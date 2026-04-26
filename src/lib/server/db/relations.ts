import { db } from './index';
import { TAXONOMY_COLUMNS, type Category, type Tag } from './schema';
import { slugify } from '$lib/utils';

export function listCategories(): Category[] {
	return db
		.query(`SELECT ${TAXONOMY_COLUMNS} FROM categories ORDER BY name COLLATE NOCASE ASC`)
		.all() as Category[];
}

export function createCategory(rawName: string): Category | null {
	const name = rawName.trim();
	if (!name) return null;
	const slug = slugify(name);
	if (!slug) return null;

	db.query('INSERT OR IGNORE INTO categories (name, slug) VALUES ($name, $slug)').run({
		$name: name,
		$slug: slug
	});
	return db
		.query(`SELECT ${TAXONOMY_COLUMNS} FROM categories WHERE slug = $slug`)
		.get({ $slug: slug }) as Category | null;
}

export function searchTags(q: string, limit = 10): Tag[] {
	const slug = slugify(q);
	if (!slug) {
		return db
			.query(`SELECT ${TAXONOMY_COLUMNS} FROM tags ORDER BY name COLLATE NOCASE ASC LIMIT $limit`)
			.all({ $limit: limit }) as Tag[];
	}
	return db
		.query(
			`SELECT ${TAXONOMY_COLUMNS} FROM tags
			 WHERE slug LIKE $prefix
			 ORDER BY length(slug) ASC, name COLLATE NOCASE ASC
			 LIMIT $limit`
		)
		.all({ $prefix: `${slug}%`, $limit: limit }) as Tag[];
}

export function upsertTagByName(rawName: string): Tag | null {
	const name = rawName.trim();
	if (!name) return null;
	const slug = slugify(name);
	if (!slug) return null;

	db.query('INSERT OR IGNORE INTO tags (name, slug) VALUES ($name, $slug)').run({
		$name: name,
		$slug: slug
	});
	return db
		.query(`SELECT ${TAXONOMY_COLUMNS} FROM tags WHERE slug = $slug`)
		.get({ $slug: slug }) as Tag | null;
}

export function setItemCategories(itemId: number, categoryIds: number[]) {
	const del = db.query('DELETE FROM item_categories WHERE item_id = $itemId');
	const ins = db.query(
		'INSERT OR IGNORE INTO item_categories (item_id, category_id) VALUES ($itemId, $categoryId)'
	);
	const tx = db.transaction(() => {
		del.run({ $itemId: itemId });
		for (const categoryId of categoryIds) {
			ins.run({ $itemId: itemId, $categoryId: categoryId });
		}
	});
	tx();
}

export function setItemTags(itemId: number, tagNames: string[]) {
	const tagIds: number[] = [];
	for (const name of tagNames) {
		const tag = upsertTagByName(name);
		if (tag) tagIds.push(tag.id);
	}
	const del = db.query('DELETE FROM item_tags WHERE item_id = $itemId');
	const ins = db.query(
		'INSERT OR IGNORE INTO item_tags (item_id, tag_id) VALUES ($itemId, $tagId)'
	);
	const tx = db.transaction(() => {
		del.run({ $itemId: itemId });
		for (const tagId of tagIds) {
			ins.run({ $itemId: itemId, $tagId: tagId });
		}
	});
	tx();
}

export function getItemCategoryIds(itemId: number): number[] {
	const rows = db
		.query('SELECT category_id AS id FROM item_categories WHERE item_id = $itemId')
		.all({ $itemId: itemId }) as { id: number }[];
	return rows.map((r) => r.id);
}

export function getItemTagNames(itemId: number): string[] {
	const rows = db
		.query(
			`SELECT t.name AS name
			 FROM item_tags it JOIN tags t ON t.id = it.tag_id
			 WHERE it.item_id = $itemId
			 ORDER BY t.name COLLATE NOCASE ASC`
		)
		.all({ $itemId: itemId }) as { name: string }[];
	return rows.map((r) => r.name);
}
