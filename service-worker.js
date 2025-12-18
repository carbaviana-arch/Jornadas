const CACHE_NAME = "registro-horas-v1.3";
const urlsToCache = [
  "./index.html?v=1.3",
  "./style.css?v=1.3",
  "./script.js?v=1.3",
  "./manifest.json?v=1.3",
  "./icon-192.png?v=1.3",
  "./icon-512.png?v=1.3",
  "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
];

// Instalación del service worker y cache inicial
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activación y limpieza de cachés antiguas
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Interceptar solicitudes y responder desde caché o red
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
      .catch(() => {
        // Opción: mostrar página offline si no hay conexión
        if (event.request.mode === "navigate") {
          return caches.match("./index.html?v=1.3");
        }
      })
  );
});