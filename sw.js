// Service worker — cache offline da PWA Painel
// Estratégia: HTML sempre "network-first" (para receberes updates); restantes assets "cache-first".
const CACHE = 'painel-v12';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-check-192.png',
  './icon-check-512.png',
  './apple-touch-icon-check.png',
  './challenge75.js',
  './challenge75.css',
  './workout.js',
  './workout.css'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);

  // Supabase precisa sempre de rede — nunca intercetar
  if (url.hostname.endsWith('supabase.co')) return;
  if (req.method !== 'GET') return;

  const isHTML = req.mode === 'navigate' || req.destination === 'document';

  if (isHTML) {
    // network-first: tenta a rede, atualiza a cache, cai na cache se offline
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put('./index.html', copy));
        return res;
      }).catch(() => caches.match('./index.html').then((r) => r || caches.match('./')))
    );
    return;
  }

  if (url.origin === self.location.origin) {
    const isCode = req.destination === 'script' || req.destination === 'style';
    if (isCode) {
      // Codigo network-first: novas versoes aparecem logo apos cada deploy.
      e.respondWith(fetch(req).then((res) => {
        if (res.ok) { const copy=res.clone(); caches.open(CACHE).then((c)=>c.put(req,copy)); }
        return res;
      }).catch(()=>caches.match(req)));
      return;
    }
    // Imagens e restantes recursos estaveis continuam cache-first.
    e.respondWith(caches.match(req).then((cached)=>cached||fetch(req).then((res)=>{
      if(res.ok){const copy=res.clone();caches.open(CACHE).then((c)=>c.put(req,copy));}
      return res;
    })));
  }
});
