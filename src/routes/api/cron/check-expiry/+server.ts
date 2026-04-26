import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, ITEM_COLUMNS, type Item } from '$lib/server/db';
import { sendMail } from '$lib/server/mail';
import { env } from '$env/dynamic/private';
import { todayIso, daysUntil, expiryStatus } from '$lib/expiry';

function timingSafeEqual(a: string, b: string) {
	if (a.length !== b.length) return false;
	let r = 0;
	for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
	return r === 0;
}

function renderEmail(buckets: { expired: Item[]; critical: Item[]; warning: Item[] }) {
	const row = (it: Item) => {
		const d = daysUntil(it.expiryDate);
		const when =
			d === null ? '—' : d < 0 ? `<b style="color:#c00">expired ${-d}d ago</b>` : `in ${d} day${d === 1 ? '' : 's'}`;
		const dose = it.dosage ? ` <span style="color:#666">(${it.dosage})</span>` : '';
		return `<tr>
			<td style="padding:6px 12px;border-bottom:1px solid #eee">${escapeHtml(it.name)}${dose}</td>
			<td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right">${escapeHtml(String(it.quantity))}</td>
			<td style="padding:6px 12px;border-bottom:1px solid #eee">${escapeHtml(it.expiryDate ?? '')}</td>
			<td style="padding:6px 12px;border-bottom:1px solid #eee">${when}</td>
		</tr>`;
	};
	const section = (label: string, items: Item[], color: string) => {
		if (!items.length) return '';
		return `<h3 style="margin:24px 0 8px;color:${color}">${label} (${items.length})</h3>
		<table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;font-size:14px">
			<thead><tr style="text-align:left;background:#f6f6f6">
				<th style="padding:6px 12px">Item</th>
				<th style="padding:6px 12px;text-align:right">Qty</th>
				<th style="padding:6px 12px">Expires</th>
				<th style="padding:6px 12px">Status</th>
			</tr></thead>
			<tbody>${items.map(row).join('')}</tbody>
		</table>`;
	};
	return `<div style="font-family:system-ui,sans-serif;max-width:640px;margin:0 auto;padding:16px">
		<h2 style="margin-top:0">Home Pharmacy — daily expiry digest</h2>
		<p style="color:#666">${todayIso()}</p>
		${section('Already expired', buckets.expired, '#c00')}
		${section('Expiring within 7 days', buckets.critical, '#c60')}
		${section('Expiring within 30 days', buckets.warning, '#a80')}
	</div>`;
}

function escapeHtml(s: string) {
	return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

export const POST: RequestHandler = async ({ request }) => {
	const auth = request.headers.get('authorization') ?? '';
	const token = auth.replace(/^Bearer\s+/i, '');
	if (!env.CRON_SECRET || !timingSafeEqual(token, env.CRON_SECRET)) {
		throw error(401, 'unauthorized');
	}

	const today = todayIso();
	const cutoff = new Date();
	cutoff.setDate(cutoff.getDate() + 30);
	const cutoffIso = cutoff.toISOString().slice(0, 10);

	const candidates = db
		.query(
			`SELECT ${ITEM_COLUMNS} FROM items
			WHERE expiry_date IS NOT NULL AND expiry_date <= $cutoff AND quantity > 0`
		)
		.all({ $cutoff: cutoffIso }) as Item[];

	const buckets = { expired: [] as Item[], critical: [] as Item[], warning: [] as Item[] };
	for (const it of candidates) {
		const s = expiryStatus(it.expiryDate);
		if (s === 'expired') buckets.expired.push(it);
		else if (s === 'critical') buckets.critical.push(it);
		else if (s === 'warning') buckets.warning.push(it);
	}

	const total = buckets.expired.length + buckets.critical.length + buckets.warning.length;
	let sent = false;
	if (total > 0 && env.NOTIFY_EMAIL) {
		await sendMail({
			to: env.NOTIFY_EMAIL,
			subject: `Home Pharmacy: ${total} item${total === 1 ? '' : 's'} expiring (${today})`,
			html: renderEmail(buckets)
		});
		sent = true;
	}

	return json({
		date: today,
		checked: candidates.length,
		expired: buckets.expired.length,
		critical: buckets.critical.length,
		warning: buckets.warning.length,
		sent
	});
};
