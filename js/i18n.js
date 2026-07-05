/**
 * Rise Music Mag — Internationalisation (FR/EN)
 * ----------------------------------------------------------------
 * Source unique de vérité pour la langue active de l'application.
 * Ne touche jamais au DOM des pages (ça reste le rôle des modules
 * render-*.js) : ce module se contente de charger les dictionnaires
 * de traduction et d'exposer t(clé) pour les consommer.
 *
 * Détection de la langue initiale, par ordre de priorité :
 *   1. Préfixe d'URL (/en/... -> 'en', sinon -> 'fr')
 *   2. Préférence enregistrée (localStorage)
 *   3. Langue du navigateur (Accept-Language / navigator.language)
 *   4. 'fr' par défaut
 *
 * Usage :
 *   import { i18n, t } from './i18n.js';
 *   await i18n.init();               // au démarrage de l'app, une seule fois
 *   t('nav.artistes')                // -> "Artistes" ou "Artists"
 *   t('contact.successText', { name: 'Léo', email: 'leo@mail.com' })
 *   i18n.setLocale('en');            // changement explicite (lang switch)
 *   window.addEventListener('rise:localechange', (e) => { ... e.detail.locale });
 */

import { BASE_PATH } from './data-store.js';

const STORAGE_KEY = 'rise-locale';
const SUPPORTED = ['fr', 'en'];
const DEFAULT_LOCALE = 'fr';

const DICT_URLS = {
  fr: 'i18n/fr.json',
  en: 'i18n/en.json'
};

function dataUrl(relativePath) {
  return `${BASE_PATH}/${relativePath}`.replace(/\/{2,}/g, '/');
}

/** Lit le préfixe de langue directement depuis l'URL courante, sans dépendre du routeur. */
function localeFromUrl() {
  let path = window.location.pathname;
  if (BASE_PATH && path.startsWith(BASE_PATH)) path = path.slice(BASE_PATH.length);
  return path === '/en' || path.startsWith('/en/') ? 'en' : null;
}

function localeFromStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return SUPPORTED.includes(stored) ? stored : null;
  } catch {
    return null; // localStorage indisponible (navigation privée stricte, etc.)
  }
}

function localeFromBrowser() {
  const lang = (navigator.language || navigator.userLanguage || '').slice(0, 2).toLowerCase();
  return SUPPORTED.includes(lang) ? lang : null;
}

class I18n {
  constructor() {
    this._locale = DEFAULT_LOCALE;
    this._dicts = { fr: {}, en: {} };
    this._ready = false;
  }

  /** Détecte et charge les deux dictionnaires (chargés ensemble : légers, évite un aller-retour au changement de langue). */
  async init() {
    const [frRes, enRes] = await Promise.all([
      fetch(dataUrl(DICT_URLS.fr), { cache: 'no-cache' }),
      fetch(dataUrl(DICT_URLS.en), { cache: 'no-cache' })
    ]);
    this._dicts.fr = frRes.ok ? await frRes.json() : {};
    this._dicts.en = enRes.ok ? await enRes.json() : {};

    const initial = localeFromUrl() || localeFromStorage() || localeFromBrowser() || DEFAULT_LOCALE;
    this._applyLocale(initial);
    this._ready = true;
  }

  /** Applique la langue en mémoire + <html lang> ; ne touche pas au localStorage (utilisé aussi lors de la résolution d'URL au chargement, où on ne veut pas écraser la préférence enregistrée). */
  _applyLocale(locale) {
    this._locale = SUPPORTED.includes(locale) ? locale : DEFAULT_LOCALE;
    document.documentElement.setAttribute('lang', this._locale);
  }

  getLocale() {
    return this._locale;
  }

  /**
   * Change la langue active.
   * @param {string} locale - 'fr' | 'en'
   * @param {object} [opts]
   * @param {boolean} [opts.persist=true] - enregistrer le choix dans localStorage
   * @param {boolean} [opts.silent=false] - ne pas déclencher l'événement 'rise:localechange'
   *   (utilisé en interne lors de la résolution d'une URL déjà localisée au chargement)
   */
  setLocale(locale, opts = {}) {
    const { persist = true, silent = false } = opts;
    if (!SUPPORTED.includes(locale) || locale === this._locale) {
      if (SUPPORTED.includes(locale)) this._applyLocale(locale); // idempotent mais garde <html lang> à jour
      return;
    }
    this._applyLocale(locale);
    if (persist) {
      try { localStorage.setItem(STORAGE_KEY, locale); } catch { /* stockage indisponible, on continue sans persister */ }
    }
    if (!silent) {
      window.dispatchEvent(new CustomEvent('rise:localechange', { detail: { locale } }));
    }
  }

  /**
   * Traduit une clé. Si absente du dictionnaire actif, retourne le dictionnaire
   * FR en secours, puis la clé elle-même (jamais un écran vide) — utile pendant
   * le développement si une clé est ajoutée dans un module avant d'être ajoutée
   * aux deux fichiers de traduction.
   * @param {string} key
   * @param {object} [vars] - interpolation simple {name} -> vars.name
   */
  t(key, vars) {
    if (!this._ready) return key;
    const value = this._dicts[this._locale]?.[key] ?? this._dicts.fr?.[key] ?? key;
    if (!vars) return value;
    return Object.entries(vars).reduce(
      (str, [k, v]) => str.replaceAll(`{${k}}`, v),
      value
    );
  }
}

export const i18n = new I18n();
export const t = (key, vars) => i18n.t(key, vars);
export const getLocale = () => i18n.getLocale();
export const setLocale = (locale, opts) => i18n.setLocale(locale, opts);

/**
 * Traduit un CHAMP DE DONNÉE (pas une clé d'interface) : convention utilisée
 * par artistes.json / interviews.json / articles.json, où chaque champ
 * traduisible a un jumeau `<champ>_en` optionnel à côté du champ FR
 * d'origine (ex: description / description_en, bio / bio_en).
 * Repli automatique sur le FR si la traduction est absente ou vide, pour
 * qu'une entrée pas encore traduite reste affichable plutôt que vide.
 * @param {object} obj - entrée de données (artiste, interview, article, item de qna...)
 * @param {string} field - nom du champ FR, sans suffixe (ex: 'description')
 */
export function tf(obj, field) {
  if (!obj) return '';
  if (getLocale() === 'en') {
    const enValue = obj[`${field}_en`];
    if (enValue) return enValue;
  }
  return obj[field] ?? '';
}
