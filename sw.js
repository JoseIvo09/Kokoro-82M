/* ==========================================================
   SERVICE WORKER — Versão Kokoro (offline completo)
   Cacheia assets locais E as CDNs do Kokoro (jsdelivr, HuggingFace)
   para que o jogo funcione 100% offline após o primeiro acesso.
   ========================================================== */
const CACHE_NAME = 'complete-palavra-kokoro-v2';
const CDN_ORIGINS = [
  'cdn.jsdelivr.net',
  'huggingface.co',
  'cdn-lfs.huggingface.co',
  'cdn-lfs.hf.co'
];

const STATIC_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './script.js',
  './kokoro-loader.js',
  './manifest.json',
  './palavras.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const isCDN = CDN_ORIGINS.some(origin =>
    url.hostname === origin || url.hostname.endsWith(`.${origin}`)
  );

  if (isCDN) {
    // CDNs do Kokoro: cache-first (grandes, não mudam) — baixa uma vez só
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (response && (response.status === 200 || response.type === 'opaque')) {
            const clone = response.clone();
            event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put(request, clone)));
          }
          return response;
        }).catch(() => cached);
      })
    );
    return;
  }

  // Assets locais: cache-first com atualização em background
  event.respondWith(
    caches.match(request).then(cached => {
      const networkFetch = fetch(request).then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put(request, clone)));
        }
        return response;
      }).catch(() => cached);
      return cached || networkFetch;
    })
  );
});
