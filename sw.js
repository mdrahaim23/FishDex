// FISHDEX service worker
// To force users onto a new build: bump CACHE_VERSION below.
// On activate, old caches are deleted automatically.

const CACHE_VERSION = 'fishdex-v28';

// Fish sprites — kept as a list so it's clear what gets precached. If you add
// new fish to the FISH array in index.html, add the new id here too (or rely
// on the runtime cache fallback in the fetch handler — same-origin GETs get
// cached on first successful fetch).
const FISH_IDS = [
  // Common
  'baitfish', 'catfish',
  // Uncommon
  'ladyfish', 'silver_perch', 'pufferfish', 'speckled_seatrout', 'needlefish',
  // Rare
  'weakfish', 'whiting', 'sheepshead', 'mangrove_snapper',
  // Epic
  'spanish_mackerel', 'flounder', 'black_drum', 'jack_crevalle', 'bluefish', 'houndfish',
  // Legendary
  'redfish', 'snook', 'pompano', 'barracuda', 'shark', 'bonito', 'permit', 'tripletail',
  // Champion
  'tarpon', 'goliath_grouper', 'gag_grouper', 'red_snapper',
  // Freshwater
  'bluegill', 'largemouth_bass', 'smallmouth_bass',
];

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
  'favicon-16.png',
  ...FISH_IDS.map(id => `fish/${id}.webp`)
];

// Map library (Leaflet + markercluster), self-hosted in lib/. Cached best-effort
// so a missing file never fails the whole install — the map still streams online.
const LIB = [
  'lib/leaflet/leaflet.js',
  'lib/leaflet/leaflet.css',
  'lib/leaflet/leaflet.markercluster.js',
  'lib/leaflet/MarkerCluster.css',
  'lib/leaflet/MarkerCluster.Default.css',
];

// Online map tile hosts — never cached (would balloon the cache with thousands
// of tiles). These stream from the network; offline shows blank tiles.
const TILE_HOSTS = ['openstreetmap.org', 'arcgisonline.com'];

// Install: precache the app shell + all fish sprites so the app works fully
// offline immediately after install. If a sprite isn't in PRECACHE, the fetch
// handler below will cache it on first successful network load.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(async cache => {
        await cache.addAll(PRECACHE);                      // core shell — must succeed
        await Promise.allSettled(LIB.map(u => cache.add(u))); // map libs — best-effort
      })
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
    // Online map tiles: don't intercept or cache — let the browser fetch them
    // directly so they never accumulate in the cache.
    if (TILE_HOSTS.some(h => url.hostname.endsWith(h))) return;
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
