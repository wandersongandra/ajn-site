import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const SITE = 'https://ajnengenharia.com.br';
const WWW = 'https://www.ajnengenharia.com.br';
const PATHS = ['/', '/servicos/', '/contato/', '/blog/'];
const DEFAULT_TIMEOUT_MS = 12000;

/** GET-only, redirect-aware audit. Safe for manual CI and for mocked unit tests. */
export async function auditLiveSecurity({ fetchImpl = fetch, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
	const errors = [];
	const observations = [];
	async function get(url) {
		try {
			const response = await fetchImpl(url, {
				method: 'GET',
				redirect: 'manual',
				signal: AbortSignal.timeout(timeoutMs),
			});
			observations.push({ url, status: response.status });
			return response;
		} catch (error) {
			errors.push(url + ': falha na requisição (' + String(error?.message ?? error) + ')');
			return null;
		}
	}
	function assert(ok, message) {
		if (!ok) errors.push(message);
	}
	function inspectSecurityHeaders(response, url) {
		if (!response) return;
		const headers = response.headers;
		const hsts = headers.get('strict-transport-security') ?? '';
		const hstsMatch = /(?:^|;)\s*max-age\s*=\s*(\d+)/i.exec(hsts);
		assert(hstsMatch !== null && Number(hstsMatch?.[1]) >= 300, url + ': HSTS max-age ausente ou inferior a 300s.');
		assert(!/(?:^|;)\s*(?:includesubdomains|preload)(?:;|$)/i.test(hsts), url + ': HSTS inclui subdomínios/preload sem validação.');
		const enforced = headers.get('content-security-policy') ?? '';
		const candidate = headers.get('content-security-policy-report-only') ?? '';
		assert(enforced.includes("script-src 'self'"), url + ': CSP enforced ausente ou diferente do baseline de scripts.');
		assert(candidate.includes("script-src 'self'") && candidate.includes("form-action 'self'") &&
			candidate.includes("img-src 'self' data:"), url + ': candidata CSP Report-Only ausente ou incompleta.');
		assert((headers.get('x-content-type-options') ?? '').toLowerCase() === 'nosniff', url + ': X-Content-Type-Options ausente.');
		assert((headers.get('x-frame-options') ?? '').toUpperCase() === 'DENY', url + ': X-Frame-Options diferente de DENY.');
		assert(Boolean(headers.get('referrer-policy')), url + ': Referrer-Policy ausente.');
		assert(Boolean(headers.get('permissions-policy')), url + ': Permissions-Policy ausente.');
	}
	function inspectRedirect(response, from, expected) {
		if (!response) return;
		assert(response.status === 302, from + ': redirecionamento temporário deveria ser 302 (observado ' + response.status + ').');
		const location = response.headers.get('location');
		if (!location) { errors.push(from + ': Location ausente.'); return; }
		let actual;
		try { actual = new URL(location, from).href; }
		catch { errors.push(from + ': Location inválido.'); return; }
		assert(actual === expected, from + ': destino, caminho ou query não corresponde ao canonical (' + actual + ').');
	}
	for (const path of PATHS) {
		const url = SITE + path;
		const response = await get(url);
		if (!response) continue;
		assert(response.status === 200, url + ': esperado HTTP 200.');
		if (response.status === 200) {
			inspectSecurityHeaders(response, url);
			const html = await response.text();
			assert(html.includes('rel="canonical" href="' + url + '"'), url + ': canonical diferente do domínio principal.');
			const robots = /<meta\s+name="robots"\s+content="([^"]+)"/i.exec(html)?.[1] ?? '';
			assert(!/\bnoindex\b/i.test(robots), url + ': noindex na página de produção.');
		}
	}
	const testPath = '/contato/?from=security-smoke&path=%2Fblog';
	for (const path of ['/', testPath]) {
		const from = WWW + path;
		inspectRedirect(await get(from), from, SITE + path);
	}
	const httpUrl = 'http://ajnengenharia.com.br/';
	const httpResult = await get(httpUrl);
	if (httpResult) {
		assert([301, 302, 307, 308].includes(httpResult.status), httpUrl + ': HTTP não redireciona para HTTPS.');
		const location = httpResult.headers.get('location');
		assert(Boolean(location) && new URL(location, httpUrl).href === SITE + '/',
			httpUrl + ': redirecionamento não aponta ao HTTPS canonical.');
	}
	return { ok: errors.length === 0, errors, observations };
}

async function main() {
	const result = await auditLiveSecurity();
	for (const row of result.observations) console.log('[live-security] GET ' + row.status + ' ' + row.url);
	if (!result.ok) {
		for (const error of result.errors) console.error('[live-security][FAIL] ' + error);
		process.exitCode = 1;
	} else {
		console.log('[live-security] PASS: HTTPS, HSTS, CSP, headers, indexação e redirecionamentos observados via HTTP; QA visual/CSP console permanece separado.');
	}
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
	await main();
}
