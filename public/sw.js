// STEA Service Worker — Network-First, Auto-versioning
// Cache name includes build timestamp injected at deploy time via index.html meta tag
// Falls back to date-based version so each calendar day is a fresh cache

const BUILD_DATE = new Date().toISOString().slice(0, 10); // "2026-04-20"
const CACHE_NAME = `stea-v${BUILD_DATE}`;

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/pwa-192.png',
  '/icons/pwa-512.png',
];

// ── Install: precache shell assets ──────────────────────────────────────────
self.addEventListener('install', (event) => {
  // Skip waiting so new SW activates immediately on next navigation
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_ASSETS)).catch(() => {})
  );
});

// ── Activate: delete ALL previous caches ────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => {
            console.log('[SW] Deleting old cache:', k);
            return caches.delete(k);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: Network-First for all same-origin requests ───────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Ignore non-GET, non-same-origin, and browser-extension requests
  if (
    request.method !== 'GET' ||
    !request.url.startsWith(self.location.origin) ||
    request.url.includes('chrome-extension') ||
    request.url.includes('firebase') ||
    request.url.includes('firestore') ||
    request.url.includes('googleapis')
  ) {
    return;
  }

  // NAVIGATION (HTML) — Always network first, fall back to cached index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            caches.open(CACHE_NAME).then(c => c.put(request, response.clone()));
          }
          return response;
        })
        .catch(() =>
          caches.match('/index.html').then(r => r || new Response('Offline', { status: 503 }))
        )
    );
    return;
  }

  // JS/CSS ASSETS with hash in URL — Cache first (they're immutable)
  const isHashedAsset = /\/assets\/[^/]+-[a-f0-9]{8,}\.(js|css|woff2?)/.test(request.url);
  if (isHashedAsset) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (response.ok) {
            caches.open(CACHE_NAME).then(c => c.put(request, response.clone()));
          }
          return response;
        });
      })
    );
    return;
  }

  // ICONS / IMAGES — Stale-while-revalidate
  if (/\.(png|jpg|jpeg|svg|webp|gif|ico)$/.test(request.url)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(request).then(cached => {
          const fetchPromise = fetch(request).then(response => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          }).catch(() => cached);
          return cached || fetchPromise;
        })
      )
    );
    return;
  }

  // EVERYTHING ELSE — Network first, cache fallback
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok && response.type === 'basic') {
          caches.open(CACHE_NAME).then(c => c.put(request, response.clone()));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// ── Message: force-refresh all clients ──────────────────────────────────────
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
