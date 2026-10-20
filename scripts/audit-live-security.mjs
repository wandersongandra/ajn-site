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
	function inspectRedirect(response, from) {
		if (!response) return null;
		assert(response.status === 301, from + ': redirecionamento permanente deveria ser 301 (observado ' + response.status + ').');
		const location = response.headers.get('location');
		if (!location) { errors.push(from + ': Location ausente.'); return null; }
		try { return new URL(location, from).href; }
		catch { errors.push(from + ': Location inválido.'); return null; }
	}
	async function followCanonicalRedirects(start, expected) {
		const allowedHosts = new Set([new URL(SITE).hostname, new URL(WWW).hostname]);
		const visited = new Set();
		let current = start;
		for (let hop = 0; hop <= 3; hop += 1) {
			if (visited.has(current)) {
				errors.push(start + ': loop de redirecionamento detectado em ' + current + '.');
				return;
			}
			visited.add(current);
			const response = await get(current);
			if (!response) return;
			if (response.status === 200) {
				assert(current === expected, start + ': destino final diferente do canonical (' + current + ').');
				return;
			}
			const next = inspectRedirect(response, current);
			if (!next) return;
			const nextUrl = new URL(next);
			assert(nextUrl.protocol === 'https:' && allowedHosts.has(nextUrl.hostname),
				current + ': redirecionamento saiu dos hosts HTTPS permitidos (' + next + ').');
			if (nextUrl.protocol !== 'https:' || !allowedHosts.has(nextUrl.hostname)) return;
			current = next;
		}
		errors.push(start + ': mais de três saltos de redirecionamento.');
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
		await followCanonicalRedirects(WWW + path, SITE + path);
	}
	await followCanonicalRedirects('http://ajnengenharia.com.br/', SITE + '/');
	await followCanonicalRedirects('http://www.ajnengenharia.com.br/', SITE + '/');
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
