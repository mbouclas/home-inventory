import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createCategory, listCategories } from '$lib/server/db/relations';

export const GET: RequestHandler = async () => {
	return json({ categories: listCategories() });
};

export const POST: RequestHandler = async ({ request }) => {
	const body = (await request.json().catch(() => null)) as { name?: unknown } | null;
	const name = typeof body?.name === 'string' ? body.name.trim() : '';
	if (!name) throw error(400, 'name required');
	if (name.length > 60) throw error(400, 'name too long');

	const category = createCategory(name);
	if (!category) throw error(400, 'invalid name');

	return json({ category });
};
