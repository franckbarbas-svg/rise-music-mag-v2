/**
 * Rise Music Mag — Rendu des cartes
 * ----------------------------------------------------------------
 * Fonctions pures qui transforment une entrée de données (artiste,
 * interview...) en markup HTML de carte. Aucune de ces fonctions ne
 * touche le DOM directement : elles retournent une chaîne, à insérer
 * par l'appelant (innerHTML) puis observer via scroll-reveal.js.
 *
 * C'est ce découplage qui permet au système d'être "data-driven" :
 * ajouter une entrée dans interviews.json suffit à faire apparaître
 * une nouvelle carte, sans toucher au HTML ni au JS de rendu.
 *
 * i18n : ces cartes affichent des données FR (pas encore de contenu
 * traduit — voir note de portée dans le README d'étape). Seuls les
 * libellés d'interface autour (boutons, badges, textes fixes) passent
 * par t() pour s'afficher dans la langue active.
 */

import { dataStore } from './data-store.js';
import { t, getLocale, tf } from './i18n.js';

/** Échappe le HTML pour éviter toute injection depuis les données JSON. */
export function esc(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** URL de thumbnail YouTube à partir d'un ID vidéo (ou placeholder si absent). */
function thumbUrl(youtubeId, photo) {
  if (photo) return photo;
  if (youtubeId) return `https://i.ytimg.com/vi/${esc(youtubeId)}/hqdefault.jpg`;
  return null;
}

/** Locale à utiliser pour Date.toLocaleDateString() selon la langue active. */
function dateLocale() {
  return getLocale() === 'en' ? 'en-GB' : 'fr-FR';
}

/**
 * Carte artiste standard (utilisée dans le carrousel home + la grille talents).
 * @param {object} artiste - entrée de artistes.json
 * @returns {string} markup HTML
 */
export function renderTalentCard(artiste) {
  const thumb = thumbUrl(artiste.youtube, artiste.photo);
  const genreLabel = dataStore.getGenreLabel(artiste.genre);

  return `
    <article class="card talent reveal" data-route="/artiste/${esc(artiste.id)}" tabindex="0" role="link" aria-label="${t('common.decouvrir')} ${esc(artiste.nom)}">
      <div class="thumb" data-route="/artiste/${esc(artiste.id)}">
        ${thumb
          ? `<img src="${esc(thumb)}" alt="${esc(artiste.photoAlt || artiste.nom)}" loading="lazy">`
          : `<div class="clip-soon"><span>${t('common.visuelAVenir')}</span></div>`
        }
        ${artiste.youtube ? `<div class="play"><i aria-hidden="true">▶</i></div>` : ''}
      </div>
      <div class="info">
        <div class="info-top">
          <span class="tag ${esc(artiste.genre)}">${esc(genreLabel)}</span>
          <span class="tag city">${esc(artiste.ville)}</span>
        </div>
        <div class="info-row">
          <h3 data-route="/artiste/${esc(artiste.id)}">${esc(artiste.nom)}</h3>
          <button class="card-share-btn" data-share="${esc(artiste.id)}" data-share-type="artiste" aria-label="${t('common.partager')} ${esc(artiste.nom)}">
            <svg viewBox="0 0 24 24"><path d="M18 8a3 3 0 1 0-2.83-4H15a3 3 0 0 0 .14 2.05L8.91 9.81a3 3 0 1 0 0 4.38l6.23 3.76A3 3 0 1 0 18 16a3 3 0 0 0-2.05.81L9.72 13a3 3 0 0 0 0-2L15.95 7.2A3 3 0 0 0 18 8z"/></svg>
          </button>
        </div>
      </div>
      <span class="card-hint">${t('common.lireArticle')}</span>
    </article>`;
}

/**
 * Tuile de mosaïque (grille asymétrique de la page Artistes).
 * @param {object} artiste
 * @param {'large'|'medium'|'small'} size
 */
export function renderMosaicTile(artiste, size = 'small') {
  const thumb = thumbUrl(artiste.youtube, artiste.photo);
  return `
    <div class="mtile ${size} reveal" data-route="/artiste/${esc(artiste.id)}" tabindex="0" role="link" aria-label="${esc(artiste.nom)}">
      <span class="mtile-genre" style="background:${dataStore.getGenreColorVar(artiste.genre)}"></span>
      <button class="mtile-share" data-share="${esc(artiste.id)}" data-share-type="artiste" aria-label="${t('common.partager')} ${esc(artiste.nom)}">
        <svg viewBox="0 0 24 24"><path d="M18 8a3 3 0 1 0-2.83-4H15a3 3 0 0 0 .14 2.05L8.91 9.81a3 3 0 1 0 0 4.38l6.23 3.76A3 3 0 1 0 18 16a3 3 0 0 0-2.05.81L9.72 13a3 3 0 0 0 0-2L15.95 7.2A3 3 0 0 0 18 8z"/></svg>
      </button>
      ${thumb ? `<img src="${esc(thumb)}" alt="${esc(artiste.photoAlt || artiste.nom)}" loading="lazy">` : ''}
      <div class="mtile-overlay">
        <h4>${esc(artiste.nom)}</h4>
        <span class="mtile-city">${esc(artiste.ville)}</span>
      </div>
    </div>`;
}

/**
 * Carte interview (liste interviews + suggestions "autres interviews").
 * @param {object} interview - entrée de interviews.json
 */
export function renderInterviewCard(interview) {
  const thumb = thumbUrl(interview.youtube, interview.photo);
  return `
    <article class="interview-card reveal" data-route="/interview/${esc(interview.id)}" tabindex="0" role="link" aria-label="Interview ${esc(interview.nom)}">
      <div class="interview-card-media">
        ${thumb ? `<img src="${esc(thumb)}" alt="${esc(interview.photoAlt || interview.nom)}" loading="lazy">` : ''}
      </div>
      <div class="interview-card-info">
        <h4>${esc(interview.nom)}</h4>
        <span>${esc(tf(interview, 'meta'))}</span>
      </div>
    </article>`;
}

/**
 * Petite carte "related" (suggestion compacte sous une interview/article).
 * @param {object} interview
 */
export function renderRelatedCard(interview) {
  const thumb = thumbUrl(interview.youtube, interview.photo);
  return `
    <div class="related-card" data-route="/interview/${esc(interview.id)}" tabindex="0" role="link" aria-label="${esc(interview.nom)}">
      ${thumb ? `<img src="${esc(thumb)}" alt="${esc(interview.nom)}" loading="lazy">` : ''}
      <div class="rc-info">
        <h4>${esc(interview.nom)}</h4>
        <span>${esc(dataStore.getGenreLabel(interview.genre))}</span>
      </div>
    </div>`;
}

/**
 * Carte article de magazine (grille actualités).
 * @param {object} article - entrée de articles.json
 */
export function renderArticleCard(article) {
  const categories = dataStore.getArticleCategories();
  const cat = categories.find(c => c.id === article.categorie);
  const dateFormatted = article.datePublication
    ? new Date(article.datePublication).toLocaleDateString(dateLocale(), { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  return `
    <article class="card reveal" data-route="/article/${esc(article.id)}" tabindex="0" role="link" aria-label="${esc(tf(article, 'titre'))}">
      <div class="thumb" data-route="/article/${esc(article.id)}">
        ${article.image
          ? `<img src="${esc(article.image)}" alt="${esc(article.imageAlt || tf(article, 'titre'))}" loading="lazy">`
          : `<div class="clip-soon"><span>${t('common.visuelAVenir')}</span></div>`
        }
      </div>
      <div class="info">
        <div class="info-top">
          ${cat ? `<span class="tag city">${esc(cat.label)}</span>` : ''}
        </div>
        <div class="info-row">
          <h3 data-route="/article/${esc(article.id)}">${esc(tf(article, 'titre'))}</h3>
        </div>
        <p style="color:var(--txt2);font-size:.82rem;margin-top:6px">${esc(tf(article, 'chapo'))}</p>
        <div style="display:flex;justify-content:space-between;margin-top:10px;color:var(--muted);font-size:.7rem">
          <span>${esc(dateFormatted)}</span>
          <span>${esc(article.tempsLecture)} ${t('common.minLecture')}</span>
        </div>
      </div>
    </article>`;
}

/**
 * Carte genre (les 5 univers édito de la home).
 * @param {object} genre - entrée de site.json -> genres[]
 * @param {string} icon - emoji ou symbole décoratif
 * @param {string} description
 */
export function renderGenreCard(genre, icon, description) {
  return `
    <div class="genre-card reveal" data-genre="${esc(genre.id)}" data-filter-genre="${esc(genre.id)}" role="link" tabindex="0" aria-label="${t('common.explorer')} ${esc(genre.label)}">
      <div class="genre-icon" aria-hidden="true">${icon}</div>
      <h3>${esc(genre.label)}</h3>
      <p>${esc(description)}</p>
      <span class="tag ${esc(genre.id)}" style="margin-top:8px">${t('common.explorer')} →</span>
    </div>`;
}
