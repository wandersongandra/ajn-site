import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

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
		else if (/\.(astro|ts|js|mjs)$/.test(entry.name)) files.push(path);
	}
	return files;
}

const headers = await readFile('public/.htaccess', 'utf8').catch(() => '');
const sourceFiles = await walk('src');
const source = await Promise.all(sourceFiles.map(async (path) => ({ path, text: await readFile(path, 'utf8') })));

check(headers.includes('Content-Security-Policy'), 'public/.htaccess não define Content-Security-Policy.');
check(headers.includes("script-src 'self'"), 'CSP deve restringir scripts a self.');
check(!/script-src[^;]*'unsafe-inline'/.test(headers) && !headers.includes("'unsafe-eval'"), 'CSP não deve liberar scripts inline ou eval.');
check(headers.includes("style-src-attr 'unsafe-inline'"), 'CSP deve declarar explicitamente a exceção limitada aos atributos de estilo existentes.');
check(!/(^|;)\s*style-src\s+[^;]*'unsafe-inline'/.test(headers), 'style-src não deve liberar blocos de estilo inline.');
check(headers.includes('X-Content-Type-Options "nosniff"'), 'X-Content-Type-Options nosniff ausente.');
check(headers.includes('X-Frame-Options "DENY"'), 'X-Frame-Options DENY ausente.');
check(headers.includes('Referrer-Policy "strict-origin-when-cross-origin"'), 'Referrer-Policy restritiva ausente.');
check(headers.includes('Permissions-Policy'), 'Permissions-Policy ausente.');

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

const siteOriginReferences = source.filter(({ text }) => text.includes('PUBLIC_SITE_ORIGIN'));
check(siteOriginReferences.length === 1 && siteOriginReferences[0].path.replaceAll('\\', '/').endsWith('src/utils/site.ts'), 'PUBLIC_SITE_ORIGIN deve ser centralizado em src/utils/site.ts.');

if (issues.length > 0) {
	issues.forEach((issue) => console.error(`[security][FAIL] ${issue}`));
	process.exitCode = 1;
} else {
	console.log(`[security] PASS: headers, CSP, sinks DOM, storage client-side e JSON-LD auditados em ${source.length} arquivos.`);
}
