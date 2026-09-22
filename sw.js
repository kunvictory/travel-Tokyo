// 河口湖・東京・橫濱行程 App - 離線快取
// 策略：每次都讓瀏覽器向伺服器「驗證」目前版本是否還是最新
// （用標準 HTTP 快取驗證機制 cache:'no-cache'）：
//   - 內容沒變 → 伺服器只回一個很小的「沒變」訊號(304)，速度跟直接讀快取差不多
//   - 內容有變 → 才會真的抓新版本回來(200)並更新快取
// 只有真的離線、完全連不上網路時，才退回用 Service Worker 自己存的快取頂著用。

const CACHE_NAME = 'kawaguchi-trip-cache-v4';

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
  // 只處理同源的檔案(你自己GitHub Pages上的html/css/js/圖示)
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    // cache:'no-cache' 會強迫瀏覽器每次都跟伺服器「確認」一下版本，
    // 沒變的話伺服器回應很小、很快；有變才會真的下載新內容。
    fetch(event.request, { cache: 'no-cache' }).then(function(networkResponse) {
      if (networkResponse && networkResponse.status === 200) {
        var clone = networkResponse.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, clone);
        });
      }
      return networkResponse;
    }).catch(function() {
      // 真的斷網、連驗證都連不上，才退回用之前存的快取版本
      return caches.match(event.request);
    })
  );
});
