// Verificação estática do blog gerado pelo Astro.
// Executar depois de "npm run build": node scripts/audit-blog.mjs
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';

const blogDir = path.resolve('dist/blog');
const failures = [];
const report = { archiveCards: 0, articles: 0, responsiveImages: 0, descriptions: 0 };
const articleTitles = new Map();
const descriptions = new Map();
let archiveHtml = '';

async function collectHtml(dir) {
	const entries = await readdir(dir, { withFileTypes: true });
	const files = [];
	for (const entry of entries) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) files.push(...await collectHtml(full));
		else if (entry.name.endsWith('.html')) files.push(full);
	}
	return files;
}

let htmlFiles = [];
try {
	htmlFiles = await collectHtml(blogDir);
} catch (error) {
	failures.push('Não foi possível encontrar dist/blog: execute npm run build antes desta auditoria.');
}

for (const file of htmlFiles) {
	const html = await readFile(file, 'utf8');
	const route = path.relative(blogDir, file).replaceAll(path.sep, '/');
	const title = (html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? '').trim();
	const description = (html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)/i)?.[1] ?? '').trim();
	const h1Count = (html.match(/<h1\b/gi) ?? []).length;

	if (route === 'index.html') {
		archiveHtml = html;
		if (!html.includes('id="blog-archive-grid"')) failures.push('Blog: grid não possui ID para navegação acessível.');
		if (!html.includes('data-blog-search')) failures.push('Blog: pesquisa não encontrada.');
		if (!html.includes('aria-live="polite" aria-atomic="true" data-blog-results'))
			failures.push('Blog: total de resultados precisa anunciar a quantidade exibida.');
		if (!html.includes('data-blog-more aria-controls="blog-archive-grid"'))
			failures.push('Blog: botão mostrar mais não controla o grid de artigos.');
		for (const required of [
			'aria-label="Guias para começar"',
			'/blog/laudo-tecnico-das-condicoes-ambientais-de-trabalho-ltcat',
			'/blog/laudo-de-gerenciamento-de-riscos-essencial-para-garantir-a-seguranca-no-ambiente-de-trabalho',
			'/blog/seguranca-do-trabalho-e-pcmso-gestao-da-saude-ocupacional',
		]) {
			if (!html.includes(required)) failures.push('Blog: curadoria inicial incompleta: ' + required);
		}
		report.archiveCards = (html.match(/class=["']blog-card["']/g) ?? []).length;
		report.responsiveImages = (html.match(/\bsrcset=["']/g) ?? []).length;
		if (report.archiveCards !== 31) failures.push('Arquivo do blog: esperados 31 cards; obtidos ' + report.archiveCards);
		if (report.responsiveImages < 10) failures.push('Arquivo do blog: imagens responsivas insuficientes; confira widths/sizes.');
		if (h1Count !== 1) failures.push('Arquivo do blog: esperado um H1, encontrado ' + h1Count);
		continue;
	}

	report.articles++;
	// A postagem, o Open Graph e a imagem real de compartilhamento precisam coincidir.
	const slug = route.replace(/\\/g, '/').replace(/\/index\.html$/, '');
	const expectedOg = '/images/og/' + slug + '.jpg';
	try { if (!(await stat(path.resolve('dist' + expectedOg))).isFile()) failures.push(route + ': imagem OG inválida'); }
	catch { failures.push(route + ': imagem OG inexistente: ' + expectedOg); }
	if (!html.includes(expectedOg)) failures.push(route + ': URL da imagem OG não corresponde ao arquivo publicado');
	const jsonld = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
		.flatMap((match) => {
			try {
				const parsed = JSON.parse(match[1]);
				return Array.isArray(parsed) ? parsed : [parsed];
			} catch {
				failures.push(route + ': JSON-LD inválido');
				return [];
			}
		});
	const article = jsonld.find((data) => data?.['@type'] === 'BlogPosting');
	if (!article) failures.push(route + ': BlogPosting estruturado ausente');
	else {
		if (!article.publisher?.logo?.url) failures.push(route + ': logo do publisher ausente no BlogPosting');
		if (article.author?.['@type'] === 'Organization' && !article.author?.logo?.url)
			failures.push(route + ': autor institucional sem identificação de logo');
		if (!String(article.mainEntityOfPage ?? '').endsWith('/blog/' + slug + '/'))
			failures.push(route + ': mainEntityOfPage diverge da rota canônica com barra final');
	}
	// Cada âncora do sumário deve levar a uma seção realmente existente.
	const sectionAnchors = [...html.matchAll(/href="#(blog-secao-[0-9]+)"/g)].map((match) => match[1]);
	for (const target of sectionAnchors) {
		if (!html.includes('id="' + target + '"')) failures.push(route + ': sumário com destino ausente: ' + target);
	}
	// O autor deve ser identificável ao leitor; os posts legados de "Admin" usam a marca AJN.
	if (!route.includes('a-importancia-do-ltcat-para-a-seguranca-do-trabalho-e-a-protecao-do-ambiente-profissional')
		&& !html.includes('· Por ')) {
		failures.push(route + ': autor não está visível no artigo');
	}
	if (!html.includes('class="blog-article__content"')) {
		failures.push(route + ': artigo não contém região editorial padrão');
	}
	if (!html.includes('application/ld+json') || !html.includes('BlogPosting')) {
		failures.push(route + ': dados estruturados BlogPosting ausentes');
	}
	// Os artigos possuem data de revisão e referências identificáveis.
	if (!/["']dateModified["']\s*:/.test(html)) {
		failures.push(route + ': data de revisão ausente no BlogPosting');
	}
	if (!route.includes('um-pouco-sobre-nos') && !/href=["']https:\/\/(?:www\.)?(?:gov\.br|planalto\.gov\.br|bombeiros\.mg\.gov\.br)/.test(html)) {
		failures.push(route + ': fontes oficiais não encontradas no corpo do artigo');
	}
	if (h1Count !== 1) failures.push(route + ': esperado um H1, encontrado ' + h1Count);
	if (!title) failures.push(route + ': título ausente');
	if (!description || description.length < 75 || description.length > 180) {
		failures.push(route + ': descrição com tamanho inválido (' + description.length + ' caracteres)');
	}
	if (/…\s*$/.test(description) || /\.\.\.\s*$/.test(description)) {
		failures.push(route + ': descrição truncada');
	}
	if (title.includes('Ǫue') || title.includes('NR-35:Trabalho')) {
		failures.push(route + ': grafia do título precisa ser corrigida');
	}
	if (title) {
		if (articleTitles.has(title)) failures.push(route + ': título duplicado com ' + articleTitles.get(title));
		articleTitles.set(title, route);
	}
	if (description) {
		report.descriptions++;
		if (descriptions.has(description)) failures.push(route + ': descrição duplicada com ' + descriptions.get(description));
		descriptions.set(description, route);
	}
}

if (report.articles !== 31) failures.push('Esperados 31 artigos HTML gerados, encontrados ' + report.articles);

// Exercita a pesquisa, os filtros e a expansão usando o script entregue ao navegador.
if (archiveHtml) {
	const script = await readFile('public/scripts/blog-index.js', 'utf8');
	const cards = [...archiveHtml.matchAll(/<article\b[^>]*data-blog-card[^>]*data-blog-searchable="([^"]*)"[^>]*data-blog-category="([^"]*)"[^>]*>/g)]
		.map((match) => ({ dataset: { blogSearchable: match[1], blogCategory: match[2] }, hidden: false }));
	const validTopics = new Set([
		'Gestão de SST', 'Saúde ocupacional', 'Laudos e avaliações técnicas', 'Normas regulamentadoras',
		'eSocial e obrigações', 'Segurança operacional', 'Treinamentos e prevenção', 'SST por setor',
		'Gestão ambiental e qualidade', 'Engenharia e prevenção contra incêndio', 'Institucional',
	]);
	if (cards.some((card) => !validTopics.has(card.dataset.blogCategory))) failures.push('Blog: artigo contém categoria editorial não reconhecida.');
	const handlers = {};
	let searchFocused = false;
	const search = { value: '', addEventListener: (event, callback) => { handlers['search:' + event] = callback; }, focus() { searchFocused = true; } };
	const results = { textContent: '' };
	const empty = { hidden: true };
	const more = { hidden: false, textContent: '', addEventListener: (event, callback) => { handlers['more:' + event] = callback; } };
	const moreWrap = { hidden: true };
	const reset = { addEventListener: (event, callback) => { handlers['reset:' + event] = callback; } };
	const form = { addEventListener: (event, callback) => { handlers['form:' + event] = callback; } };
	const topics = [...new Set(['', ...cards.map((card) => card.dataset.blogCategory)])];
	const topicLinks = topics.map((topic) => ({
		dataset: { blogTopic: topic },
		addEventListener: (event, callback) => { handlers['topic:' + topic + ':' + event] = callback; },
		setAttribute(name, value) { this[name] = value; },
		removeAttribute(name) { delete this[name]; },
	}));
	const document = {
		querySelector: (selector) => ({
			'[data-blog-search]': search,
			'[data-blog-form]': form,
			'[data-blog-results]': results,
			'[data-blog-empty]': empty,
			'[data-blog-reset]': reset,
			'[data-blog-more]': more,
			'[data-blog-more-wrap]': moreWrap,
		}[selector] ?? null),
		querySelectorAll: (selector) => selector === '[data-blog-card]' ? cards : selector === '[data-blog-topic]' ? topicLinks : [],
	};
	const location = { href: 'https://ajnengenharia.com.br/blog/' };
	const updateUrl = (_state, _title, value) => { location.href = new URL(value, location.href).href; };
	const window = {
		location,
		history: { pushState: updateUrl, replaceState: updateUrl },
		addEventListener: (event, callback) => { handlers['window:' + event] = callback; },
	};
	vm.runInNewContext(script, { document, window, URL, URLSearchParams });
	const visibleCount = () => cards.filter((card) => !card.hidden).length;
	if (cards.length !== 31 || visibleCount() !== 9) failures.push('Busca do Blog: carregamento inicial não limita a 9 de 31 artigos.');
	search.value = 'PERMISSÃO';
	handlers['search:input']();
	if (visibleCount() !== 1 || cards.find((card) => card.dataset.blogSearchable.includes('Permissão'))?.hidden !== false)
		failures.push('Busca do Blog: normalização de acentos não encontra o artigo sobre APR/Permissão de Trabalho.');
	search.value = '';
	handlers['search:input']();
	const topic = 'Normas regulamentadoras';
	const topicLink = topicLinks.find((link) => link.dataset.blogTopic === topic);
	handlers['topic:' + topic + ':click']?.({ preventDefault() {}, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false });
	const topicMatches = cards.filter((card) => card.dataset.blogCategory === topic);
	if (topicLink?.['aria-current'] !== 'true' || visibleCount() !== topicMatches.length || new URL(location.href).searchParams.get('tema') !== topic)
		failures.push('Filtro do Blog: tema não filtra cards e atualiza o estado/URL.');
	search.value = '';
	handlers['search:input']();
	handlers['topic::click']?.({ preventDefault() {}, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false });
	if (visibleCount() !== 9 || moreWrap.hidden) failures.push('Paginação do Blog: botão de expansão não aparece após resetar o tema.');
	handlers['more:click']?.();
	if (visibleCount() !== 18 || !results.textContent.includes('18 de 31')) failures.push('Paginação do Blog: “Mostrar mais” não revela o próximo grupo de cards.');
	search.value = 'termo inexistente';
	handlers['search:input']();
	if (empty.hidden || visibleCount() !== 0 || !results.textContent.includes('Nenhum artigo')) failures.push('Busca do Blog: estado vazio não é anunciado.');
	handlers['reset:click']?.();
	if (visibleCount() !== 9 || !empty.hidden || !searchFocused || search.value !== '') failures.push('Busca do Blog: limpar filtros não restaura lista/foco.');
}

if (failures.length) {
	for (const issue of failures) console.error('[blog][FAIL] ' + issue);
	process.exitCode = 1;
} else {
	console.log('[blog] PASS: ' + report.articles + ' artigos, ' + report.archiveCards
		+ ' cards, ' + report.descriptions + ' descrições e ' + report.responsiveImages + ' srcsets no arquivo.');
}
