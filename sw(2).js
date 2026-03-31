const CACHE_NAME = 'knorri-v3';
const OFFLINE_URL = './index.html';

const PRECACHE_ASSETS = [
  './', './index.html', './manifest.json',
  './icon-192.png', './icon-512.png',
  './screenshot1.png', './screenshot2.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.allSettled(PRECACHE_ASSETS.map(url =>
        cache.add(url).catch(e => console.warn('Cache skip:', url))
      ))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // API calls: altijd netwerk
  if (url.hostname.includes('groq.com') || url.hostname.includes('anthropic.com')) {
    event.respondWith(fetch(event.request).catch(() =>
      new Response(JSON.stringify({error:'offline'}), {status:503, headers:{'Content-Type':'application/json'}})
    ));
    return;
  }

  // Alles ander: netwerk eerst, dan cache (offline fallback)
  event.respondWith(
    fetch(event.request).then(response => {
      if (response.ok && event.request.method === 'GET') {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
      }
      return response;
    }).catch(() =>
      caches.match(event.request).then(cached => cached || caches.match('./index.html'))
    )
  );
});
