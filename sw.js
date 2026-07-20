/* CFOP Trainer Service Worker — online-first with offline fallback */
const CACHE = 'cfop-runtime-v72';
const CORE = [
  './',
  './index.html',
  './styles.css',
  './theme-init.js',
  './i18n.js',
  './cube-engine.js',
  './progress.js',
  './build.js',
  './player.js',
  './freeplay.js',
  './solver.js',
  './scramble.js',
  './navigation.js',
  './rendering.js',
  './algorithms.js',
  './app.js',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './icon-64.png',
  './icon-home-dark-v8.png',
  './icon-home-light-v8.png',
  './apple-touch-icon.png',
  './og.jpg',
  './og-light.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)));
    if (self.registration.navigationPreload) await self.registration.navigationPreload.enable();
    await self.clients.claim();
  })());
});

async function networkFirst(request, preloadResponse) {
  const cache = await caches.open(CACHE);
  try {
    let response = preloadResponse ? await preloadResponse : null;
    if (!response) response = await fetch(request);
    if (response && response.ok && response.type === 'basic') await cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request, {ignoreSearch: request.mode === 'navigate'});
    if (cached) return cached;
    if (request.mode === 'navigate') {
      const shell = await cache.match('./index.html');
      if (shell) return shell;
    }
    throw error;
  }
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(networkFirst(event.request, event.preloadResponse));
});
