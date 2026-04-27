import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import { itemFormSchema } from '$lib/schemas/item';
import { db } from '$lib/server/db';
import { replaceItemLots } from '$lib/server/db/lots';
import {
	listCategories,
	setItemCategories,
	setItemTags
} from '$lib/server/db/relations';

export const load: PageServerLoad = async ({ url }) => {
	const categories = listCategories();
	const categoriesByName = new Map(categories.map((c) => [c.name, c.id]));

	const rawTags = url.searchParams.get('tags') ?? '';
	const tags = rawTags
		? rawTags
				.split(',')
				.map((t) => t.trim().toLowerCase())
				.filter((t) => t.length > 0)
		: [];

	const rawCategoryNames = url.searchParams.get('categoryNames') ?? '';
	const categoryIds = rawCategoryNames
		? rawCategoryNames
				.split('|')
				.map((n) => categoriesByName.get(n.trim()))
				.filter((id): id is number => typeof id === 'number')
		: [];

	const aiSuggested = url.searchParams.get('ai') === '1';
	const initialQuantity = Number(url.searchParams.get('quantity') ?? 1);

	const initial = {
		name: url.searchParams.get('name') ?? '',
		dosage: url.searchParams.get('dosage') ?? '',
		description: url.searchParams.get('description') ?? '',
		usage: url.searchParams.get('usage') ?? '',
		expiryDate: url.searchParams.get('expiryDate') ?? '',
		barcode: url.searchParams.get('barcode') ?? '',
		quantity: initialQuantity,
		expiryLots: initialQuantity > 0 ? [
			{
				quantity: initialQuantity,
				expiryDate: url.searchParams.get('expiryDate') ?? ''
			}
		] : [],
		photoUrl: url.searchParams.get('photoUrl') ?? '',
		photoPublicId: url.searchParams.get('photoPublicId') ?? '',
		categoryIds,
		tags
	};
	const form = await superValidate(initial, zod4(itemFormSchema));
	return { form, categories, aiSuggested };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await superValidate(request, zod4(itemFormSchema));
		if (!form.valid) return fail(400, { form });

		const tx = db.transaction(() => {
			const now = Date.now();
			const created = db
				.query(
					`INSERT INTO items (
						name, dosage, description, usage, barcode,
						photo_url, photo_public_id, updated_at
					) VALUES (
						$name, $dosage, $description, $usage, $barcode,
						$photoUrl, $photoPublicId, $updatedAt
					) RETURNING id`
				)
				.get({
					$name: form.data.name,
					$dosage: form.data.dosage ?? null,
					$description: form.data.description ?? null,
					$usage: form.data.usage ?? null,
					$barcode: form.data.barcode ?? null,
					$photoUrl: form.data.photoUrl ?? null,
					$photoPublicId: form.data.photoPublicId ?? null,
					$updatedAt: now
				}) as { id: number };

			replaceItemLots(created.id, form.data.expiryLots, now);
			setItemCategories(created.id, form.data.categoryIds);
			setItemTags(created.id, form.data.tags);
			return created;
		});
		const created = tx();

		throw redirect(303, `/items?added=${created.id}`);
	}
};
