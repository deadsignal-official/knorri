const CACHE = 'knorri-v5';
const FILES = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-192-maskable.png', './icon-512-maskable.png', './screenshot1.png', './screenshot2.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => Promise.allSettled(FILES.map(u => c.add(u).catch(()=>{})))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (new URL(e.request.url).hostname.includes('groq.com') || new URL(e.request.url).hostname.includes('fonts.g')) {
    e.respondWith(fetch(e.request).catch(() => new Response('', { status: 503 }))); return;
  }
  e.respondWith(fetch(e.request).then(r => { if (r.ok && e.request.method === 'GET') { const c = r.clone(); caches.open(CACHE).then(ca => ca.put(e.request, c)); } return r; }).catch(() => caches.match(e.request).then(c => c || caches.match('./index.html'))));
});
