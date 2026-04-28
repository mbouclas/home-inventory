import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { auth } from '$lib/server/auth';

export const POST: RequestHandler = async ({ request, locals }) => {
	await auth.api.signOut({ headers: request.headers });
	locals.user = null;
	locals.session = null;
	throw redirect(303, '/login');
};
