import type { InventorySnapshot, OfflineOperation } from '$lib/types/inventory';

const DB_NAME = 'home-pharmacy-offline';
const DB_VERSION = 2;

type StoreName =
	| 'items'
	| 'categories'
	| 'tags'
	| 'itemCategories'
	| 'itemTags'
	| 'operations'
	| 'meta';

let dbPromise: Promise<IDBDatabase> | null = null;

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
	return new Promise((resolve, reject) => {
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

function txDone(tx: IDBTransaction): Promise<void> {
	return new Promise((resolve, reject) => {
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
		tx.onabort = () => reject(tx.error);
	});
}

export function openOfflineDb(): Promise<IDBDatabase> {
	if (dbPromise) return dbPromise;

	dbPromise = new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onupgradeneeded = () => {
			const db = request.result;
			if (!db.objectStoreNames.contains('items')) db.createObjectStore('items', { keyPath: 'id' });
			if (!db.objectStoreNames.contains('categories')) db.createObjectStore('categories', { keyPath: 'id' });
			if (!db.objectStoreNames.contains('tags')) db.createObjectStore('tags', { keyPath: 'id' });
			if (!db.objectStoreNames.contains('itemCategories')) db.createObjectStore('itemCategories', { keyPath: 'key' });
			if (!db.objectStoreNames.contains('itemTags')) db.createObjectStore('itemTags', { keyPath: 'key' });
			if (!db.objectStoreNames.contains('operations')) db.createObjectStore('operations', { keyPath: 'id' });
			if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'key' });
		};

		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});

	return dbPromise;
}

async function getAll<T>(db: IDBDatabase, storeName: StoreName): Promise<T[]> {
	const tx = db.transaction(storeName, 'readonly');
	return requestToPromise<T[]>(tx.objectStore(storeName).getAll());
}

export async function readSnapshot(): Promise<InventorySnapshot | null> {
	const db = await openOfflineDb();
	const [items, categories, tags, itemCategoriesRows, itemTagsRows, metaRows] = await Promise.all([
		getAll<InventorySnapshot['items'][number]>(db, 'items'),
		getAll<InventorySnapshot['categories'][number]>(db, 'categories'),
		getAll<InventorySnapshot['tags'][number]>(db, 'tags'),
		getAll<InventorySnapshot['itemCategories'][number] & { key: string }>(db, 'itemCategories'),
		getAll<InventorySnapshot['itemTags'][number] & { key: string }>(db, 'itemTags'),
		getAll<{ key: string; value: unknown }>(db, 'meta')
	]);

	const syncedAt = metaRows.find((row) => row.key === 'syncedAt')?.value;
	if (!syncedAt) return null;

	return {
		items,
		categories,
		tags,
		itemCategories: itemCategoriesRows.map(({ key: _key, ...link }) => link),
		itemTags: itemTagsRows.map(({ key: _key, ...link }) => link),
		syncedAt: Number(syncedAt)
	};
}

export async function writeSnapshot(snapshot: InventorySnapshot): Promise<void> {
	const db = await openOfflineDb();
	const tx = db.transaction(
		['items', 'categories', 'tags', 'itemCategories', 'itemTags', 'meta'],
		'readwrite'
	);

	for (const store of ['items', 'categories', 'tags', 'itemCategories', 'itemTags'] as StoreName[]) {
		tx.objectStore(store).clear();
	}

	for (const item of snapshot.items) tx.objectStore('items').put(item);
	for (const category of snapshot.categories) tx.objectStore('categories').put(category);
	for (const tag of snapshot.tags) tx.objectStore('tags').put(tag);
	for (const link of snapshot.itemCategories) {
		tx.objectStore('itemCategories').put({ ...link, key: `${link.itemId}:${link.categoryId}` });
	}
	for (const link of snapshot.itemTags) {
		tx.objectStore('itemTags').put({ ...link, key: `${link.itemId}:${link.tagId}` });
	}
	tx.objectStore('meta').put({ key: 'syncedAt', value: snapshot.syncedAt });

	await txDone(tx);
}

export async function readOperations(): Promise<OfflineOperation[]> {
	const db = await openOfflineDb();
	const operations = await getAll<OfflineOperation>(db, 'operations');
	return operations.sort((a, b) => a.createdAt - b.createdAt);
}

export async function addOperation(operation: OfflineOperation): Promise<void> {
	const db = await openOfflineDb();
	const tx = db.transaction('operations', 'readwrite');
	tx.objectStore('operations').put(operation);
	await txDone(tx);
}

export async function deleteOperations(ids: string[]): Promise<void> {
	if (ids.length === 0) return;
	const db = await openOfflineDb();
	const tx = db.transaction('operations', 'readwrite');
	const store = tx.objectStore('operations');
	for (const id of ids) store.delete(id);
	await txDone(tx);
}

export async function clearOfflineData(): Promise<void> {
	const db = await openOfflineDb();
	const tx = db.transaction(
		['items', 'categories', 'tags', 'itemCategories', 'itemTags', 'operations', 'meta'],
		'readwrite'
	);

	for (const store of ['items', 'categories', 'tags', 'itemCategories', 'itemTags', 'operations', 'meta'] as StoreName[]) {
		tx.objectStore(store).clear();
	}

	await txDone(tx);
}
