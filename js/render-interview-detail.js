/**
 * Rise Music Mag — Page détail Interview
 * ----------------------------------------------------------------
 * Modèle UNIQUE pour toutes les interviews (référence : fiche FRIEDA).
 * Ajouter une interview dans data/interviews.json suffit à faire
 * apparaître automatiquement : la page, ses métadonnées, la nav
 * précédent/suivant, et les suggestions "Autres interviews".
 *
 * i18n : interface traduite via t(), contenu éditorial (Q&A, bio) en
 * français uniquement — voir note de portée dans render-artiste-detail.js.
 */

import { dataStore } from './data-store.js';
import { esc, renderRelatedCard } from './render-cards.js';
import { applySeo, buildBreadcrumbJsonLd } from './seo.js';
import { t, tf } from './i18n.js';

export function renderInterviewDetail(id) {
  const interview = dataStore.getInterviewById(id);

  if (!interview) {
    return { html: renderInterviewNotFound(), notFound: true };
  }

  const artiste = interview.artisteId ? dataStore.getArtisteById(interview.artisteId) : null;
  const { prev, next } = dataStore.getInterviewNeighbors(id);
  const related = dataStore.getRelatedInterviews(id, 3);
  const genreLabel = dataStore.getGenreLabel(interview.genre);

  const heroImg = interview.photo || (interview.youtube ? `https://i.ytimg.com/vi/${esc(interview.youtube)}/maxresdefault.jpg` : null);

  const clipBlock = interview.youtube
    ? `<div class="clip-embed">
         <iframe src="https://www.youtube-nocookie.com/embed/${esc(interview.youtube)}" title="Clip de ${esc(interview.nom)}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
       </div>
       <a class="clip-fallback-link" href="https://www.youtube.com/watch?v=${esc(interview.youtube)}" target="_blank" rel="noopener">${t('detail.videoFallback')}</a>`
    : `<div class="clip-soon"><span>${t('detail.clipAVenir')}</span></div>`;

  const qnaBlock = (interview.qna || []).map((item, i) => `
    <div class="qna-item">
      <div class="qna-num">${String(i + 1).padStart(2, '0')}</div>
      <div>
        <b>${esc(tf(item, 'q'))}</b>
        <p>${esc(tf(item, 'r'))}</p>
      </div>
    </div>`).join('');

  const navBlock = `
    <div class="interview-nav">
      ${prev
        ? `<button class="interview-nav-btn" data-route="/interview/${esc(prev.id)}">← ${esc(prev.nom)}</button>`
        : `<span></span>`}
      ${next
        ? `<button class="interview-nav-btn" data-route="/interview/${esc(next.id)}">${esc(next.nom)} →</button>`
        : `<span></span>`}
    </div>`;

  const relatedBlock = related.length ? `
    <div class="related">
      <h3>${t('interview.autresInterviews')}</h3>
      <div class="related-grid">
        ${related.map(renderRelatedCard).join('')}
      </div>
    </div>` : '';

  const html = `
    <header class="article-header">
      ${heroImg ? `<img src="${esc(heroImg)}" alt="${esc(interview.photoAlt || interview.nom)}">` : ''}
      <div class="overlay">
        <span class="tag ${esc(interview.genre)}">${esc(genreLabel)}</span>
        <h1 class="display-xl">${esc(interview.nom)}</h1>
      </div>
    </header>

    <div class="article-meta-panel">
      <div class="article-meta-row">
        <div><span>${t('common.ville')}</span><span>${esc(interview.ville || '—')}</span></div>
        <div><span>${t('common.univers')}</span><span>${esc(genreLabel)}</span></div>
        <div><span>${t('detail.tempsLecture')}</span><span>${esc(interview.tempsLecture || 4)} min</span></div>
        ${interview.auteur ? `<div><span>${t('detail.par')}</span><span>${esc(interview.auteur)}</span></div>` : ''}
      </div>
    </div>

    ${interview.bio ? `
    <div class="interview-bio-panel">
      <p>${esc(tf(interview, 'bio'))}</p>
    </div>` : ''}

    <div class="article-body" style="display:block;max-width:1100px">
      <div class="article-media" style="position:static;border-bottom:none;padding-bottom:0;max-width:600px;margin:0 auto">
        ${clipBlock}
        <div class="share-row">
          <span>${t('common.partager')}</span>
          <button class="share-btn" data-share="${esc(interview.id)}" data-share-type="interview" aria-label="${t('detail.copierLien')}">
            <svg viewBox="0 0 24 24"><path d="M18 8a3 3 0 1 0-2.83-4H15a3 3 0 0 0 .14 2.05L8.91 9.81a3 3 0 1 0 0 4.38l6.23 3.76A3 3 0 1 0 18 16a3 3 0 0 0-2.05.81L9.72 13a3 3 0 0 0 0-2L15.95 7.2A3 3 0 0 0 18 8z"/></svg>
          </button>
        </div>
      </div>
    </div>

    <div class="qna-list">
      ${qnaBlock || `<p class="no-result">${t('interview.contenuAVenir')}</p>`}
    </div>

    ${navBlock}
    <div class="wrap">${relatedBlock}</div>

    ${artiste ? `
    <div class="wrap" style="text-align:center;padding-bottom:60px">
      <a class="btn line" data-route="/artiste/${esc(artiste.id)}">${t('interview.voirFicheArtiste')} ${esc(artiste.nom)} →</a>
    </div>` : ''}
  `;

  applySeo({
    title: interview.seo?.titre || `${interview.nom} — Interview | Rise Music Mag`,
    description: interview.seo?.description || tf(interview, 'bio') || `Interview de ${interview.nom} sur Rise Music Mag.`,
    image: heroImg,
    type: 'article',
    canonicalPath: `/interview/${interview.id}`,
    jsonLd: [
      buildInterviewJsonLd(interview, artiste),
      buildBreadcrumbJsonLd([
        { name: t('breadcrumb.accueil'), path: '/' },
        { name: t('nav.interviews'), path: '/interviews' },
        { name: interview.nom, path: `/interview/${interview.id}` }
      ])
    ]
  });

  return { html, notFound: false };
}

function renderInterviewNotFound() {
  return `
    <div class="wrap" style="padding:140px 20px 80px;text-align:center">
      <h1 class="display-lg">${t('interview.notFoundTitle')}</h1>
      <p class="editorial-text" style="margin:16px 0 24px">${t('interview.notFoundText')}</p>
      <a class="btn gold" data-route="/interviews">${t('interview.voirToutes')}</a>
    </div>`;
}

/** Construit le JSON-LD schema.org (NewsArticle + mentionne l'artiste en Person). */
function buildInterviewJsonLd(interview, artiste) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: `${interview.nom} — Interview`,
    datePublished: interview.datePublication || undefined,
    author: { '@type': 'Organization', name: interview.auteur || 'Rise Music Mag' },
    publisher: { '@type': 'Organization', name: 'Rise Music Mag' },
    image: interview.photo || undefined
  };
  if (artiste) {
    data.about = { '@type': 'MusicGroup', name: artiste.nom };
  }
  return data;
}
