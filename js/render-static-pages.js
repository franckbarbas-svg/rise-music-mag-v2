/**
 * Rise Music Mag — Pages éditoriales statiques
 * ----------------------------------------------------------------
 * À propos, Partenariats, Contact, Mentions légales, Confidentialité.
 * Regroupées dans un seul module car structurellement simples (texte +
 * éventuellement un formulaire), contrairement aux pages data-driven
 * (artistes, interviews...) qui méritent chacune leur propre fichier.
 *
 * Contrat éditorial assumé ici : tout le texte légal/institutionnel
 * (mentions légales, confidentialité) reste générique et explicitement
 * marqué "à compléter" — je ne fabrique pas de fausses mentions légales
 * (SIRET, adresse, hébergeur...) qui engageraient la responsabilité de
 * Franck si elles étaient inexactes ou copiées d'un autre site.
 *
 * i18n : ces pages sont entièrement institutionnelles (pas de contenu
 * éditorial variable), donc entièrement traduites via t() — contrairement
 * aux pages data-driven où seule l'interface est traduite pour l'instant.
 */

import { dataStore } from './data-store.js';
import { applySeo } from './seo.js';
import { t } from './i18n.js';

// ---------------------------------------------------------------
// À propos
// ---------------------------------------------------------------

export function renderAboutPage() {
  const site = dataStore.getSiteConfig();

  applySeo({
    title: t('about.metaTitle'),
    description: site.identite?.description,
    type: 'website',
    canonicalPath: '/about'
  });

  return `
    <div class="about-hero">
      <span class="kick"><span class="kick-dot"></span>${t('about.kick')}</span>
      <h1 class="about-title display-xl">${t('about.title')}</h1>
    </div>

    <div class="about">
      <div class="main">
        <h3>${t('about.missionTitle')}</h3>
        <p>${esc2(site.identite?.description)}</p>
        <p>${t('about.missionText')}</p>
      </div>
      <div>
        <div class="values">
          <div class="val"><span class="val-icon">🎯</span><b>${t('about.val1Title')}</b><span>${t('about.val1Text')}</span></div>
          <div class="val"><span class="val-icon">🔍</span><b>${t('about.val2Title')}</b><span>${t('about.val2Text')}</span></div>
          <div class="val"><span class="val-icon">🌍</span><b>${t('about.val3Title')}</b><span>${t('about.val3Text')}</span></div>
        </div>
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------
// Partenariats
// ---------------------------------------------------------------

export function renderPartenariatsPage() {
  applySeo({
    title: t('partenariats.metaTitle'),
    description: t('partenariats.metaDesc'),
    type: 'website',
    canonicalPath: '/partenariats'
  });

  return `
    <div class="about-hero">
      <span class="kick"><span class="kick-dot"></span>${t('partenariats.kick')}</span>
      <h1 class="about-title display-xl">${t('partenariats.title')}</h1>
    </div>

    <div class="wrap" style="padding:32px 20px 60px">
      <div class="part-simple">
        <p>${t('partenariats.text')}</p>
        <div class="btns">
          <a class="btn gold" data-route="/contact">${t('partenariats.cta')}</a>
        </div>
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------
// Contact (formulaire)
// ---------------------------------------------------------------

export function renderContactPage() {
  applySeo({
    title: t('contact.metaTitle'),
    description: t('contact.metaDesc'),
    type: 'website',
    canonicalPath: '/contact'
  });

  return `
    <div class="about-hero">
      <span class="kick"><span class="kick-dot"></span>${t('contact.kick')}</span>
      <h1 class="about-title display-xl">${t('contact.title')}</h1>
    </div>

    <div class="wrap" style="padding:32px 20px 60px">
      <form id="contact-form" name="contact" method="POST" data-netlify="true" netlify-honeypot="bot-field" novalidate>
        <input type="hidden" name="form-name" value="contact">
        <p class="hidden-field" style="position:absolute;left:-9999px" aria-hidden="true">
          <label>Ne pas remplir si vous êtes humain·e : <input name="bot-field"></label>
        </p>
        <div class="row">
          <div>
            <label for="contact-name">${t('contact.nom')}</label>
            <input type="text" id="contact-name" name="name" required autocomplete="name">
          </div>
          <div>
            <label for="contact-email">${t('contact.email')}</label>
            <input type="email" id="contact-email" name="email" required autocomplete="email">
          </div>
        </div>
        <div>
          <label for="contact-subject">${t('contact.sujet')}</label>
          <select id="contact-subject" name="subject">
            <option value="artiste">${t('contact.sujetArtiste')}</option>
            <option value="presse">${t('contact.sujetPresse')}</option>
            <option value="autre">${t('contact.sujetAutre')}</option>
          </select>
        </div>
        <div>
          <label for="contact-message">${t('contact.message')}</label>
          <textarea id="contact-message" name="message" required></textarea>
        </div>
        <button type="submit" class="btn gold" style="justify-content:center">${t('contact.envoyer')}</button>
      </form>
    </div>
  `;
}

// ---------------------------------------------------------------
// Mentions légales
// ---------------------------------------------------------------

export function renderLegalPage() {
  applySeo({
    title: t('legal.metaTitle'),
    type: 'website',
    canonicalPath: '/mentions-legales'
  });

  return `
    <div class="about-hero">
      <h1 class="about-title display-xl" style="font-size:clamp(2.4rem,8vw,5rem)">${t('legal.title')}</h1>
    </div>
    <div class="legal-grid" style="padding-top:32px">
      <div class="legal-card">
        <h3>${t('legal.editeurTitle')}</h3>
        <p><em>${t('legal.editeurText')}</em></p>
      </div>
      <div class="legal-card">
        <h3>${t('legal.hebergementTitle')}</h3>
        <p><em>${t('legal.hebergementText')}</em></p>
      </div>
      <div class="legal-card">
        <h3>${t('legal.propriIntTitle')}</h3>
        <p>${t('legal.propriIntText')}</p>
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------
// Politique de confidentialité
// ---------------------------------------------------------------

export function renderConfidentialitePage() {
  applySeo({
    title: t('confidentialite.metaTitle'),
    type: 'website',
    canonicalPath: '/confidentialite'
  });

  return `
    <div class="about-hero">
      <h1 class="about-title display-xl" style="font-size:clamp(2.4rem,8vw,5rem)">${t('confidentialite.title')}</h1>
    </div>
    <div class="legal-grid" style="padding-top:32px">
      <div class="legal-card">
        <h3>${t('confidentialite.donneesTitle')}</h3>
        <p>${t('confidentialite.donneesText')}</p>
      </div>
      <div class="legal-card">
        <h3>${t('confidentialite.cookiesTitle')}</h3>
        <p><em>${t('confidentialite.cookiesText')}</em></p>
      </div>
      <div class="legal-card">
        <h3>${t('confidentialite.droitsTitle')}</h3>
        <p>${t('confidentialite.droitsText')}</p>
      </div>
    </div>
  `;
}

/** Échappement HTML minimal pour ce module (texte de config, pas de données utilisateur). */
function esc2(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
