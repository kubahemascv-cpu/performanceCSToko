// SW Dashboard CS Toko — Kubah Emas
// File statis, permanen di repo. Bikin Android bisa mengenali app ini
// sebagai PWA yang bisa diinstall permanen (bukan sekadar shortcut),
// dan bikin kerangka tampilan kebuka cepat meski koneksi lambat.
//
// PENTING: dashboard ini live — datanya selalu ditarik dari Google
// Sheets tiap dibuka. Data TIDAK di-cache di sini supaya selalu fresh.

const CACHE = 'cs-toko-v7';

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(['./', 'manifest.json', 'icon-192.png', 'icon-512.png']).catch(function () {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE; })
            .map(function (k) { return caches.delete(k); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;

  // Data live dari Google Sheets (JSONP) & Google APIs: selalu ambil
  // langsung dari internet, jangan pernah di-cache.
  if (/docs\.google\.com|googleapis\.com|gstatic\.com/.test(e.request.url)) {
    e.respondWith(fetch(e.request));
    return;
  }

  // File app (HTML/JS/CSS/icon/manifest): cache-first, biar tampilan
  // kerangka dashboard kebuka instan meski koneksi lambat/offline.
  e.respondWith(
    caches.open(CACHE).then(function (c) {
      return c.match(e.request).then(function (r) {
        return r || fetch(e.request).then(function (res) {
          if (res && res.status === 200) c.put(e.request, res.clone());
          return res;
        }).catch(function () { return r; });
      });
    })
  );
});
