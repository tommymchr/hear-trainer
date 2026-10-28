const CACHE = 'hear-trainer-1.55.0';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) {   // polices : le cache d'abord (elles ne changent pas)
    e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return r; })));
    return;
  }
  // L'app : le réseau (pour les mises à jour), mais au plus 2,5 s ; sinon la copie en cache. Avec une connexion faible, l'app s'ouvre quand même vite.
  e.respondWith(new Promise((resolve) => {
    let done = false;
    const end = (r) => { if (!done && r) { done = true; resolve(r); } };
    const fromCache = () => caches.match(e.request, { ignoreSearch: true }).then((r) => r || (e.request.mode === 'navigate' ? caches.match('./index.html') : null));
    const timer = setTimeout(() => fromCache().then(end), 2500);
    fetch(e.request).then((r) => {
      if (r && r.ok) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
      clearTimeout(timer); end(r);
    }).catch(() => fromCache().then((r) => { clearTimeout(timer); end(r || Response.error()); }));
  }));
});
