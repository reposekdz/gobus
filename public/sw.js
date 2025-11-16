// GoBus Advanced Service Worker - Production Ready
const CACHE_VERSION = 'gobus-v1.0.0-production';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const API_CACHE = `${CACHE_VERSION}-api`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

// Resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/vite.svg'
];

// Cache size limits
const CACHE_LIMITS = {
  [DYNAMIC_CACHE]: 50,
  [API_CACHE]: 100,
  [IMAGE_CACHE]: 60
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Kwinjiza (Installing)...', CACHE_VERSION);
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[Service Worker] Kubika amakuru (Caching static assets)...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch((error) => {
        console.error('[Service Worker] Ikibazo cyo kubika (Cache error):', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Gukora (Activating)...', CACHE_VERSION);
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!cacheName.startsWith(CACHE_VERSION)) {
              console.log('[Service Worker] Gusiba cache ishaje (Removing old cache):', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip chrome extensions and non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // API requests - Network first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request, API_CACHE));
    return;
  }

  // Images - Cache first, network fallback
  if (request.destination === 'image') {
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE));
    return;
  }

  // Static assets - Cache first
  if (STATIC_ASSETS.some(asset => url.pathname === asset)) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
    return;
  }

  // Other requests - Network first
  event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE));
});

// Network first strategy
async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
      await trimCache(cacheName);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Ntibashobora kubona umuyoboro (Network unavailable), gukoresha cache:', request.url);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlineResponse = await caches.match('/offline.html');
      if (offlineResponse) {
        return offlineResponse;
      }
    }
    
    return new Response(
      JSON.stringify({ 
        error: 'Ntibashobora kubona umuyoboro (Network unavailable)', 
        message: 'Emeza ko umuyoboro uhari (Please check your internet connection)',
        offline: true 
      }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Cache first strategy
async function cacheFirstStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Update cache in background
    fetch(request)
      .then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          caches.open(cacheName)
            .then(cache => {
              cache.put(request, networkResponse);
              trimCache(cacheName);
            });
        }
      })
      .catch(() => {});
    
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
      await trimCache(cacheName);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[Service Worker] Ikibazo (Error):', error);
    throw error;
  }
}

// Trim cache to limit size
async function trimCache(cacheName) {
  const limit = CACHE_LIMITS[cacheName];
  if (!limit) return;
  
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > limit) {
    const deletePromises = keys.slice(0, keys.length - limit).map(key => cache.delete(key));
    await Promise.all(deletePromises);
  }
}

// Background sync for offline bookings
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  
  if (event.tag === 'sync-bookings') {
    event.waitUntil(syncOfflineBookings());
  }
  
  if (event.tag === 'sync-payments') {
    event.waitUntil(syncOfflinePayments());
  }
});

async function syncOfflineBookings() {
  console.log('[Service Worker] Kohereza amatike yari offline (Syncing offline bookings)...');
  
  try {
    const db = await openIndexedDB();
    const tx = db.transaction('offlineBookings', 'readonly');
    const store = tx.objectStore('offlineBookings');
    const bookings = await store.getAll();
    
    for (const booking of bookings) {
      try {
        const response = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(booking.data)
        });
        
        if (response.ok) {
          const deleteTx = db.transaction('offlineBookings', 'readwrite');
          const deleteStore = deleteTx.objectStore('offlineBookings');
          await deleteStore.delete(booking.id);
          console.log('[Service Worker] Itike ryoherejwe neza (Booking synced):', booking.id);
        }
      } catch (error) {
        console.error('[Service Worker] Ikibazo cyo kohereza itike (Booking sync error):', error);
      }
    }
  } catch (error) {
    console.error('[Service Worker] IndexedDB error:', error);
  }
}

async function syncOfflinePayments() {
  console.log('[Service Worker] Kohereza kwishyura kwari offline (Syncing offline payments)...');
  // Implementation for syncing offline payments
}

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  console.log('[Service Worker] Ubutumwa bwashitse (Push received):', data);

  const title = data.title || 'GoBus Rwanda';
  const options = {
    body: data.body || 'Ufite amakuru mashya (You have a new update)',
    icon: '/vite.svg',
    badge: '/vite.svg',
    vibrate: [200, 100, 200],
    tag: data.tag || 'gobus-notification',
    requireInteraction: data.requireInteraction || false,
    data: data.data || {},
    actions: data.actions || [
      { action: 'open', title: 'Fungura (Open)' },
      { action: 'close', title: 'Funga (Close)' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification yakandanzwe (Notification click):', event.notification.tag);
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if a window is already open
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window if none exists
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Helper to open IndexedDB
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('GoBusDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('offlineBookings')) {
        db.createObjectStore('offlineBookings', { keyPath: 'id', autoIncrement: true });
      }
      
      if (!db.objectStoreNames.contains('offlinePayments')) {
        db.createObjectStore('offlinePayments', { keyPath: 'id', autoIncrement: true });
      }
      
      if (!db.objectStoreNames.contains('cachedDestinations')) {
        db.createObjectStore('cachedDestinations', { keyPath: 'id' });
      }
    };
  });
}

console.log('[Service Worker] GoBus Service Worker bikiriho (loaded) - Version:', CACHE_VERSION);
