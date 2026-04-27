import { db, type Item, type ItemExpiryLot } from './index';

export type StockLotInput = {
	quantity: number;
	expiryDate?: string | null;
};

const LOT_COLUMNS = `
	id,
	item_id AS itemId,
	expiry_date AS expiryDate,
	quantity,
	created_at AS createdAt,
	updated_at AS updatedAt
`;

export function normalizeLots(lots: StockLotInput[]) {
	return lots
		.map((lot) => ({
			quantity: Number(lot.quantity),
			expiryDate: lot.expiryDate || null
		}))
		.filter((lot) => Number.isInteger(lot.quantity) && lot.quantity > 0);
}

export function listItemLots(itemId: number): ItemExpiryLot[] {
	return db
		.query(
			`SELECT ${LOT_COLUMNS}
			FROM item_expiry_lots
			WHERE item_id = $itemId
			ORDER BY expiry_date IS NULL ASC, expiry_date ASC, id ASC`
		)
		.all({ $itemId: itemId }) as ItemExpiryLot[];
}

export function attachLots<T extends Item>(items: Omit<T, 'expiryLots'>[]): T[] {
	return items.map((item) => ({ ...item, expiryLots: listItemLots(item.id) }) as T);
}

export function getItemWithLots(item: Omit<Item, 'expiryLots'> | null): Item | null {
	if (!item) return null;
	return { ...item, expiryLots: listItemLots(item.id) };
}

export function replaceItemLots(itemId: number, lots: StockLotInput[], now = Date.now()) {
	const normalized = normalizeLots(lots);
	db.query(`DELETE FROM item_expiry_lots WHERE item_id = $itemId`).run({ $itemId: itemId });
	insertItemLots(itemId, normalized, now);
}

export function addItemLots(itemId: number, lots: StockLotInput[], now = Date.now()) {
	const normalized = normalizeLots(lots);
	if (normalized.length === 0) return;
	insertItemLots(itemId, normalized, now);
	db.query(`UPDATE items SET updated_at = $updatedAt WHERE id = $itemId`).run({
		$updatedAt: now,
		$itemId: itemId
	});
}

export function consumeItemQuantity(itemId: number, quantity: number, now = Date.now()) {
	if (!Number.isInteger(quantity) || quantity <= 0) return;

	const available = db
		.query(`SELECT COALESCE(SUM(quantity), 0) AS quantity FROM item_expiry_lots WHERE item_id = $itemId`)
		.get({ $itemId: itemId }) as { quantity: number };
	if (available.quantity < quantity) throw new Error('Not enough stock');

	let remaining = quantity;
	const lots = listItemLots(itemId);
	for (const lot of lots) {
		if (remaining <= 0) break;
		const used = Math.min(lot.quantity, remaining);
		remaining -= used;

		if (used === lot.quantity) {
			db.query(`DELETE FROM item_expiry_lots WHERE id = $id`).run({ $id: lot.id });
		} else {
			db.query(`UPDATE item_expiry_lots SET quantity = quantity - $used, updated_at = $updatedAt WHERE id = $id`).run({
				$used: used,
				$updatedAt: now,
				$id: lot.id
			});
		}
	}

	db.query(`UPDATE items SET updated_at = $updatedAt WHERE id = $itemId`).run({
		$updatedAt: now,
		$itemId: itemId
	});
}

function insertItemLots(itemId: number, lots: StockLotInput[], now: number) {
	for (const lot of lots) {
		db.query(
			`INSERT INTO item_expiry_lots (item_id, expiry_date, quantity, updated_at)
			VALUES ($itemId, $expiryDate, $quantity, $updatedAt)`
		).run({
			$itemId: itemId,
			$expiryDate: lot.expiryDate || null,
			$quantity: lot.quantity,
			$updatedAt: now
		});
	}
}
