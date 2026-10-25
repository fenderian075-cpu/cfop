/* CFOP Trainer Service Worker — online-first with offline fallback */
const CACHE_PREFIX = 'cfop-runtime-';
const CACHE = CACHE_PREFIX + 'v101';
const NETWORK_TIMEOUT_MS = 4000;
const CORE = [
  './',
  './index.html',
  './styles.css?v=101',
  './theme-init.js?v=101',
  './i18n.js?v=101',
  './cube-engine.js?v=101',
  './progress.js?v=101',
  './build.js?v=101',
  './player.js?v=101',
  './freeplay.js?v=101',
  './solver.js?v=101',
  './scramble.js?v=101',
  './cube-worker.js?v=101',
  './navigation.js?v=101',
  './rendering.js?v=101',
  './algorithms.js?v=101',
  './app.js?v=101',
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
  // A new version waits until existing pages close, so it cannot delete their assets.
  const requests=CORE.map(path=>new Request(new URL(path,self.registration.scope),{cache:'reload'}));
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(requests)));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE).map(key => caches.delete(key)));
    // Preload may reuse a fresh HTTP-cached shell; navigation below revalidates explicitly.
    if (self.registration.navigationPreload) await self.registration.navigationPreload.disable();
  })());
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  const controller = new AbortController();
  let timer, failedResponse;
  try {
    const network = fetch(request, { signal: controller.signal, cache:'no-cache' });
    const deadline = new Promise((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new Error('network-timeout')); }, NETWORK_TIMEOUT_MS); });
    const response = await Promise.race([network, deadline]);
    if (!response?.ok) { failedResponse = response; throw new Error('http-failure'); }
    if (response.type === 'basic') {
      // Cache quota failures must not discard a successful network response.
      try { await cache.put(request, response.clone()); } catch (_) {}
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request, {ignoreSearch: request.mode === 'navigate'});
    if (cached) return cached;
    if (request.mode === 'navigate') {
      const shell = await cache.match('./index.html');
      if (shell) return shell;
    }
    if (failedResponse) return failedResponse;
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function respond(request) {
  // Versioned assets belong to the installed shell. Keep them coherent offline and online.
  if (new URL(request.url).searchParams.get('v') === '101') {
    const cached = await (await caches.open(CACHE)).match(request);
    if (cached) return cached;
  }
  return networkFirst(request);
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  const scope = new URL(self.registration.scope).pathname;
  if (!new URL(event.request.url).pathname.startsWith(scope)) return;
  event.respondWith(respond(event.request));
});

