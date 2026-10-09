/* Aviso informativo. Sem rastreamento, sem cookies, sem requisições de rede. */
(() => {
  'use strict';
  const key = 'ajn-privacy-notice-ack-v1';
  const ttl = 180 * 24 * 60 * 60 * 1000;
  const notice = document.getElementById('ajn-privacy-notice');
  if (!notice) return;
  const acknowledge = notice.querySelector('[data-privacy-acknowledge]');
  const reopen = document.querySelectorAll('[data-privacy-open]');
  const read = () => {
    try {
      const value = Number(window.localStorage.getItem(key));
      return Number.isFinite(value) && value > 0 && value <= Date.now() && Date.now() - value < ttl;
    } catch { return false; }
  };
  const save = () => {
    try { window.localStorage.setItem(key, String(Date.now())); } catch { /* modo privado/bloqueado */ }
  };
  if (!read()) notice.hidden = false;
  acknowledge?.addEventListener('click', () => {
    save();
    notice.hidden = true;
  });
  reopen.forEach((button) => button.addEventListener('click', () => {
    notice.hidden = false;
    acknowledge?.focus();
  }));
})();
