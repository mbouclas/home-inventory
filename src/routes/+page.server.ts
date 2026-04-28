import type { PageServerLoad } from './$types';
import { db, ITEM_COLUMNS, type Item } from '$lib/server/db';
import { attachLots } from '$lib/server/db/lots';
import { listTopCategories } from '$lib/server/db/relations';
import { todayIso, expiryStatus } from '$lib/expiry';

export const load: PageServerLoad = async () => {
	const today = todayIso();
	const cutoff = new Date();
	cutoff.setDate(cutoff.getDate() + 30);
	const cutoffIso = cutoff.toISOString().slice(0, 10);

	const expiring = db
		.query(
			`SELECT
				items.id,
				items.user_id AS userId,
				items.barcode,
				items.name,
				items.dosage,
				items.description,
				items.usage,
				l.expiry_date AS expiryDate,
				l.quantity,
				items.photo_url AS photoUrl,
				items.photo_public_id AS photoPublicId,
				items.created_at AS createdAt,
				items.updated_at AS updatedAt,
				l.id AS lotId,
				l.created_at AS lotCreatedAt,
				l.updated_at AS lotUpdatedAt
			FROM item_expiry_lots l
			JOIN items ON items.id = l.item_id
			WHERE l.expiry_date IS NOT NULL AND l.expiry_date <= $cutoff
			ORDER BY l.expiry_date ASC, items.name ASC`
		)
		.all({ $cutoff: cutoffIso })
		.map((row) => {
			const it = row as Omit<Item, 'expiryLots'> & { lotId: number; lotCreatedAt: number; lotUpdatedAt: number };
			return {
				...it,
				expiryLots: [
					{
						id: it.lotId,
						itemId: it.id,
						expiryDate: it.expiryDate,
						quantity: it.quantity,
						createdAt: it.lotCreatedAt,
						updatedAt: it.lotUpdatedAt
					}
				]
			} as Item;
		});

	const lowStock = attachLots(db
		.query(
			`SELECT * FROM (SELECT ${ITEM_COLUMNS} FROM items)
			WHERE quantity <= 1
			ORDER BY quantity ASC, name ASC`
		)
		.all() as Omit<Item, 'expiryLots'>[]);

	const { c: totalCount } = db.query(`SELECT count(*) AS c FROM items`).get() as { c: number };
	const { c: inStock } = db
		.query(`SELECT count(*) AS c FROM (SELECT items.id FROM items JOIN item_expiry_lots l ON l.item_id = items.id GROUP BY items.id HAVING SUM(l.quantity) > 0)`)
		.get() as { c: number };

	const buckets = {
		expired: expiring.filter((i) => expiryStatus(i.expiryDate) === 'expired'),
		critical: expiring.filter((i) => expiryStatus(i.expiryDate) === 'critical'),
		warning: expiring.filter((i) => expiryStatus(i.expiryDate) === 'warning')
	};

	return { today, totalCount, inStock, topCategories: listTopCategories(), buckets, lowStock };
};
