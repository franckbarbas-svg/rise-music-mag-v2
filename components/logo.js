/**
 * Rise Music Mag — Composant Logo
 * ----------------------------------------------------------------
 * Le logo est désormais l'artwork fourni (monogramme R doré avec
 * barres d'égaliseur intégrées, voir images/logo/logo-symbol.png).
 * Servi via <picture> avec une source WebP (30 Ko, -90% vs le PNG
 * d'origine à 289 Ko) et fallback PNG pour les rares navigateurs sans
 * support WebP. Pas de SVG inline : aucun défs/gradient à namespacer,
 * donc aucun risque de conflit d'ID même si le logo apparaît plusieurs
 * fois sur une page (nav + footer + menu mobile).
 *
 * Usage :
 *   import { renderLogo, renderLogoLink } from './components/logo.js';
 *   nav.innerHTML = renderLogoLink({ basePath: BASE_PATH });
 */

/**
 * @param {object} [opts]
 * @param {boolean} [opts.withText=true] - afficher "RISE / Music Mag" à côté du symbole
 * @param {string} [opts.basePath=''] - BASE_PATH courant, pour construire le chemin de l'image
 */
export function renderLogo({ withText = true, basePath = '' } = {}) {
  const symbol = `<picture>
      <source srcset="${basePath}/images/logo/logo-symbol.webp" type="image/webp">
      <img class="logo-symbol" src="${basePath}/images/logo/logo-symbol.png" alt="" width="36" height="33" loading="eager">
    </picture>`;

  if (!withText) return symbol;

  return `${symbol}
    <div class="logo-text">
      <span class="logo-rise">RISE</span>
      <span class="logo-bar"></span>
      <span class="logo-sub">Music Mag</span>
    </div>`;
}

/**
 * Variante prête à l'emploi : le lien complet vers l'accueil avec le logo dedans.
 * @param {object} [opts]
 * @param {string} [opts.basePath] - BASE_PATH courant, pour construire un href correct
 */
export function renderLogoLink({ basePath = '' } = {}) {
  const href = basePath ? `${basePath}/` : '/';
  return `<a class="logo" href="${href}" data-route="/" aria-label="Retour à l'accueil Rise Music Mag">${renderLogo({ withText: true, basePath })}</a>`;
}
