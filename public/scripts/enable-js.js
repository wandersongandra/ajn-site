// Hide the no-JS fallback only while the deferred controller is loading.
// If that request fails, the load event restores the accessible fallback.
document.documentElement.classList.add('js-pending');
window.addEventListener('load', () => {
	if (!document.documentElement.classList.contains('js-enabled')) {
		document.documentElement.classList.remove('js-pending');
	}
}, { once: true });
