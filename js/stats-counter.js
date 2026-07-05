/**
 * Rise Music Mag — Animation de comptage des statistiques
 * ----------------------------------------------------------------
 * Anime les nombres de 0 jusqu'à leur valeur cible (data-target) quand
 * le bloc stats devient visible au scroll. Découplé du HTML : lit
 * simplement tous les éléments .stat-num présents dans le DOM.
 */

/**
 * @param {HTMLElement|Document} [root=document]
 * @param {number} [duration=1200] - durée totale de l'animation en ms
 */
export function animateStats(root = document, duration = 1200) {
  const els = root.querySelectorAll('.stat-num[data-target]');
  els.forEach((el) => {
    const target = parseInt(el.dataset.target, 10) || 0;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min(1, (now - start) / duration);
      // easeOutCubic pour un ralentissement naturel en fin de comptage
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased);
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = target;
      }
    }
    requestAnimationFrame(tick);
  });
}
