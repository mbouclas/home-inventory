import OpenAI from 'openai';
import { env } from '$env/dynamic/private';
import { aiExtractedSchema, type AiExtracted } from '$lib/schemas/item';

let client: OpenAI | null = null;
function getClient() {
	if (!client) {
		if (!env.OPENAI_API_KEY) throw new Error('Missing OPENAI_API_KEY');
		client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
	}
	return client;
}

const SYSTEM = `You extract pharmaceutical or medical-supply information from a single photograph of an item or its packaging.
Rules:
- Return only fields you can read with confidence. Use null for anything missing or unreadable.
- "name": brand or product name as printed (no marketing taglines).
- "dosage": active ingredient strength, e.g. "500 mg", "5 mg/ml", "20 mcg/dose". Null for non-medication supplies.
- "description": one short sentence on what the item is (e.g. "Ibuprofen, a non-steroidal anti-inflammatory pain reliever.").
- "usage": dosing/usage instructions visible on the box, condensed to 1–3 sentences. Do not invent.
- "expiryDate": normalize to ISO YYYY-MM-DD. If only month/year ("EXP 03/2027" or "03 2027"), use the LAST day of that month. Null if absent.
- "barcode": digits only, no spaces, of the EAN/UPC/GTIN if visible.`;

const RESPONSE_SCHEMA = {
	type: 'object',
	additionalProperties: false,
	properties: {
		name: { type: ['string', 'null'] },
		dosage: { type: ['string', 'null'] },
		description: { type: ['string', 'null'] },
		usage: { type: ['string', 'null'] },
		expiryDate: { type: ['string', 'null'] },
		barcode: { type: ['string', 'null'] }
	},
	required: ['name', 'dosage', 'description', 'usage', 'expiryDate', 'barcode']
} as const;

export async function extractFromImageUrl(imageUrl: string): Promise<AiExtracted> {
	const openai = getClient();
	const completion = await openai.chat.completions.create({
		model: env.OPENAI_MODEL ?? 'gpt-4o',
		temperature: 0,
		messages: [
			{ role: 'system', content: SYSTEM },
			{
				role: 'user',
				content: [
					{ type: 'text', text: 'Extract the fields from this photo. Return only JSON matching the schema.' },
					{ type: 'image_url', image_url: { url: imageUrl, detail: 'high' } }
				]
			}
		],
		response_format: {
			type: 'json_schema',
			json_schema: { name: 'pharma_item', strict: true, schema: RESPONSE_SCHEMA }
		}
	});

	const raw = completion.choices[0]?.message?.content ?? '{}';
	return aiExtractedSchema.parse(JSON.parse(raw));
}
