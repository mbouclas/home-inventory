import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { uploadPhoto } from '$lib/server/cloudinary';
import { extractFromImageUrl } from '$lib/server/ai/extract';
import { classifyItem } from '$lib/server/ai/classify';
import { listCategories } from '$lib/server/db/relations';

export const POST: RequestHandler = async ({ request }) => {
	const form = await request.formData();
	const file = form.get('photo');
	if (!(file instanceof File) || file.size === 0) {
		throw error(400, 'photo file required');
	}
	if (file.size > 10 * 1024 * 1024) {
		throw error(413, 'photo too large (max 10 MB)');
	}

	const upload = await uploadPhoto(file);
	const fields = await extractFromImageUrl(upload.url);

	const availableCategories = listCategories().map((c) => c.name);
	const classification = await classifyItem(fields, availableCategories).catch(
		(err) => {
			console.error('classifyItem failed:', err);
			return { categories: [] as string[], tags: [] as string[] };
		}
	);

	return json({
		photoUrl: upload.url,
		photoPublicId: upload.publicId,
		fields,
		classification
	});
};
