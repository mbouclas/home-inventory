import type { Database as BunSqliteDatabase, SQLQueryBindings } from 'bun:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { createRequire } from 'node:module';
import { env } from '$env/dynamic/private';
import { SCHEMA_SQL } from './schema';
import { seedCategories } from './seed';

type StatementParams = SQLQueryBindings | SQLQueryBindings[];

type PreparedQuery = {
    all(params?: StatementParams): unknown[];
    get(params?: StatementParams): unknown;
    run(params?: StatementParams): unknown;
};

type TableColumn = {
    name: string;
};

export type Database = {
    query(sql: string): PreparedQuery;
    transaction<T extends (...args: unknown[]) => unknown>(fn: T): T;
    exec(sql: string): void;
};

function bindAndCall<T>(method: (...params: SQLQueryBindings[]) => T, params?: StatementParams): T {
    if (params === undefined) return method();
    return Array.isArray(params) ? method(...params) : method(params);
}

const dbPath = (env.DATABASE_PATH ?? './data/pharmacy.db').replace(/^file:/, '');
mkdirSync(dirname(dbPath), { recursive: true });

const runtimeRequire = createRequire(import.meta.url);
let rawDb: BunSqliteDatabase | undefined;
let initialized = false;

function hasColumn(rawDb: BunSqliteDatabase, table: string, column: string) {
    return rawDb
        .prepare(`PRAGMA table_info(${table})`)
        .all()
        .some((row) => (row as TableColumn).name === column);
}

function migrateSchema(rawDb: BunSqliteDatabase) {
    if (!hasColumn(rawDb, 'items', 'user_id')) {
        rawDb.exec('ALTER TABLE items ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE SET NULL');
    }

    if (!hasColumn(rawDb, 'users', 'display_name')) {
        rawDb.exec('ALTER TABLE users ADD COLUMN display_name TEXT');
    }

    if (!hasColumn(rawDb, 'users', 'email')) {
        rawDb.exec('ALTER TABLE users ADD COLUMN email TEXT');
    }

    if (!hasColumn(rawDb, 'users', 'email_verified')) {
        rawDb.exec('ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0');
    }

    if (!hasColumn(rawDb, 'users', 'image')) {
        rawDb.exec('ALTER TABLE users ADD COLUMN image TEXT');
    }

    if (!hasColumn(rawDb, 'users', 'display_username')) {
        rawDb.exec('ALTER TABLE users ADD COLUMN display_username TEXT');
    }

    rawDb.exec(`
        CREATE INDEX IF NOT EXISTS items_user_idx ON items (user_id);
        CREATE UNIQUE INDEX IF NOT EXISTS users_email_idx ON users (email);
        CREATE INDEX IF NOT EXISTS audit_events_actor_idx ON audit_events (actor_user_id);
        CREATE INDEX IF NOT EXISTS audit_events_entity_idx ON audit_events (entity_type, entity_id);
        CREATE INDEX IF NOT EXISTS audit_events_created_at_idx ON audit_events (created_at);
    `);

    rawDb.exec('UPDATE users SET display_name = COALESCE(display_name, username)');
    rawDb.exec('UPDATE users SET display_username = COALESCE(display_username, username)');
}

function getRawDb() {
    if (!rawDb) {
        const { Database } = runtimeRequire('bun:sqlite') as typeof import('bun:sqlite');
        rawDb = new Database(dbPath);
    }

    if (!initialized) {
        initialized = true;
        try {
            rawDb.exec('PRAGMA journal_mode = WAL');
            rawDb.exec('PRAGMA foreign_keys = ON');
            rawDb.exec(SCHEMA_SQL);
            migrateSchema(rawDb);
            seedCategories(db);
        } catch (error) {
            initialized = false;
            throw error;
        }
    }

    return rawDb;
}

export const db: Database = {
    query(sql) {
        const rawDb = getRawDb();
        const statement = rawDb.prepare(sql);
        return {
            all(params) {
                return bindAndCall((...boundParams) => statement.all(...(boundParams as never)), params);
            },
            get(params) {
                return bindAndCall((...boundParams) => statement.get(...(boundParams as never)), params);
            },
            run(params) {
                return bindAndCall((...boundParams) => statement.run(...(boundParams as never)), params);
            }
        };
    },
    transaction(fn) {
        return getRawDb().transaction(fn) as unknown as typeof fn;
    },
    exec(sql) {
        getRawDb().exec(sql);
    }
};

export * from './schema';
