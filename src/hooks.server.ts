import { building } from '$app/environment';
import { redirect, type Handle } from '@sveltejs/kit';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { auth, toAppSession } from '$lib/server/auth';
import { registerAuditListeners } from '$lib/server/audit';

registerAuditListeners();

function isPublicPath(pathname: string) {
	return (
		pathname === '/login' ||
		pathname.startsWith('/api/auth') ||
		pathname === '/api/cron/check-expiry' ||
		pathname === '/favicon.svg' ||
		pathname === '/service-worker.js' ||
		pathname.startsWith('/_app/') ||
		pathname.startsWith('/.well-known/')
	);
}

export const handle: Handle = async ({ event, resolve }) => {
	const sessionResult = toAppSession(
		(await auth.api.getSession({
			headers: event.request.headers
		})) as Parameters<typeof toAppSession>[0]
	);
	event.locals.session = sessionResult?.session ?? null;
	event.locals.user = sessionResult?.user ?? null;

	if (!event.locals.user && !isPublicPath(event.url.pathname)) {
		if (event.url.pathname.startsWith('/api/')) {
			return new Response('Not authenticated', { status: 401 });
		}

		throw redirect(303, `/login?redirectTo=${encodeURIComponent(event.url.pathname + event.url.search)}`);
	}

	return svelteKitHandler({ event, resolve, auth, building });
};
