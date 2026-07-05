/**
 * Rise Music Mag — Page détail Article
 * ----------------------------------------------------------------
 * Mise en page éditoriale standard. Affiche aussi les artistes liés
 * (via artistesIds) et 3 suggestions d'articles dans la même catégorie.
 *
 * i18n : interface traduite via t(). Le corps de l'article (chapo,
 * contenu) reste en français — voir note de portée dans
 * render-artiste-detail.js.
 */

import { dataStore } from './data-store.js';
import { esc, renderArticleCard } from './render-cards.js';
import { applySeo, buildBreadcrumbJsonLd } from './seo.js';
import { t, getLocale, tf } from './i18n.js';

export function renderArticleDetail(id) {
  const article = dataStore.getArticleById(id);

  if (!article) {
    return { html: renderArticleNotFound(), notFound: true };
  }

  const categories = dataStore.getArticleCategories();
  const cat = categories.find(c => c.id === article.categorie);
  const dateFormatted = article.datePublication
    ? new Date(article.datePublication).toLocaleDateString(getLocale() === 'en' ? 'en-GB' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  const artistesLies = (article.artistesIds || [])
    .map(id => dataStore.getArtisteById(id))
    .filter(Boolean);

  const suggestions = dataStore.getArticles()
    .filter(a => a.id !== article.id && a.categorie === article.categorie)
    .slice(0, 3);

  const exempleBadge = article.statut === 'exemple'
    ? `<span class="tag soon" style="margin-left:6px">${t('article.exempleBadge')}</span>` : '';

  const html = `
    <header class="article-header">
      ${article.image ? `<img src="${esc(article.image)}" alt="${esc(article.imageAlt || tf(article, 'titre'))}">` : ''}
      <div class="overlay">
        ${cat ? `<span class="tag city">${esc(cat.label)}</span>${exempleBadge}` : ''}
        <h1 class="display-xl" style="font-size:clamp(2.2rem,7vw,5.5rem)">${esc(tf(article, 'titre'))}</h1>
      </div>
    </header>

    <div class="article-meta-panel">
      <div class="article-meta-row">
        <div><span>${t('detail.par')}</span><span>${esc(article.auteur || 'Rise Music Mag')}</span></div>
        <div><span>${t('detail.publieLe')}</span><span>${esc(dateFormatted)}</span></div>
        <div><span>${t('detail.lecture')}</span><span>${esc(article.tempsLecture || 3)} min</span></div>
      </div>
    </div>

    <div class="wrap" style="max-width:760px;padding-top:32px">
      <p class="editorial-text" style="font-size:1.2rem;margin-bottom:24px">${esc(tf(article, 'chapo'))}</p>
      <div style="color:var(--txt2);line-height:1.8">${tf(article, 'contenu') || ''}</div>

      ${(article.tags || []).length ? `
      <div style="margin-top:28px;padding-top:20px;border-top:1px solid var(--line)">
        ${article.tags.map(tag => `<span class="tag city">#${esc(tag)}</span>`).join('')}
      </div>` : ''}

      <div class="share-row">
        <span>${t('common.partager')}</span>
        <button class="share-btn" data-share="${esc(article.id)}" data-share-type="article" aria-label="${t('detail.copierLien')}">
          <svg viewBox="0 0 24 24"><path d="M18 8a3 3 0 1 0-2.83-4H15a3 3 0 0 0 .14 2.05L8.91 9.81a3 3 0 1 0 0 4.38l6.23 3.76A3 3 0 1 0 18 16a3 3 0 0 0-2.05.81L9.72 13a3 3 0 0 0 0-2L15.95 7.2A3 3 0 0 0 18 8z"/></svg>
        </button>
      </div>

      <a class="btn line btn-back" data-route="/actualites">${t('article.retourToutes')}</a>
    </div>

    ${artistesLies.length ? `
    <div class="wrap related">
      <h3>${artistesLies.length > 1 ? t('article.mentionnePlusieurs') : t('article.mentionneUn')}</h3>
      <div class="related-grid">
        ${artistesLies.map(a => `
          <div class="related-card" data-route="/artiste/${esc(a.id)}" tabindex="0" role="link" aria-label="${esc(a.nom)}">
            ${a.photo ? `<img src="${esc(a.photo)}" alt="${esc(a.nom)}" loading="lazy">` : ''}
            <div class="rc-info"><h4>${esc(a.nom)}</h4><span>${esc(dataStore.getGenreLabel(a.genre))}</span></div>
          </div>`).join('')}
      </div>
    </div>` : ''}

    ${suggestions.length ? `
    <div class="wrap related">
      <h3>${t('article.aLireAussi')}</h3>
      <div class="track" style="overflow-x:visible;flex-wrap:wrap">
        ${suggestions.map(renderArticleCard).join('')}
      </div>
    </div>` : ''}
  `;

  applySeo({
    title: article.seo?.titre || `${tf(article, 'titre')} | Rise Music Mag`,
    description: article.seo?.description || tf(article, 'chapo'),
    image: article.image,
    type: 'article',
    canonicalPath: `/article/${article.id}`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        headline: tf(article, 'titre'),
        datePublished: article.datePublication || undefined,
        author: { '@type': 'Organization', name: article.auteur || 'Rise Music Mag' },
        publisher: { '@type': 'Organization', name: 'Rise Music Mag' },
        image: article.image || undefined
      },
      buildBreadcrumbJsonLd([
        { name: t('breadcrumb.accueil'), path: '/' },
        { name: t('nav.articles'), path: '/actualites' },
        { name: tf(article, 'titre'), path: `/article/${article.id}` }
      ])
    ]
  });

  return { html, notFound: false };
}

function renderArticleNotFound() {
  return `
    <div class="wrap" style="padding:140px 20px 80px;text-align:center">
      <h1 class="display-lg">${t('article.notFoundTitle')}</h1>
      <p class="editorial-text" style="margin:16px 0 24px">${t('article.notFoundText')}</p>
      <a class="btn gold" data-route="/actualites">${t('article.voirToutes')}</a>
    </div>`;
}
