import { json, error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { db, schema } from '$lib/server/db';
import { deletePhoto } from '$lib/server/cloudinary';

export const DELETE: RequestHandler = async ({ params }) => {
	const id = Number(params.id);
	if (!Number.isFinite(id)) throw error(400, 'bad id');

	const [item] = await db.select().from(schema.items).where(eq(schema.items.id, id));
	if (!item) throw error(404, 'not found');

	if (item.photoPublicId) {
		try {
			await deletePhoto(item.photoPublicId);
		} catch (e) {
			console.warn('cloudinary delete failed', e);
		}
	}

	await db.delete(schema.items).where(eq(schema.items.id, id));
	return json({ ok: true });
};
