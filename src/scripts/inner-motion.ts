// Entradas progressivas nas paginas internas da AJN.
// Nenhum conteudo depende deste arquivo para ficar visivel.
const main = document.querySelector<HTMLElement>('#conteudo-principal');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const dataSaver = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;

if (main && !main.querySelector('.home-page') && 'IntersectionObserver' in window && !reducedMotion && !dataSaver) {
	const selectors = [
		'.inner-page .page-heading',
		'.inner-page .service-index-card',
		'.inner-page .institutional-intro > div:last-child',
		'.inner-page .institutional-gallery',
		'.inner-page .values-grid > section',
		'.inner-page .content-section',
		'.inner-page .service-detail-wp__content',
		'.inner-page .detail-layout__main .content-gallery',
		'.inner-page .detail-sidebar',
		'.inner-page .contact-page',
		'.inner-page .link-index-grid',
		'.blog-hub .blog-hub__intro',
		'.blog-hub .blog-archive__heading',
		'.blog-hub .blog-card',
		'.blog-reading .blog-article__header',
		'.blog-reading .blog-article__toc',
		'.blog-reading .blog-article__gallery-section',
		'.blog-reading .blog-related__card',
	].join(', ');

	// Limite fixo de observacoes: a pagina de mapa do site contem dezenas de links.
	const elements = Array.from(main.querySelectorAll<HTMLElement>(selectors)).slice(0, 48);
	if (elements.length) {
		const viewportHeight = window.innerHeight;
		for (const [index, element] of elements.entries()) {
			element.dataset.motionEnter = '';
			if (element.matches('.service-index-card, .blog-card, .values-grid > section, .blog-related__card')) {
				element.style.setProperty('--motion-delay', `${(index % 3) * 55}ms`);
			}
			const rect = element.getBoundingClientRect();
			if (rect.top < viewportHeight && rect.bottom > 0) element.classList.add('is-visible');
		}

		const observer = new IntersectionObserver((entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) continue;
				entry.target.classList.add('is-visible');
				observer.unobserve(entry.target);
			}
		}, { rootMargin: '0px 0px -24px 0px', threshold: 0.04 });

		for (const element of elements) {
			if (!element.classList.contains('is-visible')) observer.observe(element);
		}

		// Habilita as transicoes apenas depois do conteudo ja visivel ser marcado.
		main.classList.add('inner-motion-ready');
	}
}
