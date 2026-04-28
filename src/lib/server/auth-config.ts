import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { Database } from 'bun:sqlite';
import { betterAuth } from 'better-auth';
import { username } from 'better-auth/plugins';
import { SCHEMA_SQL } from './db/schema';

type AuthFactoryOptions = {
	plugins?: Parameters<typeof betterAuth>[0]['plugins'];
};

type ColumnRow = { name: string };

let sqlite: Database | undefined;

export function authDatabasePath() {
	return (process.env.DATABASE_PATH ?? './data/pharmacy.db').replace(/^file:/, '');
}

function hasColumn(db: Database, table: string, column: string) {
	return db.prepare(`PRAGMA table_info(${table})`).all().some((row) => (row as ColumnRow).name === column);
}

function tableExists(db: Database, table: string) {
	return !!db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").get(table);
}

function addColumnIfMissing(db: Database, table: string, columnDefinition: string) {
	const columnName = columnDefinition.split(' ')[0];
	if (!hasColumn(db, table, columnName)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${columnDefinition}`);
}

function ensureAuthTables(db: Database) {
	db.exec(`
CREATE TABLE IF NOT EXISTS auth_sessions (
	id TEXT PRIMARY KEY,
	expires_at INTEGER NOT NULL,
	token TEXT NOT NULL UNIQUE,
	created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
	updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
	ip_address TEXT,
	user_agent TEXT,
	user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS auth_sessions_user_id_idx ON auth_sessions (user_id);

CREATE TABLE IF NOT EXISTS auth_accounts (
	id TEXT PRIMARY KEY,
	account_id TEXT NOT NULL,
	provider_id TEXT NOT NULL,
	user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	access_token TEXT,
	refresh_token TEXT,
	id_token TEXT,
	access_token_expires_at INTEGER,
	refresh_token_expires_at INTEGER,
	scope TEXT,
	password TEXT,
	created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
	updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE INDEX IF NOT EXISTS auth_accounts_user_id_idx ON auth_accounts (user_id);
CREATE INDEX IF NOT EXISTS auth_accounts_provider_account_idx ON auth_accounts (provider_id, account_id);

CREATE TABLE IF NOT EXISTS auth_verifications (
	id TEXT PRIMARY KEY,
	identifier TEXT NOT NULL,
	value TEXT NOT NULL,
	expires_at INTEGER NOT NULL,
	created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
	updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE INDEX IF NOT EXISTS auth_verifications_identifier_idx ON auth_verifications (identifier);
`);
}

export function ensureAuthSchema(db: Database) {
	if (tableExists(db, 'items') && !hasColumn(db, 'items', 'user_id')) {
		db.exec('ALTER TABLE items ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE SET NULL');
	}

	db.exec(SCHEMA_SQL);

	if (tableExists(db, 'users')) {
		addColumnIfMissing(db, 'users', 'display_name TEXT');
		addColumnIfMissing(db, 'users', 'email TEXT');
		addColumnIfMissing(db, 'users', 'email_verified INTEGER NOT NULL DEFAULT 0');
		addColumnIfMissing(db, 'users', 'image TEXT');
		addColumnIfMissing(db, 'users', 'display_username TEXT');
		db.exec('UPDATE users SET display_name = COALESCE(display_name, username)');
		db.exec('UPDATE users SET display_username = COALESCE(display_username, username)');
		db.exec('CREATE UNIQUE INDEX IF NOT EXISTS users_email_idx ON users (email)');
	}

	db.exec('CREATE INDEX IF NOT EXISTS items_user_idx ON items (user_id)');
	ensureAuthTables(db);
}

export function getAuthDatabase() {
	if (!sqlite) {
		const dbPath = authDatabasePath();
		mkdirSync(dirname(dbPath), { recursive: true });
		sqlite = new Database(dbPath);
		sqlite.exec('PRAGMA foreign_keys = ON');
		ensureAuthSchema(sqlite);
	}

	return sqlite;
}

export function createAuth(options: AuthFactoryOptions = {}) {
	return betterAuth({
		baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost',
		database: getAuthDatabase(),
		emailAndPassword: {
			enabled: true
		},
		user: {
			modelName: 'users',
			fields: {
				name: 'display_name',
				email: 'email',
				emailVerified: 'email_verified',
				image: 'image',
				createdAt: 'created_at',
				updatedAt: 'updated_at'
			},
			additionalFields: {
				passwordHash: {
					type: 'string',
					required: false,
					input: false,
					fieldName: 'password_hash'
				}
			}
		},
		session: {
			modelName: 'auth_sessions',
			fields: {
				expiresAt: 'expires_at',
				createdAt: 'created_at',
				updatedAt: 'updated_at',
				ipAddress: 'ip_address',
				userAgent: 'user_agent',
				userId: 'user_id'
			}
		},
		account: {
			modelName: 'auth_accounts',
			fields: {
				accountId: 'account_id',
				providerId: 'provider_id',
				userId: 'user_id',
				accessToken: 'access_token',
				refreshToken: 'refresh_token',
				idToken: 'id_token',
				accessTokenExpiresAt: 'access_token_expires_at',
				refreshTokenExpiresAt: 'refresh_token_expires_at',
				createdAt: 'created_at',
				updatedAt: 'updated_at'
			}
		},
		verification: {
			modelName: 'auth_verifications',
			fields: {
				expiresAt: 'expires_at',
				createdAt: 'created_at',
				updatedAt: 'updated_at'
			}
		},
		advanced: {
			database: {
				generateId: (model) => {
					if (model.model === 'user' || model.model === 'users') return false;
					return crypto.randomUUID();
				}
			}
		},
		databaseHooks: {
			user: {
				create: {
					before: async (user) => {
						if ('passwordHash' in user && typeof user.passwordHash === 'string') return { data: user };
						return {
							data: {
								...user,
								passwordHash: 'legacy-placeholder'
							}
						};
					}
				}
			}
		},
		plugins: [
			username({
				schema: {
					user: {
						fields: {
							displayUsername: 'display_username'
						}
					}
				}
			}),
			...(options.plugins ?? [])
		]
	});
}
