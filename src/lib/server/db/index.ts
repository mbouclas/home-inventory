import { Database } from 'bun:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { env } from '$env/dynamic/private';
import { SCHEMA_SQL } from './schema';
import { seedCategories } from './seed';

const dbPath = (env.DATABASE_PATH ?? './data/pharmacy.db').replace(/^file:/, '');
mkdirSync(dirname(dbPath), { recursive: true });

export const db = new Database(dbPath, { create: true });
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');
db.exec(SCHEMA_SQL);
seedCategories(db);

export * from './schema';
