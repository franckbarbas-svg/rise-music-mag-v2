/**
 * Rise Music Mag — Point d'entrée de l'application
 * ----------------------------------------------------------------
 * Initialise le data-store, construit la nav/footer, enregistre toutes
 * les routes auprès du routeur, et gère les comportements transverses
 * (délégation de clic sur data-route, filtres genre, recherche, partage).
 *
 * C'est le seul fichier qui touche directement au DOM "global" (nav,
 * footer, #app). Chaque module render-*.js reste une fonction pure qui
 * retourne du HTML ; c'est ici qu'on l'injecte.
 */

import { dataStore, BASE_PATH } from './data-store.js';
import { router } from './router.js';
import { i18n, t, getLocale, setLocale, tf } from './i18n.js';
import { registerServiceWorker } from './pwa.js';
import { renderLogoLink } from '../components/logo.js';
import { observeReveals, revealImmediately, onStatsReveal } from './scroll-reveal.js';
import { animateStats } from './stats-counter.js';
import { initShareDelegation } from './share.js';
import { showToast } from './toast.js';
import { renderHomePage } from './render-home.js';
import { renderArtistesPage, renderMosaicGrid } from './render-page-artistes.js';
import { renderArtisteDetail } from './render-artiste-detail.js';
import { renderInterviewsPage } from './render-page-interviews.js';
import { renderInterviewDetail } from './render-interview-detail.js';
import { renderArticlesPage, renderArticlesGrid, renderPagination } from './render-page-articles.js';
import { renderArticleDetail } from './render-article-detail.js';
import { renderAlbumsPage } from './render-page-albums.js';
import { renderAlbumDetail } from './render-album-detail.js';
import { renderConcertsPage } from './render-page-concerts.js';
import { renderGaleriePage } from './render-page-galerie.js';
import {
  renderAboutPage, renderPartenariatsPage, renderContactPage,
  renderLegalPage, renderConfidentialitePage
} from './render-static-pages.js';

const appEl = document.getElementById('app');
const navLinksEl = document.getElementById('nav-links');
const mnavEl = document.getElementById('mnav');
const footerColsEl = document.getElementById('footer-cols');
const footerSocialEl = document.getElementById('footer-social');
const loaderEl = document.getElementById('loader');
const progressBarEl = document.getElementById('progressBar');

/** Injecte du HTML dans #app, relance les observers, et remonte en haut. */
function mount(html) {
  appEl.innerHTML = html;
  observeReveals(appEl);
  // Le contenu déjà dans le viewport au moment du mount (typiquement le
  // haut de page) doit apparaître tout de suite plutôt qu'attendre un
  // scroll qui ne viendra peut-être jamais sur une page courte.
  revealImmediately(appEl);
  highlightCurrentNavLink();
}

// ---------------------------------------------------------------
// Construction de la navigation (desktop + mobile) depuis site.json
// ---------------------------------------------------------------

/** site.json ne connaît que le FR : on associe chaque id de nav à sa clé
 * de traduction plutôt que d'utiliser item.label directement, pour que la
 * nav change de langue sans dépendre du contenu des données. */
const NAV_I18N_KEYS = {
  home: 'nav.home',
  talents: 'nav.artistes',
  interview: 'nav.interviews',
  articles: 'nav.articles',
  albums: 'nav.albums',
  agenda: 'nav.concerts',
  galerie: 'nav.galerie',
  about: 'nav.about',
  partenariats: 'nav.partenariats',
  contact: 'nav.contact',
  legal: 'nav.legal',
  confidentialite: 'nav.confidentialite'
};

function navLabel(item) {
  return t(NAV_I18N_KEYS[item.id] || item.id) || item.label;
}

/** Construit le bouton de bascule de langue (desktop + mobile). */
function renderLangSwitch() {
  const target = getLocale() === 'en' ? 'fr' : 'en';
  // Pas d'id : ce markup est injecté deux fois (nav desktop + menu mobile),
  // et un id dupliqué dans le DOM serait invalide. On délègue via la classe.
  return `<button type="button" class="lang-switch" data-target-locale="${target}" aria-label="${t('nav.langSwitchAria')}">${t('nav.langSwitch')}</button>`;
}

function buildNavigation() {
  const nav = dataStore.getNavigation();
  const linksHtml = nav
    .filter(item => item.id !== 'home')
    .map(item => `<a href="${router.buildUrl(item.path)}" data-route="${item.path}" data-nav-path="${item.path}">${navLabel(item)}</a>`)
    .join('') + renderLangSwitch();

  navLinksEl.innerHTML = linksHtml;

  const mnavLinksHtml = nav
    .filter(item => item.id !== 'home')
    .map(item => `<a href="${router.buildUrl(item.path)}" data-route="${item.path}" data-nav-path="${item.path}">${navLabel(item)}</a>`)
    .join('') + renderLangSwitch();
  document.getElementById('mnav-links').innerHTML = mnavLinksHtml;

  initLangSwitchDelegation();
  applyStaticI18nLabels();
}

/** Libellés statiques du squelette HTML (index.html) qui ne passent pas
 * par un module render-*.js : burger, aria-label du menu mobile, loader. */
function applyStaticI18nLabels() {
  const burger = document.getElementById('burger');
  if (burger) burger.setAttribute('aria-label', t('nav.burgerOpen'));
  const mnavNav = document.querySelector('#mnav nav');
  if (mnavNav) mnavNav.setAttribute('aria-label', t('nav.mobileLabel'));
  const loaderText = document.querySelector('#loader .loader-text');
  if (loaderText) loaderText.textContent = t('loader.text');
}

/** Deux boutons de bascule existent dans le DOM (desktop + mobile, un seul
 * visible selon le breakpoint) : on (ré)attache un listener sur chacun à
 * chaque reconstruction de la nav (après un changement de langue). */
function initLangSwitchDelegation() {
  document.querySelectorAll('.lang-switch').forEach(btn => {
    btn.addEventListener('click', () => {
      setLocale(btn.dataset.targetLocale);
    });
  });
}

function highlightCurrentNavLink() {
  // On compare des chemins CANONIQUES : resolve() traduit l'URL réelle
  // (qui peut être localisée /en/...) vers sa forme canonique FR, la même
  // que celle stockée dans data-nav-path.
  const resolved = router.resolve(window.location.pathname, window.location.search);
  const nav = dataStore.getNavigation();
  const current = nav.find(item => {
    const itemResolved = router.resolve(item.path, '');
    return itemResolved.page === resolved.page;
  });
  document.querySelectorAll('[data-nav-path]').forEach((a) => {
    a.classList.toggle('current', current ? a.dataset.navPath === current.path : false);
  });
}

// ---------------------------------------------------------------
// Construction du footer depuis site.json
// ---------------------------------------------------------------

function buildFooter() {
  const site = dataStore.getSiteConfig();
  const nav = dataStore.getNavigation().filter(i => i.id !== 'home');
  const legal = dataStore.getSiteConfig().footerLinks || [];
  const reseaux = site.reseaux || {};

  const half = Math.ceil(nav.length / 2);
  const col1 = nav.slice(0, half);
  const col2 = nav.slice(half);

  footerColsEl.innerHTML = `
    <div class="foot-col">
      <h5>${t('footer.naviguer')}</h5>
      ${col1.map(i => `<a href="${router.buildUrl(i.path)}" data-route="${i.path}">${navLabel(i)}</a>`).join('')}
    </div>
    <div class="foot-col">
      <h5>${t('footer.explorer')}</h5>
      ${col2.map(i => `<a href="${router.buildUrl(i.path)}" data-route="${i.path}">${navLabel(i)}</a>`).join('')}
      ${legal.map(i => `<a href="${router.buildUrl(i.path)}" data-route="${i.path}">${navLabel(i)}</a>`).join('')}
    </div>`;

  const socialEntries = Object.entries(reseaux).filter(([, url]) => !!url);
  footerSocialEl.innerHTML = socialEntries.length
    ? `<span class="foot-social-label">${t('footer.suivre')}</span><div class="foot-social-links">${
        socialEntries.map(([key, url]) => `<a href="${url}" target="_blank" rel="noopener">${key}</a>`).join('')
      }</div>`
    : '';

  const taglineEl = document.querySelector('.foot-brand p');
  if (taglineEl) taglineEl.textContent = t('footer.tagline');
  const rightsEl = document.querySelector('.foot-bottom .copy');
  if (rightsEl) {
    const yearSpan = document.getElementById('footer-year');
    const year = yearSpan ? yearSpan.textContent : new Date().getFullYear();
    rightsEl.innerHTML = `© <span id="footer-year">${year}</span> ${site.identite?.nom || 'Rise Music Mag'}. ${t('footer.rights')}`;
  }
}

// ---------------------------------------------------------------
// Délégation globale de navigation : tout élément [data-route] navigue
// via le routeur SPA plutôt que de recharger la page.
// ---------------------------------------------------------------

function initRouteDelegation() {
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-route]');
    if (!el) return;
    // Si la cible a aussi [data-share], le handler de share.js gère déjà
    // le clic et a appelé stopPropagation : on ne navigue pas en double.
    if (e.target.closest('[data-share]')) return;

    e.preventDefault();
    closeMobileMenu();
    router.navigate(el.dataset.route);
  });

  // Permet d'activer un élément [data-route] au clavier (Entrée/Espace)
  // pour les cartes en role="link" tabindex="0" — accessibilité clavier.
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const el = e.target.closest('[data-route]');
    if (!el || el.tagName === 'A' || el.tagName === 'BUTTON') return; // déjà géré nativement
    e.preventDefault();
    router.navigate(el.dataset.route);
  });
}

// ---------------------------------------------------------------
// Menu mobile (burger)
// ---------------------------------------------------------------

function initMobileMenu() {
  const burger = document.getElementById('burger');
  burger.addEventListener('click', () => {
    const isOpen = mnavEl.classList.toggle('open');
    burger.classList.toggle('open', isOpen);
    burger.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });
}

function closeMobileMenu() {
  mnavEl.classList.remove('open');
  document.getElementById('burger').classList.remove('open');
  document.getElementById('burger').setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

// ---------------------------------------------------------------
// Nav : fond plein une fois qu'on a scrollé
// ---------------------------------------------------------------

function initScrollNav() {
  const nav = document.getElementById('main-nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 10);
    if (progressBarEl) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progressBarEl.style.width = max > 0 ? `${(window.scrollY / max) * 100}%` : '0%';
    }
  }, { passive: true });
}

// ---------------------------------------------------------------
// Filtres genre + recherche sur la page Artistes (comportement client,
// sans re-fetch ni rechargement de page)
// ---------------------------------------------------------------

function initArtistesPageBehavior() {
  const filtersEl = document.getElementById('genre-filters');
  const searchEl = document.getElementById('artistes-search');
  const mosaicEl = document.getElementById('artistes-mosaic');
  const countEl = document.getElementById('artistes-count');
  if (!filtersEl || !mosaicEl) return; // pas sur la page artistes

  let activeGenre = 'all';

  function applyFilters() {
    const query = searchEl ? searchEl.value.trim() : '';
    let list = activeGenre === 'all' ? dataStore.getArtistes() : dataStore.getArtistesByGenre(activeGenre);
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(a =>
        a.nom.toLowerCase().includes(q) ||
        (a.ville || '').toLowerCase().includes(q)
      );
    }
    mosaicEl.innerHTML = renderMosaicGrid(list);
    if (countEl) countEl.textContent = `${list.length} artiste${list.length === 1 ? '' : 's'}`;
    observeReveals(mosaicEl);
    revealImmediately(mosaicEl);
  }

  filtersEl.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-genre-filter]');
    if (!btn) return;
    activeGenre = btn.dataset.genreFilter;
    filtersEl.querySelectorAll('button').forEach(b => {
      const isActive = b === btn;
      b.classList.toggle('active', isActive);
      b.setAttribute('aria-pressed', String(isActive));
    });
    applyFilters();
  });

  if (searchEl) {
    let debounceTimer;
    searchEl.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(applyFilters, 200);
    });
  }
}

// ---------------------------------------------------------------
// Filtres catégorie + recherche + pagination sur la page Articles
// ---------------------------------------------------------------

function initArticlesPageBehavior() {
  const filtersEl = document.getElementById('article-filters');
  const searchEl = document.getElementById('articles-search');
  const gridEl = document.getElementById('articles-grid');
  const paginationEl = document.getElementById('articles-pagination');
  const countEl = document.getElementById('articles-count');
  if (!filtersEl || !gridEl) return; // pas sur la page articles

  let activeCategorie = 'all';
  let currentPage = 1;

  function getFilteredList() {
    const query = searchEl ? searchEl.value.trim() : '';
    let list = activeCategorie === 'all'
      ? dataStore.getArticles()
      : dataStore.getArticlesByCategorie(activeCategorie);
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(a =>
        tf(a, 'titre').toLowerCase().includes(q) ||
        tf(a, 'chapo').toLowerCase().includes(q) ||
        (a.tags || []).some(t => t.toLowerCase().includes(q))
      );
    }
    return list;
  }

  function render() {
    const list = getFilteredList();
    gridEl.innerHTML = renderArticlesGrid(list, currentPage);
    if (paginationEl) paginationEl.innerHTML = renderPagination(list, currentPage);
    if (countEl) countEl.textContent = `${list.length} article${list.length === 1 ? '' : 's'}`;
    observeReveals(gridEl);
    revealImmediately(gridEl);
  }

  filtersEl.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-cat-filter]');
    if (!btn) return;
    activeCategorie = btn.dataset.catFilter;
    currentPage = 1;
    filtersEl.querySelectorAll('button').forEach(b => {
      const isActive = b === btn;
      b.classList.toggle('active', isActive);
      b.setAttribute('aria-pressed', String(isActive));
    });
    render();
  });

  if (paginationEl) {
    paginationEl.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-page]');
      if (!btn) return;
      currentPage = parseInt(btn.dataset.page, 10) || 1;
      render();
      gridEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  if (searchEl) {
    let debounceTimer;
    searchEl.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => { currentPage = 1; render(); }, 200);
    });
  }
}

// ---------------------------------------------------------------
// Formulaire de contact (soumission, validation simple, succès)
// ---------------------------------------------------------------

function initContactFormBehavior() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('contact-name');
    const email = document.getElementById('contact-email');
    const message = document.getElementById('contact-message');
    const submitBtn = form.querySelector('button[type="submit"]');

    if (!name.value.trim() || !email.value.trim() || !message.value.trim()) {
      showToast(t('contact.champsRequis'), 'error');
      return;
    }

    // Honeypot anti-spam : si un bot a rempli ce champ caché, on feint le
    // succès sans rien envoyer (comportement standard Netlify Forms).
    const botField = form.querySelector('[name="bot-field"]');
    if (botField && botField.value) {
      form.innerHTML = `
        <div class="form-success">
          <div class="icon">✓</div>
          <h3>${t('contact.successTitle')}</h3>
        </div>`;
      return;
    }

    const originalBtnText = submitBtn ? submitBtn.textContent : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = t('common.envoiEnCours');
    }

    try {
      const body = new URLSearchParams(new FormData(form)).toString();
      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      form.innerHTML = `
        <div class="form-success">
          <div class="icon">✓</div>
          <h3>${t('contact.successTitle')}</h3>
          <p>${t('contact.successText', { name: escapeForDisplay(name.value.trim()), email: escapeForDisplay(email.value.trim()) })}</p>
        </div>`;
    } catch (err) {
      console.error('[contact-form] échec de l\'envoi :', err);
      showToast(t('contact.envoiEchoue'), 'error');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
      }
    }
  });
}

function escapeForDisplay(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ---------------------------------------------------------------
// Enregistrement des routes
// ---------------------------------------------------------------

function registerRoutes() {
  router.register('home', () => {
    mount(renderHomePage());
  });

  router.register('artistes', (params, query) => {
    mount(renderArtistesPage(query));
    initArtistesPageBehavior();
  });

  router.register('artiste-detail', (params) => {
    const { html } = renderArtisteDetail(params.id);
    mount(html);
  });

  router.register('interviews', () => {
    mount(renderInterviewsPage());
  });

  router.register('interview-detail', (params) => {
    const { html } = renderInterviewDetail(params.id);
    mount(html);
  });

  router.register('articles', (params, query) => {
    mount(renderArticlesPage(query));
    initArticlesPageBehavior();
  });

  router.register('article-detail', (params) => {
    const { html } = renderArticleDetail(params.id);
    mount(html);
  });

  router.register('albums', () => {
    mount(renderAlbumsPage());
  });

  router.register('album-detail', (params) => {
    const { html } = renderAlbumDetail(params.id);
    mount(html);
  });

  router.register('concerts', () => {
    mount(renderConcertsPage());
  });

  router.register('galerie', () => {
    mount(renderGaleriePage());
  });

  router.register('about', () => {
    mount(renderAboutPage());
  });

  router.register('partenariats', () => {
    mount(renderPartenariatsPage());
  });

  router.register('contact', () => {
    mount(renderContactPage());
    initContactFormBehavior();
  });

  router.register('legal', () => {
    mount(renderLegalPage());
  });

  router.register('confidentialite', () => {
    mount(renderConfidentialitePage());
  });

  router.registerNotFound(() => {
    mount(`
      <div class="wrap" style="padding:160px 20px 100px;text-align:center">
        <h1 class="display-lg">${t('common.pageIntrouvable')}</h1>
        <p class="editorial-text" style="margin:16px 0 24px">${t('common.pageIntrouvableTexte')}</p>
        <a class="btn gold" data-route="/">${t('common.retourAccueil')}</a>
      </div>
    `);
  });
}

// ---------------------------------------------------------------
// Démarrage
// ---------------------------------------------------------------

/**
 * Au changement explicite de langue (bouton lang-switch), on reconstruit
 * la nav/footer (libellés traduits) puis on re-rend la page courante à sa
 * nouvelle URL localisée, sans recharger le site ni perdre la position
 * dans l'app — c'est le même mécanisme que router.navigate, mais appliqué
 * "sur place" (voir router.refreshInPlace()).
 */
function initLocaleChangeReaction() {
  window.addEventListener('rise:localechange', () => {
    // L'URL doit refléter la nouvelle langue : on réécrit l'entrée
    // d'historique courante (replace, pas de nouvelle entrée dans l'historique
    // pour un simple changement de langue) avant de re-rendre.
    const resolved = router.resolve(window.location.pathname, window.location.search);
    const canonicalPath = resolved.page === 'home' ? '/' : buildCanonicalPathFromResolved(resolved);
    const url = router.buildUrl(canonicalPath);
    if (window.location.pathname + window.location.search !== url) {
      history.replaceState(history.state, '', url);
    }
    buildNavigation();
    buildFooter();
    router.refreshInPlace();
    // Les pages avec comportements client (filtres artistes/articles) doivent
    // ré-attacher leurs listeners après un re-rendu complet du HTML de #app.
    initArtistesPageBehavior();
    initArticlesPageBehavior();
    initContactFormBehavior();
  });
}

/** Reconstruit un chemin canonique à partir d'une route déjà résolue
 * (utile après un changement de langue, où on ne connaît que {page, params}). */
function buildCanonicalPathFromResolved(resolved) {
  const withParam = (base, id) => `${base}/${id}`;
  switch (resolved.page) {
    case 'home': return '/';
    case 'artistes': return '/artistes';
    case 'artiste-detail': return withParam('/artiste', resolved.params.id);
    case 'interviews': return '/interviews';
    case 'interview-detail': return withParam('/interview', resolved.params.id);
    case 'articles': return '/actualites';
    case 'article-detail': return withParam('/article', resolved.params.id);
    case 'albums': return '/albums';
    case 'album-detail': return withParam('/album', resolved.params.id);
    case 'concerts': return '/concerts';
    case 'galerie': return '/galerie';
    case 'about': return '/about';
    case 'partenariats': return '/partenariats';
    case 'contact': return '/contact';
    case 'legal': return '/mentions-legales';
    case 'confidentialite': return '/confidentialite';
    default: return '/';
  }
}

async function init() {
  await i18n.init();
  await dataStore.init();

  document.getElementById('nav-logo').innerHTML = renderLogoLink({ basePath: BASE_PATH });
  document.getElementById('mnav-logo').innerHTML = renderLogoLink({ basePath: BASE_PATH });
  document.getElementById('footer-logo').innerHTML = renderLogoLink({ basePath: BASE_PATH });

  buildNavigation();
  buildFooter();
  registerRoutes();
  initRouteDelegation();
  initMobileMenu();
  initScrollNav();
  initShareDelegation();
  initLocaleChangeReaction();
  onStatsReveal(() => animateStats(appEl));
  registerServiceWorker();

  router.start();

  if (loaderEl) {
    loaderEl.classList.add('hidden');
  }
}

init().catch((err) => {
  console.error('[app] Échec de l\'initialisation :', err);
  if (loaderEl) loaderEl.classList.add('hidden');
  if (appEl) {
    appEl.innerHTML = `
      <div class="wrap" style="padding:160px 20px 100px;text-align:center">
        <h1 class="display-lg">Erreur de chargement</h1>
        <p class="editorial-text">Le site n'a pas pu se charger correctement. Essaie de rafraîchir la page.</p>
      </div>`;
  }
});
