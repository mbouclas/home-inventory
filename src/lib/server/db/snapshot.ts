import { db, ITEM_COLUMNS, TAXONOMY_COLUMNS, type Category, type Item, type Tag } from './index';
import { attachLots } from './lots';
import type { InventorySnapshot, ItemCategoryLink, ItemTagLink } from '$lib/types/inventory';

export function getInventorySnapshot(): InventorySnapshot {
	const items = attachLots(db
		.query(`SELECT ${ITEM_COLUMNS} FROM items ORDER BY quantity ASC, expiryDate ASC, updated_at DESC`)
		.all() as Omit<Item, 'expiryLots'>[]);
	const categories = db
		.query(`SELECT ${TAXONOMY_COLUMNS} FROM categories ORDER BY name COLLATE NOCASE ASC`)
		.all() as Category[];
	const tags = db
		.query(`SELECT ${TAXONOMY_COLUMNS} FROM tags ORDER BY name COLLATE NOCASE ASC`)
		.all() as Tag[];
	const itemCategories = db
		.query('SELECT item_id AS itemId, category_id AS categoryId FROM item_categories')
		.all() as ItemCategoryLink[];
	const itemTags = db
		.query('SELECT item_id AS itemId, tag_id AS tagId FROM item_tags')
		.all() as ItemTagLink[];

	return {
		items,
		categories,
		tags,
		itemCategories,
		itemTags,
		syncedAt: Date.now()
	};
}
