(() => {
  const search = document.querySelector('[data-service-search]');
  const cards = [...document.querySelectorAll('[data-service-card]')];
  const groups = [...document.querySelectorAll('[data-service-group]')];
  const empty = document.querySelector('[data-service-empty]');
  const results = document.querySelector('[data-service-results]');

  // Mesmas regras na pesquisa e no texto pesquisado: aceita acentos,
  // "e-Social" / "esocial" e termos em qualquer ordem.
  const normalize = (value) => String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/\be[\s-]+social\b/g, 'esocial')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

  const searchable = cards.map((card) => ({
    card,
    text: normalize(card.dataset.serviceSearchable ?? ''),
  }));

  function render() {
    const terms = normalize(search?.value ?? '').split(/\s+/).filter(Boolean);
    let shown = 0;
    for (const item of searchable) {
      const matches = terms.every((term) => item.text.includes(term));
      item.card.hidden = !matches;
      if (matches) shown += 1;
    }
    for (const group of groups) {
      group.hidden = !group.querySelector('[data-service-card]:not([hidden])');
    }
    if (empty) empty.hidden = shown > 0;
    if (results) results.textContent = shown === 1 ? '1 serviço encontrado' : `${shown} serviços encontrados`;
  }

  search?.addEventListener('input', render);
  render();
})();
