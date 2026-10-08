// Progressive enhancement: no library, scroll listener or layout-dependent animation.
const home = document.querySelector<HTMLElement>('.home-page');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;

if (home && 'IntersectionObserver' in window && !reducedMotion && !saveData) {
	const targets = Array.from(home.querySelectorAll<HTMLElement>('[data-reveal]'));

	if (targets.length > 0) {
		// Content already on screen should never disappear after the script starts.
		const viewportHeight = window.innerHeight;
		for (const element of targets) {
			const bounds = element.getBoundingClientRect();
			if (bounds.top < viewportHeight && bounds.bottom > 0) {
				element.classList.add('is-visible');
			}
		}

		const observer = new IntersectionObserver((entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) continue;
				entry.target.classList.add('is-visible');
				observer.unobserve(entry.target);
			}
		}, { rootMargin: '0px 0px -28px 0px', threshold: 0.06 });

		for (const element of targets) {
			if (!element.classList.contains('is-visible')) observer.observe(element);
		}

		// JS-enabled only: without JS, every section stays visible.
		home.classList.add('motion-ready');
	}
}
