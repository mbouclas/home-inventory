import OpenAI from 'openai';
import { env } from '$env/dynamic/private';
import {
	aiClassifiedSchema,
	type AiClassified,
	type AiExtracted
} from '$lib/schemas/item';

let client: OpenAI | null = null;
function getClient() {
	if (!client) {
		if (!env.OPENAI_API_KEY) throw new Error('Missing OPENAI_API_KEY');
		client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
	}
	return client;
}

const SYSTEM = `You classify a single pharmacy/medicine item.
Rules:
- "categories": pick 1 to 3 names that BEST describe the item's primary use, drawn ONLY from the provided list of available categories. Never invent or paraphrase a category. If nothing fits, return [].
- "tags": 3 to 6 short, lowercase, single- or two-word tags useful for searching this item. Prefer: active ingredient (e.g. "ibuprofen"), pharmaceutical form (e.g. "tablet", "syrup", "cream", "drops"), and audience (e.g. "adult", "children", "infant"). No punctuation, no hashtags, no duplicates of the item name.`;

export async function classifyItem(
	fields: AiExtracted,
	availableCategories: string[]
): Promise<AiClassified> {
	const openai = getClient();

	const categoryEnum =
		availableCategories.length > 0 ? availableCategories : ['__none__'];

	const RESPONSE_SCHEMA = {
		type: 'object',
		additionalProperties: false,
		properties: {
			categories: {
				type: 'array',
				items: { type: 'string', enum: categoryEnum },
				maxItems: 3
			},
			tags: {
				type: 'array',
				items: { type: 'string' },
				maxItems: 6
			}
		},
		required: ['categories', 'tags']
	} as const;

	const userPayload = {
		name: fields.name,
		dosage: fields.dosage,
		description: fields.description,
		usage: fields.usage,
		availableCategories
	};

	const completion = await openai.chat.completions.create({
		model: env.OPENAI_MODEL ?? 'gpt-4o',
		temperature: 0,
		messages: [
			{ role: 'system', content: SYSTEM },
			{
				role: 'user',
				content: `Classify this item. Use only categories from availableCategories.\n${JSON.stringify(
					userPayload
				)}`
			}
		],
		response_format: {
			type: 'json_schema',
			json_schema: { name: 'pharma_classification', strict: true, schema: RESPONSE_SCHEMA }
		}
	});

	const raw = completion.choices[0]?.message?.content ?? '{}';
	const parsed = aiClassifiedSchema.parse(JSON.parse(raw));

	const allowed = new Set(availableCategories);
	return {
		categories: parsed.categories.filter((c) => allowed.has(c)),
		tags: parsed.tags
			.map((t) => t.trim().toLowerCase())
			.filter((t, i, arr) => t.length > 0 && arr.indexOf(t) === i)
	};
}
