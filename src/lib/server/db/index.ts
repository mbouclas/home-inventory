import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { dev } from '$app/environment';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { env } from '$env/dynamic/private';
import * as schema from './schema';

const dbPath = (env.DATABASE_PATH ?? './data/pharmacy.db').replace(/^file:/, '');
mkdirSync(dirname(dbPath), { recursive: true });

const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema, logger: dev });
export { schema };
