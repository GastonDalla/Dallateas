// Hand-written service worker. It caches static assets and optimized images only.
// API responses and HTML pages are never cached: they can hold one account's data.
const VERSION = "v2";
const STATIC_CACHE = `dallateas-static-${VERSION}`;
const IMAGE_CACHE = `dallateas-images-${VERSION}`;
const OFFLINE_URL = "/offline.html";
const MAX_IMAGES = 400;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.add(OFFLINE_URL))
      .then(() => self.skipWaiting()),
  );
});

// Dropping every other cache also removes what the previous worker stored, including API responses.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== STATIC_CACHE && key !== IMAGE_CACHE).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

async function trimCache(cache) {
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - MAX_IMAGES)).map((key) => cache.delete(key)));
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    await cache.put(request, response.clone());
    if (cacheName === IMAGE_CACHE) await trimCache(cache);
  }
  return response;
}

async function navigate(request) {
  try {
    return await fetch(request);
  } catch {
    const cache = await caches.open(STATIC_CACHE);
    return (await cache.match(OFFLINE_URL)) ?? Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(navigate(request));
  } else if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/favicon/")) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  } else if (url.pathname === "/_next/image") {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
  }
});
