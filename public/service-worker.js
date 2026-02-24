const STATIC_CACHE = 'fishbitecast-static-v1';
const STATIC_ASSETS = ['/', '/manifest.webmanifest', '/icons/icon-192.svg', '/icons/icon-512.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== STATIC_CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const cacheableDestinations = ['document', 'style', 'script', 'image', 'font'];
  if (!cacheableDestinations.includes(request.destination)) return;
  const isDocumentRequest = request.mode === 'navigate' || request.destination === 'document';

  event.respondWith(
    fetch(request)
      .then((response) => {
        const cloned = response.clone();
        void caches.open(STATIC_CACHE).then((cache) => cache.put(request, cloned));
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) {
          return cached;
        }

        if (isDocumentRequest) {
          const appShell = await caches.match('/');
          if (appShell) {
            return appShell;
          }
        }

        return Response.error();
      }),
  );
});
