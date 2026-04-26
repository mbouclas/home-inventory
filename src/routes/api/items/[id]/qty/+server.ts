import { json, error } from '@sveltejs/kit';
import { z } from 'zod';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';

const Body = z.union([
	z.object({ delta: z.number().int().min(-1000).max(1000) }),
	z.object({ quantity: z.number().int().min(0).max(99999) })
]);

export const PATCH: RequestHandler = async ({ params, request }) => {
	const id = Number(params.id);
	if (!Number.isFinite(id)) throw error(400, 'bad id');

	const parsed = Body.safeParse(await request.json().catch(() => ({})));
	if (!parsed.success) throw error(400, 'bad body');

	const now = Date.now();
	if ('delta' in parsed.data) {
		db.query(
			`UPDATE items SET quantity = max(0, quantity + $d), updated_at = $t WHERE id = $id`
		).run({ $d: parsed.data.delta, $t: now, $id: id });
	} else {
		db.query(`UPDATE items SET quantity = $q, updated_at = $t WHERE id = $id`).run({
			$q: parsed.data.quantity,
			$t: now,
			$id: id
		});
	}

	const updated = db
		.query(`SELECT quantity FROM items WHERE id = $id`)
		.get({ $id: id }) as { quantity: number } | null;
	if (!updated) throw error(404, 'not found');
	return json({ quantity: updated.quantity });
};
