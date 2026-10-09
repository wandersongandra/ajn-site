import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { extractScriptElements, getHtmlAttributeValue, hasExactHtmlAttribute, isJsonLdScript } from './security-html.mjs';
import { cspSourcesEqual, cspSourceIsExact, isAllowedResourceUrl } from './hosting-policy.mjs';

const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };
const config = await readFile('public/.htaccess', 'utf8');
const header = (name) => config.match(new RegExp('^\\s*Header always set ' + name + ' "([^"]+)"', 'm'))?.[1] ?? '';
const enforced = header('Content-Security-Policy');
const reportOnly = header('Content-Security-Policy-Report-Only');

check(Boolean(enforced), 'A CSP atualmente enforced deve ser preservada.');
check(Boolean(reportOnly), 'A CSP candidata deve permanecer em Report-Only.');
check(cspSourcesEqual(reportOnly, 'default-src', ["'self'"]) &&
	cspSourcesEqual(reportOnly, 'script-src', ["'self'", 'https://www.googletagmanager.com']), 'CSP candidata deve restringir default/script a self.');
check(cspSourcesEqual(reportOnly, 'form-action', ["'self'"]) &&
	cspSourcesEqual(reportOnly, 'img-src', ["'self'", 'data:', 'https://www.google-analytics.com', 'https://region1.google-analytics.com']), 'CSP candidata deve restringir forms e imagens.');
check(cspSourcesEqual(reportOnly, 'connect-src', ["'self'", 'https://www.google-analytics.com', 'https://region1.google-analytics.com']),
  'CSP candidata deve permitir apenas endpoints de medição GA4 conhecidos.');
check(cspSourcesEqual(reportOnly, 'style-src', ["'self'", 'https://fonts.googleapis.com']) &&
	cspSourcesEqual(reportOnly, 'font-src', ["'self'", 'https://fonts.gstatic.com']),
	'CSP candidata deve permitir somente as origens exatas de Google Fonts nos respectivos contextos.');
check(cspSourcesEqual(reportOnly, 'base-uri', ["'self'"]) &&
	cspSourcesEqual(reportOnly, 'object-src', ["'none'"]) &&
	cspSourcesEqual(reportOnly, 'frame-ancestors', ["'none'"]), 'CSP candidata deve restringir objetos, frames e base URI.');
check(!cspSourceIsExact(reportOnly, 'script-src', "'unsafe-inline'") &&
	!cspSourceIsExact(reportOnly, 'script-src', "'unsafe-eval'"),
	'CSP candidata não pode liberar scripts inline ou eval.');
check(cspSourcesEqual(reportOnly, 'style-src-attr', ["'unsafe-inline'"]),
	'A exceção deve ficar limitada aos atributos de estilo existentes.');
check(!/(?:^|;)\s*report-(?:uri|to)\s/i.test(reportOnly), 'Não declare collector CSP inexistente.');
check(/Strict-Transport-Security "max-age=300"/.test(config), 'HSTS candidate deve começar em 300 segundos.');
check(!/Strict-Transport-Security[^\r\n]*(?:includeSubDomains|preload)/i.test(config),
	'Não usar includeSubDomains/preload sem auditoria específica.');
check(/RewriteRule \^ https:\/\/ajnengenharia\.com\.br%\{REQUEST_URI\} \[R=302,L,NE\]/.test(config),
	'O redirect deve ser temporário durante o teste controlado.');

async function walk(directory) {
	const entries = await readdir(directory, { withFileTypes: true });
	const files = [];
	for (const entry of entries) {
		const filepath = join(directory, entry.name);
		if (entry.isDirectory()) files.push(...await walk(filepath));
		else if (/\.(html|css)$/.test(entry.name)) files.push(filepath);
	}
	return files;
}

const artifacts = await walk('dist').catch(() => []);
const htmlFiles = artifacts.filter(filepath => filepath.endsWith('.html'));
check(htmlFiles.length > 0, 'Execute o build antes da auditoria de compatibilidade CSP.');
const productionOrigin = 'https://ajnengenharia.com.br';
for (const filepath of artifacts) {
	const body = await readFile(filepath, 'utf8');
	if (filepath.endsWith('.css')) {
		for (const [, rawUrl] of body.matchAll(/url\(["']?(https?:\/\/[^"')]+)["']?\)/gi)) {
			try {
				const origin = new URL(rawUrl).origin;
				check(origin === 'https://fonts.gstatic.com', filepath + ': origem CSS não permitida pela CSP: ' + origin);
			} catch {
				failures.push(filepath + ': URL CSS malformada.');
			}
		}
		continue;
	}
	for (const script of extractScriptElements(body)) {
		if (isJsonLdScript(script.attributes)) {
			try { JSON.parse(script.body); }
			catch { failures.push(filepath + ': JSON-LD inválido ou não escapado corretamente.'); }
		} else if (!hasExactHtmlAttribute(script.attributes, 'src') && script.body.trim()) {
			failures.push(filepath + ': script inline executável incompatível com a candidata CSP.');
		}
	}
	// O recurso é validado individualmente pelo atributo real. data-src,
	// data-href e domínios presentes em outros atributos não autorizam a URL.
	for (const [, kindRaw, attributes] of body.matchAll(/<(script|img|source|link)\b([^>]*)>/gi)) {
		const kind = kindRaw.toLowerCase();
		const isImage = kind === 'img' || kind === 'source';
		const rel = getHtmlAttributeValue(attributes, 'rel') ?? '';
		const isStylesheet = kind === 'link' && rel.toLowerCase().split(/\s+/).includes('stylesheet');
		if (kind === 'link' && !isStylesheet) continue;
		const values = isImage
			? [getHtmlAttributeValue(attributes, 'src'), getHtmlAttributeValue(attributes, 'srcset')]
			: [getHtmlAttributeValue(attributes, kind === 'link' ? 'href' : 'src')];
		for (const value of values) {
			if (value === null) continue;
			const candidates = isImage && value.includes(',') ? value.split(/,\s*/) : [value];
			for (const candidate of candidates) {
				const rawUrl = candidate.trim().split(/\s+/)[0];
				check(isAllowedResourceUrl(rawUrl, kind, productionOrigin, isStylesheet),
					filepath + ': URL de recurso externo ou malformado não autorizada: ' + rawUrl);
			}
		}
	}
}

if (failures.length) {
	failures.forEach(message => console.error('[hosting-config][FAIL] ' + message));
	process.exitCode = 1;
} else {
	console.log('[hosting-config] PASS: CSP enforced preservada, candidata em Report-Only e ' +
		htmlFiles.length + ' HTML + CSS verificados. Não comprova configuração live da Hostinger.');
}
