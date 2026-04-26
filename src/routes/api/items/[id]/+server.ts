import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { deletePhoto } from '$lib/server/cloudinary';

export const DELETE: RequestHandler = async ({ params }) => {
	const id = Number(params.id);
	if (!Number.isFinite(id)) throw error(400, 'bad id');

	const item = db
		.query(`SELECT photo_public_id AS photoPublicId FROM items WHERE id = $id`)
		.get({ $id: id }) as { photoPublicId: string | null } | null;
	if (!item) throw error(404, 'not found');

	if (item.photoPublicId) {
		try {
			await deletePhoto(item.photoPublicId);
		} catch (e) {
			console.warn('cloudinary delete failed', e);
		}
	}

	db.query(`DELETE FROM items WHERE id = $id`).run({ $id: id });
	return json({ ok: true });
};
