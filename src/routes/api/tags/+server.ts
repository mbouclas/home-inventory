import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { searchTags } from '$lib/server/db/relations';

export const GET: RequestHandler = async ({ url }) => {
	const q = url.searchParams.get('q') ?? '';
	const limitRaw = Number(url.searchParams.get('limit') ?? 10);
	const limit = Math.min(Math.max(Number.isFinite(limitRaw) ? limitRaw : 10, 1), 50);
	return json({ tags: searchTags(q, limit) });
};
