import { desc, asc, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db, schema } from '$lib/server/db';

export const load: PageServerLoad = async ({ url }) => {
	const q = url.searchParams.get('q')?.trim() ?? '';

	const base = db.select().from(schema.items);
	const rows = q
		? await base
				.where(sql`lower(${schema.items.name}) like ${'%' + q.toLowerCase() + '%'} or ${schema.items.barcode} = ${q}`)
				.orderBy(asc(schema.items.quantity), asc(schema.items.expiryDate))
		: await base.orderBy(asc(schema.items.quantity), asc(schema.items.expiryDate), desc(schema.items.updatedAt));

	return { items: rows, q };
};
