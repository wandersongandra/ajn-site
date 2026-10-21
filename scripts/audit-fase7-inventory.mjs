import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const distRoot = path.join(root, 'dist');
const contentRoots = [
	'src/content/marketing',
	'src/content/blog',
	'src/content/services',
	'src/content/institutional',
];
const outputDir = path.join(root, 'docs', 'audits');

async function walk(directory) {
	const entries = await readdir(directory, { withFileTypes: true });
	const files = [];
	for (const entry of entries) {
		const absolute = path.join(directory, entry.name);
		if (entry.isDirectory()) files.push(...await walk(absolute));
		else files.push(absolute);
	}
	return files;
}

function normalizePath(value) {
	const pathname = value.split(/[?#]/, 1)[0].replace(/\\+/g, '/');
	if (!pathname.startsWith('/')) return null;
	const normalized = pathname.replace(/\/+/g, '/').replace(/\/+$/, '');
	return normalized || '/';
}

function decodeEntities(value) {
	const entities = new Map([
		['&amp;', String.fromCharCode(38)],
		['&quot;', String.fromCharCode(34)],
		['&#39;', String.fromCharCode(39)],
		['&apos;', String.fromCharCode(39)],
		['&lt;', String.fromCharCode(60)],
		['&gt;', String.fromCharCode(62)],
	]);
	return value
		.replace(/&(?:amp|quot|#39|apos|lt|gt);/g, (entity) => entities.get(entity) ?? entity)
		.replace(/\s+/g, ' ')
		.trim();
}

function textFromHtml(value) {
	return decodeEntities(value
		.replace(/<script\b[^>]*>[\s\S]*?<\/script[^>]*>/gi, ' ')
		.replace(/<style\b[^>]*>[\s\S]*?<\/style[^>]*>/gi, ' ')
		.replace(/<[^>]+>/g, ' '));
}

function firstMatch(html, expression) {
	return html.match(expression)?.[1] ? decodeEntities(html.match(expression)[1]) : '';
}

// Métrica separada para links de artigos: o total do CSV inclui navegação global.
function editorialArticleHtml(html) {
	const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? '';
	return main.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1] ?? main;
}

function internalTargets(html) {
	return [...html.matchAll(/\bhref="([^"]+)"/gi)]
		.map((match) => normalizePath(match[1]))
		.filter(Boolean);
}

function routeFromHtmlFile(file) {
	const relative = path.relative(distRoot, file).replaceAll('\\', '/');
	if (!relative.endsWith('.html')) return null;
	if (relative === '404.html') return '/404';
	if (relative === 'index.html') return '/';
	if (relative.endsWith('/index.html')) return normalizePath(`/${relative.slice(0, -'/index.html'.length)}`);
	return normalizePath(`/${relative.slice(0, -'.html'.length)}`);
}

function classify(route) {
	if (route === '/') return { type: 'home', theme: 'empresa e engenharia', intent: 'comercial/navegacional', service: '' };
	if (route === '/blog') return { type: 'blog-index', theme: 'conteúdo técnico', intent: 'navegacional/informacional', service: '' };
	if (route.startsWith('/blog/')) return { type: 'blog', theme: themeFor(route), intent: 'informacional', service: serviceFor(route) };
	if (route === '/servicos') return { type: 'service-catalog', theme: 'catálogo de serviços', intent: 'comercial/navegacional', service: '' };
	if (route.startsWith('/servicos/')) return { type: 'service', theme: themeFor(route), intent: 'comercial', service: serviceFor(route) };
	if (route === '/sobre-nos' || route === '/contato' || route === '/mapa-site') return { type: 'institutional', theme: themeFor(route), intent: 'navegacional/comercial', service: '' };
	if (route.startsWith('/politica-') || route === '/termos-de-uso') return { type: 'legal', theme: 'privacidade e uso do site', intent: 'navegacional', service: '' };
	if (route === '/404' || route === '/informacoes') return { type: 'legacy/redirect', theme: 'rota legada', intent: 'navegacional', service: '' };
	return { type: 'marketing', theme: themeFor(route), intent: 'comercial', service: serviceFor(route) };
}

function themeFor(route) {
	if (/pgr|pcmso|ltcat|laudo|peric|inspec|sst|seguranca|saude|esocial|nr-|treinamento|higiene|aep|aet|acidente/i.test(route)) return 'SST e saúde ocupacional';
	if (/eletric|spda|cabeamento|instalac/i.test(route)) return 'engenharia elétrica';
	if (/incendio|bombeiro|avcb|clcb|ppcip/i.test(route)) return 'prevenção contra incêndio';
	if (/elevador|plataforma|escada|elevacao/i.test(route)) return 'movimento vertical e acessibilidade';
	if (/ambiental|residu/i.test(route)) return 'gestão ambiental';
	if (/qualidade/i.test(route)) return 'gestão da qualidade';
	if (/medicoes|ruido|calor|iluminamento/i.test(route)) return 'avaliações ambientais ocupacionais';
	if (/sobre|contato|mapa/i.test(route)) return 'institucional';
	return 'tema comercial a confirmar';
}

function serviceFor(route) {
	const map = [
		[/pgr/i, 'PGR/GRO'],
		[/pcmso|aso/i, 'PCMSO e ASOs'],
		[/ltcat|ppp/i, 'LTCAT/PPP'],
		[/esocial/i, 'eSocial SST'],
		[/peric|insalubridade/i, 'Perícias de insalubridade e periculosidade'],
		[/incendio|bombeiro|avcb|clcb|ppcip/i, 'Projetos e regularização contra incêndio'],
		[/eletric|spda|cabeamento|instalac/i, 'Projetos e instalações elétricas'],
		[/elevador|plataforma|escada|elevacao/i, 'Movimento vertical e acessibilidade'],
		[/ambiental|residu/i, 'Gestão ambiental'],
		[/qualidade/i, 'Gestão da qualidade'],
		[/treinamento|nr-/i, 'Treinamentos de NRs'],
		[/medicoes|ruido|calor|iluminamento/i, 'Avaliações e medições ambientais'],
	];
	return map.find(([pattern]) => pattern.test(route))?.[1] ?? '';
}

function sourceFor(route, sourceMap) {
	return sourceMap.get(route) ?? `dist${route === '/' ? '/index.html' : `${route}/index.html`}`;
}

function csvCell(value) {
	return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

const sourceMap = new Map();
for (const contentRoot of contentRoots) {
	const directory = path.join(root, contentRoot);
	for (const file of await walk(directory)) {
		if (!file.endsWith('.ts')) continue;
		const source = await readFile(file, 'utf8');
		const match = source.match(/\bpath\s*:\s*['"]([^'"]+)['"]/);
		if (match) sourceMap.set(normalizePath(match[1]), file.replace(`${root}${path.sep}`, '').replaceAll('\\', '/'));
	}
}

const htmlFiles = (await walk(distRoot)).filter((file) => file.endsWith('.html'));
const pages = [];
for (const file of htmlFiles) {
	const route = routeFromHtmlFile(file);
	if (!route || route === '/404') continue;
	const html = await readFile(file, 'utf8');
	const title = firstMatch(html, /<title>([\s\S]*?)<\/title>/i);
	const description = firstMatch(html, /<meta\s+name="description"\s+content="([^"]*)"/i);
	const canonical = firstMatch(html, /<link\s+rel="canonical"\s+href="([^"]*)"/i);
	const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((match) => textFromHtml(match[1]));
	const imageTags = [...html.matchAll(/<img\b[^>]*>/gi)].map((match) => match[0]);
	const missingAlt = imageTags.filter((tag) => !/\balt(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?(?=\s|\/?>)/i.test(tag)).length;
	const internalLinks = internalTargets(html);
	const articleLinks = route.startsWith('/blog/') ? internalTargets(editorialArticleHtml(html)) : [];
	const words = textFromHtml(html).split(/\s+/).filter(Boolean).length;
	const metaProblems = [];
	if (!title) metaProblems.push('title ausente');
	if (!description) metaProblems.push('meta description ausente');
	if (!canonical) metaProblems.push('canonical ausente');
	if (description.includes('...') || description.includes('…')) metaProblems.push('description truncada');
	if (description && description.length < 90) metaProblems.push('description curta');
	if (h1s.length !== 1) metaProblems.push(`${h1s.length} H1 renderizado(s)`);
	if (missingAlt > 0) metaProblems.push(`${missingAlt} imagem(ns) sem alt`);
	const riskText = textFromHtml(html);
	if (/melhor empresa|líder absoluta|empresa renomada|escolha certa|garantindo a conformidade|cumprindo todas as normas|anos de atuação|especialistas reconhecidos|oferece serviços especializados/i.test(riskText)) {
		metaProblems.push('afirmação comercial depende de validação');
	}
	const classified = classify(route);
	const strategyCandidate = classified.type === 'marketing' && /preco|orcamento|valor|empresa|bh|belo-horizonte/i.test(route)
		? 'sobreposição estratégica candidata; não prova de canibalização'
		: '';
	if (strategyCandidate) metaProblems.push(strategyCandidate);
	const quality = metaProblems.length === 0 ? 'baseline técnico sem achado automático' : 'requer revisão dirigida';
	const priority = metaProblems.some((problem) => /ausente|H1|afirmação comercial/.test(problem)) ? 'P1' : metaProblems.length ? 'P2' : 'P3';
	const action = metaProblems.some((problem) => /afirmação comercial/.test(problem))
		? 'validar com proprietário antes de editar'
		: metaProblems.length ? 'revisar mantendo URL' : 'manter e monitorar';
	const dependency = metaProblems.some((problem) => /afirmação comercial/.test(problem))
		? 'confirmação comercial/documental da capacidade e do escopo'
		: strategyCandidate ? 'Search Console/Analytics e decisão comercial' : '';
	pages.push({
		route,
		type: classified.type,
		title,
		h1: h1s[0] ?? '',
		description,
		canonical,
		theme: classified.theme,
		intent: classified.intent,
		service: classified.service,
		quality,
		problems: metaProblems.join(' | '),
		priority,
		action,
		evidence: sourceFor(route, sourceMap),
		dependency,
		words,
		imageCount: imageTags.length,
		missingAlt,
		internalLinks: internalLinks.length,
		articleLinks: articleLinks.length,
	});
}

pages.sort((a, b) => a.route.localeCompare(b.route, 'pt-BR'));
const routeSet = new Set(pages.map((page) => page.route));
const inbound = new Map(pages.map((page) => [page.route, 0]));
const inboundFromArticles = new Map(pages.map((page) => [page.route, 0]));
for (const file of htmlFiles) {
	const route = routeFromHtmlFile(file);
	if (!route || route === '/404') continue;
	const html = await readFile(file, 'utf8');
	for (const target of internalTargets(html)) {
		if (routeSet.has(target)) inbound.set(target, (inbound.get(target) ?? 0) + 1);
	}
	if (route.startsWith('/blog/')) {
		for (const target of internalTargets(editorialArticleHtml(html))) {
			if (routeSet.has(target)) inboundFromArticles.set(target, (inboundFromArticles.get(target) ?? 0) + 1);
		}
	}
}
const orphanRoutes = [...inbound.entries()].filter(([, count]) => count === 0).map(([route]) => route);
for (const page of pages) {
	if (orphanRoutes.includes(page.route)) {
		page.problems = [page.problems, 'sem link interno detectado no HTML compilado'].filter(Boolean).join(' | ');
		if (page.priority === 'P3') page.priority = 'P2';
		if (page.action === 'manter e monitorar') page.action = 'revisar arquitetura de links';
	}
}

const blogArticleCounts = pages.filter((page) => page.type === 'blog').map((page) => page.articleLinks);
const blogArticleRange = blogArticleCounts.length
	? `${Math.min(...blogArticleCounts)} a ${Math.max(...blogArticleCounts)}`
	: 'não disponível';
const pagesLinkedFromBlogBodies = [...inboundFromArticles.values()].filter((count) => count > 0).length;

const duplicateTitles = new Map();
for (const page of pages) {
	if (!page.title) continue;
	const key = page.title.toLocaleLowerCase('pt-BR');
	duplicateTitles.set(key, [...(duplicateTitles.get(key) ?? []), page.route]);
}
const duplicateGroups = [...duplicateTitles.values()].filter((routes) => routes.length > 1);
const headers = ['URL', 'Tipo', 'Título', 'H1', 'Descrição', 'Canonical', 'Tema', 'Intenção', 'Serviço associado', 'Qualidade', 'Problemas', 'Prioridade', 'Ação', 'Evidência', 'Dependência', 'Palavras renderizadas', 'Imagens', 'Imagens sem alt', 'Links internos'];
const csv = [headers.map(csvCell).join(','), ...pages.map((page) => [
	page.route, page.type, page.title, page.h1, page.description, page.canonical, page.theme, page.intent, page.service,
		page.quality, page.problems, page.priority, page.action, page.evidence, page.dependency, page.words, page.imageCount,
		page.missingAlt, page.internalLinks,
].map(csvCell).join(','))].join('\n') + '\n';

const byType = Object.entries(Object.groupBy(pages, (page) => page.type)).map(([type, values]) => `| ${type} | ${values.length} |`).join('\n');
const byPriority = Object.entries(Object.groupBy(pages, (page) => page.priority)).map(([priority, values]) => `| ${priority} | ${values.length} |`).join('\n');
const flagged = pages.filter((page) => page.problems).slice(0, 40).map((page) => `| ${page.route} | ${page.priority} | ${page.problems.replaceAll('|', '/')} | ${page.evidence} |`).join('\n');
const report = `# Inventário editorial e SEO — Fase 7

Gerado em ${new Date().toISOString().slice(0, 10)} a partir do build local de \`origin/main\` e dos arquivos de conteúdo. O CSV anexo contém uma linha por rota HTML auditada.

## Escopo e critérios

- Foram consideradas ${pages.length} rotas HTML de conteúdo; o \`404.html\` foi excluído do inventário editorial.
- Metadados, H1, canonical, imagens, links e contagem textual foram lidos do HTML compilado, não inferidos apenas do TypeScript.
- \`baseline técnico sem achado automático\` significa que os checks mecânicos deste inventário não encontraram ausência ou padrão de risco; não significa aprovação jurídica, comercial ou de UX.
- \`afirmação comercial depende de validação\` é um alerta de revisão, não uma conclusão de falsidade.
- Candidatos de sobreposição por \`preço\`, \`orçamento\`, localização ou \`empresa\` não são tratados como canibalização sem dados de Search Console/Analytics e revisão de intenção.

## Contagem

| Tipo | Páginas |
|---|---:|
${byType}

| Prioridade automática | Páginas |
|---|---:|
${byPriority}

- Títulos duplicados exatos: ${duplicateGroups.length} grupos.
- Rotas sem link interno encontrado no HTML compilado: ${orphanRoutes.length}.
- O relatório não remove nem redireciona páginas.

## Qualidade da medição de links

- A coluna **Links internos** do CSV conta links em todo o HTML, incluindo menu, rodapé e componentes compartilhados. Não equivale a referências editoriais nem a links únicos.
- Em separado, links internos extraídos de regiões \`<article>\` nas páginas de blog (fallback para \`<main>\`): **${blogArticleRange}** por artigo; componentes dentro do artigo podem ser incluídos e a relevância precisa de revisão contextual.
- Páginas com ao menos um inbound vindo dessas regiões dos artigos: **${pagesLinkedFromBlogBodies}**. Não representa cliques nem comprova relação semântica.
- Uma rota sem inbound no HTML não é necessariamente inacessível aos buscadores, e links globais de navegação não provam relação editorial.

## Amostra priorizada de alertas

| URL | Prioridade | Problemas detectados | Evidência |
|---|---|---|---|
${flagged || '| Nenhum alerta automático | — | — | — |'}

## Limites

O inventário não prova capacidade técnica, autorização de uso de imagem, posição no Google, tráfego, conversão, vínculo profissional, certificação ou vigência normativa. Esses itens estão documentados em \`fase7-commercial-validation.md\` e no relatório final da fase.
`;

await mkdir(outputDir, { recursive: true });
await writeFile(path.join(outputDir, 'fase7-content-inventory.csv'), csv, 'utf8');
await writeFile(path.join(outputDir, 'fase7-content-inventory.md'), report, 'utf8');
console.log(`[fase7-inventory] PASS: ${pages.length} páginas, ${duplicateGroups.length} grupos de títulos duplicados e ${orphanRoutes.length} rotas sem inbound detectado.`);
