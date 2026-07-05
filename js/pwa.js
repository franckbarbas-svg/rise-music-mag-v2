/**
 * Rise Music Mag — Enregistrement PWA
 * ----------------------------------------------------------------
 * Enregistre sw.js et gère la notification de mise à jour : quand une
 * nouvelle version du service worker est détectée, on affiche une
 * bannière discrète (pas un rechargement forcé — voir la doc du projet)
 * avec un bouton explicite. Rien ne se passe tant que la personne n'a
 * pas cliqué.
 */

import { t } from './i18n.js';

let waitingWorker = null;

function showUpdateBanner() {
  if (document.getElementById('pwa-update-banner')) return; // déjà affichée

  const banner = document.createElement('div');
  banner.id = 'pwa-update-banner';
  banner.className = 'update-banner';
  banner.setAttribute('role', 'status');
  banner.innerHTML = `
    <span>${t('pwa.updateAvailable')}</span>
    <button type="button" class="update-banner-btn">${t('pwa.updateAction')}</button>
  `;
  document.body.appendChild(banner);
  requestAnimationFrame(() => banner.classList.add('show'));

  banner.querySelector('.update-banner-btn').addEventListener('click', () => {
    if (!waitingWorker) return;
    // Le nouveau service worker prend le contrôle une fois activé
    // (voir 'controllerchange' ci-dessous), ce qui déclenche le reload.
    waitingWorker.postMessage('SKIP_WAITING');
    banner.classList.remove('show');
  });
}

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');

      // Un service worker est peut-être déjà en attente (ex: onglet resté
      // ouvert pendant un déploiement) : proposer la mise à jour tout de suite.
      if (registration.waiting) {
        waitingWorker = registration.waiting;
        showUpdateBanner();
      }

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          // 'installed' + un controller déjà actif = vraie mise à jour
          // (pas la toute première installation, où il n'y a rien à remplacer).
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            waitingWorker = newWorker;
            showUpdateBanner();
          }
        });
      });
    } catch (err) {
      console.warn('[pwa] échec de l\'enregistrement du service worker :', err);
    }
  });

  // Une fois que le nouveau service worker a pris le contrôle (suite au
  // clic sur "Mettre à jour"), recharger pour servir les nouveaux assets.
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}
