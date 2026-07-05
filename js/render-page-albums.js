/**
 * Rise Music Mag — Page liste Albums
 * ----------------------------------------------------------------
 * Grille simple de toute la discographie suivie par le magazine,
 * triée du plus récent au plus ancien.
 */

import { dataStore } from './data-store.js';
import { esc } from './render-cards.js';
import { applySeo } from './seo.js';
import { t } from './i18n.js';

export function renderAlbumsPage() {
  const albums = [...dataStore.getAlbums()].sort((a, b) =>
    new Date(b.dateSortie || 0) - new Date(a.dateSortie || 0)
  );

  applySeo({
    title: t('albums.metaTitle'),
    description: t('albums.metaDesc'),
    type: 'website',
    canonicalPath: '/albums'
  });

  return `
    <div class="wrap page-top">
      <div class="talents-masthead">
        <div class="tm-top">
          <span class="tm-label">${t('brand.name')}</span>
          <span class="tm-count">${albums.length} ${t('albums.count')}</span>
        </div>
        <h2 class="display-xl">${t('nav.albums').toUpperCase()}</h2>
        <div class="tm-sub">
          <p class="editorial-text">${t('albums.subText')}</p>
        </div>
      </div>
    </div>

    <div class="wrap">
      <div class="related-grid">
        ${albums.length ? albums.map(renderAlbumCard).join('') : `<p class="no-result">${t('albums.noResult')}</p>`}
      </div>
    </div>
  `;
}

function renderAlbumCard(album) {
  return `
    <div class="related-card" data-route="/album/${esc(album.id)}" tabindex="0" role="link" aria-label="${esc(album.titre)} — ${esc(album.artisteNom)}">
      ${album.cover
        ? `<img src="${esc(album.cover)}" alt="${esc(album.coverAlt || album.titre)}" loading="lazy">`
        : `<div class="clip-soon" style="margin:0;aspect-ratio:16/9"><span>${t('albums.pochetteAVenir')}</span></div>`
      }
      <div class="rc-info">
        <h4>${esc(album.titre)}</h4>
        <span>${esc(album.artisteNom)} · ${esc(album.type)}${album.anneeSortie ? ' · ' + esc(album.anneeSortie) : ''}</span>
      </div>
    </div>`;
}
