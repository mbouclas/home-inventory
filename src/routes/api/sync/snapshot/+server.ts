import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getInventorySnapshot } from '$lib/server/db/snapshot';

export const GET: RequestHandler = async () => {
	return json(getInventorySnapshot());
};
