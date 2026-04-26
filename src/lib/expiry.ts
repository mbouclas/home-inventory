export type ExpiryStatus = 'expired' | 'critical' | 'warning' | 'ok' | 'unknown';

const MS_DAY = 86_400_000;

export function todayIso(): string {
	const d = new Date();
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

export function daysUntil(expiry: string | null | undefined): number | null {
	if (!expiry) return null;
	const t = Date.parse(expiry + 'T00:00:00');
	if (Number.isNaN(t)) return null;
	const now = Date.parse(todayIso() + 'T00:00:00');
	return Math.round((t - now) / MS_DAY);
}

export function expiryStatus(expiry: string | null | undefined): ExpiryStatus {
	const d = daysUntil(expiry);
	if (d === null) return 'unknown';
	if (d < 0) return 'expired';
	if (d <= 7) return 'critical';
	if (d <= 30) return 'warning';
	return 'ok';
}

export function formatExpiryLabel(expiry: string | null | undefined): string {
	const d = daysUntil(expiry);
	if (d === null) return '—';
	if (d < 0) return `Expired ${-d}d ago`;
	if (d === 0) return 'Expires today';
	if (d === 1) return 'Expires tomorrow';
	if (d <= 60) return `Expires in ${d}d`;
	return expiry!;
}
