/**
 * Rise Music Mag — Page liste Artistes
 * ----------------------------------------------------------------
 * Masthead + mosaïque asymétrique + filtres par genre + recherche.
 * Le rendu de la mosaïque réassigne les tailles (large/medium/small)
 * de façon déterministe pour produire un rythme visuel varié sans
 * dépendre d'un champ "taille" à gérer manuellement dans l'admin.
 */

import { dataStore } from './data-store.js';
import { renderMosaicTile, esc } from './render-cards.js';
import { applySeo } from './seo.js';
import { t } from './i18n.js';

function tileSizeForIndex(index) {
  const pattern = ['large', 'medium', 'small', 'small', 'medium', 'small', 'small', 'small'];
  return pattern[index % pattern.length];
}

export function renderArtistesPage(query = {}) {
  const genres = dataStore.getGenres();
  const total = dataStore.getArtistes().length;
  const activeGenre = query.genre || 'all';

  applySeo({
    title: t('artistes.metaTitle'),
    description: t('artistes.metaDesc'),
    type: 'website',
    canonicalPath: '/artistes'
  });

  return `
    <div class="wrap page-top">
      <div class="talents-masthead">
        <div class="tm-top">
          <span class="tm-label">${t('brand.name')}</span>
          <span class="tm-count" id="artistes-count">${total} ${t('artistes.count')}</span>
        </div>
        <h2 class="display-xl">${t('nav.artistes').toUpperCase()}</h2>
        <div class="tm-sub">
          <p class="editorial-text">${t('artistes.subText')}</p>
        </div>
      </div>

      <div class="filters" id="genre-filters" role="group" aria-label="${t('artistes.filtreAria')}">
        <button data-genre-filter="all" class="${activeGenre === 'all' ? 'active' : ''}" aria-pressed="${activeGenre === 'all'}">${t('artistes.filtreTous')}</button>
        ${genres.map(g => `<button data-genre-filter="${esc(g.id)}" class="${activeGenre === g.id ? 'active' : ''}" aria-pressed="${activeGenre === g.id}">${esc(g.label)}</button>`).join('')}
      </div>

      <div class="search-box">
        <input type="search" id="artistes-search" placeholder="${t('artistes.searchPlaceholder')}" aria-label="${t('artistes.searchAria')}">
      </div>
    </div>

    <div class="wrap">
      <div class="mosaic" id="artistes-mosaic" aria-live="polite">
        ${renderMosaicGrid(dataStore.getArtistesByGenre(activeGenre))}
      </div>
    </div>
  `;
}

export function renderMosaicGrid(artistes) {
  if (!artistes.length) {
    return `<div class="no-result-mosaic">${t('artistes.noResult')}</div>`;
  }
  return artistes.map((a, i) => renderMosaicTile(a, tileSizeForIndex(i))).join('');
}
