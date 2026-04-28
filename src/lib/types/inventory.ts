import type { Category, Tag } from './taxonomy';

export type InventoryItem = {
	id: number;
	userId: number | null;
	barcode: string | null;
	name: string;
	dosage: string | null;
	description: string | null;
	usage: string | null;
	expiryDate: string | null;
	quantity: number;
	expiryLots: ItemExpiryLot[];
	photoUrl: string | null;
	photoPublicId: string | null;
	createdAt: number;
	updatedAt: number;
};

export type ItemExpiryLot = {
	id: number;
	itemId: number;
	expiryDate: string | null;
	quantity: number;
	createdAt: number;
	updatedAt: number;
};

export type ItemCategoryLink = {
	itemId: number;
	categoryId: number;
};

export type ItemTagLink = {
	itemId: number;
	tagId: number;
};

export type InventorySnapshot = {
	items: InventoryItem[];
	categories: Category[];
	tags: Tag[];
	itemCategories: ItemCategoryLink[];
	itemTags: ItemTagLink[];
	syncedAt: number;
};

export type OfflineOperation =
	| {
			id: string;
			type: 'addStock';
			itemId: number;
			lots: Array<{ quantity: number; expiryDate: string | null }>;
			createdAt: number;
	  }
	| {
			id: string;
			type: 'consumeStock';
			itemId: number;
			quantity: number;
			createdAt: number;
	  }
	| {
			id: string;
			type: 'deleteItem';
			itemId: number;
			createdAt: number;
	  };

export type SyncOperationResult = {
	id: string;
	ok: boolean;
	error?: string;
};

export type SyncOperationsResponse = {
	results: SyncOperationResult[];
	snapshot: InventorySnapshot;
};
