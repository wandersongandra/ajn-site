/* Vitrine AJN: controles acessíveis e evento agregado, somente com GA4 consentido. */
(() => {
  'use strict';

  const section = document.querySelector('.instagram-highlights');
  if (!section) return;
  const rail = section.querySelector('#ajn-instagram-posts');
  if (!rail) return;

  const previous = section.querySelector('[data-ig-scroll="previous"]');
  const next = section.querySelector('[data-ig-scroll="next"]');

  // Batch layout reads and button writes into a single animation frame.
  // A passive scroll handler must not synchronously force layout on every tick.
  let controlsFrame = 0;
  function syncControls() {
    controlsFrame = 0;
    const max = Math.max(0, rail.scrollWidth - rail.clientWidth);
    const left = rail.scrollLeft;
    if (previous) previous.disabled = left <= 3;
    if (next) next.disabled = left >= max - 3;
  }
  function scheduleControlsSync() {
    if (controlsFrame) return;
    controlsFrame = window.requestAnimationFrame(syncControls);
  }

  function scrollItems(direction) {
    const firstCard = rail.querySelector('.instagram-highlights__card');
    const width = firstCard ? firstCard.getBoundingClientRect().width : 290;
    const gap = Number.parseFloat(window.getComputedStyle(rail).columnGap) || 16;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    rail.scrollBy({ left: direction * (width + gap), behavior: reducedMotion ? 'instant' : 'smooth' });
    if (reducedMotion) scheduleControlsSync();
  }

  previous?.addEventListener('click', () => scrollItems(-1));
  next?.addEventListener('click', () => scrollItems(1));
  rail.addEventListener('scroll', scheduleControlsSync, { passive: true });
  window.addEventListener('resize', scheduleControlsSync, { passive: true });
  if ('ResizeObserver' in window) {
    new ResizeObserver(scheduleControlsSync).observe(rail);
  }
  scheduleControlsSync();

  // Apenas comunica a interação ao gestor de consentimento (privacy-notice.js).
  // Este módulo não carrega tag analítica, não persiste dados e não faz requisições.
  section.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const link = target.closest('a[data-ig-outbound]');
    if (!link || !section.contains(link)) return;
    window.dispatchEvent(new CustomEvent('ajn:instagram-outbound', {
      detail: {
        contentId: link.dataset.instagramId || 'profile',
        contentType: link.dataset.instagramKind === 'Reel' ? 'reel' : 'post',
        placement: 'home_editorial',
      },
    }));
  });
})();
