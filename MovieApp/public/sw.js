/**
 * LANTAWON LANG 2.0 — HIGH-PERFORMANCE DATA-SAVER SERVICE WORKER
 * 
 * Aggressively caches static assets, JS/CSS bundles, catalog metadata, and WebP images.
 * Minimizes mobile data consumption during browsing so data is only spent on video streams.
 */

// Bump these on any change to the caching strategies below. The activate handler
// deletes every cache whose name it no longer recognises, so a version bump is
// what evicts entries a previous worker stored under the old rules.
const STATIC_CACHE_NAME = "lantawon-static-v3";
const IMAGE_CACHE_NAME = "lantawon-images-v3";
const API_CACHE_NAME = "lantawon-api-v3";

const OFFLINE_URLS = [
  "/manifest.json",
  "/favicon.ico",
];

// 1. Install & Pre-cache critical core shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      return cache.addAll(OFFLINE_URLS);
    })
  );
  self.skipWaiting();
});

// 2. Activate & Clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (
            key !== STATIC_CACHE_NAME &&
            key !== IMAGE_CACHE_NAME &&
            key !== API_CACHE_NAME
          ) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// A cross-origin <img> request carries credentials mode "include". Re-issuing it
// as CORS without clearing that makes the browser reject `Access-Control-Allow-Origin: *`,
// which is exactly what TMDB and wsrv.nl send — so every poster, avatar and studio
// logo failed and fell through to the placeholder SVG. Anonymous CORS gets a
// readable (status 200, cacheable) response; opaque no-cors is the last resort so
// a host without CORS headers still renders, just uncached.
async function fetchImage(request) {
  const cache = await caches.open(IMAGE_CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;

  const sameOrigin = new URL(request.url).origin === self.location.origin;

  try {
    const response = await fetch(
      sameOrigin
        ? request
        : new Request(request.url, { mode: "cors", credentials: "omit" })
    );
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return fetch(request).catch(() => new Response("", { status: 504 }));
  }
}

// 3. Fetch Interceptor with Smart Caching Strategies
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Strategy A: Video Streams & Player Mirrors — BYPASS SERVICE WORKER DIRECTLY
  // Video chunks (.mp4, .m3u8, .ts, iframe embeds) should never be stored in SW cache
  if (
    url.pathname.endsWith(".mp4") ||
    url.pathname.endsWith(".mkv") ||
    url.pathname.endsWith(".m3u8") ||
    url.pathname.endsWith(".ts") ||
    url.hostname.includes("vidsrc") ||
    url.hostname.includes("vidlink") ||
    url.hostname.includes("embed") ||
    url.hostname.includes("stream") ||
    url.pathname.startsWith("/api/stream")
  ) {
    return;
  }

  // Strategy B: Static Code Assets (Next.js JS/CSS chunks, fonts, public icons) -> Cache-First
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".ttf")
  ) {
    event.respondWith(
      caches.open(STATIC_CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;

        try {
          const networkResponse = await fetch(request);
          if (networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch {
          return new Response("", { status: 408 });
        }
      })
    );
    return;
  }

  // Strategy C: Image & Poster CDN Cache -> Cache-First with Disk Fallback (Zero Data on repeat)
  if (
    url.hostname.includes("image.tmdb.org") ||
    url.hostname.includes("wsrv.nl") ||
    url.pathname.endsWith(".webp") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".svg")
  ) {
    event.respondWith(fetchImage(request));
    return;
  }

  // Strategy D: Catalog & Metadata APIs -> Stale-While-Revalidate (Instant load + zero repeat data)
  if (
    url.pathname.startsWith("/api/catalog/") ||
    url.pathname.startsWith("/api/taxonomy") ||
    url.pathname.startsWith("/api/franchises")
  ) {
    event.respondWith(
      caches.open(API_CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => cached);

        return cached || fetchPromise;
      })
    );
    return;
  }

  // Strategy E: HTML Document Pages -> Network-First with Cache Fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cached = await caches.match(request);
        return cached || caches.match("/");
      })
    );
  }
});
