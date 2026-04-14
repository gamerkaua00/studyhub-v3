// StudyHub v3.2.0 — Service Worker PWA
const CACHE = "studyhub-v320";
const STATIC = ["/studyhub-v3/", "/studyhub-v3/index.html"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(STATIC).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  // Nunca faz cache de API ou recursos externos
  if (e.request.method !== "GET") return;
  if (e.request.url.includes("/api/")) return;
  if (!e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const clone = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request).then((r) => r || new Response("Offline", { status: 503 })))
  );
});

// Push notifications (para futuro)
self.addEventListener("push", (e) => {
  if (!e.data) return;
  const data = e.data.json();
  e.waitUntil(
    self.registration.showNotification(data.title || "StudyHub", {
      body: data.body || "",
      icon: "/studyhub-v3/icon-192.png",
      badge: "/studyhub-v3/icon-192.png",
      data: { url: data.url || "/studyhub-v3/" },
    })
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data?.url || "/studyhub-v3/"));
});
