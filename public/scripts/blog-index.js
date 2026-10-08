(() => {
	const cards = Array.from(document.querySelectorAll('[data-blog-card]'));
	const search = document.querySelector('[data-blog-search]');
	const form = document.querySelector('[data-blog-form]');
	const topicLinks = Array.from(document.querySelectorAll('[data-blog-topic]'));
	const results = document.querySelector('[data-blog-results]');
	const empty = document.querySelector('[data-blog-empty]');
	const reset = document.querySelector('[data-blog-reset]');
	const more = document.querySelector('[data-blog-more]');
	const moreWrap = document.querySelector('[data-blog-more-wrap]');
	const pageSize = 9;
	let visibleLimit = pageSize;
	let selectedTopic = new URLSearchParams(window.location.search).get('tema') ?? '';

	const normalize = (value) => value.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLocaleLowerCase('pt-BR').trim();

	function syncUrl(mode = 'replace') {
		const url = new URL(window.location.href);
		const query = search?.value.trim() ?? '';
		if (query) url.searchParams.set('q', query);
		else url.searchParams.delete('q');
		if (selectedTopic) url.searchParams.set('tema', selectedTopic);
		else url.searchParams.delete('tema');
		url.searchParams.delete('tag');
		url.searchParams.delete('page');
		window.history[mode === 'push' ? 'pushState' : 'replaceState'](null, '', url.pathname + url.search);
	}

	function render() {
		const query = normalize(search?.value ?? '');
		let matches = 0;
		let visible = 0;
		for (const card of cards) {
			const matchesQuery = !query || normalize(card.dataset.blogSearchable ?? '').includes(query);
			const matchesTopic = !selectedTopic || card.dataset.blogCategory === selectedTopic;
			const accepted = matchesQuery && matchesTopic;
			if (accepted) matches++;
			const show = accepted && visible < visibleLimit;
			card.hidden = !show;
			if (show) visible++;
		}
		if (results) results.textContent = matches === 0
			? 'Nenhum artigo encontrado'
			: `Exibindo ${visible} de ${matches} ${matches === 1 ? 'artigo' : 'artigos'}`;
		if (empty) empty.hidden = matches !== 0;
		const remaining = Math.max(0, matches - visible);
		if (moreWrap) moreWrap.hidden = remaining === 0;
		if (more && remaining > 0) more.textContent = `Mostrar mais ${Math.min(pageSize, remaining)} ${remaining === 1 ? 'artigo' : 'artigos'}`;
		for (const link of topicLinks) {
			if ((link.dataset.blogTopic ?? '') === selectedTopic) link.setAttribute('aria-current', 'true');
			else link.removeAttribute('aria-current');
		}
	}

	if (search) {
		search.value = new URLSearchParams(window.location.search).get('q') ?? '';
		search.addEventListener('input', () => { visibleLimit = pageSize; syncUrl(); render(); });
	}
	for (const link of topicLinks) {
		link.addEventListener('click', (event) => {
			if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
			event.preventDefault();
			selectedTopic = link.dataset.blogTopic ?? '';
			visibleLimit = pageSize;
			syncUrl('push');
			render();
		});
	}
	form?.addEventListener('submit', (event) => {
		event.preventDefault();
		visibleLimit = pageSize;
		syncUrl('push');
		render();
	});
	more?.addEventListener('click', () => { visibleLimit += pageSize; render(); });
	reset?.addEventListener('click', () => {
		if (search) search.value = '';
		selectedTopic = '';
		visibleLimit = pageSize;
		syncUrl('push');
		render();
		search?.focus();
	});
	window.addEventListener('popstate', () => {
		const params = new URLSearchParams(window.location.search);
		selectedTopic = params.get('tema') ?? '';
		if (search) search.value = params.get('q') ?? '';
		visibleLimit = pageSize;
		render();
	});
	render();
})();
