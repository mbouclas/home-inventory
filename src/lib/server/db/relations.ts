import { db } from './index';
import { ITEM_COLUMNS, TAXONOMY_COLUMNS, type Category, type Item, type Tag } from './schema';
import { attachLots } from './lots';
import { slugify } from '$lib/utils';

export type CategoryWithItemCount = Category & { itemCount: number };

export function listCategories(): Category[] {
	return db
		.query(`SELECT ${TAXONOMY_COLUMNS} FROM categories ORDER BY name COLLATE NOCASE ASC`)
		.all() as Category[];
}

export function listCategoriesWithItemCount(): CategoryWithItemCount[] {
	return db
		.query(
			`SELECT
				categories.id,
				categories.name,
				categories.slug,
				categories.created_at AS createdAt,
				categories.updated_at AS updatedAt,
				COUNT(item_categories.item_id) AS itemCount
			FROM categories
			LEFT JOIN item_categories ON item_categories.category_id = categories.id
			GROUP BY categories.id
			ORDER BY categories.name COLLATE NOCASE ASC`
		)
		.all() as CategoryWithItemCount[];
}

export function listTopCategories(limit = 5): CategoryWithItemCount[] {
	return db
		.query(
			`SELECT
				categories.id,
				categories.name,
				categories.slug,
				categories.created_at AS createdAt,
				categories.updated_at AS updatedAt,
				COUNT(item_categories.item_id) AS itemCount
			FROM categories
			JOIN item_categories ON item_categories.category_id = categories.id
			GROUP BY categories.id
			ORDER BY itemCount DESC, categories.name COLLATE NOCASE ASC
			LIMIT $limit`
		)
		.all({ $limit: limit }) as CategoryWithItemCount[];
}

export function getCategoryBySlug(slug: string): CategoryWithItemCount | null {
	return db
		.query(
			`SELECT
				categories.id,
				categories.name,
				categories.slug,
				categories.created_at AS createdAt,
				categories.updated_at AS updatedAt,
				COUNT(item_categories.item_id) AS itemCount
			FROM categories
			LEFT JOIN item_categories ON item_categories.category_id = categories.id
			WHERE categories.slug = $slug
			GROUP BY categories.id`
		)
		.get({ $slug: slug }) as CategoryWithItemCount | null;
}

export function listItemsByCategorySlug(slug: string): Item[] {
	return attachLots(
		db
			.query(
				`SELECT items.*
				FROM (
					SELECT ${ITEM_COLUMNS}
					FROM items
				) items
				JOIN item_categories ON item_categories.item_id = items.id
				JOIN categories ON categories.id = item_categories.category_id
				WHERE categories.slug = $slug
				ORDER BY quantity ASC, expiryDate ASC, items.name COLLATE NOCASE ASC`
			)
			.all({ $slug: slug }) as Omit<Item, 'expiryLots'>[]
	);
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
