// Hors ligne : tout est mis en cache au premier chargement.
// Ensuite l'appli s'ouvre depuis le cache (instantané, même sans réseau)
// et se met à jour en arrière-plan quand le réseau est là.
const CACHE = "prompto-v1";
const FICHIERS = ["./", "index.html", "manifest.webmanifest", "icone-180.png", "icone-192.png", "icone-512.png", "icone-maskable-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((cles) => Promise.all(cles.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.open(CACHE).then(async (c) => {
      const enCache = await c.match(e.request, { ignoreSearch: true });
      const reseau = fetch(e.request)
        .then((r) => { if (r.ok) c.put(e.request.url.split("?")[0], r.clone()); return r; })
        .catch(() => null);
      if (enCache) { e.waitUntil(reseau); return enCache; }
      return (await reseau) || c.match("index.html");
    })
  );
});
