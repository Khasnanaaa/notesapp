const CACHE_NAME = 'story-app-v3';

// Kita hanya cache file yang PASTI ada (root dan manifest)
const assetsToCache = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('SW: Pre-caching file inti...');
      return cache.addAll(assetsToCache);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) return caches.delete(cache);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Strategi: Network First, then Cache (Agar data selalu segar tapi bisa offline)
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Perbolehkan cache untuk resource dari network (Basic) dan External (CORS) seperti Gambar
        // Note: response.type === 'opaque' (status 0) usually means CORS no-cors request (like <img> from other domain)
        if (!response || (response.status !== 200 && response.type !== 'opaque')) {
          return response;
        }

        // Simpan setiap file yang berhasil di-fetch ke cache otomatis
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      })
      .catch(() => {
        // Jika offline, ambil dari cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          
          // Jika buka halaman utama tapi offline, paksa ke index.html
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }

          // Return 404 defaults to prevent "Failed to convert value to Response" error
          return new Response(null, { status: 404, statusText: 'Not Found' });
        });
      })
  );
});

// Push Notification tetap ada
// Push Notification
self.addEventListener('push', (event) => {
  let dataPayload = { title: 'Story App', options: { body: 'Cek cerita baru!' } };
  
  if (event.data) {
    try {
        dataPayload = event.data.json();
    } catch (e) {
        console.error('Push data not JSON:', e);
    }
  }

  const title = dataPayload.title || 'Story App';
  const options = {
    body: (dataPayload.options && dataPayload.options.body) ? dataPayload.options.body : 'Cek cerita baru!',
    icon: './icons/icon-192x192.png',
    data: dataPayload.options // Menyimpan options lain jika ada
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});