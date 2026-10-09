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
		else if (/\.(astro|ts|js|mjs|html)$/.test(entry.name)) files.push(path);
	}
	return files;
}

const headers = await readFile('public/.htaccess', 'utf8').catch(() => '');
const headerValue = (name) => headers.match(new RegExp(`^\\s*Header always set ${name} "([^"]+)"`, 'm'))?.[1] ?? '';
const enforcedCsp = headerValue('Content-Security-Policy');
const reportOnlyCsp = headerValue('Content-Security-Policy-Report-Only');
const sourceFiles = await walk('src');
const source = await Promise.all(sourceFiles.map(async (path) => ({ path, text: await readFile(path, 'utf8') })));

check(Boolean(enforcedCsp), 'public/.htaccess não define Content-Security-Policy.');
check(Boolean(reportOnlyCsp), 'public/.htaccess não define política candidata Content-Security-Policy-Report-Only.');
check(reportOnlyCsp.includes("script-src 'self'"), 'CSP candidata deve restringir scripts a self.');
check(reportOnlyCsp.includes("form-action 'self'"), 'CSP candidata deve limitar submissões à própria origem.');
check(!/form-action[^;]*https?:/.test(reportOnlyCsp), 'CSP candidata não deve permitir submissões para qualquer host HTTPS.');
check(reportOnlyCsp.includes("img-src 'self' data:"), 'CSP candidata deve limitar imagens a recursos locais e data URLs.');
check(!/img-src[^;]*\shttps?:/.test(reportOnlyCsp), 'CSP candidata não deve permitir imagens de qualquer host HTTPS.');
check(!/script-src[^;]*'unsafe-inline'/.test(reportOnlyCsp) && !reportOnlyCsp.includes("'unsafe-eval'"), 'CSP candidata não deve liberar scripts inline ou eval.');
check(reportOnlyCsp.includes("style-src-attr 'unsafe-inline'"), 'CSP candidata deve declarar a exceção limitada aos atributos de estilo existentes.');
check(!/(^|;)\s*style-src\s+[^;]*'unsafe-inline'/.test(reportOnlyCsp), 'style-src da candidata não deve liberar blocos inline.');
check(headers.includes('X-Content-Type-Options "nosniff"'), 'X-Content-Type-Options nosniff ausente.');
check(headers.includes('Strict-Transport-Security "max-age=300"'), 'HSTS inicial deve ser limitado a 300 segundos.');
check(!/Strict-Transport-Security[^\r\n]*(?:includeSubDomains|preload)/i.test(headers), 'HSTS não deve habilitar includeSubDomains ou preload sem auditoria específica.');
check(headers.includes('X-Frame-Options "DENY"'), 'X-Frame-Options DENY ausente.');
check(headers.includes('Referrer-Policy "strict-origin-when-cross-origin"'), 'Referrer-Policy restritiva ausente.');
check(headers.includes('Permissions-Policy'), 'Permissions-Policy ausente.');
check(headers.includes('RewriteCond %{HTTP_HOST} ^www\\.ajnengenharia\\.com\\.br(?::[0-9]+)?$ [NC]') &&
	headers.includes('RewriteRule ^ https://ajnengenharia.com.br%{REQUEST_URI} [R=301,L,NE]'), 'Redirecionamento 301 de www para o canonical apex ausente.');

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
	const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
	let jsonLdCount = 0;
	for (const [, attributes, body] of scripts) {
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
	console.log(`[security] PASS: CSP/HSTS, redirects, sinks DOM, links, scripts e JSON-LD auditados em ${source.length} fontes e ${htmlFiles.length} páginas compiladas.`);
}
