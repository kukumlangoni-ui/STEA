// STEA Service Worker — Network-First, Auto-versioning, Offline fallback
const BUILD_DATE = new Date().toISOString().slice(0, 10);
const CACHE_NAME = `stea-v${BUILD_DATE}`;

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.webmanifest',
  '/icons/pwa-192.png',
  '/icons/pwa-512.png',
];

// ── Install ──────────────────────────────────────────
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_ASSETS))
      .catch(() => {})
  );
});

// ── Activate: delete old caches ──────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (
    request.method !== 'GET' ||
    !request.url.startsWith(self.location.origin) ||
    request.url.includes('firebase') ||
    request.url.includes('firestore') ||
    request.url.includes('googleapis') ||
    request.url.includes('cloudinary')
  ) return;

  // NAVIGATION — network first, fallback to /offline.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) caches.open(CACHE_NAME).then(c => c.put(request, response.clone()));
          return response;
        })
        .catch(() =>
          caches.match('/index.html')
            .then(r => r || caches.match('/offline.html'))
            .then(r => r || new Response('Offline', { status: 503 }))
        )
    );
    return;
  }

  // HASHED ASSETS (JS/CSS with hash in filename) — cache first, never expire
  if (/\/assets\/[^/]+-[a-f0-9]{8,}\.(js|css|woff2?)/.test(request.url)) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (response.ok) caches.open(CACHE_NAME).then(c => c.put(request, response.clone()));
          return response;
        });
      })
    );
    return;
  }

  // IMAGES — stale-while-revalidate
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

  // EVERYTHING ELSE — network first
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok && response.type === 'basic') {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(request, cloned));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// ── Message handling ──────────────────────────────────
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
