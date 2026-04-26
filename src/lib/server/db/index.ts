import BetterSqlite3 from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { env } from '$env/dynamic/private';
import { SCHEMA_SQL } from './schema';
import { seedCategories } from './seed';

type StatementParams = Record<string, unknown> | unknown[];

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

function bindAndCall<T>(
    method: (params?: StatementParams) => T,
    params?: StatementParams
): T {
    return params === undefined ? method() : method(normalizeParams(params));
}

function normalizeParams(params: StatementParams): StatementParams {
    if (Array.isArray(params)) return params;

    return Object.fromEntries(
        Object.entries(params).map(([key, value]) => [key.replace(/^[$:@]/, ''), value])
    );
}

const dbPath = (env.DATABASE_PATH ?? './data/pharmacy.db').replace(/^file:/, '');
mkdirSync(dirname(dbPath), { recursive: true });

const rawDb = new BetterSqlite3(dbPath);

export const db: Database = {
    query(sql) {
        const statement = rawDb.prepare(sql);
        return {
            all(params) {
                return bindAndCall((boundParams) => statement.all(boundParams), params);
            },
            get(params) {
                return bindAndCall((boundParams) => statement.get(boundParams), params);
            },
            run(params) {
                return bindAndCall((boundParams) => statement.run(boundParams), params);
            }
        };
    },
    transaction(fn) {
        return rawDb.transaction(fn) as unknown as typeof fn;
    },
    exec(sql) {
        rawDb.exec(sql);
    }
};

db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');
db.exec(SCHEMA_SQL);
seedCategories(db);

export * from './schema';
