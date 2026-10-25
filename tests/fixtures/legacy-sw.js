const LEGACY='cfop-runtime-v102';
self.addEventListener('install',e=>e.waitUntil((async()=>{const cache=await caches.open(LEGACY);await cache.put(new URL('./',self.registration.scope),await fetch('./__upgrade.html',{cache:'reload'}));})()));
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{if(e.request.mode==='navigate')e.respondWith(caches.open(LEGACY).then(c=>c.match(new URL('./',self.registration.scope))).then(r=>r||fetch(e.request)));});
