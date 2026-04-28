import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { deletePhoto } from '$lib/server/cloudinary';
import { emitAppEvent } from '$lib/server/events';

export const DELETE: RequestHandler = async ({ locals, params }) => {
	const user = locals.user;
	if (!user) throw error(401, 'not authenticated');

	const id = Number(params.id);
	if (!Number.isFinite(id)) throw error(400, 'bad id');

	const item = db
		.query(`SELECT name, user_id AS userId, photo_public_id AS photoPublicId FROM items WHERE id = $id`)
		.get({ $id: id }) as { name: string; userId: number | null; photoPublicId: string | null } | null;
	if (!item) throw error(404, 'not found');

	if (item.photoPublicId) {
		try {
			await deletePhoto(item.photoPublicId);
		} catch (e) {
			console.warn('cloudinary delete failed', e);
		}
	}

	db.query(`DELETE FROM items WHERE id = $id`).run({ $id: id });
	emitAppEvent('item.deleted', {
		actorUserId: user.id,
		itemId: id,
		itemOwnerUserId: item.userId,
		metadata: { name: item.name }
	});
	return json({ ok: true });
};
