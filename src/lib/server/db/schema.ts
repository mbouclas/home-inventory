export type Item = {
	id: number;
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

export type NewItem = Omit<Item, 'id' | 'createdAt' | 'updatedAt' | 'quantity' | 'expiryDate' | 'expiryLots'> &
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
	(
		SELECT l.expiry_date
		FROM item_expiry_lots l
		WHERE l.item_id = items.id AND l.expiry_date IS NOT NULL
		ORDER BY l.expiry_date ASC, l.id ASC
		LIMIT 1
	) AS expiryDate,
	COALESCE((
		SELECT SUM(l.quantity)
		FROM item_expiry_lots l
		WHERE l.item_id = items.id
	), 0) AS quantity,
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
	photo_url TEXT,
	photo_public_id TEXT,
	created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
	updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE UNIQUE INDEX IF NOT EXISTS items_barcode_unique ON items (barcode);

CREATE TABLE IF NOT EXISTS item_expiry_lots (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
	expiry_date TEXT,
	quantity INTEGER NOT NULL CHECK (quantity > 0),
	created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
	updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE INDEX IF NOT EXISTS item_expiry_lots_item_idx ON item_expiry_lots (item_id);
CREATE INDEX IF NOT EXISTS item_expiry_lots_expiry_idx ON item_expiry_lots (expiry_date);
CREATE INDEX IF NOT EXISTS item_expiry_lots_item_expiry_idx ON item_expiry_lots (item_id, expiry_date);

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
