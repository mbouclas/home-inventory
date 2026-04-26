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
`;
