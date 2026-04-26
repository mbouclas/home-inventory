import { v2 as cloudinary } from 'cloudinary';
import { env } from '$env/dynamic/private';

let configured = false;
function ensureConfigured() {
	if (configured) return;
	const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = env;
	if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
		throw new Error('Missing Cloudinary env vars (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)');
	}
	cloudinary.config({
		cloud_name: CLOUDINARY_CLOUD_NAME,
		api_key: CLOUDINARY_API_KEY,
		api_secret: CLOUDINARY_API_SECRET,
		secure: true
	});
	configured = true;
}

export async function uploadPhoto(file: File): Promise<{ url: string; publicId: string }> {
	ensureConfigured();
	const buf = Buffer.from(await file.arrayBuffer());
	const dataUri = `data:${file.type || 'image/jpeg'};base64,${buf.toString('base64')}`;
	const result = await cloudinary.uploader.upload(dataUri, {
		folder: 'home-pharmacy',
		resource_type: 'image',
		transformation: [{ width: 1600, height: 1600, crop: 'limit', quality: 'auto', fetch_format: 'auto' }]
	});
	return { url: result.secure_url, publicId: result.public_id };
}

export async function deletePhoto(publicId: string): Promise<void> {
	ensureConfigured();
	await cloudinary.uploader.destroy(publicId, { resource_type: 'image', invalidate: true });
}
