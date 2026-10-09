import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };
const config = await readFile('public/.htaccess', 'utf8');
const header = (name) => config.match(new RegExp(`^\\s*Header always set ${name} "([^"]+)"`, 'm'))?.[1] ?? '';
const enforced = header('Content-Security-Policy');
const reportOnly = header('Content-Security-Policy-Report-Only');

check(Boolean(enforced), 'A CSP atualmente enforced deve ser preservada.');
check(Boolean(reportOnly), 'A CSP candidata deve permanecer em Report-Only.');
check(reportOnly.includes("default-src 'self'") && reportOnly.includes("script-src 'self'"), 'CSP candidata deve restringir default/script a self.');
check(reportOnly.includes("form-action 'self'") && reportOnly.includes("img-src 'self' data:"), 'CSP candidata deve restringir forms e imagens.');
check(reportOnly.includes('https://fonts.googleapis.com') && reportOnly.includes('https://fonts.gstatic.com'), 'A CSP candidata deve permitir somente as origens Google Fonts realmente carregadas.');
check(!/script-src[^;]*'unsafe-inline'|script-src[^;]*'unsafe-eval'/.test(reportOnly), 'A CSP candidata não pode liberar scripts inline ou eval.');
check(reportOnly.includes("style-src-attr 'unsafe-inline'") && !/(^|;)\s*style-src\s+[^;]*'unsafe-inline'/.test(reportOnly), 'A exceção deve ficar limitada aos atributos de estilo existentes.');
check(!/\breport-(?:uri|to)\b/i.test(reportOnly), 'Não declare collector CSP inexistente.');
check(/Strict-Transport-Security "max-age=300"/.test(config), 'HSTS candidate deve começar em 300 segundos.');
check(!/Strict-Transport-Security[^\r\n]*(?:includeSubDomains|preload)/i.test(config), 'Não usar includeSubDomains/preload sem auditoria específica.');
check(/RewriteRule \^ https:\/\/ajnengenharia\.com\.br%\{REQUEST_URI\} \[R=302,L,NE\]/.test(config), 'O redirect deve ser temporário durante o teste controlado.');

async function walk(directory) {
	const entries = await readdir(directory, { withFileTypes: true });
	const files = [];
	for (const entry of entries) {
		const path = join(directory, entry.name);
		if (entry.isDirectory()) files.push(...await walk(path));
		else if (/\.(html|css)$/.test(entry.name)) files.push(path);
	}
	return files;
}

const artifacts = await walk('dist').catch(() => []);
const htmlFiles = artifacts.filter((path) => path.endsWith('.html'));
check(htmlFiles.length > 0, 'Execute o build antes da auditoria de compatibilidade CSP.');
const productionOrigin = 'https://ajnengenharia.com.br';
for (const path of artifacts) {
	const body = await readFile(path, 'utf8');
	if (path.endsWith('.css')) {
		for (const [, url] of body.matchAll(/url\(["']?(https?:\/\/[^"')]+)["']?\)/gi)) {
			const origin = new URL(url).origin;
			check(origin === 'https://fonts.gstatic.com', `${path}: origem CSS não permitida pela CSP: ${origin}`);
		}
		continue;
	}
	for (const [, tag] of body.matchAll(/<(?:script|img|source|link)\b[^>]*>/gi)) {
		const isScript = /^<script\b/i.test(tag);
		const isImage = /^(?:<img|<source)\b/i.test(tag);
		const isStylesheet = /^<link\b/i.test(tag) && /\brel=["'][^"']*stylesheet/i.test(tag);
		if (!isScript && !isImage && !isStylesheet) continue;
		const attr = isImage ? /\b(?:src|srcset)=["']([^"']+)["']/gi : /\b(?:src|href)=["']([^"']+)["']/gi;
		for (const [, value] of tag.matchAll(attr)) {
			for (const candidate of value.split(/,\s*/)) {
				const rawUrl = candidate.trim().split(/\s+/)[0];
				if (!rawUrl || rawUrl.startsWith('data:')) {
					check(isImage && rawUrl.startsWith('data:'), `${path}: data URL fora de imagem.`);
					continue;
				}
				const url = new URL(rawUrl, productionOrigin);
				const allowedFonts = isStylesheet && url.origin === 'https://fonts.googleapis.com' || /\b(?:href|src)=["']https:\/\/fonts\.gstatic\.com\//i.test(tag);
				check(url.origin === productionOrigin || allowedFonts, `${path}: recurso externo não permitido pela CSP: ${url.origin}`);
			}
		}
	}
}

if (failures.length) {
	failures.forEach((message) => console.error(`[hosting-config][FAIL] ${message}`));
	process.exitCode = 1;
} else {
	console.log(`[hosting-config] PASS: CSP enforced preservada, candidata em Report-Only e ${htmlFiles.length} HTML + CSS verificados. Não comprova configuração live da Hostinger.`);
}
