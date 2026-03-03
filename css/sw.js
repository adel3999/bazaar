// ===== Bazaar Service Worker =====
const CACHE_NAME = 'bazaar-v1';
const ASSETS_TO_CACHE = [
  '/bazaar/',
  '/bazaar/index.html',
  '/bazaar/css/styles.css',
  '/bazaar/js/utils.js',
  '/bazaar/js/bazaar-compiled.js',
  '/bazaar/manifest.json'
];

// ===== التثبيت - تخزين الملفات الأساسية =====
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('✅ Bazaar SW: تخزين الملفات...');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// ===== التفعيل - حذف الكاش القديم =====
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ===== الجلب - Network First مع Fallback =====
self.addEventListener('fetch', event => {
  // تجاهل طلبات Supabase وAPIs الخارجية
  if (
    event.request.url.includes('supabase.co') ||
    event.request.url.includes('unpkg.com') ||
    event.request.url.includes('cdn.') ||
    event.request.url.includes('openfoodfacts')
  ) {
    return fetch(event.request);
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // تخزين نسخة جديدة في الكاش
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // إذا لا يوجد إنترنت - استخدم الكاش
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          // Fallback للصفحة الرئيسية
          if (event.request.destination === 'document') {
            return caches.match('/bazaar/index.html');
          }
        });
      })
  );
});

// ===== استقبال رسائل من التطبيق =====
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
