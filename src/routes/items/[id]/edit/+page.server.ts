import { error, fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import { itemFormSchema } from '$lib/schemas/item';
import { db, ITEM_COLUMNS, type Item } from '$lib/server/db';
import { getItemWithLots, replaceItemLots } from '$lib/server/db/lots';
import {
	getItemCategoryIds,
	getItemTagNames,
	listCategories,
	setItemCategories,
	setItemTags
} from '$lib/server/db/relations';
import { deletePhoto } from '$lib/server/cloudinary';
import { emitAppEvent } from '$lib/server/events';

export const load: PageServerLoad = async ({ params }) => {
	const id = Number(params.id);
	if (!Number.isFinite(id)) throw error(400, 'bad id');
	const item = getItemWithLots(db
		.query(`SELECT ${ITEM_COLUMNS} FROM items WHERE id = $id`)
		.get({ $id: id }) as Omit<Item, 'expiryLots'> | null);
	if (!item) throw error(404, 'not found');

	const categoryIds = getItemCategoryIds(id);
	const tags = getItemTagNames(id);
	const categories = listCategories();

	const form = await superValidate(
		{
			name: item.name,
			dosage: item.dosage ?? '',
			description: item.description ?? '',
			usage: item.usage ?? '',
			expiryDate: item.expiryDate ?? '',
			barcode: item.barcode ?? '',
			quantity: item.quantity,
			expiryLots: item.expiryLots.map((lot) => ({
				quantity: lot.quantity,
				expiryDate: lot.expiryDate ?? ''
			})),
			photoUrl: item.photoUrl ?? '',
			photoPublicId: item.photoPublicId ?? '',
			categoryIds,
			tags
		},
		zod4(itemFormSchema)
	);

	return { form, item, categories };
};

export const actions: Actions = {
	default: async ({ locals, params, request }) => {
		const user = locals.user;
		if (!user) throw redirect(303, '/login');

		const id = Number(params.id);
		if (!Number.isFinite(id)) throw error(400, 'bad id');

		const form = await superValidate(request, zod4(itemFormSchema));
		if (!form.valid) return fail(400, { form });

		const existing = db
			.query(`SELECT name, user_id AS userId, photo_public_id AS photoPublicId FROM items WHERE id = $id`)
			.get({ $id: id }) as { name: string; userId: number | null; photoPublicId: string | null } | null;
		if (!existing) throw error(404, 'not found');

		const tx = db.transaction(() => {
			const now = Date.now();
			db.query(
				`UPDATE items SET
					name = $name,
					dosage = $dosage,
					description = $description,
					usage = $usage,
					barcode = $barcode,
					photo_url = $photoUrl,
					photo_public_id = $photoPublicId,
					updated_at = $updatedAt
				WHERE id = $id`
			).run({
				$name: form.data.name,
				$dosage: form.data.dosage ?? null,
				$description: form.data.description ?? null,
				$usage: form.data.usage ?? null,
				$barcode: form.data.barcode ?? null,
				$photoUrl: form.data.photoUrl ?? null,
				$photoPublicId: form.data.photoPublicId ?? null,
				$updatedAt: now,
				$id: id
			});

			replaceItemLots(id, form.data.expiryLots, now);
			setItemCategories(id, form.data.categoryIds);
			setItemTags(id, form.data.tags);
		});
		tx();
		emitAppEvent('item.updated', {
			actorUserId: user.id,
			itemId: id,
			itemOwnerUserId: existing.userId,
			metadata: { name: form.data.name, previousName: existing.name, change: 'details' }
		});

		if (
			existing.photoPublicId &&
			existing.photoPublicId !== form.data.photoPublicId
		) {
			try {
				await deletePhoto(existing.photoPublicId);
			} catch (error) {
				console.warn('cloudinary delete failed', error);
			}
		}

		throw redirect(303, '/items');
	}
};
