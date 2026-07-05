/**
 * Rise Music Mag — Page liste Interviews
 * ----------------------------------------------------------------
 * Liste chronologique de toutes les interviews publiées. Chaque
 * nouvelle entrée ajoutée dans data/interviews.json apparaît ici
 * automatiquement, sans aucune autre intervention.
 */

import { dataStore } from './data-store.js';
import { renderInterviewCard } from './render-cards.js';
import { applySeo } from './seo.js';
import { t } from './i18n.js';

export function renderInterviewsPage() {
  const interviews = dataStore.getInterviews();

  applySeo({
    title: t('interviews.metaTitle'),
    description: t('interviews.metaDesc'),
    type: 'website',
    canonicalPath: '/interviews'
  });

  return `
    <div class="interview-hero">
      <span class="kick"><span class="kick-dot"></span>${t('brand.name')}</span>
      <h1 class="interview-name display-xl">${t('nav.interviews').toUpperCase()}</h1>
      <p class="interview-meta">${interviews.length} ${t('interviews.meta')}</p>
    </div>

    <div class="interview-list" aria-live="polite">
      ${interviews.length
        ? interviews.map(renderInterviewCard).join('')
        : `<p class="no-result">${t('interviews.noResult')}</p>`
      }
    </div>
  `;
}
