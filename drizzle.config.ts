import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

const dbPath = (process.env.DATABASE_PATH ?? './data/pharmacy.db').replace(/^file:/, '');

export default defineConfig({
	schema: './src/lib/server/db/schema.ts',
	out: './drizzle',
	dialect: 'sqlite',
	dbCredentials: { url: dbPath },
	verbose: true,
	strict: true
});
