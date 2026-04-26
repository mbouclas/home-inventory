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
