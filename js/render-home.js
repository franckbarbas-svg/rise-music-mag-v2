/**
 * Rise Music Mag — Page d'accueil
 * ----------------------------------------------------------------
 * Hero + stats + 5 cartes genre + bloc feature (1 artiste mis en avant)
 * + carrousel des artistes récents. Le feature block met en avant
 * l'artiste le plus récemment publié (datePublication la plus haute),
 * donc il change automatiquement quand un nouvel artiste est ajouté.
 */

import { dataStore } from './data-store.js';
import { renderTalentCard, renderGenreCard, esc } from './render-cards.js';
import { applySeo } from './seo.js';
import { t } from './i18n.js';

const GENRE_ICONS = {
  pop: '🎤',
  afro: '🌍',
  dance: '💫',
  indie: '🎸',
  hybrid: '✨'
};

/** Clé i18n de la description de chaque genre (voir i18n/fr.json + en.json). */
const GENRE_I18N_KEYS = {
  pop: 'genre.pop.desc',
  afro: 'genre.afro.desc',
  dance: 'genre.dance.desc',
  indie: 'genre.indie.desc',
  hybrid: 'genre.hybrid.desc'
};

export function renderHomePage() {
  const site = dataStore.getSiteConfig();
  const artistes = dataStore.getArtistes();
  const genres = dataStore.getGenres();

  // L'artiste mis en avant : le plus récemment publié.
  const featured = [...artistes].sort((a, b) => new Date(b.datePublication || 0) - new Date(a.datePublication || 0))[0];
  const recent = artistes.filter(a => a.id !== featured?.id).slice(0, 10);

  applySeo({
    title: `${site.identite?.nom || 'Rise Music Mag'} — ${site.identite?.tagline || ''}`,
    description: site.identite?.description,
    type: 'website',
    canonicalPath: '/',
    jsonLd: [
      buildOrganizationJsonLd(site),
      buildWebSiteJsonLd(site)
    ]
  });

  return `
    <section class="hero">
      <div class="hero-bg" aria-hidden="true"></div>
      <div class="hero-content">
        <h1>${t('home.heroTitle1')} <em>${t('home.heroTitleEm')}</em> ${t('home.heroTitle2')}</h1>
        <p>${t('home.heroText')}</p>
        <div class="btns">
          <a class="btn gold" data-route="/artistes">${t('home.ctaArtistes')}</a>
          <a class="btn line" data-route="/interviews">${t('home.ctaInterviews')}</a>
        </div>
      </div>
    </section>

    <section>
      <div class="wrap">
        <div class="stats reveal">
          <div class="stat"><div class="stat-num" id="stat-artists" data-target="${artistes.length}">0</div><div class="stat-label">${t('home.statArtistes')}</div></div>
          <div class="stat"><div class="stat-num" id="stat-genres" data-target="${genres.length}">0</div><div class="stat-label">${t('home.statUnivers')}</div></div>
          <div class="stat"><div class="stat-num" id="stat-interviews" data-target="${dataStore.getInterviews().length}">0</div><div class="stat-label">${t('home.statInterviews')}</div></div>
        </div>
      </div>
    </section>

    <section>
      <div class="wrap">
        <div class="head reveal">
          <h2>${t('home.universTitle')}</h2>
          <p>${t('home.universText')}</p>
        </div>
        <div class="genre-grid">
          ${genres.map(g => renderGenreCard(g, GENRE_ICONS[g.id] || '🎵', t(GENRE_I18N_KEYS[g.id] || ''))).join('')}
        </div>
      </div>
    </section>

    ${featured ? `
    <section>
      <div class="wrap">
        <div class="feature-block reveal-zoom">
          ${renderFeatureBlock(featured)}
        </div>
      </div>
    </section>` : ''}

    <section>
      <div class="wrap">
        <div class="head reveal">
          <h2>${t('home.aDecouvrirTitle')}</h2>
          <p>${t('home.aDecouvrirText')}</p>
        </div>
        <div class="track" id="home-track">
          ${recent.map(renderTalentCard).join('')}
        </div>
        <div class="see-all">
          <a class="btn line" data-route="/artistes">${t('home.voirTousArtistes')}</a>
        </div>
      </div>
    </section>
  `;
}

function renderFeatureBlock(artiste) {
  const genreLabel = dataStore.getGenreLabel(artiste.genre);
  const genreColor = dataStore.getGenreColorVar(artiste.genre);
  const img = artiste.photo || (artiste.youtube ? `https://i.ytimg.com/vi/${esc(artiste.youtube)}/maxresdefault.jpg` : null);

  return `
    <div class="feature-grid">
      <div class="feature-media" data-route="/artiste/${esc(artiste.id)}">
        ${img ? `<img src="${esc(img)}" alt="${esc(artiste.photoAlt || artiste.nom)}" loading="lazy">` : ''}
        <span class="feature-tag"><span class="dot" style="background:${genreColor}"></span>${esc(genreLabel)}</span>
        ${artiste.youtube ? `<div class="play"><i aria-hidden="true">▶</i></div>` : ''}
      </div>
      <div class="feature-text" data-route="/artiste/${esc(artiste.id)}">
        <div>
          <span class="feature-eyebrow">${t('home.aLaUne')}</span>
          <h3>${esc(artiste.nom)}</h3>
          <p class="intro">${esc((artiste.description || '').slice(0, 180))}${(artiste.description || '').length > 180 ? '…' : ''}</p>
        </div>
        <div>
          <div class="feature-meta">
            <div><span>${t('common.ville')}</span><span>${esc(artiste.ville)}</span></div>
            <div><span>${t('common.univers')}</span><span>${esc(genreLabel)}</span></div>
          </div>
          <button class="feature-cta">${t('common.lireArticle')}<span class="circle">→</span></button>
        </div>
      </div>
    </div>`;
}

/**
 * Schema.org Organization : identité de la marque pour Google (peut alimenter
 * le panneau de connaissance / knowledge panel si le site gagne en autorité).
 */
function buildOrganizationJsonLd(site) {
  const reseaux = site.reseaux || {};
  const sameAs = Object.values(reseaux).filter(Boolean);
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: site.identite?.nom || 'Rise Music Mag',
    url: site.identite?.url || undefined,
    logo: site.identite?.ogImage || undefined,
    sameAs: sameAs.length ? sameAs : undefined
  };
}

/**
 * Schema.org WebSite : déclare le site comme entité. Pas de potentialAction
 * SearchAction ici volontairement — le site n'a pas de route de recherche
 * globale accessible par URL (?q=...), seulement des filtres client-side sur
 * les pages Artistes et Actualités. Déclarer un SearchAction qui ne correspond
 * à rien de fonctionnel serait trompeur pour Google et les utilisateurs.
 */
function buildWebSiteJsonLd(site) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: site.identite?.nom || 'Rise Music Mag',
    url: site.identite?.url || undefined
  };
}
