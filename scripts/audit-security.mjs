import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { extractScriptElements } from './security-html.mjs';

const issues = [];

function check(condition, message) {
	if (!condition) issues.push(message);
}

async function walk(directory) {
	const entries = await readdir(directory, { withFileTypes: true });
	const files = [];
	for (const entry of entries) {
		const path = join(directory, entry.name);
		if (entry.isDirectory()) files.push(...await walk(path));
		else if (/\.(astro|ts|js|mjs|html)$/.test(entry.name)) files.push(path);
	}
	return files;
}

const sourceFiles = await walk('src');
const source = await Promise.all(sourceFiles.map(async (path) => ({ path, text: await readFile(path, 'utf8') })));

const dangerousPatterns = [
	[/\.innerHTML\s*=/, 'innerHTML'],
	[/\.outerHTML\s*=/, 'outerHTML'],
	[/insertAdjacentHTML\s*\(/, 'insertAdjacentHTML'],
	[/document\.write(?:ln)?\s*\(/, 'document.write'],
	[/\beval\s*\(/, 'eval'],
	[/\bnew\s+Function\s*\(/, 'new Function'],
	[/\b(?:localStorage|sessionStorage)\b/, 'Web Storage'],
];
for (const { path, text } of source) {
	for (const [pattern, label] of dangerousPatterns) {
		check(!pattern.test(text), `${path} contém padrão não permitido: ${label}.`);
	}
	if (text.includes('set:html=') && !text.includes('serializeJsonLd(')) {
		issues.push(`${path} usa set:html sem serializeJsonLd().`);
	}
	check(!/<script(?![^>]*(?:src=|type=["']application\/ld\+json["']))[^>]*>/i.test(text), `${path} contém script inline executável.`);
}

const distFiles = await walk('dist').catch(() => []);
const htmlFiles = distFiles.filter((path) => path.endsWith('.html'));
check(htmlFiles.length > 0, 'Execute npm run build antes da auditoria dos artefatos HTML.');
for (const path of htmlFiles) {
	const html = await readFile(path, 'utf8');
	const scripts = extractScriptElements(html);
	let jsonLdCount = 0;
	for (const { attributes, body } of scripts) {
		if (/\btype=["']application\/ld\+json["']/i.test(attributes)) {
			jsonLdCount += 1;
			try {
				JSON.parse(body);
			} catch {
				issues.push(`${path} contém JSON-LD inválido.`);
			}
		} else if (!/\bsrc\s*=/i.test(attributes) && body.trim()) {
			issues.push(`${path} contém script executável inline.`);
		}
	}
	const isRedirectDocument = /<meta\s+http-equiv=["']refresh["']/i.test(html);
	check(jsonLdCount > 0 || isRedirectDocument, `${path} não contém dados JSON-LD renderizados.`);
	check(!/\bhref=["']\s*(?:javascript|data|vbscript|file|blob):/i.test(html), `${path} contém link com protocolo não autorizado.`);
}

const siteOriginReferences = source.filter(({ text }) => text.includes('PUBLIC_SITE_ORIGIN'));
check(siteOriginReferences.length === 1 && siteOriginReferences[0].path.replaceAll('\\', '/').endsWith('src/utils/site.ts'), 'PUBLIC_SITE_ORIGIN deve ser centralizado em src/utils/site.ts.');

if (issues.length > 0) {
	issues.forEach((issue) => console.error(`[security][FAIL] ${issue}`));
	process.exitCode = 1;
} else {
	console.log(`[security] PASS: sinks DOM, links, scripts e JSON-LD auditados em ${source.length} fontes e ${htmlFiles.length} páginas compiladas.`);
}
