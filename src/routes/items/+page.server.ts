import type { PageServerLoad } from './$types';
import { db, ITEM_COLUMNS, type Item } from '$lib/server/db';

export const load: PageServerLoad = async ({ url }) => {
	const q = url.searchParams.get('q')?.trim() ?? '';

	const rows = q
		? (db
				.query(
					`SELECT ${ITEM_COLUMNS} FROM items
					WHERE lower(name) LIKE $like OR barcode = $q
					ORDER BY quantity ASC, expiry_date ASC`
				)
				.all({ $like: '%' + q.toLowerCase() + '%', $q: q }) as Item[])
		: (db
				.query(
					`SELECT ${ITEM_COLUMNS} FROM items
					ORDER BY quantity ASC, expiry_date ASC, updated_at DESC`
				)
				.all() as Item[]);

	return { items: rows, q };
};
