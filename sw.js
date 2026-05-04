const CACHE_NAME = 'health-tracker-v4';
const ASSETS_TO_CACHE = [
  './index.html',
  './manifest.json',
  './icon.png',
  './icon.svg',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Outfit:wght@600;800&display=swap',
  'https://unpkg.com/react@18/umd/react.development.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.development.js',
  'https://unpkg.com/@babel/standalone/babel.min.js'
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

// Fetch: Network-first falling back to cache (Ensures fresh data when online)
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
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
