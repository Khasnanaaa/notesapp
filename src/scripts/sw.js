import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, NetworkFirst, CacheFirst } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';

// 1. Precaching (App Shell)
// self.__WB_MANIFEST akan diisi otomatis oleh InjectManifest plugin
precacheAndRoute(self.__WB_MANIFEST);

// 2. Runtime Caching

// API Stories (Network First - User wants latest stories, internal fallback if offline)
registerRoute(
  ({ url }) => url.origin === 'https://story-api.dicoding.dev' && !url.pathname.includes('/images/'),
  new NetworkFirst({
    cacheName: 'stories-api',
    plugins: [
        new CacheableResponsePlugin({
            statuses: [0, 200],
        }),
        new ExpirationPlugin({
            maxEntries: 100,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
        }),
    ],
  })
);

// API Images (StaleWhileRevalidate - served from cache if available, updated in bg)
registerRoute(
  ({ url }) => url.origin === 'https://story-api.dicoding.dev' && url.pathname.includes('/images/'),
  new StaleWhileRevalidate({
    cacheName: 'stories-images',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200], // Allow opaque responses (CORS)
      }),
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
      }),
    ],
  })
);

// Google Fonts (CacheFirst)
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxAgeSeconds: 365 * 24 * 60 * 60,
      }),
    ],
  })
);

// 3. Push Notifications
self.addEventListener('push', (event) => {
  console.log('Service worker pushing...');

  async function chainPromise() {
    let data = { title: 'Story App', options: { body: 'Cek cerita baru!' } };
  
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            console.error('Push data not JSON:', e);
        }
    }

    // Tutorial style uses data.title and data.options.body 
    // We keep robust fallback but ensure structure matches
    const title = data.title || 'Story App';
    const options = {
        body: (data.options && data.options.body) ? data.options.body : 'Cek cerita baru!',
        icon: './icons/icon-192x192.png',
        badge: './icons/icon-192x192.png',
        data: data.options
    };

    await self.registration.showNotification(title, options);
  }

  event.waitUntil(chainPromise());
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/#/')
  );
});
