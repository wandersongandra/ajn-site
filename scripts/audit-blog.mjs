// Verificação estática do blog gerado pelo Astro.
// Executar depois de "npm run build": node scripts/audit-blog.mjs
import { readFile, readdir } from 'node:fs/promises';
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
		report.archiveCards = (html.match(/class=["']blog-card["']/g) ?? []).length;
		report.responsiveImages = (html.match(/\bsrcset=["']/g) ?? []).length;
		if (report.archiveCards !== 20) failures.push('Arquivo do blog: esperados 20 cards; obtidos ' + report.archiveCards);
		if (report.responsiveImages < 10) failures.push('Arquivo do blog: imagens responsivas insuficientes; confira widths/sizes.');
		if (h1Count !== 1) failures.push('Arquivo do blog: esperado um H1, encontrado ' + h1Count);
		continue;
	}

	report.articles++;
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
