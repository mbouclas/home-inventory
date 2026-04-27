import { json } from '@sveltejs/kit';
import { z } from 'zod';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { deletePhoto } from '$lib/server/cloudinary';
import { getInventorySnapshot } from '$lib/server/db/snapshot';
import { addItemLots, consumeItemQuantity } from '$lib/server/db/lots';
import type { SyncOperationResult } from '$lib/types/inventory';

const Operation = z.discriminatedUnion('type', [
	z.object({
		id: z.string().min(1),
		type: z.literal('addStock'),
		itemId: z.number().int().positive(),
		lots: z.array(z.object({ quantity: z.number().int().min(1).max(1000), expiryDate: z.string().nullable() })).min(1).max(100),
		createdAt: z.number().int()
	}),
	z.object({
		id: z.string().min(1),
		type: z.literal('consumeStock'),
		itemId: z.number().int().positive(),
		quantity: z.number().int().min(1).max(1000),
		createdAt: z.number().int()
	}),
	z.object({
		id: z.string().min(1),
		type: z.literal('deleteItem'),
		itemId: z.number().int().positive(),
		createdAt: z.number().int()
	})
]);

const Body = z.object({ operations: z.array(Operation).max(200) });

export const POST: RequestHandler = async ({ request }) => {
	const parsed = Body.safeParse(await request.json().catch(() => ({})));
	if (!parsed.success) {
		return json({ results: [], snapshot: getInventorySnapshot() }, { status: 400 });
	}

	const results: SyncOperationResult[] = [];
	for (const operation of parsed.data.operations) {
		try {
			if (operation.type === 'addStock') {
				addItemLots(operation.itemId, operation.lots, operation.createdAt);
				results.push({ id: operation.id, ok: true });
				continue;
			}

			if (operation.type === 'consumeStock') {
				consumeItemQuantity(operation.itemId, operation.quantity, operation.createdAt);
				results.push({ id: operation.id, ok: true });
				continue;
			}

			const item = db
				.query(`SELECT photo_public_id AS photoPublicId FROM items WHERE id = $id`)
				.get({ $id: operation.itemId }) as { photoPublicId: string | null } | null;

			if (item?.photoPublicId) {
				try {
					await deletePhoto(item.photoPublicId);
				} catch (error) {
					console.warn('cloudinary delete failed', error);
				}
			}

			db.query(`DELETE FROM items WHERE id = $id`).run({ $id: operation.itemId });
			results.push({ id: operation.id, ok: true });
		} catch (error) {
			results.push({
				id: operation.id,
				ok: false,
				error: error instanceof Error ? error.message : 'Operation failed'
			});
		}
	}

	return json({ results, snapshot: getInventorySnapshot() });
};
