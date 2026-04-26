import { sql } from 'drizzle-orm';
import { sqliteTable, integer, text, index } from 'drizzle-orm/sqlite-core';

export const items = sqliteTable(
	'items',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		barcode: text('barcode').unique(),
		name: text('name').notNull(),
		dosage: text('dosage'),
		description: text('description'),
		usage: text('usage'),
		expiryDate: text('expiry_date'),
		quantity: integer('quantity').notNull().default(1),
		photoUrl: text('photo_url'),
		photoPublicId: text('photo_public_id'),
		createdAt: integer('created_at')
			.notNull()
			.default(sql`(unixepoch() * 1000)`),
		updatedAt: integer('updated_at')
			.notNull()
			.default(sql`(unixepoch() * 1000)`)
	},
	(t) => ({
		expiryIdx: index('items_expiry_idx').on(t.expiryDate)
	})
);

export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
