// apps/web/public/sw.js
// Marksman Service Worker — Workbox-powered caching strategies + Background Sync.
//
// Design: The SW handles only HTTP-level caching (static assets, page shells).
// All IndexedDB logic and JWT auth stays in the main thread; the SW delegates
// sync back via postMessage so we don't duplicate auth state in the SW context.

importScripts(
  'https://storage.googleapis.com/workbox-cdn/releases/7.3.0/workbox-sw.js',
);

const { routing, strategies, expiration } = workbox;

// ── Lifecycle ─────────────────────────────────────────────────────────────────
// Take control immediately so the first load is served by this SW version.
self.skipWaiting();
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// ── Static assets: Cache-First ────────────────────────────────────────────────
// JS, CSS, fonts, images — long-lived, versioned by Next.js content hashes.
routing.registerRoute(
  ({ request }) =>
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font' ||
    request.destination === 'image',
  new strategies.CacheFirst({
    cacheName: 'marksman-static-v1',
    plugins: [
      new expiration.ExpirationPlugin({
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        maxEntries: 120,
        purgeOnQuotaError: true,
      }),
    ],
  }),
);

// ── Page navigations: NetworkFirst ────────────────────────────────────────────
// Serve from network; fall back to cache when offline.
// 5-second network timeout before using cached shell.
routing.registerRoute(
  ({ request }) => request.mode === 'navigate',
  new strategies.NetworkFirst({
    cacheName: 'marksman-pages-v1',
    networkTimeoutSeconds: 5,
    plugins: [
      new expiration.ExpirationPlugin({ maxEntries: 40 }),
    ],
  }),
);

// ── API calls: NetworkOnly ────────────────────────────────────────────────────
// apiFetch in the main thread handles the IndexedDB fallback.
// The SW must not intercept these — it has no JWT and no Dexie instance.
routing.registerRoute(
  ({ url }) =>
    url.pathname.startsWith('/api') ||
    url.port === '3001' ||
    url.hostname !== self.location.hostname,
  new strategies.NetworkOnly(),
);

// ── Background Sync ───────────────────────────────────────────────────────────
// When connectivity is restored, the browser fires the 'sync' event.
// We delegate processing to the main thread rather than running sync logic here.
self.addEventListener('sync', (event) => {
  if (event.tag === 'marksman-sync') {
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((client) =>
          client.postMessage({ type: 'SW_TRIGGER_SYNC' }),
        );
      }),
    );
  }
});

// ── Periodic Sync ─────────────────────────────────────────────────────────────
// Analytics cache refresh — fires once every 24h when the browser grants it.
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'marksman-analytics-refresh') {
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((client) =>
          client.postMessage({ type: 'SW_REFRESH_ANALYTICS' }),
        );
      }),
    );
  }
});
