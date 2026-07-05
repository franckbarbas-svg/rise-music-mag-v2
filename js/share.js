/**
 * Rise Music Mag — Partage social
 * ----------------------------------------------------------------
 * Construit l'URL canonique d'une entité (artiste/interview/article)
 * et utilise l'API Web Share native si disponible (mobile), avec
 * fallback copie-presse-papier + toast partout ailleurs.
 */

import { BASE_PATH } from './data-store.js';
import { showToast } from './toast.js';

const ROUTE_PREFIX = {
  artiste: '/artiste/',
  interview: '/interview/',
  article: '/article/',
  album: '/album/'
};

/**
 * @param {string} id
 * @param {'artiste'|'interview'|'article'|'album'} type
 * @param {string} [title] - titre à inclure dans le partage natif
 */
export async function shareEntity(id, type, title = '') {
  const prefix = ROUTE_PREFIX[type] || '/';
  const url = `${window.location.origin}${BASE_PATH}${prefix}${id}`;

  if (navigator.share) {
    try {
      await navigator.share({ title, url });
      return;
    } catch (err) {
      // L'utilisateur a annulé le partage natif : pas une erreur à signaler.
      if (err && err.name === 'AbortError') return;
      // Sinon on retombe sur le presse-papier ci-dessous.
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    showToast('Lien copié dans le presse-papier');
  } catch {
    showToast('Impossible de copier le lien', 'error');
  }
}

/**
 * Délégation d'événement globale : à appeler une seule fois au démarrage.
 * Écoute les clics sur tout élément [data-share] présent dans la page,
 * y compris ceux ajoutés dynamiquement après coup par le routeur.
 * @param {HTMLElement} [root=document]
 */
export function initShareDelegation(root = document) {
  root.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-share]');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    const id = btn.dataset.share;
    const type = btn.dataset.shareType || 'artiste';
    shareEntity(id, type);
  });
}
