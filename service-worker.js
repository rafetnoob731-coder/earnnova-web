// EARNNOVA BETA - Service Worker (PWA)
const CACHE_NAME = 'earnnova-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/app.js',
    '/js/auth.js',
    '/js/dashboard.js',
    '/js/admin.js',
    '/js/firebase-config.js',
    '/manifest.json',
    '/assets/logo.svg',
    '/assets/logo-splash.svg',
    '/assets/icon-192.png',
    '/assets/icon-512.png'
];

// Install - cache assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('Caching app shell');
            return cache.addAll(urlsToCache);
        }).then(() => self.skipWaiting())
    );
});

// Activate - clean old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch - serve from cache or network
self.addEventListener('fetch', event => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;
    
    // Skip Firebase API calls
    if (event.request.url.includes('firebase') || 
        event.request.url.includes('googleapis') ||
        event.request.url.includes('gstatic.com')) {
        event.respondWith(fetch(event.request));
        return;
    }
    
    event.respondWith(
        caches.match(event.request).then(response => {
            if (response) return response;
            
            return fetch(event.request).then(networkResponse => {
                // Only cache successful responses
                if (networkResponse.status === 200) {
                    const clone = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, clone);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // Offline fallback
                if (event.request.mode === 'navigate') {
                    return caches.match('/index.html');
                }
                return new Response('Offline', { status: 503 });
            });
        })
    );
});

// Background sync for offline actions
self.addEventListener('sync', event => {
    if (event.tag === 'sync-transactions') {
        // Sync offline transactions
        console.log('Syncing transactions...');
    }
});
