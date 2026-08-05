/**
 * Service Worker cho AHA-MIND PWA
 * 
 * ĐỒNG BỘ CẤU HÌNH (Option A):
 * Các hằng số CACHE_NAME và STATIC_ASSETS dưới đây được đồng bộ thủ công
 * với cấu hình Single Source of Truth tại `src/lib/config/brand.ts` (thuộc tính `brand.pwa`).
 * Khi thay đổi cấu hình brand hoặc update version, hãy cập nhật đồng bộ tại đây.
 * 
 * Made by Anh Tu - Share to be share
 */
const CACHE_NAME = "aha-mind-cache-v2";
const STATIC_ASSETS = [
  "/",
  "/brand/favicon.ico",
  "/brand/logo-final.svg",
  "/brand/logo-full-final.svg",
  "/brand/icon-192.png",
  "/brand/icon-512.png",
  "/brand/apple-touch-icon.png",
  "/brand/og-image.png",
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
