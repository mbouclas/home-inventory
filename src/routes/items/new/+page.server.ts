import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import { itemFormSchema } from '$lib/schemas/item';
import { db } from '$lib/server/db';

export const load: PageServerLoad = async ({ url }) => {
	const initial = {
		name: url.searchParams.get('name') ?? '',
		dosage: url.searchParams.get('dosage') ?? '',
		description: url.searchParams.get('description') ?? '',
		usage: url.searchParams.get('usage') ?? '',
		expiryDate: url.searchParams.get('expiryDate') ?? '',
		barcode: url.searchParams.get('barcode') ?? '',
		quantity: Number(url.searchParams.get('quantity') ?? 1),
		photoUrl: url.searchParams.get('photoUrl') ?? '',
		photoPublicId: url.searchParams.get('photoPublicId') ?? ''
	};
	const form = await superValidate(initial, zod4(itemFormSchema));
	return { form };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await superValidate(request, zod4(itemFormSchema));
		if (!form.valid) return fail(400, { form });

		const created = db
			.query(
				`INSERT INTO items (
					name, dosage, description, usage, expiry_date, barcode,
					quantity, photo_url, photo_public_id, updated_at
				) VALUES (
					$name, $dosage, $description, $usage, $expiryDate, $barcode,
					$quantity, $photoUrl, $photoPublicId, $updatedAt
				) RETURNING id`
			)
			.get({
				$name: form.data.name,
				$dosage: form.data.dosage ?? null,
				$description: form.data.description ?? null,
				$usage: form.data.usage ?? null,
				$expiryDate: form.data.expiryDate ?? null,
				$barcode: form.data.barcode ?? null,
				$quantity: form.data.quantity,
				$photoUrl: form.data.photoUrl ?? null,
				$photoPublicId: form.data.photoPublicId ?? null,
				$updatedAt: Date.now()
			}) as { id: number };

		throw redirect(303, `/items?added=${created.id}`);
	}
};
