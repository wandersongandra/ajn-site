import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { extractScriptElements, getHtmlAttributeValue, hasExactHtmlAttribute, isJsonLdScript } from './security-html.mjs';
import { cspSourcesEqual, cspSourceIsExact, isAllowedResourceUrl, cspTokens } from './hosting-policy.mjs';
import { MAX_CSP_HEADER_BYTES, verifyCspStyleHashes } from './sync-csp-style-hashes.mjs';

const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };
const config = await readFile('public/.htaccess', 'utf8');
const configLines = config.split(/\r?\n/).map((line) => line.trim());
const header = (name) => config.match(new RegExp('^\\s*Header always set ' + name + ' "([^"]+)"', 'm'))?.[1] ?? '';
const enforced = header('Content-Security-Policy');

check(Boolean(enforced), 'A CSP enforced deve estar presente em public/.htaccess.');
check(
	Buffer.byteLength(enforced, 'utf8') <= MAX_CSP_HEADER_BYTES,
	`A CSP enforced (${Buffer.byteLength(enforced, 'utf8')} bytes) não pode exceder ${MAX_CSP_HEADER_BYTES} bytes.`
);
check(cspSourcesEqual(enforced, 'default-src', ["'self'"]), 'CSP enforced deve restringir default-src a self.');
check(
	cspSourcesEqual(enforced, 'script-src', ["'self'", 'https://challenges.cloudflare.com']),
	'CSP enforced deve restringir script-src a self e Turnstile.'
);
check(
	cspSourcesEqual(enforced, 'img-src', ["'self'", 'data:']),
	"CSP enforced deve restringir img-src a 'self' data: (sem https: aberto)."
);
check(
	cspSourcesEqual(enforced, 'font-src', ["'self'", 'data:']),
	"CSP enforced deve restringir font-src a 'self' data:."
);
check(
	cspSourcesEqual(enforced, 'connect-src', ["'self'", 'https://api.opengscgandra.tech', 'https://challenges.cloudflare.com']),
	'CSP deve permitir apenas a API same-origin, endpoint de contato AJN e Turnstile.'
);
check(
	cspSourcesEqual(enforced, 'frame-src', ['https://challenges.cloudflare.com']),
	'CSP enforced deve permitir frames apenas do Turnstile.'
);
const styleTokens = cspTokens(enforced, 'style-src') ?? [];
check(
	styleTokens.includes("'self'") &&
		styleTokens.includes("'unsafe-hashes'") &&
		!styleTokens.includes("'unsafe-inline'") &&
		styleTokens.some((t) => t.startsWith("'sha256-")),
	"CSP style-src deve usar 'self' 'unsafe-hashes' com hashes SHA-256 e sem 'unsafe-inline'."
);
check(
	cspSourcesEqual(enforced, 'base-uri', ["'self'"]) &&
		cspSourcesEqual(enforced, 'form-action', ["'self'"]) &&
		cspSourcesEqual(enforced, 'object-src', ["'none'"]) &&
		cspSourcesEqual(enforced, 'frame-ancestors', ["'none'"]),
	'CSP enforced deve restringir objetos, frames, form-action e base URI.'
);
check(
	!cspSourceIsExact(enforced, 'script-src', "'unsafe-inline'") &&
		!cspSourceIsExact(enforced, 'script-src', "'unsafe-eval'"),
	'CSP enforced não pode liberar scripts inline ou eval.'
);
const styleHashCheck = verifyCspStyleHashes();
check(styleHashCheck.ok, `Hashes style-src fora de sincronia: ${styleHashCheck.errors.join('; ')}`);
check(/Strict-Transport-Security "max-age=300"/.test(config), 'HSTS candidate deve começar em 300 segundos.');
check(!/Strict-Transport-Security[^\r\n]*(?:includeSubDomains|preload)/i.test(config),
	'Não usar includeSubDomains/preload sem auditoria específica.');
check(/RewriteRule \^ https:\/\/ajnengenharia\.com\.br%\{REQUEST_URI\} \[R=301,L,NE\]/.test(config),
	'O redirecionamento de www para o host canônico deve ser permanente após homologação.');
const careerRouteRules = [
	'RewriteRule ^api/index\\.php$ - [L]',
	'RewriteRule ^api(?:/.*)?$ api/index.php [QSA,L]',
	'RewriteRule ^carreiras/(?!talentos/?$|acompanhamento/?$|vaga/?$)([a-z0-9-]+)/?$ api/index.php [QSA,L]',
];
check(careerRouteRules.every((rule) => configLines.some((line) => line === rule)),
	'API e páginas dinâmicas de carreiras devem usar PHP local, sem redirecionamento externo.');
check(!config.includes('carreiras.ajnengenharia.com.br'), 'A hospedagem Premium não deve depender do Worker externo.');

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
				check(origin === productionOrigin, filepath + ': origem CSS não permitida pela CSP: ' + origin);
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
