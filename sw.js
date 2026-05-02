// FISHDEX service worker
// To force users onto a new build: bump CACHE_VERSION below.
// On activate, old caches are deleted automatically.

const CACHE_VERSION = 'fishdex-v6';
const PRECACHE = [
  './',
  'index.html',
  'manifest.json',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-192.png',
  'icon-maskable-512.png',
  'icon-180.png',
  'icon-167.png',
  'icon-152.png',
  'icon-120.png',
  'favicon-32.png',
  'favicon-16.png'
];

// Install: precache the app shell. The HTML embeds all 18 fish sprites as
// base64 inside it, so caching index.html is enough — no separate sprite files.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean up old cache versions
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch: cache-first for same-origin (offline support), network with cache
// fallback for cross-origin (Google Fonts)
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  if (sameOrigin) {
    // Cache-first
    event.respondWith(
      caches.match(req).then(cached => {
        if (cached) return cached;
        return fetch(req).then(resp => {
          // Cache successful responses for next time
          if (resp && resp.ok && resp.type === 'basic') {
            const copy = resp.clone();
            caches.open(CACHE_VERSION).then(c => c.put(req, copy));
          }
          return resp;
        }).catch(() => caches.match('index.html'));
      })
    );
  } else {
    // Cross-origin (fonts): try network, fall back to cache
    event.respondWith(
      fetch(req).then(resp => {
        if (resp && resp.ok) {
          const copy = resp.clone();
          caches.open(CACHE_VERSION).then(c => c.put(req, copy));
        }
        return resp;
      }).catch(() => caches.match(req))
    );
  }
});
