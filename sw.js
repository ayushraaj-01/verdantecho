/**
 * VerdantEcho Service Worker
 * Pre-caches offline trail assets so the app functions 100% in backcountry airplane mode
 */

const CACHE_NAME = 'verdantecho-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './ai-worker.js',
  './manifest.json',
  './assets/images/forest_trail.jpg',
  './assets/images/sugar_maple.jpg',
  './assets/images/poison_ivy.jpg',
  './assets/images/chickadee.jpg',
  './assets/audio/chickadee.wav',
  './assets/audio/robin.wav',
  './assets/audio/hawk.wav',
  './assets/audio/sparrow.wav',
  './assets/audio/crickets.wav'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((k) => {
          if (k !== CACHE_NAME) return caches.delete(k);
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cached) => {
      return cached || fetch(e.request).catch(() => {
        // Return offline cached index
        if (e.request.destination === 'document') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
