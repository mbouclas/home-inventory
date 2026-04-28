import { json, error } from '@sveltejs/kit';
import { z } from 'zod';
import type { RequestHandler } from './$types';
import { db, ITEM_COLUMNS, type Item } from '$lib/server/db';
import { addItemLots, consumeItemQuantity, getItemWithLots } from '$lib/server/db/lots';
import { emitAppEvent } from '$lib/server/events';

const Body = z.union([
	z.object({ lots: z.array(z.object({ quantity: z.number().int().min(1).max(1000), expiryDate: z.string().nullable() })).min(1).max(100) }),
	z.object({ quantityToConsume: z.number().int().min(1).max(1000) }),
	z.object({ delta: z.number().int().min(-1000).max(-1) })
]);

export const PATCH: RequestHandler = async ({ locals, params, request }) => {
	const user = locals.user;
	if (!user) throw error(401, 'not authenticated');

	const id = Number(params.id);
	if (!Number.isFinite(id)) throw error(400, 'bad id');

	const parsed = Body.safeParse(await request.json().catch(() => ({})));
	if (!parsed.success) throw error(400, 'bad body');

	const now = Date.now();
	let change: 'addStock' | 'consumeStock';
	try {
		if ('lots' in parsed.data) {
			addItemLots(id, parsed.data.lots, now);
			change = 'addStock';
		} else if ('quantityToConsume' in parsed.data) {
			consumeItemQuantity(id, parsed.data.quantityToConsume, now);
			change = 'consumeStock';
		} else {
			consumeItemQuantity(id, Math.abs(parsed.data.delta), now);
			change = 'consumeStock';
		}
	} catch (e) {
		throw error(400, e instanceof Error ? e.message : 'quantity update failed');
	}

	const updated = getItemWithLots(db
		.query(`SELECT ${ITEM_COLUMNS} FROM items WHERE id = $id`)
		.get({ $id: id }) as Omit<Item, 'expiryLots'> | null);
	if (!updated) throw error(404, 'not found');
	emitAppEvent('item.updated', {
		actorUserId: user.id,
		itemId: id,
		itemOwnerUserId: updated.userId,
		metadata: { name: updated.name, change }
	});
	return json({ quantity: updated.quantity, expiryDate: updated.expiryDate, expiryLots: updated.expiryLots });
};
