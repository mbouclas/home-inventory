import { browser } from '$app/environment';
import { expiryStatus, todayIso } from '$lib/expiry';
import type { InventoryItem, InventorySnapshot, ItemExpiryLot, OfflineOperation, SyncOperationsResponse } from '$lib/types/inventory';
import type { Category, Tag } from '$lib/types/taxonomy';
import { addOperation, clearOfflineData, deleteOperations, readOperations, readSnapshot, writeSnapshot } from './db';

export type GlobalSearchResults = {
	items: InventoryItem[];
	categories: Array<Category & { items: InventoryItem[] }>;
	tags: Array<Tag & { items: InventoryItem[] }>;
};

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

function nextExpiry(lots: ItemExpiryLot[]) {
	return lots
		.map((lot) => lot.expiryDate)
		.filter((expiry): expiry is string => expiry !== null)
		.sort()[0] ?? null;
}

function totalQuantity(lots: ItemExpiryLot[]) {
	return lots.reduce((sum, lot) => sum + lot.quantity, 0);
}

function sortLots(lots: ItemExpiryLot[]) {
	return [...lots].sort((a, b) => {
		const expiry = (a.expiryDate ?? '9999-99-99').localeCompare(b.expiryDate ?? '9999-99-99');
		if (expiry !== 0) return expiry;
		return a.id - b.id;
	});
}

function withStock(item: InventoryItem, lots: ItemExpiryLot[]): InventoryItem {
	return { ...item, expiryLots: sortLots(lots), quantity: totalQuantity(lots), expiryDate: nextExpiry(lots) };
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

	get categoryCounts() {
		return this.categories
			.map((category) => ({
				...category,
				itemCount: this.itemCategories.filter((link) => link.categoryId === category.id).length
			}))
			.sort((a, b) => a.name.localeCompare(b.name));
	}

	get topCategories() {
		return this.categoryCounts
			.filter((category) => category.itemCount > 0)
			.sort((a, b) => b.itemCount - a.itemCount || a.name.localeCompare(b.name))
			.slice(0, 5);
	}

	get dashboard() {
		const today = todayIso();
		const cutoff = new Date();
		cutoff.setDate(cutoff.getDate() + 30);
		const cutoffIso = cutoff.toISOString().slice(0, 10);
		const expiring = this.items
			.flatMap((item) =>
				item.expiryLots
					.filter((lot) => lot.expiryDate !== null && lot.expiryDate <= cutoffIso)
					.map((lot) => ({ ...item, quantity: lot.quantity, expiryDate: lot.expiryDate, expiryLots: [lot] }))
			)
			.sort((a, b) => (a.expiryDate ?? '').localeCompare(b.expiryDate ?? ''));
		const lowStock = sortItems(this.items.filter((item) => item.quantity <= 1));

		return {
			today,
			totalCount: this.items.length,
			inStock: this.items.filter((item) => item.quantity > 0).length,
			topCategories: this.topCategories,
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

	globalSearch(query: string): GlobalSearchResults {
		const q = query.trim().toLowerCase();
		if (!q) return { items: [], categories: [], tags: [] };

		const sorted = this.sortedItems;
		const itemsById = new Map(sorted.map((item) => [item.id, item]));
		const itemsForIds = (ids: number[]) => ids.map((id) => itemsById.get(id)).filter((item): item is InventoryItem => !!item);

		return {
			items: sorted.filter((item) => item.name.toLowerCase().includes(q)),
			categories: this.categories
				.filter((category) => category.name.toLowerCase().includes(q))
				.map((category) => ({
					...category,
					items: itemsForIds(
						this.itemCategories
							.filter((link) => link.categoryId === category.id)
							.map((link) => link.itemId)
					)
				})),
			tags: this.tags
				.filter((tag) => tag.name.toLowerCase().includes(q))
				.map((tag) => ({
					...tag,
					items: itemsForIds(
						this.itemTags
							.filter((link) => link.tagId === tag.id)
							.map((link) => link.itemId)
					)
				}))
		};
	}

	itemsForCategorySlug(slug: string) {
		const category = this.categories.find((item) => item.slug === slug);
		if (!category) return [];
		const itemIds = new Set(
			this.itemCategories
				.filter((link) => link.categoryId === category.id)
				.map((link) => link.itemId)
		);
		return sortItems(this.items.filter((item) => itemIds.has(item.id)));
	}

	categoryForSlug(slug: string) {
		return this.categories.find((category) => category.slug === slug) ?? null;
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

	async clearLocalData() {
		await clearOfflineData();
		this.items = [];
		this.categories = [];
		this.tags = [];
		this.itemCategories = [];
		this.itemTags = [];
		this.lastSyncedAt = null;
		this.pendingCount = 0;
	}

	async addStock(itemId: number, lots: Array<{ quantity: number; expiryDate: string | null }>) {
		const now = Date.now();
		const current = this.items.find((item) => item.id === itemId);
		if (!current) return;
		const newLots = lots.map((lot, index) => ({
			id: -now - index,
			itemId,
			expiryDate: lot.expiryDate || null,
			quantity: lot.quantity,
			createdAt: now,
			updatedAt: now
		}));
		this.items = this.items.map((item) =>
			item.id === itemId
				? withStock({ ...item, updatedAt: now }, [...item.expiryLots, ...newLots])
				: item
		);

		await this.queueOperation({ id: operationId(), type: 'addStock', itemId, lots, createdAt: now });
		await this.persistCurrentSnapshot();
		await this.syncPending();
	}

	async consumeStock(itemId: number, quantity: number) {
		const now = Date.now();
		const current = this.items.find((item) => item.id === itemId);
		if (!current || current.quantity < quantity) return;

		let remaining = quantity;
		const lots = sortLots(current.expiryLots)
			.map((lot) => {
				if (remaining <= 0) return lot;
				const used = Math.min(lot.quantity, remaining);
				remaining -= used;
				return { ...lot, quantity: lot.quantity - used, updatedAt: now };
			})
			.filter((lot) => lot.quantity > 0);

		this.items = this.items.map((item) =>
			item.id === itemId ? withStock({ ...item, updatedAt: now }, lots) : item
		);

		await this.queueOperation({ id: operationId(), type: 'consumeStock', itemId, quantity, createdAt: now });
		await this.persistCurrentSnapshot();
		await this.syncPending();
	}

	async changeQuantity(itemId: number, delta: number) {
		if (delta < 0) await this.consumeStock(itemId, Math.abs(delta));
	}

	async deleteItem(itemId: number) {
		const now = Date.now();
		this.items = this.items.filter((item) => item.id !== itemId);
		await this.queueOperation({ id: operationId(), type: 'deleteItem', itemId, createdAt: now });
		await this.persistCurrentSnapshot();
		await this.syncPending();
	}

	private applySnapshot(snapshot: InventorySnapshot) {
		this.items = snapshot.items.map((item) => withStock(item, item.expiryLots ?? []));
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
