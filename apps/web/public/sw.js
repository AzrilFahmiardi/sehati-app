// HemaVision PWA Service Worker
const CACHE_NAME = "hemavision-v1";
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/offline",
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
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Never cache sensitive API/data requests
  if (
    event.request.url.includes("/api/") ||
    event.request.url.includes("/pasien/") ||
    event.request.url.includes("/nakes/")
  ) {
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match("/offline") || caches.match("/");
      })
    );
  }
});
