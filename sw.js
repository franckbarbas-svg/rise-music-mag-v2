/**
 * Rise Music Mag — Service Worker
 * ----------------------------------------------------------------
 * Trois stratégies de cache, choisies par type de ressource :
 *
 * 1. NAVIGATION (documents HTML, ex: n'importe quelle URL de page) :
 *    Network-First — toujours essayer le réseau en premier pour avoir
 *    le contenu le plus frais, mais retomber sur le cache (puis sur
 *    index.html) si hors-ligne. Comme c'est une SPA, toute navigation
 *    interne est gérée par le JS une fois index.html chargé : le
 *    fallback offline sert donc systématiquement index.html, quelle
 *    que soit l'URL demandée.
 *
 * 2. DONNÉES JSON (/data/*.json, /i18n/*.json) :
 *    Stale-While-Revalidate — sert immédiatement la version en cache
 *    (affichage instantané), PUIS revalide en arrière-plan et met à
 *    jour le cache pour la prochaine visite. Compromis idéal pour du
 *    contenu éditorial qui change occasionnellement : jamais d'attente
 *    réseau visible, jamais complètement périmé.
 *
 * 3. ASSETS STATIQUES (css/js/images/fonts) :
 *    Cache-First — un asset versionné par son nom de fichier (ou qui
 *    change rarement) n'a pas besoin d'être revalidé à chaque fois.
 *
 * Mise à jour : voir js/pwa.js pour la logique de notification —
 * ce service worker ne force JAMAIS de rechargement de page lui-même.
 */

const SW_VERSION = 'v1';
const CACHE_HTML = `rise-html-${SW_VERSION}`;
const CACHE_DATA = `rise-data-${SW_VERSION}`;
const CACHE_ASSETS = `rise-assets-${SW_VERSION}`;
const ALL_CACHES = [CACHE_HTML, CACHE_DATA, CACHE_ASSETS];

// Ressources critiques pré-mises en cache à l'installation, pour que le
// tout premier chargement hors-ligne (ou en réseau très lent) fonctionne
// déjà. Le reste se remplit au fil de la navigation normale.
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/css/main.css',
  '/js/app.js',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_HTML)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      // N'active pas immédiatement : on laisse l'onglet courant terminer
      // avec l'ancienne version. js/pwa.js proposera explicitement la mise
      // à jour, qui déclenchera skipWaiting() via message (voir plus bas).
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !ALL_CACHES.includes(key))
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Permet à js/pwa.js de déclencher l'activation immédiate du nouveau
// service worker quand l'utilisateur clique "Mettre à jour" sur la
// bannière — jamais automatique, toujours à l'initiative de la personne.
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

function isDataRequest(url) {
  return url.pathname.startsWith('/data/') || url.pathname.startsWith('/i18n/');
}

function isStaticAsset(url) {
  return /\.(css|js|mjs|png|jpg|jpeg|webp|svg|ico|woff2?|ttf)$/.test(url.pathname);
}

async function networkFirstHtml(request) {
  const cache = await caches.open(CACHE_HTML);
  try {
    const fresh = await fetch(request);
    if (fresh && fresh.ok) cache.put('/index.html', fresh.clone());
    return fresh;
  } catch {
    // Hors-ligne : la SPA gère toutes ses routes depuis index.html, donc
    // peu importe l'URL exacte demandée, on sert le shell applicatif.
    const cached = await cache.match('/index.html');
    return cached || Response.error();
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_DATA);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((fresh) => {
      if (fresh && fresh.ok) cache.put(request, fresh.clone());
      return fresh;
    })
    .catch(() => null);

  // Sert le cache immédiatement si dispo ; sinon attend le réseau.
  return cached || (await networkPromise) || Response.error();
}

async function cacheFirstAsset(request) {
  const cache = await caches.open(CACHE_ASSETS);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const fresh = await fetch(request);
    if (fresh && fresh.ok) cache.put(request, fresh.clone());
    return fresh;
  } catch {
    return cached || Response.error();
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return; // ne jamais intercepter POST (ex: soumission Netlify Forms)

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // ressources tierces (YouTube, etc.) : laisser passer

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstHtml(request));
  } else if (isDataRequest(url)) {
    event.respondWith(staleWhileRevalidate(request));
  } else if (isStaticAsset(url)) {
    event.respondWith(cacheFirstAsset(request));
  }
  // Tout le reste (ex: appels d'API tiers éventuels) : comportement réseau par défaut.
});
