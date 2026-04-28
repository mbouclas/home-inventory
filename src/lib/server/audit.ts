import { db } from './db';
import { onAppEvent, type ItemAuditAction, type ItemAuditPayload } from './events';

let registered = false;

function insertAuditEvent(action: ItemAuditAction, payload: ItemAuditPayload) {
	db.query(
		`INSERT INTO audit_events (
			actor_user_id, action, entity_type, entity_id,
			item_owner_user_id, metadata_json, created_at
		) VALUES (
			$actorUserId, $action, 'item', $entityId,
			$itemOwnerUserId, $metadataJson, $createdAt
		)`
	).run({
		$actorUserId: payload.actorUserId,
		$action: action,
		$entityId: payload.itemId,
		$itemOwnerUserId: payload.itemOwnerUserId,
		$metadataJson: payload.metadata ? JSON.stringify(payload.metadata) : null,
		$createdAt: payload.createdAt ?? Date.now()
	});
}

export function registerAuditListeners() {
	if (registered) return;
	registered = true;
	onAppEvent('item.created', (payload) => insertAuditEvent('item.created', payload));
	onAppEvent('item.updated', (payload) => insertAuditEvent('item.updated', payload));
	onAppEvent('item.deleted', (payload) => insertAuditEvent('item.deleted', payload));
}
