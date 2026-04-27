import { existsSync } from 'node:fs';
import { Database } from 'bun:sqlite';
import 'dotenv/config';

type ColumnInfo = {
	name: string;
};

type BackfillCandidate = {
	id: number;
	name: string;
	legacyQuantity: number;
	legacyExpiry: string | null;
	lotQuantity: number;
};

const args = new Set(Bun.argv.slice(2));
const dryRun = args.has('--dry-run');
const dbPathArg = Bun.argv.find((arg) => arg.startsWith('--db='));
const dbPath = (dbPathArg?.slice('--db='.length) || process.env.DATABASE_PATH || './data/pharmacy.db').replace(/^file:/, '');

if (!existsSync(dbPath)) {
	console.error(`Database not found: ${dbPath}`);
	process.exit(1);
}

const db = new Database(dbPath);
db.exec('PRAGMA foreign_keys = ON');

const itemColumns = new Set(
	(db.query('PRAGMA table_info(items)').all() as ColumnInfo[]).map((column) => column.name)
);

const missingLegacyColumns = ['quantity', 'expiry_date'].filter((column) => !itemColumns.has(column));
if (missingLegacyColumns.length > 0) {
	console.error(
		`Cannot backfill: items table is missing legacy column(s): ${missingLegacyColumns.join(', ')}`
	);
	console.error('This migration is only for production databases created before split stock lots.');
	process.exit(1);
}

db.exec(`
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
`);

const candidates = db
	.query(`
		SELECT
			i.id,
			i.name,
			i.quantity AS legacyQuantity,
			i.expiry_date AS legacyExpiry,
			COALESCE(SUM(l.quantity), 0) AS lotQuantity
		FROM items i
		LEFT JOIN item_expiry_lots l ON l.item_id = i.id
		GROUP BY i.id
		HAVING legacyQuantity > 0 AND lotQuantity = 0
		ORDER BY i.name COLLATE NOCASE ASC, i.id ASC
	`)
	.all() as BackfillCandidate[];

console.log(`Database: ${dbPath}`);
console.log(`Backfill candidates: ${candidates.length}`);

for (const item of candidates) {
	console.log(
		`- #${item.id} ${item.name}: qty ${item.legacyQuantity}, expiry ${item.legacyExpiry ?? 'none'}`
	);
}

if (dryRun) {
	console.log('Dry run only. Re-run without --dry-run to write rows.');
	process.exit(0);
}

const result = db
	.query(`
		INSERT INTO item_expiry_lots (item_id, expiry_date, quantity, created_at, updated_at)
		SELECT
			i.id,
			i.expiry_date,
			i.quantity,
			COALESCE(i.created_at, unixepoch() * 1000),
			COALESCE(i.updated_at, unixepoch() * 1000)
		FROM items i
		WHERE i.quantity > 0
			AND NOT EXISTS (
				SELECT 1
				FROM item_expiry_lots l
				WHERE l.item_id = i.id
			)
	`)
	.run();

console.log(`Inserted rows: ${result.changes}`);
console.log('Backfill complete. Restart the app and refresh clients.');
