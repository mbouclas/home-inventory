import { json, error } from '@sveltejs/kit';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import type { RequestHandler } from './$types';
import { db, schema } from '$lib/server/db';

const Body = z.union([
	z.object({ delta: z.number().int().min(-1000).max(1000) }),
	z.object({ quantity: z.number().int().min(0).max(99999) })
]);

export const PATCH: RequestHandler = async ({ params, request }) => {
	const id = Number(params.id);
	if (!Number.isFinite(id)) throw error(400, 'bad id');

	const parsed = Body.safeParse(await request.json().catch(() => ({})));
	if (!parsed.success) throw error(400, 'bad body');

	if ('delta' in parsed.data) {
		const delta = parsed.data.delta;
		await db
			.update(schema.items)
			.set({
				quantity: sql`max(0, ${schema.items.quantity} + ${delta})`,
				updatedAt: Date.now()
			})
			.where(eq(schema.items.id, id));
	} else {
		await db
			.update(schema.items)
			.set({ quantity: parsed.data.quantity, updatedAt: Date.now() })
			.where(eq(schema.items.id, id));
	}

	const [updated] = await db.select().from(schema.items).where(eq(schema.items.id, id));
	if (!updated) throw error(404, 'not found');
	return json({ quantity: updated.quantity });
};
