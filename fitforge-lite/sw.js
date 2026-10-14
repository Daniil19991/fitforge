// Офлайн-кэш FitForge Lite. При изменении файлов увеличьте версию.
const CACHE = 'fitforge-lite-v1';
importScripts('js/data.js'); // список упражнений — чтобы знать, сколько листов превью

const FILES = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/styles.css',
  'js/data.js',
  'js/figure.js',
  'js/generator.js',
  'js/app.js',
  'icons/icon.svg',
  'icons/icon-maskable.svg',
  // листы превью: по 8 упражнений в файле (см. js/app.js → sprite)
  ...['frog', 'human'].flatMap(skin => Array.from({ length: Math.ceil(EXERCISES.length / 8) }, (_, k) => `thumbs/${skin}-${k}.webp`)),
];
const FONT_CSS = 'https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&display=swap';
const STATIC_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(async c => {
    await c.addAll(FILES);
    await c.add(new Request(FONT_CSS, { mode: 'cors' })).catch(() => {}); // шрифт — необязателен
  }).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (STATIC_HOSTS.includes(url.hostname)) {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return res;
    })));
    return;
  }
  if (url.origin !== location.origin) return;
  // свои файлы: сначала сеть (чтобы обновления приходили сразу), без сети — кэш
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html')))
  );
});
