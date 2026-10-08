// A página permanece plenamente visível sem JS, IntersectionObserver ou animações.
// Um observador único revela seções apenas enquanto elas entram na janela.
const root = document.querySelector<HTMLElement>('[data-about-page]');
const motionOff = window.matchMedia('(prefers-reduced-motion: reduce)');
const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;

if (root && 'IntersectionObserver' in window && !motionOff.matches && !saveData) {
	const parts = Array.from(root.querySelectorAll<HTMLElement>('[data-about-reveal]'));
	const viewportHeight = window.innerHeight;

	for (const part of parts) {
		const rect = part.getBoundingClientRect();
		if (rect.top < viewportHeight && rect.bottom > 0) {
			part.classList.add('is-visible');
		}
	}

	const observer = new IntersectionObserver((entries) => {
		for (const entry of entries) {
			if (!entry.isIntersecting) continue;
			entry.target.classList.add('is-visible');
			observer.unobserve(entry.target);
		}
	}, { rootMargin: '0px 0px -20px 0px', threshold: 0.04 });

	for (const part of parts) {
		if (!part.classList.contains('is-visible')) observer.observe(part);
	}
	root.classList.add('is-motion-ready');
}
export {};
