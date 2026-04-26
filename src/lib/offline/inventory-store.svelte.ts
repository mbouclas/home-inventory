import { browser } from '$app/environment';
import { expiryStatus, todayIso } from '$lib/expiry';
import type { InventoryItem, InventorySnapshot, OfflineOperation, SyncOperationsResponse } from '$lib/types/inventory';
import { addOperation, deleteOperations, readOperations, readSnapshot, writeSnapshot } from './db';

function sortItems(items: InventoryItem[]) {
	return [...items].sort((a, b) => {
		if (a.quantity !== b.quantity) return a.quantity - b.quantity;
		const expiry = (a.expiryDate ?? '9999-99-99').localeCompare(b.expiryDate ?? '9999-99-99');
		if (expiry !== 0) return expiry;
		return b.updatedAt - a.updatedAt;
	});
}

function operationId() {
	const random = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
	return `${Date.now()}-${random}`;
}

class InventoryStore {
	ready = $state(false);
	online = $state(true);
	syncing = $state(false);
	lastSyncedAt = $state<number | null>(null);
	lastError = $state<string | null>(null);
	pendingCount = $state(0);
	items = $state<InventoryItem[]>([]);
	private categories: InventorySnapshot['categories'] = [];
	private tags: InventorySnapshot['tags'] = [];
	private itemCategories: InventorySnapshot['itemCategories'] = [];
	private itemTags: InventorySnapshot['itemTags'] = [];
	private initialized = false;

	get sortedItems() {
		return sortItems(this.items);
	}

	get dashboard() {
		const today = todayIso();
		const cutoff = new Date();
		cutoff.setDate(cutoff.getDate() + 30);
		const cutoffIso = cutoff.toISOString().slice(0, 10);
		const expiring = this.items
			.filter((item) => item.expiryDate !== null && item.expiryDate <= cutoffIso)
			.sort((a, b) => (a.expiryDate ?? '').localeCompare(b.expiryDate ?? ''));
		const lowStock = sortItems(this.items.filter((item) => item.quantity <= 1));

		return {
			today,
			totalCount: this.items.length,
			inStock: this.items.filter((item) => item.quantity > 0).length,
			buckets: {
				expired: expiring.filter((item) => expiryStatus(item.expiryDate) === 'expired'),
				critical: expiring.filter((item) => expiryStatus(item.expiryDate) === 'critical'),
				warning: expiring.filter((item) => expiryStatus(item.expiryDate) === 'warning')
			},
			lowStock
		};
	}

	async init() {
		if (!browser || this.initialized) return;
		this.initialized = true;
		this.online = navigator.onLine;

		window.addEventListener('online', () => {
			this.online = true;
			void this.syncPending();
			void this.refreshSnapshot();
		});
		window.addEventListener('offline', () => {
			this.online = false;
		});
		window.addEventListener('focus', () => {
			if (navigator.onLine) void this.syncPending();
		});

		const cached = await readSnapshot();
		if (cached) this.applySnapshot(cached);
		await this.refreshPendingCount();
		this.ready = true;

		if (this.online) {
			await this.syncPending();
			await this.refreshSnapshot();
		}
	}

	filterItems(query: string) {
		const q = query.trim().toLowerCase();
		if (!q) return this.sortedItems;
		return this.sortedItems.filter(
			(item) => item.name.toLowerCase().includes(q) || item.barcode === query.trim()
		);
	}

	async refreshSnapshot() {
		if (!browser || !navigator.onLine) return;
		this.syncing = true;
		this.lastError = null;
		try {
			const response = await fetch('/api/sync/snapshot');
			if (!response.ok) throw new Error(await response.text());
			const snapshot = (await response.json()) as InventorySnapshot;
			await writeSnapshot(snapshot);
			this.applySnapshot(snapshot);
		} catch (error) {
			this.lastError = error instanceof Error ? error.message : 'Could not refresh offline cache';
		} finally {
			this.syncing = false;
		}
	}

	async changeQuantity(itemId: number, delta: number) {
		const now = Date.now();
		const current = this.items.find((item) => item.id === itemId);
		if (!current) return;
		this.items = this.items.map((item) =>
			item.id === itemId
				? { ...item, quantity: Math.max(0, item.quantity + delta), updatedAt: now }
				: item
		);

		await this.queueOperation({ id: operationId(), type: 'changeQuantity', itemId, delta, createdAt: now });
		await this.persistCurrentSnapshot();
		await this.syncPending();
	}

	async deleteItem(itemId: number) {
		const now = Date.now();
		this.items = this.items.filter((item) => item.id !== itemId);
		await this.queueOperation({ id: operationId(), type: 'deleteItem', itemId, createdAt: now });
		await this.persistCurrentSnapshot();
		await this.syncPending();
	}

	private applySnapshot(snapshot: InventorySnapshot) {
		this.items = snapshot.items;
		this.categories = snapshot.categories;
		this.tags = snapshot.tags;
		this.itemCategories = snapshot.itemCategories;
		this.itemTags = snapshot.itemTags;
		this.lastSyncedAt = snapshot.syncedAt;
	}

	private async persistCurrentSnapshot() {
		if (!this.lastSyncedAt) return;
		await writeSnapshot({
			items: this.items,
			categories: this.categories,
			tags: this.tags,
			itemCategories: this.itemCategories,
			itemTags: this.itemTags,
			syncedAt: this.lastSyncedAt
		});
	}

	private async queueOperation(operation: OfflineOperation) {
		await addOperation(operation);
		await this.refreshPendingCount();
	}

	private async refreshPendingCount() {
		this.pendingCount = (await readOperations()).length;
	}

	private async syncPending() {
		if (!browser || !navigator.onLine || this.syncing) return;
		const operations = await readOperations();
		this.pendingCount = operations.length;
		if (operations.length === 0) return;

		this.syncing = true;
		this.lastError = null;
		try {
			const response = await fetch('/api/sync/operations', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ operations })
			});
			if (!response.ok) throw new Error(await response.text());
			const data = (await response.json()) as SyncOperationsResponse;
			const completed = data.results.filter((result) => result.ok).map((result) => result.id);
			await deleteOperations(completed);
			await writeSnapshot(data.snapshot);
			this.applySnapshot(data.snapshot);
			this.pendingCount = (await readOperations()).length;
			const failed = data.results.find((result) => !result.ok);
			if (failed) this.lastError = failed.error ?? 'Some offline changes could not sync';
		} catch (error) {
			this.lastError = error instanceof Error ? error.message : 'Could not sync offline changes';
		} finally {
			this.syncing = false;
		}
	}
}

export const inventory = new InventoryStore();
