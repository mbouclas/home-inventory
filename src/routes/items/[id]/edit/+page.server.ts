import { error, fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import { itemFormSchema } from '$lib/schemas/item';
import { db, schema } from '$lib/server/db';

export const load: PageServerLoad = async ({ params }) => {
	const id = Number(params.id);
	if (!Number.isFinite(id)) throw error(400, 'bad id');
	const [item] = await db.select().from(schema.items).where(eq(schema.items.id, id));
	if (!item) throw error(404, 'not found');

	const form = await superValidate(
		{
			name: item.name,
			dosage: item.dosage ?? '',
			description: item.description ?? '',
			usage: item.usage ?? '',
			expiryDate: item.expiryDate ?? '',
			barcode: item.barcode ?? '',
			quantity: item.quantity,
			photoUrl: item.photoUrl ?? '',
			photoPublicId: item.photoPublicId ?? ''
		},
		zod4(itemFormSchema)
	);

	return { form, item };
};

export const actions: Actions = {
	default: async ({ params, request }) => {
		const id = Number(params.id);
		if (!Number.isFinite(id)) throw error(400, 'bad id');

		const form = await superValidate(request, zod4(itemFormSchema));
		if (!form.valid) return fail(400, { form });

		await db
			.update(schema.items)
			.set({
				name: form.data.name,
				dosage: form.data.dosage ?? null,
				description: form.data.description ?? null,
				usage: form.data.usage ?? null,
				expiryDate: form.data.expiryDate ?? null,
				barcode: form.data.barcode ?? null,
				quantity: form.data.quantity,
				photoUrl: form.data.photoUrl ?? null,
				photoPublicId: form.data.photoPublicId ?? null,
				updatedAt: Date.now()
			})
			.where(eq(schema.items.id, id));

		throw redirect(303, '/items');
	}
};
