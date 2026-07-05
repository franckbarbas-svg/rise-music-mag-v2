/**
 * Rise Music Mag — Page liste Articles (Actualités)
 * ----------------------------------------------------------------
 * Vrai système de magazine : catégories, tags, recherche, pagination.
 * Tout le filtrage se fait côté client après le rendu initial (voir
 * js/app.js -> initArticlesPageBehavior), pour rester rapide et simple
 * sans backend de recherche.
 */

import { dataStore } from './data-store.js';
import { renderArticleCard, esc } from './render-cards.js';
import { applySeo } from './seo.js';
import { t } from './i18n.js';

const PER_PAGE = 9;

export function renderArticlesPage(query = {}) {
  const categories = dataStore.getArticleCategories();
  const total = dataStore.getArticles().length;

  applySeo({
    title: t('articles.metaTitle'),
    description: t('articles.metaDesc'),
    type: 'website',
    canonicalPath: '/actualites'
  });

  return `
    <div class="wrap page-top">
      <div class="talents-masthead">
        <div class="tm-top">
          <span class="tm-label">${t('brand.name')}</span>
          <span class="tm-count" id="articles-count">${total} ${t('articles.count')}</span>
        </div>
        <h2 class="display-xl">${t('nav.articles').toUpperCase()}</h2>
        <div class="tm-sub">
          <p class="editorial-text">${t('articles.subText')}</p>
        </div>
      </div>

      <div class="filters" id="article-filters" role="group" aria-label="${t('articles.filtreAria')}">
        <button data-cat-filter="all" class="active" aria-pressed="true">${t('articles.filtreToutes')}</button>
        ${categories.map(c => `<button data-cat-filter="${esc(c.id)}" aria-pressed="false">${esc(c.label)}</button>`).join('')}
      </div>

      <div class="search-box">
        <input type="search" id="articles-search" placeholder="${t('articles.searchPlaceholder')}" aria-label="${t('articles.searchAria')}">
      </div>
    </div>

    <div class="wrap">
      <div class="track" id="articles-grid" style="overflow-x:visible;flex-wrap:wrap" aria-live="polite">
        ${renderArticlesGrid(dataStore.getArticles(), 1)}
      </div>
      <div id="articles-pagination"></div>
    </div>
  `;
}

export function renderArticlesGrid(articles, page = 1) {
  if (!articles.length) {
    return `<p class="no-result" style="width:100%">${t('articles.noResult')}</p>`;
  }
  const { items } = dataStore.paginate(articles, page, PER_PAGE);
  return items.map(renderArticleCard).join('');
}

export function renderPagination(articles, page = 1) {
  const { totalPages, page: safePage } = dataStore.paginate(articles, page, PER_PAGE);
  if (totalPages <= 1) return '';

  let buttons = '';
  for (let p = 1; p <= totalPages; p++) {
    buttons += `<button class="icon-btn sm ${p === safePage ? 'active' : ''}" data-page="${p}" aria-current="${p === safePage}" aria-label="${t('articles.pageAria')} ${p}" style="width:auto;height:32px;padding:0 10px;border-radius:4px;${p === safePage ? 'border-color:var(--gold);color:var(--gold)' : ''}">${p}</button>`;
  }
  return `<div class="btns" style="margin-top:32px" role="navigation" aria-label="${t('articles.paginationAria')}">${buttons}</div>`;
}
