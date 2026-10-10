const CACHE_NAME = "deutsch-quest-v1";
const CORE_FILES = [
  "./", "./index.html", "./manifest.json",
  "./css/style.css", "./css/responsive.css",
  "./js/storage.js", "./js/game-engine.js", "./js/app.js",
  "./data/curriculum.json", "./data/vocabulary-source.json", "./assets/icons/icon.svg"
];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(caches.match(event.request).then(cached => {
    if (cached) return cached;
    return fetch(event.request).then(response => {
      if (response && response.status === 200 && new URL(event.request.url).origin === self.location.origin) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
      }
      return response;
    }).catch(() => caches.match("./index.html"));
  }));
});
