/**
 * Rise Music Mag — Data Store
 * ----------------------------------------------------------------
 * Module central de chargement et d'accès aux données du site.
 * Charge une seule fois tous les fichiers JSON de /data, les met en cache,
 * et expose une API simple pour les consommer depuis n'importe quel module.
 *
 * Aucune dépendance externe. ES Modules natifs.
 *
 * Usage :
 *   import { dataStore } from './data-store.js';
 *   await dataStore.init();
 *   const artistes = dataStore.getArtistes();
 *   const frieda = dataStore.getArtisteById('frieda');
 */

// BASE_PATH : permet au site de fonctionner aussi bien à la racine d'un domaine
// (Netlify, domaine custom) qu'en sous-dossier (ancien déploiement GitHub Pages).
// Calculé une seule fois, exporté pour que tous les modules construisent
// leurs URLs et leurs fetch() de la même façon.
export const BASE_PATH = (() => {
  const knownRoutes = [
    'artistes', 'artiste', 'interviews', 'interview',
    'actualites', 'article', 'albums', 'album',
    'concerts', 'galerie', 'about', 'partenariats',
    'contact', 'mentions-legales', 'confidentialite',
    // Préfixe et segments de la version anglaise (/en/artists, /en/gallery...) :
    // ajoutés ici pour que BASE_PATH reste correct même déployé en sous-dossier.
    'en', 'artists', 'artist', 'news', 'gallery', 'partners', 'legal', 'privacy'
  ];
  const segments = window.location.pathname.split('/').filter(Boolean);
  let base = '';
  for (const seg of segments) {
    if (knownRoutes.includes(seg)) break;
    base += '/' + seg;
  }
  return base;
})();

/**
 * Construit une URL de données respectant le BASE_PATH courant.
 * @param {string} relativePath - ex: 'data/artistes.json'
 */
function dataUrl(relativePath) {
  return `${BASE_PATH}/${relativePath}`.replace(/\/{2,}/g, '/');
}

/** Liste des fichiers JSON à charger au démarrage. */
const SOURCES = {
  site: 'data/site.json',
  artistes: 'data/artistes.json',
  interviews: 'data/interviews.json',
  articles: 'data/articles.json',
  albums: 'data/albums.json',
  events: 'data/events.json'
};

class DataStore {
  constructor() {
    this._cache = {};
    this._initPromise = null;
    this._ready = false;
  }

  /**
   * Charge l'ensemble des fichiers JSON en parallèle.
   * Sûr à appeler plusieurs fois : la requête réseau n'est faite qu'une fois.
   * @returns {Promise<void>}
   */
  init() {
    if (this._initPromise) return this._initPromise;

    this._initPromise = Promise.all(
      Object.entries(SOURCES).map(async ([key, path]) => {
        try {
          const res = await fetch(dataUrl(path), { cache: 'no-cache' });
          if (!res.ok) throw new Error(`HTTP ${res.status} sur ${path}`);
          this._cache[key] = await res.json();
        } catch (err) {
          console.error(`[data-store] Échec de chargement de ${path} :`, err);
          // On ne bloque pas tout le site si un seul fichier échoue :
          // on retombe sur une structure vide cohérente pour ce type de données.
          this._cache[key] = this._emptyFallback(key);
        }
      })
    ).then(() => {
      this._ready = true;
    });

    return this._initPromise;
  }

  _emptyFallback(key) {
    switch (key) {
      case 'site': return { identite: {}, couleurs: {}, genres: [], navigation: [], footerLinks: [], reseaux: {}, pageTitles: {} };
      case 'artistes': return { artistes: [] };
      case 'interviews': return { interviews: [] };
      case 'articles': return { categories: [], articles: [] };
      case 'albums': return { albums: [] };
      case 'events': return { events: [] };
      default: return {};
    }
  }

  _assertReady() {
    if (!this._ready) {
      throw new Error('[data-store] init() doit être terminé avant tout accès aux données. Appelle await dataStore.init() au démarrage de l\'app.');
    }
  }

  // ---------------------------------------------------------------
  // SITE / CONFIG
  // ---------------------------------------------------------------

  getSiteConfig() {
    this._assertReady();
    return this._cache.site;
  }

  getGenres() {
    this._assertReady();
    return this._cache.site.genres || [];
  }

  getGenreLabel(genreId) {
    const genre = this.getGenres().find(g => g.id === genreId);
    return genre ? genre.label : (genreId ? String(genreId) : 'Genre à préciser');
  }

  getGenreColorVar(genreId) {
    const genre = this.getGenres().find(g => g.id === genreId);
    return genre ? `var(${genre.couleurVar})` : 'var(--muted)';
  }

  getNavigation() {
    this._assertReady();
    return this._cache.site.navigation || [];
  }

  getPageTitle(pageId) {
    this._assertReady();
    return (this._cache.site.pageTitles || {})[pageId] || pageId;
  }

  // ---------------------------------------------------------------
  // ARTISTES
  // ---------------------------------------------------------------

  /**
   * @param {object} [opts]
   * @param {boolean} [opts.includeUnpublished=false]
   * @returns {Array}
   */
  getArtistes(opts = {}) {
    this._assertReady();
    const list = this._cache.artistes.artistes || [];
    return opts.includeUnpublished ? list : list.filter(a => a.statut === 'publie');
  }

  getArtisteById(id) {
    this._assertReady();
    return (this._cache.artistes.artistes || []).find(a => a.id === id) || null;
  }

  getArtistesByGenre(genreId) {
    if (genreId === 'all' || !genreId) return this.getArtistes();
    return this.getArtistes().filter(a => a.genre === genreId);
  }

  /** Recherche texte simple sur nom, ville et description. */
  searchArtistes(query) {
    const q = (query || '').trim().toLowerCase();
    if (!q) return this.getArtistes();
    return this.getArtistes().filter(a =>
      a.nom.toLowerCase().includes(q) ||
      (a.ville || '').toLowerCase().includes(q) ||
      (a.description || '').toLowerCase().includes(q)
    );
  }

  // ---------------------------------------------------------------
  // INTERVIEWS
  // ---------------------------------------------------------------

  getInterviews(opts = {}) {
    this._assertReady();
    const list = this._cache.interviews.interviews || [];
    const filtered = opts.includeUnpublished ? list : list.filter(i => i.statut === 'publie');
    // Tri du plus récent au plus ancien ; les entrées sans date passent en dernier,
    // dans leur ordre d'apparition dans le fichier source.
    return [...filtered].sort((a, b) => {
      if (!a.datePublication && !b.datePublication) return 0;
      if (!a.datePublication) return 1;
      if (!b.datePublication) return -1;
      return new Date(b.datePublication) - new Date(a.datePublication);
    });
  }

  getInterviewById(id) {
    this._assertReady();
    return (this._cache.interviews.interviews || []).find(i => i.id === id) || null;
  }

  /**
   * Calcule la navigation précédent/suivant pour une interview donnée,
   * dans l'ordre chronologique d'affichage (le plus récent en premier).
   * @param {string} id
   * @returns {{prev: object|null, next: object|null}}
   */
  getInterviewNeighbors(id) {
    const list = this.getInterviews();
    const index = list.findIndex(i => i.id === id);
    if (index === -1) return { prev: null, next: null };
    return {
      prev: index > 0 ? list[index - 1] : null,
      next: index < list.length - 1 ? list[index + 1] : null
    };
  }

  /**
   * Suggestions "Autres interviews" : exclut l'interview courante,
   * priorise le même genre, complète avec les plus récentes.
   * @param {string} currentId
   * @param {number} [limit=3]
   */
  getRelatedInterviews(currentId, limit = 3) {
    const current = this.getInterviewById(currentId);
    const others = this.getInterviews().filter(i => i.id !== currentId);
    if (!current) return others.slice(0, limit);

    const sameGenre = others.filter(i => i.genre === current.genre);
    const rest = others.filter(i => i.genre !== current.genre);
    return [...sameGenre, ...rest].slice(0, limit);
  }

  // ---------------------------------------------------------------
  // ARTICLES
  // ---------------------------------------------------------------

  getArticleCategories() {
    this._assertReady();
    return this._cache.articles.categories || [];
  }

  getArticles(opts = {}) {
    this._assertReady();
    const list = this._cache.articles.articles || [];
    // 'exemple' est traité comme visible publiquement par choix temporaire,
    // le temps de valider le rendu des pages — à retirer de cette liste
    // (ne garder que 'publie') avant mise en ligne réelle du site.
    const visibleStatuses = ['publie', 'exemple'];
    const filtered = opts.includeUnpublished ? list : list.filter(a => visibleStatuses.includes(a.statut));
    return [...filtered].sort((a, b) => new Date(b.datePublication) - new Date(a.datePublication));
  }

  getArticleById(id) {
    this._assertReady();
    return (this._cache.articles.articles || []).find(a => a.id === id) || null;
  }

  getArticlesByCategorie(categorieId) {
    if (!categorieId || categorieId === 'all') return this.getArticles();
    return this.getArticles().filter(a => a.categorie === categorieId);
  }

  getArticlesByTag(tag) {
    return this.getArticles().filter(a => (a.tags || []).includes(tag));
  }

  searchArticles(query) {
    const q = (query || '').trim().toLowerCase();
    if (!q) return this.getArticles();
    return this.getArticles().filter(a =>
      a.titre.toLowerCase().includes(q) ||
      (a.chapo || '').toLowerCase().includes(q) ||
      (a.tags || []).some(t => t.toLowerCase().includes(q))
    );
  }

  /**
   * Pagination simple côté client.
   * @param {Array} list
   * @param {number} page - 1-indexé
   * @param {number} perPage
   */
  paginate(list, page = 1, perPage = 9) {
    const totalPages = Math.max(1, Math.ceil(list.length / perPage));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * perPage;
    return {
      items: list.slice(start, start + perPage),
      page: safePage,
      totalPages,
      total: list.length
    };
  }

  // ---------------------------------------------------------------
  // ALBUMS
  // ---------------------------------------------------------------

  getAlbums(opts = {}) {
    this._assertReady();
    const list = this._cache.albums.albums || [];
    return opts.includeUnpublished ? list : list.filter(a => a.statut !== 'brouillon');
  }

  getAlbumById(id) {
    this._assertReady();
    return (this._cache.albums.albums || []).find(a => a.id === id) || null;
  }

  getAlbumsByArtisteId(artisteId) {
    return this.getAlbums().filter(a => a.artisteId === artisteId);
  }

  // ---------------------------------------------------------------
  // EVENTS (Agenda concerts)
  // ---------------------------------------------------------------

  /**
   * @param {object} [opts]
   * @param {boolean} [opts.includePast=false] - inclure les événements déjà passés
   */
  getEvents(opts = {}) {
    this._assertReady();
    const list = this._cache.events.events || [];
    const now = new Date();
    // Les events au statut 'exemple' restent visibles temporairement
    // (même logique que getArticles) pour valider le rendu de la page
    // Concerts — à filtrer avant mise en ligne réelle.
    const filtered = opts.includePast
      ? list
      : list.filter(e => !e.date || new Date(e.date) >= now);
    return [...filtered].sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  getEventById(id) {
    this._assertReady();
    return (this._cache.events.events || []).find(e => e.id === id) || null;
  }

  getEventsByArtisteId(artisteId) {
    return this.getEvents({ includePast: true }).filter(e => e.artisteId === artisteId);
  }
}

/** Instance unique partagée par toute l'application. */
export const dataStore = new DataStore();
