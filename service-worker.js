const CACHE_NAME = 'my-pwa-cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/script.js',
    '/tween.umd.js',
    '/js/three.module.js',
    '/js/OrbitControls.js',
    '/nets/tetrahedron-top.json',
    '/nets/cube-top.json',
    '/nets/octahedron-top.json',
    '/nets/dodecahedron-top.json',
    '/nets/icosahedron-top.json',
    '/nets/cubotahedron-top.json',
    '/nets/truncated-cube-top.json',
    '/nets/icosidodecahedron-top.json',
    '/nets/truncated-tetrahedron-top.json',
    '/nets/truncated-octahedron-top.json',
    '/nets/truncated-cuboctahedron-top.json',
    '/nets/truncated-dodecahedron-top.json',
    '/nets/snub-cube-top.json',
    '/nets/snub-dodecahedron-top.json',
    '/icons/192.png',
    '/icons/512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
