import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const distDir = path.resolve('dist');
const failures = [];
const warnings = [];

async function walk(dir) {
	const entries = await readdir(dir, { withFileTypes: true });
	const files = [];
	for (const entry of entries) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) files.push(...await walk(full));
		else files.push(full);
	}
	return files;
}

function routeFromHtml(file) {
	const rel = path.relative(distDir, file).split(path.sep).join('/');
	if (rel === 'index.html') return '/';
	if (rel.endsWith('/index.html')) return '/' + rel.slice(0, -'/index.html'.length);
	return '/' + rel.replace(/\.html$/, '');
}

function normalizeInternalHref(href) {
	if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return null;
	if (/^https?:\/\//i.test(href)) return null;
	const clean = href.split('#')[0].split('?')[0];
	if (!clean) return '/';
	if (clean.startsWith('/images/') || clean.startsWith('/assets/') || clean.startsWith('/favicon')) return null;
	if (/\.[a-z0-9]{2,5}$/i.test(clean)) return null;
	return clean;
}

async function routeExists(href) {
	const normalized = href === '/' ? '/' : href.replace(/\/$/, '');
	const candidates = normalized === '/'
		? [path.join(distDir, 'index.html')]
		: [
			path.join(distDir, normalized.slice(1), 'index.html'),
			path.join(distDir, normalized.slice(1) + '.html'),
		];
	for (const candidate of candidates) {
		try {
			if ((await stat(candidate)).isFile()) return true;
		} catch {}
	}
	return false;
}

const htmlFiles = (await walk(distDir)).filter((file) => file.endsWith('.html'));
const titleMap = new Map();
const descriptionMap = new Map();

for (const file of htmlFiles) {
	const route = routeFromHtml(file);
	const html = await readFile(file, 'utf8');
	// O arquivo gerado pelo Astro é apenas o fallback de uma rota HTTP 301 no servidor.
	// Não deve ter H1/canonical próprios nem ser considerado página indexável.
	if (route === '/informacoes') {
		if (!/http-equiv=["']refresh["']/i.test(html) || !html.includes('/mapa-site')) {
			failures.push('/informacoes: fallback de redirect sem destino /mapa-site.');
		}
		continue;
	}
	const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim();
	const description = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i)?.[1]?.trim();
	const canonical = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)?.[1]?.trim();
	const robots = html.match(/<meta\s+name=["']robots["']\s+content=["']([^"']+)["']/i)?.[1]?.trim();
	const h1Count = (html.match(/<h1\b/gi) || []).length;

	if (!title) failures.push(`${route}: title ausente`);
	if (!description) failures.push(`${route}: description ausente`);
	if (!canonical) failures.push(`${route}: canonical ausente`);
	if (!robots) failures.push(`${route}: robots ausente`);
	if (h1Count !== 1) failures.push(`${route}: esperado 1 H1, encontrado ${h1Count}`);

	if (title) {
		if (titleMap.has(title)) warnings.push(`title duplicado: ${route} e ${titleMap.get(title)}`);
		else titleMap.set(title, route);
	}
	if (description) {
		if (descriptionMap.has(description)) warnings.push(`description duplicada: ${route} e ${descriptionMap.get(description)}`);
		else descriptionMap.set(description, route);
	}

	const hrefs = [...html.matchAll(/href=["']([^"']+)["']/gi)].map((match) => normalizeInternalHref(match[1])).filter(Boolean);
	for (const href of new Set(hrefs)) {
		if (!(await routeExists(href))) failures.push(`${route}: link interno sem destino gerado -> ${href}`);
	}
}

for (const warning of warnings) console.warn('[seo][WARN]', warning);
if (failures.length) {
	for (const failure of failures) console.error('[seo][FAIL]', failure);
	process.exitCode = 1;
} else {
	console.log(`[seo] PASS — ${htmlFiles.length} páginas auditadas`);
}
