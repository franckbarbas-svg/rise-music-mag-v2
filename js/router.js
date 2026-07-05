/**
 * Rise Music Mag — Routeur SPA (FR/EN)
 * ----------------------------------------------------------------
 * Remplace l'ancien système maison (pushState/popstate + calcul manuel
 * de BASE_PATH dans le HTML). Sur Netlify, le site vit toujours à la
 * racine donc le routeur n'a plus besoin de gérer de sous-dossier — mais
 * on garde le support via BASE_PATH (data-store.js) par sécurité si le
 * site est un jour redéployé ailleurs.
 *
 * Modèle de routes CANONIQUE (toujours en français, utilisé partout
 * ailleurs dans le code — data-route="/artiste/frieda", etc.) :
 *   '/'                      -> home
 *   '/artistes'               -> liste artistes (+ ?genre=xxx)
 *   '/artiste/:id'            -> détail artiste
 *   '/interviews'             -> liste interviews
 *   '/interview/:id'          -> détail interview
 *   '/actualites'             -> liste articles (+ ?categorie=xxx&page=N)
 *   '/article/:id'            -> détail article
 *   '/albums'                 -> liste albums
 *   '/album/:id'               -> détail album
 *   '/concerts'                -> agenda
 *   '/galerie'                  -> galerie photo
 *   '/about', '/partenariats', '/contact'
 *   '/mentions-legales', '/confidentialite'
 *
 * Internationalisation : chaque route canonique a un équivalent localisé
 * sous /en/... (ex: /en/artists, /en/artist/:id). Le routeur traduit
 * automatiquement dans les deux sens :
 *   - resolve()  : URL réelle du navigateur (FR ou /en/...) -> route canonique + locale
 *   - buildUrl() : route canonique -> URL affichée dans la barre d'adresse,
 *                  localisée selon i18n.getLocale() courant
 * Ainsi, tout le reste du code (render-cards.js, app.js...) continue de
 * manipuler exclusivement des chemins canoniques FR (data-route="/artiste/xxx"),
 * sans jamais se soucier de la langue active : c'est le routeur qui traduit
 * au moment d'écrire l'URL dans l'historique du navigateur.
 *
 * Usage :
 *   import { router } from './router.js';
 *   router.register('home', () => renderHome());
 *   router.register('artiste-detail', (params) => renderArtisteDetail(params.id));
 *   router.start();
 */

import { BASE_PATH } from './data-store.js';
import { getLocale, setLocale } from './i18n.js';

/** Définition déclarative des routes canoniques (FR) : motif -> { page, params } */
const ROUTE_PATTERNS = [
  { pattern: /^\/$/, page: 'home', params: [] },
  { pattern: /^\/artistes$/, page: 'artistes', params: [] },
  { pattern: /^\/artiste\/([\w-]+)$/, page: 'artiste-detail', params: ['id'] },
  { pattern: /^\/interviews$/, page: 'interviews', params: [] },
  { pattern: /^\/interview\/([\w-]+)$/, page: 'interview-detail', params: ['id'] },
  { pattern: /^\/actualites$/, page: 'articles', params: [] },
  { pattern: /^\/article\/([\w-]+)$/, page: 'article-detail', params: ['id'] },
  { pattern: /^\/albums$/, page: 'albums', params: [] },
  { pattern: /^\/album\/([\w-]+)$/, page: 'album-detail', params: ['id'] },
  { pattern: /^\/concerts$/, page: 'concerts', params: [] },
  { pattern: /^\/galerie$/, page: 'galerie', params: [] },
  { pattern: /^\/about$/, page: 'about', params: [] },
  { pattern: /^\/partenariats$/, page: 'partenariats', params: [] },
  { pattern: /^\/contact$/, page: 'contact', params: [] },
  { pattern: /^\/mentions-legales$/, page: 'legal', params: [] },
  { pattern: /^\/confidentialite$/, page: 'confidentialite', params: [] }
];

/**
 * Traduction des segments "statiques" de chemin (pas les :id, qui restent
 * identiques dans les deux langues — un artiste garde le même slug partout).
 * Seul le premier segment d'un chemin canonique a besoin d'être traduit.
 */
const SEGMENT_FR_TO_EN = {
  'artistes': 'artists',
  'artiste': 'artist',
  'actualites': 'news',
  'article': 'article',
  'galerie': 'gallery',
  'partenariats': 'partners',
  'mentions-legales': 'legal',
  'confidentialite': 'privacy'
  // 'interviews', 'interview', 'albums', 'album', 'concerts', 'about', 'contact'
  // sont identiques dans les deux langues : pas d'entrée nécessaire.
};
const SEGMENT_EN_TO_FR = Object.fromEntries(
  Object.entries(SEGMENT_FR_TO_EN).map(([fr, en]) => [en, fr])
);

function localizeFirstSegment(segment, locale) {
  if (locale !== 'en') return segment;
  return SEGMENT_FR_TO_EN[segment] || segment;
}

function canonicalizeFirstSegment(segment) {
  return SEGMENT_EN_TO_FR[segment] || segment;
}

class Router {
  constructor() {
    this._handlers = {};
    this._notFoundHandler = null;
    this._currentPage = null;
    /** Jeton incrémenté à chaque navigation pour annuler les rendus obsolètes
     * (ex: si l'utilisateur navigue à nouveau avant la fin d'une animation). */
    this._navToken = 0;
  }

  register(page, handler) {
    this._handlers[page] = handler;
    return this;
  }

  registerNotFound(handler) {
    this._notFoundHandler = handler;
    return this;
  }

  get navToken() {
    return this._navToken;
  }

  /**
   * Résout une URL RÉELLE du navigateur (peut être FR ou localisée /en/...)
   * en { page, params, query, locale }. C'est la seule fonction qui sait lire
   * le préfixe /en/ ; le reste de l'app raisonne uniquement en chemins canoniques.
   */
  resolve(pathname, search) {
    let path = pathname.replace(/\/+$/, '') || '/';
    if (BASE_PATH && path.startsWith(BASE_PATH)) {
      path = path.slice(BASE_PATH.length) || '/';
    }

    let locale = 'fr';
    if (path === '/en' || path.startsWith('/en/')) {
      locale = 'en';
      path = path.slice(3) || '/';
      if (!path.startsWith('/')) path = '/' + path;
    }

    // Canonicalise le premier segment (ex: /en/artists -> /artistes) avant
    // de matcher les patterns, qui sont toujours écrits en français.
    if (locale === 'en' && path !== '/') {
      const parts = path.split('/').filter(Boolean);
      parts[0] = canonicalizeFirstSegment(parts[0]);
      path = '/' + parts.join('/');
    }

    const query = Object.fromEntries(new URLSearchParams(search));

    for (const route of ROUTE_PATTERNS) {
      const match = path.match(route.pattern);
      if (match) {
        const params = {};
        route.params.forEach((name, i) => { params[name] = match[i + 1]; });
        return { page: route.page, params, query, locale };
      }
    }

    return { page: null, params: {}, query, locale };
  }

  /**
   * Construit l'URL à afficher dans la barre d'adresse pour un chemin
   * CANONIQUE (toujours en français), localisée selon la langue active.
   */
  buildUrl(path) {
    return this.buildUrlForLocale(path, getLocale());
  }

  /**
   * Comme buildUrl(), mais pour une langue explicite plutôt que la langue
   * active — utilisé par js/seo.js pour générer les balises hreflang FR/EN
   * d'une page sans dépendre de la langue actuellement affichée.
   * @param {string} path - chemin canonique
   * @param {'fr'|'en'} locale
   */
  buildUrlForLocale(path, locale) {
    let localizedPath = path;

    if (locale === 'en') {
      if (path === '/') {
        localizedPath = '/en/';
      } else {
        const parts = path.split('/').filter(Boolean);
        parts[0] = localizeFirstSegment(parts[0], 'en');
        localizedPath = '/en/' + parts.join('/');
      }
    }

    return BASE_PATH ? `${BASE_PATH}${localizedPath}` : localizedPath;
  }

  /**
   * Navigue vers un chemin CANONIQUE (toujours en français) et déclenche
   * le rendu correspondant. C'est la méthode utilisée par tous les liens
   * internes (data-route), qui n'ont jamais besoin de connaître la langue
   * active : le routeur localise l'URL affichée automatiquement.
   */
  navigate(path, opts = {}) {
    const [pathname, search = ''] = path.split('?');
    let cleanPath = pathname.replace(/\/+$/, '') || '/';
    const query = Object.fromEntries(new URLSearchParams(search ? '?' + search : ''));

    let matched = null;
    for (const route of ROUTE_PATTERNS) {
      const match = cleanPath.match(route.pattern);
      if (match) {
        const params = {};
        route.params.forEach((name, i) => { params[name] = match[i + 1]; });
        matched = { page: route.page, params };
        break;
      }
    }

    const page = matched?.page ?? null;
    const params = matched?.params ?? {};
    const handler = this._handlers[page] || this._notFoundHandler;
    if (!handler) {
      console.warn(`[router] Aucun handler enregistré pour la page "${page}" (chemin: ${path})`);
      return false;
    }

    this._navToken += 1;
    this._currentPage = page;

    if (!opts.skipPush) {
      const url = this.buildUrl(cleanPath);
      const method = opts.replace ? 'replaceState' : 'pushState';
      if (window.location.pathname + window.location.search !== url) {
        history[method]({ page, params, query }, '', url);
      }
    }

    handler(params, query);
    window.scrollTo({ top: 0, behavior: opts.skipScroll ? 'auto' : 'smooth' });
    return true;
  }

  /**
   * Re-rend la page courante à son URL localisée actuelle, sans changer de
   * page ni pousser d'entrée d'historique — utilisé après un changement de
   * langue explicite (lang switch) pour rafraîchir le texte affiché.
   */
  refreshInPlace() {
    const { pathname, search } = window.location;
    const resolved = this.resolve(pathname, search);
    const handler = this._handlers[resolved.page] || this._notFoundHandler;
    if (!handler) return;
    this._navToken += 1;
    handler(resolved.params, resolved.query);
  }

  /** Démarre le routeur : résout l'URL courante (FR ou /en/...) et écoute popstate. */
  start() {
    const route = () => {
      const { pathname, search } = window.location;
      const resolved = this.resolve(pathname, search);
      // La locale vient de l'URL réelle au chargement/popstate : on ne
      // persiste pas ce choix (silent) pour ne pas écraser une préférence
      // explicite enregistrée si l'utilisateur arrive via un lien partagé.
      setLocale(resolved.locale, { persist: false, silent: true });

      this._navToken += 1;
      this._currentPage = resolved.page;
      const handler = this._handlers[resolved.page] || this._notFoundHandler;
      if (!handler) {
        console.warn(`[router] Aucun handler enregistré pour la page "${resolved.page}" (chemin: ${pathname})`);
        return;
      }
      handler(resolved.params, resolved.query);
    };
    window.addEventListener('popstate', route);
    route();
  }

  get currentPage() {
    return this._currentPage;
  }
}

export const router = new Router();
