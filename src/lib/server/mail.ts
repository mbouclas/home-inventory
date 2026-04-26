import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '$env/dynamic/private';

let transporter: Transporter | null = null;

export function getTransporter(): Transporter {
	if (transporter) return transporter;
	const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = env;
	if (!SMTP_HOST || !SMTP_PORT) {
		throw new Error('Missing SMTP_HOST / SMTP_PORT');
	}
	transporter = nodemailer.createTransport({
		host: SMTP_HOST,
		port: Number(SMTP_PORT),
		secure: Number(SMTP_PORT) === 465,
		auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined
	});
	return transporter;
}

export async function sendMail(opts: { to: string; subject: string; html: string; text?: string }) {
	const t = getTransporter();
	const from = env.SMTP_FROM ?? `Home Pharmacy <${env.SMTP_USER ?? 'no-reply@example.com'}>`;
	return t.sendMail({ from, ...opts });
}
