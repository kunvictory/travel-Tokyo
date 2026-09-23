// 河口湖・東京・橫濱行程 App - 離線快取
// 策略：同源(GitHub Pages上你自己的檔案)一律「有快取先用快取，同時背景更新」；
// 外部資源(Google字型、天氣API)失敗時不影響離線使用，交給頁面本身的容錯處理。

const CACHE_NAME = 'kawaguchi-trip-cache-v1';

self.addEventListener('install', function(event) {
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') return;

  var url = new URL(event.request.url);
  // 只快取同源的檔案(你自己GitHub Pages上的html/css/js/圖示)
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then(function(cached) {
      var fetchPromise = fetch(event.request).then(function(networkResponse) {
        if (networkResponse && networkResponse.status === 200) {
          var clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, clone);
          });
        }
        return networkResponse;
      }).catch(function() {
        return cached;
      });
      // 有快取先秒開，背景仍會更新快取；沒快取才等網路
      return cached || fetchPromise;
    })
  );
});
