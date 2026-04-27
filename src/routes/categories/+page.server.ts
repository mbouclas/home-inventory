import type { PageServerLoad } from './$types';
import { listCategoriesWithItemCount } from '$lib/server/db/relations';

export const load: PageServerLoad = async () => {
	return { categories: listCategoriesWithItemCount() };
};
