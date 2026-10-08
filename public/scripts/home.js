(() => {
	const home = document.querySelector('.home-page');
	const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const saveData = navigator.connection?.saveData;

	if (home && 'IntersectionObserver' in window && !reducedMotion && !saveData) {
		const targets = Array.from(home.querySelectorAll('[data-reveal]'));
		if (targets.length > 0) {
			const viewportHeight = window.innerHeight;
			for (const element of targets) {
				const bounds = element.getBoundingClientRect();
				if (bounds.top < viewportHeight && bounds.bottom > 0) element.classList.add('is-visible');
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
			home.classList.add('motion-ready');
		}
	}
})();

(() => {
	const carousel = document.querySelector('[data-clients-carousel]');
	const toggle = carousel?.querySelector('[data-clients-pause]');
	const toggleLabel = toggle?.querySelector('[data-clients-pause-label]');
	const desktop = window.matchMedia('(min-width: 769px)');
	const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
	const saveData = navigator.connection?.saveData === true;

	if (carousel && toggle && toggleLabel) {
		let inView = false;
		let pausedByUser = false;
		const supported = 'IntersectionObserver' in window;

		const sync = () => {
			const enabled = desktop.matches && !reducedMotion.matches && !saveData && supported;
			carousel.classList.toggle('is-ready', enabled);
			carousel.classList.toggle('is-playing', enabled && inView && !pausedByUser && !document.hidden);
			toggle.hidden = !enabled;
			toggle.setAttribute('aria-pressed', String(pausedByUser));
			toggleLabel.textContent = pausedByUser ? 'Retomar carrossel' : 'Pausar carrossel';
		};

		if (supported) {
			const observer = new IntersectionObserver((entries) => {
				inView = entries.some((entry) => entry.isIntersecting);
				sync();
			}, { threshold: 0.08 });
			observer.observe(carousel);
		}
		toggle.addEventListener('click', () => {
			pausedByUser = !pausedByUser;
			sync();
		});
		document.addEventListener('visibilitychange', sync);
		desktop.addEventListener('change', sync);
		reducedMotion.addEventListener('change', sync);
		sync();
	}
})();
