import type { PageServerLoad } from './$types';
import { db, ITEM_COLUMNS, type Item } from '$lib/server/db';
import { todayIso, expiryStatus } from '$lib/expiry';

export const load: PageServerLoad = async () => {
	const today = todayIso();
	const cutoff = new Date();
	cutoff.setDate(cutoff.getDate() + 30);
	const cutoffIso = cutoff.toISOString().slice(0, 10);

	const expiring = db
		.query(
			`SELECT ${ITEM_COLUMNS} FROM items
			WHERE expiry_date IS NOT NULL AND expiry_date <= $cutoff
			ORDER BY expiry_date ASC`
		)
		.all({ $cutoff: cutoffIso }) as Item[];

	const lowStock = db
		.query(
			`SELECT ${ITEM_COLUMNS} FROM items
			WHERE quantity <= 1
			ORDER BY quantity ASC, name ASC`
		)
		.all() as Item[];

	const { c: totalCount } = db.query(`SELECT count(*) AS c FROM items`).get() as { c: number };
	const { c: inStock } = db
		.query(`SELECT count(*) AS c FROM items WHERE quantity > 0`)
		.get() as { c: number };

	const buckets = {
		expired: expiring.filter((i) => expiryStatus(i.expiryDate) === 'expired'),
		critical: expiring.filter((i) => expiryStatus(i.expiryDate) === 'critical'),
		warning: expiring.filter((i) => expiryStatus(i.expiryDate) === 'warning')
	};

	return { today, totalCount, inStock, buckets, lowStock };
};
