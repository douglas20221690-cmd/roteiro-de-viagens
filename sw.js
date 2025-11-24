
const CACHE_NAME = 'travel-manager-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  'https://cdn-icons-png.flaticon.com/512/201/201623.png'
];

// Instalação: Cache inicial de arquivos estáticos essenciais
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Ativação: Limpeza de caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Interceptação de Rede: Estratégia Network First (Tenta internet, se falhar, usa cache)
self.addEventListener('fetch', (event) => {
  // Ignora requisições que não são GET ou esquemas chrome-extension/etc
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  // Estratégia especial para Firestore/Google APIs (Deixa a lib lidar ou network only)
  if (event.request.url.includes('firestore.googleapis.com') || 
      event.request.url.includes('googleapis.com')) {
    return; // O SDK do Firebase tem sua própria persistência offline configurada no storage.ts
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Se a resposta for válida, clonamos e guardamos no cache para o futuro
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      })
      .catch(() => {
        // Se falhar (offline), tenta pegar do cache
        return caches.match(event.request);
      })
  );
});
