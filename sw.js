// Service worker – Barber c l'hair
// Pages HTML : réseau d'abord (toujours à jour), cache en secours hors-ligne.
// Fichiers statiques du site : cache d'abord puis mise à jour en arrière-plan.
// Firebase / API externes : jamais mis en cache (réservations en temps réel).
const CACHE = 'barber-v35';
const PRECACHE = [
  './',
  './index.html',
  './style.css?v=2.41',
  './script.js?v=2.34',
  './fx.css?v=1.4',
  './fx.js?v=1.3',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './images/IMG_1006.jpg',
  './images/salon_tonneau.jpg',
  './images/salon_coin_attente.jpg',
  './images/salon_etagere_radio.jpg',
  './images/aqa_wax_eclaire.jpg',
  './images/immortal_eclaire.jpg',
  './images/produit_nishman_cologne.jpg',
  './images/produit_etagere_bois1.jpg',
  './images/produit_etagere_bois2.jpg',
  './images/produit_oud_cologne.jpg'
];

self.addEventListener('install', (e) => {
  // Les images de la galerie sont « bonus » : si l'une échoue, l'installation continue
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.allSettled(PRECACHE.map((u) => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Firebase, fonts, etc.

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
