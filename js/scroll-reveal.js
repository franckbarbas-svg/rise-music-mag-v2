/**
 * Rise Music Mag — Scroll Reveal
 * ----------------------------------------------------------------
 * Observe les éléments .reveal / .reveal-zoom / .reveal-side et leur
 * ajoute .visible quand ils entrent dans le viewport (cf. css/animations.css).
 * Un seul observer partagé pour toute l'app plutôt qu'un par page.
 */

let observer = null;
let onStatsVisible = null;

function getObserver() {
  if (observer) return observer;
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        if (entry.target.querySelector('#stat-artists') && typeof onStatsVisible === 'function') {
          onStatsVisible();
        }
        observer.unobserve(entry.target);
      });
    },
    { threshold: .12 }
  );
  return observer;
}

/**
 * Observe tous les éléments .reveal* présents dans un conteneur donné
 * (par défaut : tout le document). À appeler après chaque rendu de page,
 * puisque le contenu est généré dynamiquement par le data-store.
 * @param {HTMLElement|Document} [root=document]
 */
export function observeReveals(root = document) {
  const obs = getObserver();
  root.querySelectorAll('.reveal, .reveal-zoom, .reveal-side').forEach((el) => {
    obs.observe(el);
  });
}

/**
 * Enregistre un callback déclenché la première fois que le bloc stats
 * (contenant #stat-artists) devient visible — utilisé pour lancer
 * l'animation de comptage des statistiques sur la home.
 * @param {() => void} callback
 */
export function onStatsReveal(callback) {
  onStatsVisible = callback;
}

/**
 * Force tous les .reveal d'un conteneur à apparaître immédiatement,
 * sans attendre le scroll (utile juste après un changement de page SPA,
 * pour le contenu déjà visible dans le viewport au chargement).
 * @param {HTMLElement|Document} root
 */
export function revealImmediately(root = document) {
  root.querySelectorAll('.reveal, .reveal-zoom, .reveal-side').forEach((el) => {
    el.classList.add('visible');
  });
}
