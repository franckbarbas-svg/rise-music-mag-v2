/**
 * Rise Music Mag — Page détail Album
 * ----------------------------------------------------------------
 */

import { dataStore } from './data-store.js';
import { esc } from './render-cards.js';
import { applySeo, buildBreadcrumbJsonLd } from './seo.js';
import { t, getLocale } from './i18n.js';

export function renderAlbumDetail(id) {
  const album = dataStore.getAlbumById(id);
  if (!album) {
    return { html: renderAlbumNotFound(), notFound: true };
  }

  const artiste = album.artisteId ? dataStore.getArtisteById(album.artisteId) : null;
  const dateFormatted = album.dateSortie
    ? new Date(album.dateSortie).toLocaleDateString(getLocale() === 'en' ? 'en-GB' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : (album.anneeSortie || '—');

  const streamingBlock = (album.spotify || album.appleMusic)
    ? `<div class="streaming-links">
        ${album.spotify ? `<a href="${esc(album.spotify)}" target="_blank" rel="noopener">Spotify</a>` : ''}
        ${album.appleMusic ? `<a href="${esc(album.appleMusic)}" target="_blank" rel="noopener">Apple Music</a>` : ''}
      </div>`
    : `<div class="streaming-links"><span class="soon">${t('album.ecouteAVenir')}</span></div>`;

  const html = `
    <header class="article-header" style="aspect-ratio:1/1;max-width:700px;margin:90px auto 0">
      ${album.cover
        ? `<img src="${esc(album.cover)}" alt="${esc(album.coverAlt || album.titre)}">`
        : `<div class="clip-soon" style="margin:0;height:100%;aspect-ratio:unset"><span>${t('albums.pochetteAVenir')}</span></div>`
      }
    </header>

    <div class="wrap" style="max-width:700px;text-align:center;padding-top:24px">
      <span class="tag city">${esc(album.type)}</span>
      <h1 class="display-lg" style="font-size:clamp(2rem,6vw,3.5rem);margin:8px 0">${esc(album.titre)}</h1>
      ${artiste ? `<a class="btn line" data-route="/artiste/${esc(artiste.id)}" style="margin:8px 0">${esc(artiste.nom)}</a>` : `<p style="color:var(--txt2)">${esc(album.artisteNom)}</p>`}
      <p style="color:var(--muted);font-size:.85rem;margin-bottom:20px">${esc(dateFormatted)}</p>

      ${album.description ? `<p class="editorial-text" style="margin-bottom:20px">${esc(album.description)}</p>` : ''}

      ${streamingBlock}

      <div style="margin-top:32px">
        <a class="btn line" data-route="/albums">${t('album.retourTous')}</a>
      </div>
    </div>
  `;

  applySeo({
    title: `${album.titre} — ${album.artisteNom} | Rise Music Mag`,
    description: album.description || `${album.titre}, ${album.type.toLowerCase()} de ${album.artisteNom}.`,
    image: album.cover,
    type: 'article',
    canonicalPath: `/album/${album.id}`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'MusicAlbum',
        name: album.titre,
        byArtist: { '@type': 'MusicGroup', name: album.artisteNom },
        datePublished: album.dateSortie || undefined,
        image: album.cover || undefined
      },
      buildBreadcrumbJsonLd([
        { name: t('breadcrumb.accueil'), path: '/' },
        { name: t('nav.albums'), path: '/albums' },
        { name: album.titre, path: `/album/${album.id}` }
      ])
    ]
  });

  return { html, notFound: false };
}

function renderAlbumNotFound() {
  return `
    <div class="wrap" style="padding:140px 20px 80px;text-align:center">
      <h1 class="display-lg">${t('album.notFoundTitle')}</h1>
      <p class="editorial-text" style="margin:16px 0 24px">${t('album.notFoundText')}</p>
      <a class="btn gold" data-route="/albums">${t('album.voirTous')}</a>
    </div>`;
}
