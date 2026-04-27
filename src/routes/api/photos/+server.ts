import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { uploadPhoto } from '$lib/server/cloudinary';

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
	return json({
		photoUrl: upload.url,
		photoPublicId: upload.publicId
	});
};
