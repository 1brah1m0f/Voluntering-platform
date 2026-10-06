// Service worker: makes Openly installable and lets the app shell open offline.
//
// - Page loads go to the network first, so every deploy is picked up at once; the
//   last good index.html is only used when the network is down.
// - Vite's hashed files under /assets/ never change, so they're served from cache.
// - Other same-origin files (logos, icons) are served from cache and refreshed behind.
// - Supabase, /api/* and every non-GET request pass straight through: data, auth
//   and the AI are never cached here.
//
// Bump VERSION to drop all old caches on the next visit.

const VERSION = 'v1';
const SHELL = `openly-shell-${VERSION}`;
const ASSETS = `openly-assets-${VERSION}`;
const STATIC = `openly-static-${VERSION}`;
const FONTS = `openly-fonts-${VERSION}`;
const KEEP = [SHELL, ASSETS, STATIC, FONTS];
const PRECACHE = ['/index.html', '/favicon.svg', '/manifest.webmanifest', '/icons/icon-192.png'];
// Hashed bundles pile up across deploys; keep the newest ones only.
const MAX_ASSETS = 120;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('openly-') && !KEEP.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com') {
    event.respondWith(cacheFirst(req, FONTS));
    return;
  }
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/') || url.pathname === '/sitemap.xml' || url.pathname === '/sw.js') return;

  if (req.mode === 'navigate') {
    event.respondWith(networkFirstPage(req));
  } else if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(req, ASSETS, MAX_ASSETS));
  } else {
    event.respondWith(staleWhileRevalidate(req, STATIC));
  }
});

async function networkFirstPage(req) {
  try {
    const res = await fetch(req);
    // Every route renders the same SPA shell, so keep the latest copy for offline use.
    // /o/:id pages carry opportunity-specific meta tags, so they don't replace it.
    if (res.ok && !new URL(req.url).pathname.startsWith('/o/')) {
      const copy = res.clone();
      caches.open(SHELL).then((c) => c.put('/index.html', copy));
    }
    return res;
  } catch {
    const cached = await caches.match('/index.html', { cacheName: SHELL });
    return cached || Response.error();
  }
}

async function cacheFirst(req, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached) return cached;
  const res = await fetch(req);
  if (res.ok || res.type === 'opaque') {
    await cache.put(req, res.clone());
    if (maxEntries) trim(cache, maxEntries);
  }
  return res;
}

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  const network = fetch(req)
    .then((res) => {
      if (res.ok) cache.put(req, res.clone());
      return res;
    })
    .catch(() => cached || Response.error());
  return cached || network;
}

async function trim(cache, maxEntries) {
  const keys = await cache.keys();
  // Cache keys come back in insertion order: drop the oldest.
  await Promise.all(keys.slice(0, Math.max(0, keys.length - maxEntries)).map((k) => cache.delete(k)));
}
