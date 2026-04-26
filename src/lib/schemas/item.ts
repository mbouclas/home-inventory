import { z } from 'zod';

const isoDate = z
	.string()
	.regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
	.optional()
	.or(z.literal('').transform(() => undefined));

export const itemFormSchema = z.object({
	name: z.string().min(1, 'Required').max(200),
	dosage: z.string().max(100).optional().or(z.literal('').transform(() => undefined)),
	description: z.string().max(2000).optional().or(z.literal('').transform(() => undefined)),
	usage: z.string().max(2000).optional().or(z.literal('').transform(() => undefined)),
	expiryDate: isoDate,
	barcode: z.string().max(64).optional().or(z.literal('').transform(() => undefined)),
	quantity: z.coerce.number().int().min(0).max(99999).default(1),
	photoUrl: z.string().url().optional().or(z.literal('').transform(() => undefined)),
	photoPublicId: z.string().optional().or(z.literal('').transform(() => undefined)),
	categoryIds: z.array(z.coerce.number().int().positive()).default([]),
	tags: z.array(z.string().min(1).max(40)).max(20).default([])
});

export type ItemFormData = z.infer<typeof itemFormSchema>;

export const aiExtractedSchema = z.object({
	name: z.string().nullable(),
	dosage: z.string().nullable(),
	description: z.string().nullable(),
	usage: z.string().nullable(),
	expiryDate: z.string().nullable(),
	barcode: z.string().nullable()
});

export type AiExtracted = z.infer<typeof aiExtractedSchema>;

export const aiClassifiedSchema = z.object({
	categories: z.array(z.string()).max(5),
	tags: z.array(z.string()).max(8)
});

export type AiClassified = z.infer<typeof aiClassifiedSchema>;
