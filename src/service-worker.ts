/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="webworker" />
/// <reference types="@sveltejs/kit" />

import { build, files, version } from '$service-worker';

const worker = self as unknown as ServiceWorkerGlobalScope;
const CACHE = `home-pharmacy-${version}`;
const APP_SHELL = '/';
const ASSETS = [...build, ...files, APP_SHELL];

worker.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => worker.skipWaiting())
	);
});

worker.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
			.then(() => worker.clients.claim())
	);
});

worker.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') return;

	event.respondWith(
		(async () => {
			const url = new URL(event.request.url);
			const cache = await caches.open(CACHE);

			if (ASSETS.includes(url.pathname)) {
				const cachedAsset = await cache.match(url.pathname);
				if (cachedAsset) return cachedAsset;
			}

			try {
				const response = await fetch(event.request);
				if (response instanceof Response && response.ok) {
					cache.put(event.request, response.clone());
				}
				return response;
			} catch (error) {
				const cached = await cache.match(event.request);
				if (cached) return cached;

				if (event.request.mode === 'navigate') {
					const shell = await cache.match(APP_SHELL);
					if (shell) return shell;
				}

				throw error;
			}
		})()
	);
});
