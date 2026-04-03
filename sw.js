// EVA-Companion Service Worker
// Increment this version when you update index.html to force cache refresh
var CACHE_VERSION = "v1";
var CACHE_NAME = "eva-companion-" + CACHE_VERSION;

// Install: cache core files
self.addEventListener("install", function (event) {
  self.skipWaiting(); // Activate immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(["./index.html", "./logo.png"]);
    })
  );
});

// Activate: clean old caches
self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(
        names
          .filter(function (name) {
            return name.startsWith("eva-companion-") && name !== CACHE_NAME;
          })
          .map(function (name) {
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim(); // Take control of all pages immediately
});

// Fetch: NETWORK FIRST strategy
// Always try to get the latest from the network
// Fall back to cache only if offline
self.addEventListener("fetch", function (event) {
  event.respondWith(
    fetch(event.request)
      .then(function (response) {
        // Got a fresh response - cache it for offline use
        if (response.ok) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(function () {
        // Network failed - try cache
        return caches.match(event.request);
      })
  );
});
