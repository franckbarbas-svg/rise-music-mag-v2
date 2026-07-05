/**
 * Rise Music Mag — Page Concerts (Agenda)
 * ----------------------------------------------------------------
 * Liste chronologique des événements à venir (les passés sont masqués
 * par défaut, cf. dataStore.getEvents()). Affiche ville, salle,
 * billetterie. Pas de mosaïque ici : une liste type "agenda presse"
 * est plus lisible pour ce type de contenu très factuel.
 */

import { dataStore } from './data-store.js';
import { esc } from './render-cards.js';
import { applySeo } from './seo.js';
import { t, getLocale } from './i18n.js';

export function renderConcertsPage() {
  const events = dataStore.getEvents();

  applySeo({
    title: t('concerts.metaTitle'),
    description: t('concerts.metaDesc'),
    type: 'website',
    canonicalPath: '/concerts'
  });

  return `
    <div class="interview-hero">
      <span class="kick"><span class="kick-dot"></span>${t('brand.name')}</span>
      <h1 class="interview-name display-xl">${t('nav.concerts').toUpperCase()}</h1>
      <p class="interview-meta">${events.length} ${events.length === 1 ? t('concerts.dateSingle') : t('concerts.datePlural')}</p>
    </div>

    <div class="wrap" style="padding-top:40px;padding-bottom:60px">
      ${events.length ? events.map(renderEventRow).join('') : `<p class="no-result">${t('concerts.noResult')}</p>`}
    </div>
  `;
}

function renderEventRow(event) {
  const locale = getLocale() === 'en' ? 'en-GB' : 'fr-FR';
  const date = event.date ? new Date(event.date) : null;
  const jour = date ? date.toLocaleDateString(locale, { day: '2-digit' }) : '—';
  const mois = date ? date.toLocaleDateString(locale, { month: 'short' }).toUpperCase().replace('.', '') : '';
  const heure = date ? date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) : '';
  const exempleBadge = event.statut === 'exemple'
    ? `<span class="tag soon">${t('concerts.exempleBadge')}</span>` : '';

  return `
    <div class="val reveal" style="display:grid;grid-template-columns:64px 1fr auto;gap:16px;align-items:center;margin-bottom:10px">
      <div style="text-align:center;line-height:1.1">
        <div style="font-family:var(--font-display);font-weight:900;font-size:1.6rem;color:var(--gold)">${jour}</div>
        <div style="font-size:.62rem;letter-spacing:.08em;color:var(--txt2);text-transform:uppercase">${mois}</div>
      </div>
      <div>
        <b style="font-size:1rem">${esc(event.artisteNom || event.titre)}</b>
        <span style="display:block;color:var(--txt2);font-size:.82rem">${esc(event.salle || '')}${event.salle && event.ville ? ', ' : ''}${esc(event.ville || '')}${heure ? ' · ' + heure : ''}</span>
        ${exempleBadge}
      </div>
      <div>
        ${event.billetterie
          ? `<a href="${esc(event.billetterie)}" target="_blank" rel="noopener" class="btn line" style="padding:8px 16px;font-size:.68rem">${t('concerts.billets')}</a>`
          : `<span class="tag soon">${t('concerts.bientot')}</span>`
        }
      </div>
    </div>`;
}
