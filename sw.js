// CRUSHA STUDIO — Service Worker v1
// オフラインキャッシュ + 24時間スマホアクセス対応

const CACHE_NAME = 'crusha-studio-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './CRUSHA-VIDEO-STUDIO-v1.html',
  './CRUSHA-MUSIC-STUDIO-v1.html',
  './CRUSHA-NSFW-SUPREME-v13.html',
  './CRUSHA-VOICE-STUDIO-v1.html',
  './CRUSHA-VIDEO-GEN-STUDIO-v1.html',
  './CRUSHA-EDIT-STUDIO-v1.html',
  './CRUSHA-EXPORT-STUDIO-v1.html'
];

// インストール時: 全アセットをキャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching assets...');
        return cache.addAll(ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// アクティベート時: 古いキャッシュを削除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// フェッチ時: Cache First → Network Fallback
self.addEventListener('fetch', (event) => {
  // chrome-extension などは無視
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request)
        .then(response => {
          // 正常レスポンスはキャッシュに保存
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          // ネットワーク不可時はオフラインページ
          if (event.request.destination === 'document') {
            return caches.match('./index.html');
          }
        });
    })
  );
});
