import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

const COMBINING_MARKS = /[̀-ͯ]/g;

export function slugify(input: string): string {
	return input
		.normalize('NFKD')
		.replace(COMBINING_MARKS, '')
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}
