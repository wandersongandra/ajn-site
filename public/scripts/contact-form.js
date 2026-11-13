(() => {
	const form = document.querySelector('[data-contact-form]');
	if (!form) return;
	const honeypot = form.querySelector('[data-contact-honeypot]');
	const status = form.querySelector('[data-contact-status]');
	const defaultStatusText = status?.textContent?.trim() ?? '';

	function announce(message) {
		if (!status) return;
		status.textContent = message;
		status.focus();
	}

	form.addEventListener('submit', (event) => {
		if (honeypot instanceof HTMLInputElement && honeypot.value.trim() !== '') {
			event.preventDefault();
			return;
		}
		if (!form.checkValidity()) {
			event.preventDefault();
			announce('Revise os campos obrigatórios destacados antes de enviar.');
			return;
		}
		announce('Enviando mensagem…');
	});

	form.addEventListener('input', () => {
		if (status && status.textContent !== defaultStatusText) status.textContent = defaultStatusText;
	});
})();
