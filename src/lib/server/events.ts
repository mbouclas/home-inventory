import { EventEmitter } from 'node:events';

export type ItemAuditAction = 'item.created' | 'item.updated' | 'item.deleted';

export type ItemAuditPayload = {
	actorUserId: number;
	itemId: number;
	itemOwnerUserId: number | null;
	metadata?: Record<string, unknown>;
	createdAt?: number;
};

type AppEvents = {
	'item.created': ItemAuditPayload;
	'item.updated': ItemAuditPayload;
	'item.deleted': ItemAuditPayload;
};

const emitter = new EventEmitter();

export function onAppEvent<K extends keyof AppEvents>(
	event: K,
	listener: (payload: AppEvents[K]) => void
) {
	emitter.on(event, listener);
}

export function emitAppEvent<K extends keyof AppEvents>(event: K, payload: AppEvents[K]) {
	emitter.emit(event, payload);
}
