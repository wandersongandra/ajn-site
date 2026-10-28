(() => {
	const home = document.querySelector('.home-page');
	const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const saveData = navigator.connection?.saveData === true;
	if (home) {
		if (saveData) home.classList.add('motion-saver');
		if (!reducedMotion && !saveData) home.classList.add('motion-enabled');
	}

	// Content is visible without JavaScript. Only enhance entrances when
	// IntersectionObserver is available and motion/data preferences permit it.
	if (home && 'IntersectionObserver' in window && !reducedMotion && !saveData) {
		const targets = Array.from(home.querySelectorAll('[data-reveal]'));
		if (targets.length > 0) {
			const pending = new Set(targets);
			let frameQueued = false;
			const observer = new IntersectionObserver((entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) reveal(entry.target);
				}
			}, { rootMargin: '0px 0px -28px 0px', threshold: 0.06 });

			function cleanup() {
				observer.disconnect();
				window.removeEventListener('scroll', scheduleSweep);
				window.removeEventListener('resize', scheduleSweep);
				window.removeEventListener('pageshow', scheduleSweep);
				window.removeEventListener('hashchange', scheduleSweep);
				home.removeEventListener('focusin', onFocus);
			}
			function reveal(element) {
				if (!pending.delete(element)) return;
				element.classList.add('is-visible');
				observer.unobserve(element);
				if (!pending.size) cleanup();
			}
			// The observer alone can miss whole sections after an instant End key,
			// anchor jump or scroll restoration. Already-passed content must never
			// remain hidden indefinitely. Layout reads are throttled to one frame.
			function sweepPassedSections() {
				frameQueued = false;
				const cutoff = window.innerHeight + 28;
				for (const element of pending) {
					if (element.getBoundingClientRect().top < cutoff) reveal(element);
				}
			}
			function scheduleSweep() {
				if (frameQueued || !pending.size) return;
				frameQueued = true;
				window.requestAnimationFrame(sweepPassedSections);
			}
			function onFocus(event) {
				const element = event.target instanceof Element ? event.target.closest('[data-reveal]') : null;
				if (element && pending.has(element)) reveal(element);
			}

			for (const element of targets) observer.observe(element);
			window.addEventListener('scroll', scheduleSweep, { passive: true });
			window.addEventListener('resize', scheduleSweep, { passive: true });
			window.addEventListener('pageshow', scheduleSweep);
			window.addEventListener('hashchange', scheduleSweep);
			home.addEventListener('focusin', onFocus);
			home.classList.add('motion-ready');
			scheduleSweep();
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


(() => {
	const hero = document.querySelector('.home-page .hero--surreal');
	if (!hero) return;
	const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
	const desktop = window.matchMedia('(min-width: 769px)').matches;
	const saveData = navigator.connection?.saveData === true;
	if (reducedMotion || !finePointer || saveData || !desktop) return;

	const layers = Array.from(hero.querySelectorAll('[data-hero-layer]'));
	let frame = 0;
	let targetX = 0;
	let targetY = 0;
	let currentX = 0;
	let currentY = 0;

	const apply = () => {
		hero.style.setProperty('--hero-parallax-x', `${currentX.toFixed(2)}px`);
		hero.style.setProperty('--hero-parallax-y', `${currentY.toFixed(2)}px`);
		for (const layer of layers) {
			const depth = Number(layer.getAttribute('data-hero-layer')) || 0.3;
			layer.style.setProperty('--hero-layer-depth', String(depth));
			layer.style.transform = `translate3d(${(currentX * depth).toFixed(2)}px, ${(currentY * depth).toFixed(2)}px, 0)`;
		}
	};

	const tick = () => {
		frame = 0;
		currentX += (targetX - currentX) * 0.08;
		currentY += (targetY - currentY) * 0.08;
		apply();
		if (Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05) {
			frame = window.requestAnimationFrame(tick);
		}
	};

	hero.addEventListener('pointermove', (event) => {
		const rect = hero.getBoundingClientRect();
		const nx = ((event.clientX - rect.left) / rect.width) - 0.5;
		const ny = ((event.clientY - rect.top) / rect.height) - 0.5;
		targetX = nx * -22;
		targetY = ny * -14;
		if (!frame) frame = window.requestAnimationFrame(tick);
	}, { passive: true });

	hero.addEventListener('pointerleave', () => {
		targetX = 0;
		targetY = 0;
		if (!frame) frame = window.requestAnimationFrame(tick);
	});
})();
