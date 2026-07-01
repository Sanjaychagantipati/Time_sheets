const CACHE_NAME = 'vt-cache-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.png',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Pre-caching failed during installation:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('Removing stale cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Bypass API requests
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Bypass non-GET requests (e.g. POST, PUT, DELETE)
  if (event.request.method !== 'GET') {
    return;
  }

  // Handle HTML navigation requests (serve index.html for SPA routing offline)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cachedResponse = await caches.match('/index.html');
        if (cachedResponse) {
          return cachedResponse;
        }
        return new Response('Vergil Tempo is offline. Please check your network connection.', {
          status: 503,
          headers: { 'Content-Type': 'text/html' }
        });
      })
    );
    return;
  }

  // Stale-While-Revalidate for static assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch((err) => {
        console.debug('Network request failed for resource:', event.request.url, err);
        if (cachedResponse) {
          return cachedResponse;
        }
        throw err;
      });
      return cachedResponse || fetchPromise;
    }).catch(() => {
      return new Response('Asset unavailable offline', {
        status: 404,
        statusText: 'Offline Asset Unavailable'
      });
    })
  );
});
