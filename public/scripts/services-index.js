(() => {
	const search = document.querySelector('[data-service-search]');
	const cards = [...document.querySelectorAll('[data-service-card]')];
	const empty = document.querySelector('[data-service-empty]');

	search?.addEventListener('input', () => {
		const query = search.value.trim().toLocaleLowerCase('pt-BR');
		let visible = 0;
		cards.forEach((card) => {
			card.hidden = query.length > 0 && !(card.dataset.serviceTitle ?? '').includes(query);
			if (!card.hidden) visible++;
		});
		if (empty) empty.hidden = visible > 0;
	});
})();
