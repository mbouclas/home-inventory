export type Item = {
	id: number;
	barcode: string | null;
	name: string;
	dosage: string | null;
	description: string | null;
	usage: string | null;
	expiryDate: string | null;
	quantity: number;
	photoUrl: string | null;
	photoPublicId: string | null;
	createdAt: number;
	updatedAt: number;
};

export type NewItem = Omit<Item, 'id' | 'createdAt' | 'updatedAt'> &
	Partial<Pick<Item, 'updatedAt'>>;

export type { Category, Tag } from '$lib/types/taxonomy';
import type { Category, Tag } from '$lib/types/taxonomy';
export type NewCategory = Omit<Category, 'id' | 'createdAt' | 'updatedAt'>;
export type NewTag = Omit<Tag, 'id' | 'createdAt' | 'updatedAt'>;

export const ITEM_COLUMNS = `
	id,
	barcode,
	name,
	dosage,
	description,
	usage,
	expiry_date AS expiryDate,
	quantity,
	photo_url AS photoUrl,
	photo_public_id AS photoPublicId,
	created_at AS createdAt,
	updated_at AS updatedAt
`;

export const TAXONOMY_COLUMNS = `
	id,
	name,
	slug,
	created_at AS createdAt,
	updated_at AS updatedAt
`;

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS items (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	barcode TEXT,
	name TEXT NOT NULL,
	dosage TEXT,
	description TEXT,
	usage TEXT,
	expiry_date TEXT,
	quantity INTEGER NOT NULL DEFAULT 1,
	photo_url TEXT,
	photo_public_id TEXT,
	created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
	updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE UNIQUE INDEX IF NOT EXISTS items_barcode_unique ON items (barcode);
CREATE INDEX IF NOT EXISTS items_expiry_idx ON items (expiry_date);

CREATE TABLE IF NOT EXISTS categories (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT NOT NULL UNIQUE,
	slug TEXT NOT NULL UNIQUE,
	created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
	updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS tags (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT NOT NULL UNIQUE,
	slug TEXT NOT NULL UNIQUE,
	created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
	updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE INDEX IF NOT EXISTS tags_slug_idx ON tags (slug);

CREATE TABLE IF NOT EXISTS item_categories (
	item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
	category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
	PRIMARY KEY (item_id, category_id)
);
CREATE INDEX IF NOT EXISTS item_categories_category_idx ON item_categories (category_id);

CREATE TABLE IF NOT EXISTS item_tags (
	item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
	tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
	PRIMARY KEY (item_id, tag_id)
);
CREATE INDEX IF NOT EXISTS item_tags_tag_idx ON item_tags (tag_id);
`;
