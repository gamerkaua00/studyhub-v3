const CACHE_NAME = "studyhub-v311";
const STATIC = ["/studyhub-v3/", "/studyhub-v3/index.html"];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(STATIC).catch(() => {})));
  self.skipWaiting();
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || e.request.url.includes("/api/")) return;
  e.respondWith(fetch(e.request).then((res) => { const cl = res.clone(); caches.open(CACHE_NAME).then((c) => c.put(e.request, cl)); return res; }).catch(() => caches.match(e.request)));
});
