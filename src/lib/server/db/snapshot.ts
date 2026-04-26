import { db, ITEM_COLUMNS, TAXONOMY_COLUMNS, type Category, type Item, type Tag } from './index';
import type { InventorySnapshot, ItemCategoryLink, ItemTagLink } from '$lib/types/inventory';

export function getInventorySnapshot(): InventorySnapshot {
	const items = db
		.query(`SELECT ${ITEM_COLUMNS} FROM items ORDER BY quantity ASC, expiry_date ASC, updated_at DESC`)
		.all() as Item[];
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
