/**
 * Rise Music Mag — Page détail Artiste
 * ----------------------------------------------------------------
 * Génère la fiche complète d'un artiste : photo/clip, bio, parcours,
 * réseaux sociaux, et ses interviews/articles/albums liés (calculés
 * automatiquement depuis les autres fichiers JSON, pas seulement
 * depuis les tableaux *Ids de l'artiste — au cas où une interview
 * référence l'artiste sans que l'inverse ait été renseigné).
 *
 * i18n : l'interface (labels, boutons, badges) est traduite via t().
 * Le contenu éditorial (nom, bio, parcours) reste en français : les
 * données de artistes.json n'ont pas encore de champs traduits — voir
 * le README d'étape pour la portée assumée de cette itération.
 */

import { dataStore } from './data-store.js';
import { esc, renderRelatedCard, renderArticleCard } from './render-cards.js';
import { applySeo, buildBreadcrumbJsonLd } from './seo.js';
import { t, tf } from './i18n.js';

const RESEAUX_LABELS = {
  spotify: 'Spotify',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  facebook: 'Facebook',
  siteWeb: 'Site officiel'
};

export function renderArtisteDetail(id) {
  const artiste = dataStore.getArtisteById(id);

  if (!artiste) {
    return { html: renderArtisteNotFound(), notFound: true };
  }

  const genreLabel = dataStore.getGenreLabel(artiste.genre);
  const heroImg = artiste.photo || (artiste.youtube ? `https://i.ytimg.com/vi/${esc(artiste.youtube)}/maxresdefault.jpg` : null);

  const allInterviews = dataStore.getInterviews();
  const linkedInterviews = allInterviews.filter(i =>
    i.artisteId === artiste.id || (artiste.interviewsIds || []).includes(i.id)
  );

  const linkedArticles = dataStore.getArticles().filter(a =>
    (artiste.articlesIds || []).includes(a.id) || (a.artistesIds || []).includes(artiste.id)
  );

  const linkedAlbums = dataStore.getAlbumsByArtisteId(artiste.id);

  const clipBlock = artiste.youtube
    ? `<div class="clip-embed">
         <iframe src="https://www.youtube-nocookie.com/embed/${esc(artiste.youtube)}" title="Clip de ${esc(artiste.nom)}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
       </div>
       <a class="clip-fallback-link" href="https://www.youtube.com/watch?v=${esc(artiste.youtube)}" target="_blank" rel="noopener">${t('detail.videoFallback')}</a>`
    : `<div class="clip-soon"><span>${t('detail.clipAVenir')}</span></div>`;

  const reseauxBlock = renderReseauxLinks(artiste.reseaux);

  const interviewsBlock = linkedInterviews.length ? `
    <div class="related">
      <h3>${t('artiste.interviewsTitle')}</h3>
      <div class="related-grid">
        ${linkedInterviews.map(renderRelatedCard).join('')}
      </div>
    </div>` : '';

  const articlesBlock = linkedArticles.length ? `
    <div class="related">
      <h3>${t('artiste.articlesLies')}</h3>
      <div class="track" style="overflow-x:visible;flex-wrap:wrap">
        ${linkedArticles.map(renderArticleCard).join('')}
      </div>
    </div>` : '';

  const albumsBlock = linkedAlbums.length ? `
    <div class="related">
      <h3>${t('artiste.discographie')}</h3>
      <div class="related-grid">
        ${linkedAlbums.map(renderAlbumMiniCard).join('')}
      </div>
    </div>` : '';

  const html = `
    <header class="article-header">
      ${heroImg ? `<img src="${esc(heroImg)}" alt="${esc(artiste.photoAlt || artiste.nom)}">` : ''}
      <div class="overlay">
        <span class="tag ${esc(artiste.genre)}">${esc(genreLabel)}</span>
        <h1 class="display-xl">${esc(artiste.nom)}</h1>
      </div>
    </header>

    <div class="article-meta-panel">
      <div class="article-meta-row">
        <div><span>${t('common.ville')}</span><span>${esc(artiste.ville || '—')}</span></div>
        <div><span>${t('common.univers')}</span><span>${esc(genreLabel)}</span></div>
        ${artiste.meta ? `<div><span>${t('artiste.actualite')}</span><span>${esc(tf(artiste, 'meta'))}</span></div>` : ''}
      </div>
    </div>

    <div class="article-body">
      <div class="article-media">
        ${clipBlock}
        ${reseauxBlock}
        <div class="share-row">
          <span>${t('common.partager')}</span>
          <button class="share-btn" data-share="${esc(artiste.id)}" data-share-type="artiste" aria-label="${t('detail.copierLien')}">
            <svg viewBox="0 0 24 24"><path d="M18 8a3 3 0 1 0-2.83-4H15a3 3 0 0 0 .14 2.05L8.91 9.81a3 3 0 1 0 0 4.38l6.23 3.76A3 3 0 1 0 18 16a3 3 0 0 0-2.05.81L9.72 13a3 3 0 0 0 0-2L15.95 7.2A3 3 0 0 0 18 8z"/></svg>
          </button>
        </div>
      </div>
      <div class="article-main">
        ${artiste.description ? `<h3>${t('artiste.presentation')}</h3><p>${esc(tf(artiste, 'description'))}</p>` : ''}
        ${artiste.parcours ? `<h3>${t('artiste.parcours')}</h3><p>${esc(tf(artiste, 'parcours'))}</p>` : ''}
        <a class="btn line btn-back" data-route="/artistes">${t('artiste.retourTous')}</a>
      </div>
    </div>

    <div class="wrap">
      ${albumsBlock}
      ${interviewsBlock}
      ${articlesBlock}
    </div>
  `;

  applySeo({
    title: artiste.seo?.titre || `${artiste.nom} — ${genreLabel} | Rise Music Mag`,
    description: artiste.seo?.description || tf(artiste, 'description') || `Découvrez ${artiste.nom} sur Rise Music Mag.`,
    image: heroImg,
    type: 'article',
    canonicalPath: `/artiste/${artiste.id}`,
    jsonLd: [
      buildArtisteJsonLd(artiste, genreLabel),
      buildBreadcrumbJsonLd([
        { name: t('breadcrumb.accueil'), path: '/' },
        { name: t('nav.artistes'), path: '/artistes' },
        { name: artiste.nom, path: `/artiste/${artiste.id}` }
      ])
    ]
  });

  return { html, notFound: false };
}

function renderReseauxLinks(reseaux) {
  if (!reseaux) return '';
  const links = Object.entries(reseaux)
    .filter(([, url]) => !!url)
    .map(([key, url]) => `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(RESEAUX_LABELS[key] || key)}</a>`);

  if (!links.length) {
    return `<div class="streaming-links"><span class="soon">${t('detail.reseauxAVenir')}</span></div>`;
  }
  return `<div class="streaming-links">${links.join('')}</div>`;
}

function renderAlbumMiniCard(album) {
  return `
    <div class="related-card" data-route="/album/${esc(album.id)}" tabindex="0" role="link" aria-label="${esc(album.titre)}">
      ${album.cover ? `<img src="${esc(album.cover)}" alt="${esc(album.titre)}" loading="lazy">` : ''}
      <div class="rc-info">
        <h4>${esc(album.titre)}</h4>
        <span>${esc(album.annee || '')}</span>
      </div>
    </div>`;
}

function renderArtisteNotFound() {
  return `
    <div class="wrap" style="padding:140px 20px 80px;text-align:center">
      <h1 class="display-lg">${t('artiste.notFoundTitle')}</h1>
      <p class="editorial-text" style="margin:16px 0 24px">${t('artiste.notFoundText')}</p>
      <a class="btn gold" data-route="/artistes">${t('common.voirTous')}</a>
    </div>`;
}

function buildArtisteJsonLd(artiste, genreLabel) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MusicGroup',
    name: artiste.nom,
    genre: genreLabel,
    image: artiste.photo || undefined,
    description: artiste.description || undefined,
    foundingLocation: artiste.ville || undefined,
    sameAs: artiste.reseaux ? Object.values(artiste.reseaux).filter(Boolean) : undefined
  };
}
