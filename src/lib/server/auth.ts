import { getRequestEvent } from '$app/server';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { createAuth, getAuthDatabase } from './auth-config';

export const auth = createAuth({
	plugins: [sveltekitCookies(getRequestEvent)]
});

export type AppSessionUser = {
	id: number;
	name: string;
	email: string;
	username: string;
	displayUsername: string;
	emailVerified: boolean;
	image: string | null;
	createdAt: number;
	updatedAt: number;
};

export type AppSession = {
	id: string;
	userId: number;
	expiresAt: number;
	createdAt: number;
	updatedAt: number;
	ipAddress: string | null;
	userAgent: string | null;
};

type BetterAuthSessionResult = {
	session: {
		id: string;
		userId: number | string;
		expiresAt: Date | string | number;
		createdAt: Date | string | number;
		updatedAt: Date | string | number;
		ipAddress?: string | null;
		userAgent?: string | null;
	};
	user: {
		id: number | string;
		name: string;
		email: string;
		emailVerified: boolean;
		image?: string | null;
		username?: string;
		displayUsername?: string;
		createdAt: Date | string | number;
		updatedAt: Date | string | number;
	};
} | null;

function toTimestamp(value: Date | string | number) {
	return value instanceof Date ? value.getTime() : new Date(value).getTime();
}

export function getUserCount() {
	return (getAuthDatabase().query('SELECT count(*) AS count FROM users').get() as { count: number }).count;
}

export function assignUnownedItemsToUser(userId: number) {
	getAuthDatabase().query('UPDATE items SET user_id = $userId WHERE user_id IS NULL').run({
		$userId: userId
	});
}

export function toAppSession(result: BetterAuthSessionResult) {
	if (!result) return null;

	const user: AppSessionUser = {
		id: Number(result.user.id),
		name: result.user.name,
		email: result.user.email,
		username: result.user.username ?? result.user.email,
		displayUsername: result.user.displayUsername ?? result.user.username ?? result.user.email,
		emailVerified: result.user.emailVerified,
		image: result.user.image ?? null,
		createdAt: toTimestamp(result.user.createdAt),
		updatedAt: toTimestamp(result.user.updatedAt)
	};

	const session: AppSession = {
		id: result.session.id,
		userId: Number(result.session.userId),
		expiresAt: toTimestamp(result.session.expiresAt),
		createdAt: toTimestamp(result.session.createdAt),
		updatedAt: toTimestamp(result.session.updatedAt),
		ipAddress: result.session.ipAddress ?? null,
		userAgent: result.session.userAgent ?? null
	};

	return { user, session };
}
