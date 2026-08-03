// Service Worker cơ bản cho AHA-MIND PWA
const CACHE_NAME = "aha-mind-cache-v1";
const STATIC_ASSETS = [
  "/",
  "/favicon.ico",
  "/logo.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Chỉ cache static requests (GET), không cache API POST/SSE
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Bỏ qua các API route và SSE streams
  if (url.pathname.startsWith("/api/")) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        // Fallback if offline
        return caches.match("/");
      });
    })
  );
});
