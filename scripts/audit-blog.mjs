// Verificação estática do blog gerado pelo Astro.
// Executar depois de "npm run build": node scripts/audit-blog.mjs
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const blogDir = path.resolve('dist/blog');
const failures = [];
const report = { archiveCards: 0, articles: 0, responsiveImages: 0, descriptions: 0 };
const articleTitles = new Map();
const descriptions = new Map();

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
		if (!html.includes('id="blog-archive-grid"')) failures.push('Blog: grid não possui ID para navegação acessível.');
		if (!html.includes('data-blog-search')) failures.push('Blog: pesquisa não encontrada.');
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
		if (report.archiveCards !== 20) failures.push('Arquivo do blog: esperados 20 cards; obtidos ' + report.archiveCards);
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
	if (!route.includes('um-pouco-sobre-nos') && !/href=["']https:\/\/(?:www\.)?(?:gov\.br|planalto\.gov\.br)/.test(html)) {
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

if (report.articles !== 20) failures.push('Esperados 20 artigos HTML gerados, encontrados ' + report.articles);

if (failures.length) {
	for (const issue of failures) console.error('[blog][FAIL] ' + issue);
	process.exitCode = 1;
} else {
	console.log('[blog] PASS: ' + report.articles + ' artigos, ' + report.archiveCards
		+ ' cards, ' + report.descriptions + ' descrições e ' + report.responsiveImages + ' srcsets no arquivo.');
}
