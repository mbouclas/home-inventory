import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getCategoryBySlug, listItemsByCategorySlug } from '$lib/server/db/relations';

export const load: PageServerLoad = async ({ params }) => {
	const category = getCategoryBySlug(params.slug);
	if (!category) error(404, 'Category not found');

	return { category, items: listItemsByCategorySlug(params.slug) };
};
