/**
 * Rise Music Mag — Notifications toast
 * ----------------------------------------------------------------
 * Petit toast en bas d'écran (cf. css/utilities.css .toast). Utilisé
 * pour confirmer une action (lien copié, formulaire envoyé...).
 */

let toastEl = null;
let hideTimeout = null;

function ensureToastElement() {
  if (toastEl) return toastEl;
  toastEl = document.createElement('div');
  toastEl.className = 'toast';
  toastEl.setAttribute('role', 'status');
  toastEl.setAttribute('aria-live', 'polite');
  document.body.appendChild(toastEl);
  return toastEl;
}

const ICONS = {
  success: '<svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>',
  error: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>'
};

/**
 * @param {string} message
 * @param {'success'|'error'} [type='success']
 */
export function showToast(message, type = 'success') {
  const el = ensureToastElement();
  el.className = `toast ${type === 'error' ? 'error' : ''}`.trim();
  el.innerHTML = `${ICONS[type] || ICONS.success}<span></span>`;
  el.querySelector('span').textContent = message;

  // Force un reflow pour que la transition se rejoue même si un toast
  // est déjà visible (sinon le navigateur peut fusionner les transitions).
  requestAnimationFrame(() => el.classList.add('show'));

  clearTimeout(hideTimeout);
  hideTimeout = setTimeout(() => {
    el.classList.remove('show');
  }, 2600);
}
