import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { assignUnownedItemsToUser, auth, getUserCount } from '$lib/server/auth';

function safeRedirectTo(value: FormDataEntryValue | string | null) {
	const redirectTo = typeof value === 'string' ? value : '/';
	return redirectTo.startsWith('/') && !redirectTo.startsWith('//') ? redirectTo : '/';
}

function authErrorMessage(error: unknown, fallback: string) {
	if (error && typeof error === 'object' && 'body' in error) {
		const body = (error as { body?: { message?: string } }).body;
		if (body?.message) return body.message;
	}

	return error instanceof Error ? error.message : fallback;
}

export const load: PageServerLoad = ({ locals, url }) => {
	if (locals.user) throw redirect(303, safeRedirectTo(url.searchParams.get('redirectTo')));
	return { needsSetup: getUserCount() === 0 };
};

export const actions: Actions = {
	default: async ({ request, url }) => {
		const form = await request.formData();
		const name = String(form.get('name') ?? '');
		const email = String(form.get('email') ?? '').trim().toLowerCase();
		const username = String(form.get('username') ?? '');
		const password = String(form.get('password') ?? '');
		const redirectTo = safeRedirectTo(form.get('redirectTo') ?? url.searchParams.get('redirectTo'));
		const needsSetup = getUserCount() === 0;

		try {
			const authResult = needsSetup
				? await auth.api.signUpEmail({
					body: {
						name,
						email,
						password,
						username,
						displayUsername: username,
						callbackURL: redirectTo
					},
					headers: request.headers
				})
				: await auth.api.signInUsername({
					body: {
						username,
						password,
						callbackURL: redirectTo
					},
					headers: request.headers
				});

			if (!authResult?.user) {
				return fail(400, { message: 'Invalid username or password', name, email, username, needsSetup: false });
			}

			if (needsSetup) assignUnownedItemsToUser(Number(authResult.user.id));
		} catch (error) {
			return fail(400, {
				message: authErrorMessage(error, needsSetup ? 'Could not create account' : 'Could not sign in'),
				name,
				email,
				username,
				needsSetup
			});
		}

		throw redirect(303, redirectTo);
	}
};
