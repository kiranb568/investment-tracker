const CACHE_NAME = "srishti-wealth-pwa-v11";
const APP_SHELL = [
    "/",
    "/index.html",
    "/signin.html",
    "/support.html",
    "/privacy.html",
    "/terms.html",
    "/admin.html",
    "/dashboard.html",
    "/offline.html",
    "/styles.css",
    "/quantum-future.css",
    "/aurora-ui.css",
    "/srishti-light.css",
    "/ui-preferences.js",
    "/auth.js",
    "/settings.js",
    "/reports.js",
    "/live-markets.js",
    "/ai-market-insights.js",
    "/trading-tools.js",
    "/pwa.js",
    "/site.webmanifest",
    "/srishti-wealth-logo.png",
    "/icons/apple-touch-icon.png",
    "/icons/icon-192.png",
    "/icons/icon-512.png"
];

self.addEventListener("message", (event) => {
    if (event.data?.type === "SKIP_WAITING") {
        self.skipWaiting();
    }
});

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") {
        return;
    }

    if (event.request.mode === "navigate") {
        event.respondWith(
            fetch(event.request).catch(() => caches.match("/offline.html"))
        );
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(event.request).then((networkResponse) => {
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
                    return networkResponse;
                }

                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
                return networkResponse;
            });
        })
    );
});
