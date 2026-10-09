/* Consentimento de análise GA4: sem tag, rede ou cookies de análise antes do aceite. */
(() => {
  'use strict';
  const KEY = 'ajn-cookie-preferences-v2';
  const DAYS = 180 * 86400000;
  const notice = document.getElementById('ajn-privacy-notice');
  if (!notice) return;
  const id = /^G-[A-Z0-9]{6,20}$/.test(notice.dataset.ga4Id || '') ? notice.dataset.ga4Id : '';
  const options = notice.querySelector('[data-privacy-options]');
  const checkbox = notice.querySelector('[data-privacy-analytics]');
  const accept = notice.querySelector('[data-privacy-accept]');
  const reject = notice.querySelector('[data-privacy-reject]');
  const customize = notice.querySelector('[data-privacy-customize]');
  const save = notice.querySelector('[data-privacy-save]');
  const reopen = document.querySelectorAll('[data-privacy-open]');
  let enabled = false;
  let loaded = false;
  let chosen = null;

  function getChoice() {
    try {
      const item = JSON.parse(window.localStorage.getItem(KEY) || 'null');
      if (!item || item.version !== 2 || item.ga4Id !== id || typeof item.analytics !== 'boolean' ||
          !Number.isFinite(item.at) || item.at > Date.now() || Date.now() - item.at >= DAYS) return null;
      return item.analytics;
    } catch { return null; }
  }
  function persist(value) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify({ version: 2, ga4Id: id, analytics: value, at: Date.now() }));
    } catch { /* Navegação privada: preferência apenas na página atual. */ }
  }
  function removeKnownAnalyticsCookies() {
    const names = document.cookie.split(';').map((entry) => entry.trim().split('=')[0])
      .filter((name) => /^_ga(?:_|$)/.test(name));
    const host = window.location.hostname;
    const domains = ['', host, '.' + host, '.ajnengenharia.com.br'];
    for (const name of names) {
      for (const domain of domains) {
        document.cookie = name + '=; Max-Age=0; Path=/; SameSite=Lax' + (domain ? '; Domain=' + domain : '');
      }
    }
  }
  function loadAnalytics() {
    if (loaded || !id || !enabled) return;
    loaded = true;
    window['ga-disable-' + id] = false;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', id, {
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      send_page_view: true
    });
    const tag = document.createElement('script');
    tag.async = true;
    tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
    document.head.appendChild(tag);
  }
  function commit(value) {
    const previous = enabled;
    enabled = value === true;
    chosen = enabled;
    persist(enabled);
    notice.hidden = true;
    if (enabled) loadAnalytics();
    else {
      if (id) window['ga-disable-' + id] = true;
      removeKnownAnalyticsCookies();
      if (previous && loaded) window.location.reload();
    }
  }
  function openPreferences() {
    notice.hidden = false;
    options.hidden = false;
    save.hidden = false;
    accept.hidden = true;
    checkbox.checked = chosen === true;
    save.focus();
  }
  const stored = getChoice();
  if (stored === null) {
    notice.hidden = false;
  } else {
    chosen = stored;
    enabled = stored;
    if (enabled) loadAnalytics();
  }
  // Eventos do feed só chegam ao GA4 após consentimento ativo.
  // O componente não conhece nem chama serviços de análise diretamente.
  window.addEventListener('ajn:instagram-outbound', (event) => {
    if (!enabled || !loaded || !id || window['ga-disable-' + id] === true ||
        typeof window.gtag !== 'function') return;
    const detail = event.detail;
    if (!detail || typeof detail.contentId !== 'string' ||
        !/^(?:[A-Za-z0-9_-]{5,32}|profile)$/.test(detail.contentId) ||
        detail.placement !== 'home_editorial') return;
    window.gtag('event', 'instagram_outbound_click', {
      content_id: detail.contentId,
      content_type: detail.contentType === 'reel' ? 'reel' : 'post',
      placement: 'home_editorial',
    });
  });

  accept?.addEventListener('click', () => commit(true));
  reject?.addEventListener('click', () => commit(false));
  customize?.addEventListener('click', openPreferences);
  save?.addEventListener('click', () => commit(checkbox.checked));
  reopen.forEach((button) => button.addEventListener('click', openPreferences));
})();
