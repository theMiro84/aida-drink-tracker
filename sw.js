// Service Worker: macht die App offline nutzbar.
// Alle Dateien aus PRECACHE werden bei der Installation gespeichert und danach
// aus dem Speicher ausgeliefert. Eine neue Version wird erkannt, sobald sich
// VERSION ändert; sie ersetzt die alte automatisch.
//
// VERSION ist ein Fingerabdruck über die Dateien in PRECACHE und wird mit
// `npm run sw:version` aktualisiert. `npm test` schlägt fehl, wenn er veraltet ist.
const VERSION = '5df1a155ba92';
const CACHE_PREFIX = 'drink-tracker-';
const CACHE_NAME = `${CACHE_PREFIX}${VERSION}`;
const PRECACHE = [
    './',
    'index.html',
    'styles.css',
    'calc.js',
    'app.js',
    'manifest.json',
    'data/getraenke.csv',
    'icons/icon-192.png',
    'icons/icon-512.png',
    'icons/apple-touch-icon.png',
    'vendor/qrcode-generator.js',
    'vendor/html5-qrcode.min.js',
    'vendor/fonts/fonts.css',
    'vendor/fonts/material-symbols-outlined-fallback-d78caf.woff2',
    'vendor/fonts/inter-latin-000fd3.woff2',
    'vendor/fonts/inter-latin-ext-bec0fc.woff2',
    'vendor/fonts/plus-jakarta-sans-latin-302e17.woff2',
    'vendor/fonts/plus-jakarta-sans-latin-ext-90357a.woff2',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        (async () => {
            const cache = await caches.open(CACHE_NAME);
            // 'reload' umgeht den Browser-Zwischenspeicher, damit wirklich die neue Version gespeichert wird.
            await cache.addAll(PRECACHE.map((url) => new Request(url, { cache: 'reload' })));
            await self.skipWaiting();
        })()
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        (async () => {
            const names = await caches.keys();
            await Promise.all(
                names.filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map((name) => caches.delete(name))
            );
            await self.clients.claim();
        })()
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

    event.respondWith(
        (async () => {
            const cache = await caches.open(CACHE_NAME);
            const cached = await cache.match(request, { ignoreSearch: true });
            if (cached) return cached;
            try {
                return await fetch(request);
            } catch (error) {
                // Offline und nicht gespeichert: Seitenaufrufe landen auf der App selbst.
                if (request.mode === 'navigate') return cache.match('index.html');
                throw error;
            }
        })()
    );
});
