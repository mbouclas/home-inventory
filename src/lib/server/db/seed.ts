import type { Database } from 'bun:sqlite';
import { slugify } from '$lib/utils';

const STARTER_CATEGORIES = [
	'Pain Relief',
	'Cold & Flu',
	'Allergy',
	'Digestive',
	'Vitamins & Supplements',
	'First Aid',
	'Antibiotics',
	'Skin Care',
	'Eye Care',
	'Heart & Blood Pressure',
	'Diabetes',
	'Children'
];

export function seedCategories(db: Database) {
	const insert = db.query(
		'INSERT OR IGNORE INTO categories (name, slug) VALUES ($name, $slug)'
	);
	const tx = db.transaction(() => {
		for (const name of STARTER_CATEGORIES) {
			insert.run({ $name: name, $slug: slugify(name) });
		}
	});
	tx();
}
