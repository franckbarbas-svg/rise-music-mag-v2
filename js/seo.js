/**
 * Rise Music Mag — SEO dynamique
 * ----------------------------------------------------------------
 * Met à jour les balises <title>, meta description, Open Graph,
 * Twitter Card, canonical et injecte le JSON-LD pour la page courante.
 * Appelé par chaque module de rendu de page détail (interview, artiste,
 * article...) après génération du HTML.
 *
 * Toutes les pages SPA partagent un seul document : on doit donc
 * nettoyer/remplacer les balises précédentes à chaque navigation,
 * plutôt que les empiler.
 */

import { dataStore } from './data-store.js';
import { BASE_PATH } from './data-store.js';
import { router } from './router.js';

const JSON_LD_ID = 'rise-jsonld';
const HREFLANG_ATTR = 'data-rise-hreflang';

function setMeta(name, content, attr = 'name') {
  if (!content) return;
  let tag = document.querySelector(`meta[${attr}="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function setCanonical(path) {
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  const site = dataStore.getSiteConfig();
  const base = (site.identite?.url || '').replace(/\/$/, '');
  // La canonique doit pointer vers l'URL réellement affichée (donc localisée
  // si on est sur la version anglaise), pas systématiquement vers la version FR.
  link.setAttribute('href', `${base}${router.buildUrl(path)}`);
}

/**
 * Injecte les balises <link rel="alternate" hreflang="..."> pour une page
 * donnée : une par langue supportée + x-default (convention Google pour
 * indiquer la version à servir par défaut si aucune langue ne correspond).
 * Nettoyées et régénérées à chaque navigation SPA, comme le JSON-LD.
 * @param {string} canonicalPath - chemin canonique (toujours en français)
 */
function setHreflang(canonicalPath) {
  document.querySelectorAll(`link[${HREFLANG_ATTR}]`).forEach(el => el.remove());
  const site = dataStore.getSiteConfig();
  const base = (site.identite?.url || '').replace(/\/$/, '');

  const alternates = [
    { lang: 'fr', locale: 'fr' },
    { lang: 'en', locale: 'en' },
    { lang: 'x-default', locale: 'fr' }
  ];

  alternates.forEach(({ lang, locale }) => {
    const link = document.createElement('link');
    link.setAttribute('rel', 'alternate');
    link.setAttribute('hreflang', lang);
    link.setAttribute('href', `${base}${router.buildUrlForLocale(canonicalPath, locale)}`);
    link.setAttribute(HREFLANG_ATTR, '');
    document.head.appendChild(link);
  });
}

/**
 * Applique les métadonnées SEO pour la page courante.
 * @param {object} opts
 * @param {string} opts.title
 * @param {string} opts.description
 * @param {string} [opts.image]
 * @param {'website'|'article'} [opts.type='website']
 * @param {string} opts.canonicalPath - chemin sans BASE_PATH, ex: '/interview/frieda'
 * @param {object|object[]} [opts.jsonLd] - un schema.org, ou un tableau de plusieurs
 *   (ex: [schemaArticle, breadcrumbSchema]). Chacun est injecté dans son propre
 *   <script>, conformément à la pratique recommandée pour 2-3 types sur une page
 *   (plus simple à déboguer qu'un seul bloc @graph fusionné).
 */
export function applySeo({ title, description, image, type = 'website', canonicalPath, jsonLd }) {
  const site = dataStore.getSiteConfig();
  const fullTitle = title || site.identite?.nom || 'Rise Music Mag';
  const desc = description || site.identite?.description || '';
  const img = image || site.identite?.ogImage || '';

  document.title = fullTitle;
  setMeta('description', desc);

  setMeta('og:title', fullTitle, 'property');
  setMeta('og:description', desc, 'property');
  setMeta('og:type', type, 'property');
  setMeta('og:image', img, 'property');
  setMeta('og:site_name', site.identite?.nom || 'Rise Music Mag', 'property');

  setMeta('twitter:card', img ? 'summary_large_image' : 'summary');
  setMeta('twitter:title', fullTitle);
  setMeta('twitter:description', desc);
  setMeta('twitter:image', img);

  if (canonicalPath) {
    setCanonical(canonicalPath);
    setHreflang(canonicalPath);
  }

  // JSON-LD : on retire tous les précédents avant d'injecter les nouveaux,
  // pour ne jamais empiler des schémas contradictoires d'une page SPA à l'autre.
  document.querySelectorAll(`[id^="${JSON_LD_ID}"]`).forEach(el => el.remove());

  const schemas = Array.isArray(jsonLd) ? jsonLd : (jsonLd ? [jsonLd] : []);
  schemas.forEach((schema, i) => {
    if (!schema) return;
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = i === 0 ? JSON_LD_ID : `${JSON_LD_ID}-${i}`;
    script.textContent = JSON.stringify(schema, (key, value) => value === undefined ? undefined : value);
    document.head.appendChild(script);
  });
}

/**
 * Construit le fil d'Ariane (Breadcrumb) JSON-LD pour une page donnée.
 * @param {Array<{name: string, path: string}>} crumbs - du plus général au plus précis
 */
export function buildBreadcrumbJsonLd(crumbs) {
  const site = dataStore.getSiteConfig();
  const base = (site.identite?.url || '').replace(/\/$/, '');
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: `${base}${BASE_PATH}${c.path}`
    }))
  };
}
