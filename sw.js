/* Service Worker — Leitura de Cocho (Confipar)
   Guarda o "esqueleto" do app em cache, pra abrir mesmo sem internet.
   Os dados em si continuam sendo salvos/sincronizados pela lógica
   já existente no leitura_cocho.html (localStorage + Supabase).
*/
const CACHE_NAME = 'leitura-cocho-v1';
const APP_SHELL = ['./leitura_cocho.html'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // Nunca intercepta chamadas ao Supabase — essas precisam ir direto pra rede
  if (req.url.includes('supabase.co')) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && req.method === 'GET') {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
