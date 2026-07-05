/**
 * Rise Music Mag — Page Galerie photo
 * ----------------------------------------------------------------
 * Pas de fichier de données dédié pour l'instant : la galerie agrège
 * les visuels déjà disponibles (photos artistes, ou à défaut leurs
 * thumbnails YouTube) en grille. Quand une vraie collection de photos
 * de concerts/événements existera, on pourra créer data/galerie.json
 * et basculer cette page dessus sans changer la structure HTML.
 */

import { dataStore } from './data-store.js';
import { esc } from './render-cards.js';
import { applySeo } from './seo.js';
import { t } from './i18n.js';

export function renderGaleriePage() {
  const artistes = dataStore.getArtistes();
  const photos = artistes
    .map(a => ({
      src: a.photo || (a.youtube ? `https://i.ytimg.com/vi/${a.youtube}/hqdefault.jpg` : null),
      alt: a.photoAlt || a.nom,
      artisteId: a.id,
      nom: a.nom
    }))
    .filter(p => p.src);

  applySeo({
    title: t('galerie.metaTitle'),
    description: t('galerie.metaDesc'),
    type: 'website',
    canonicalPath: '/galerie'
  });

  return `
    <div class="interview-hero">
      <span class="kick"><span class="kick-dot"></span>${t('brand.name')}</span>
      <h1 class="interview-name display-xl">${t('nav.galerie').toUpperCase()}</h1>
      <p class="interview-meta">${photos.length} ${photos.length === 1 ? t('galerie.visuelSingle') : t('galerie.visuelPlural')}</p>
    </div>

    <div class="wrap" style="padding-top:32px;padding-bottom:60px">
      <div class="mosaic" style="grid-auto-rows:200px">
        ${photos.length ? photos.map(renderGalleryTile).join('') : `<p class="no-result-mosaic">${t('galerie.noResult')}</p>`}
      </div>
    </div>
  `;
}

function renderGalleryTile(photo) {
  return `
    <div class="mtile small reveal" data-route="/artiste/${esc(photo.artisteId)}" tabindex="0" role="link" aria-label="${esc(photo.nom)}">
      <img src="${esc(photo.src)}" alt="${esc(photo.alt)}" loading="lazy">
      <div class="mtile-overlay">
        <h4 style="font-size:1rem">${esc(photo.nom)}</h4>
      </div>
    </div>`;
}
