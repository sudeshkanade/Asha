const CACHE_NAME = 'health-tracker-v5';
const ASSETS_TO_CACHE = [
  './index.html',
  './manifest.json',
  './icon.png',
  './icon.svg',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Outfit:wght@600;800&display=swap'
];

// Install: Cache essential clinical assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Activate: Cleanup old versions to keep device memory clean
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Cache-first for static assets/fonts, Network-first (with timeout) for dynamic/API requests
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Cache-first for local static assets (Vite builds) and Google fonts
  if (url.pathname.includes('/assets/') || url.hostname.includes('fonts.gstatic.com') || url.hostname.includes('fonts.googleapis.com')) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            const responseCopy = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseCopy));
          }
          return networkResponse;
        }).catch(() => caches.match(event.request));
      })
    );
    return;
  }

  // Network-first with 5-second timeout for other requests (e.g. Firebase APIs, Firestore)
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Network timeout')), 5000)
  );

  event.respondWith(
    Promise.race([fetch(event.request), timeoutPromise])
      .catch(() => caches.match(event.request))
  );
});

// BACKGROUND SYNC: Automatically upload offline data when network returns
self.addEventListener('sync', event => {
  if (event.tag === 'sync-health-records') {
    event.waitUntil(syncHealthData());
  }
});

// PERIODIC SYNC: Refresh clinical due-lists in the background (e.g. daily at 6 AM)
self.addEventListener('periodicsync', event => {
  if (event.tag === 'refresh-due-list') {
    event.waitUntil(fetchLatestDueList());
  }
});

// PUSH NOTIFICATIONS: Receive clinical alerts from supervisors
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : { title: 'Health Alert', body: 'New clinical task assigned.' };
  const options = {
    body: data.body,
    icon: './icon.png',
    badge: './icon.png',
    vibrate: [200, 100, 200]
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Placeholder for sync logic
async function syncHealthData() {
  console.log('Background Sync: Uploading pending health records...');
  // Logic to read from IndexedDB/LocalStorage and POST to API
}

// Placeholder for periodic refresh logic
async function fetchLatestDueList() {
  console.log('Periodic Sync: Pre-fetching today\'s clinical tasks...');
}
