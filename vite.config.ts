import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	ssr: {
		external: ['bun:sqlite']
	},
	optimizeDeps: {
		exclude: ['bun:sqlite']
	}
});
