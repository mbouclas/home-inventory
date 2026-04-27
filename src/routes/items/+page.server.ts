import type { PageServerLoad } from './$types';
import { db, ITEM_COLUMNS, type Item } from '$lib/server/db';
import { attachLots } from '$lib/server/db/lots';

export const load: PageServerLoad = async ({ url }) => {
	const q = url.searchParams.get('q')?.trim() ?? '';

	const rows = attachLots(q
		? (db
				.query(
					`SELECT ${ITEM_COLUMNS} FROM items
					WHERE lower(name) LIKE $like OR barcode = $q
					ORDER BY quantity ASC, expiryDate ASC`
				)
				.all({ $like: '%' + q.toLowerCase() + '%', $q: q }) as Omit<Item, 'expiryLots'>[])
		: (db
				.query(
					`SELECT ${ITEM_COLUMNS} FROM items
					ORDER BY quantity ASC, expiryDate ASC, updated_at DESC`
				)
				.all() as Omit<Item, 'expiryLots'>[]));

	return { items: rows, q };
};
