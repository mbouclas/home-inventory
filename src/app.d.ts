/// <reference types="bun" />
// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	type SessionUser = {
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

	type Session = {
		id: string;
		userId: number;
		expiresAt: number;
		createdAt: number;
		updatedAt: number;
		ipAddress: string | null;
		userAgent: string | null;
	};

	namespace App {
		// interface Error {}
		interface Locals {
			user: SessionUser | null;
			session: Session | null;
		}
		interface PageData {
			user?: SessionUser | null;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
