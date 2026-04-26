import { asc, sql, and, lte, isNotNull, gt } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db, schema } from '$lib/server/db';
import { todayIso, expiryStatus } from '$lib/expiry';

export const load: PageServerLoad = async () => {
	const today = todayIso();
	const cutoff = new Date();
	cutoff.setDate(cutoff.getDate() + 30);
	const cutoffIso = cutoff.toISOString().slice(0, 10);

	const expiring = await db
		.select()
		.from(schema.items)
		.where(and(isNotNull(schema.items.expiryDate), lte(schema.items.expiryDate, cutoffIso)))
		.orderBy(asc(schema.items.expiryDate));

	const lowStock = await db
		.select()
		.from(schema.items)
		.where(sql`${schema.items.quantity} <= 1`)
		.orderBy(asc(schema.items.quantity), asc(schema.items.name));

	const [{ count: totalCount = 0 } = { count: 0 }] = await db
		.select({ count: sql<number>`count(*)` })
		.from(schema.items);

	const [{ count: inStock = 0 } = { count: 0 }] = await db
		.select({ count: sql<number>`count(*)` })
		.from(schema.items)
		.where(gt(schema.items.quantity, 0));

	const buckets = {
		expired: expiring.filter((i) => expiryStatus(i.expiryDate) === 'expired'),
		critical: expiring.filter((i) => expiryStatus(i.expiryDate) === 'critical'),
		warning: expiring.filter((i) => expiryStatus(i.expiryDate) === 'warning')
	};

	return { today, totalCount: Number(totalCount), inStock: Number(inStock), buckets, lowStock };
};
