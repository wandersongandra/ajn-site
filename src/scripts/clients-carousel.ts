// Carrossel de logos: CSS faz o movimento, JS apenas controla reprodução.
// A versão sem JavaScript permanece como uma lista rolável de 10 marcas.
const carousel = document.querySelector<HTMLElement>('[data-clients-carousel]');
const toggle = carousel?.querySelector<HTMLButtonElement>('[data-clients-pause]');
const toggleLabel = toggle?.querySelector<HTMLElement>('[data-clients-pause-label]');
const desktop = window.matchMedia('(min-width: 769px)');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;

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

export {};
