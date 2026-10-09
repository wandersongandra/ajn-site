import assert from 'node:assert/strict';
import test from 'node:test';
import { auditLiveSecurity } from './audit-live-security.mjs';

const base = 'https://ajnengenharia.com.br';
const www = 'https://www.ajnengenharia.com.br';
const pages = ['/', '/servicos/', '/contato/', '/blog/'];
const headers = {
	'strict-transport-security': 'max-age=300',
	'content-security-policy': "default-src 'self'; script-src 'self'",
	'content-security-policy-report-only': "default-src 'self'; script-src 'self'; form-action 'self'; img-src 'self' data:",
	'x-content-type-options': 'nosniff',
	'x-frame-options': 'DENY',
	'referrer-policy': 'strict-origin-when-cross-origin',
	'permissions-policy': 'geolocation=()',
};
function mockFetch({ override = {} } = {}) {
	const calls = [];
	async function fake(url, options) {
		calls.push({ url, options });
		assert.equal(options.method, 'GET');
		assert.equal(options.redirect, 'manual');
		if (override[url]) return override[url];
		if (pages.some(path => url === base + path)) {
			return new Response('<!doctype html><link rel="canonical" href="' + url +
				'"><meta name="robots" content="index,follow">', { status: 200, headers });
		}
		if (url.startsWith(www + '/')) {
			const path = url.slice(www.length);
			return new Response('', { status: 302, headers: { location: base + path } });
		}
		if (url === 'http://ajnengenharia.com.br/') {
			return new Response('', { status: 301, headers: { location: base + '/' } });
		}
		throw new Error('Unexpected URL ' + url);
	}
	return { fake, calls };
}

test('audit live: cenário íntegro usa somente GET e não segue redirecionamentos', async () => {
	const { fake, calls } = mockFetch();
	const result = await auditLiveSecurity({ fetchImpl: fake });
	assert.equal(result.ok, true, result.errors.join('\n'));
	assert.equal(calls.length, 7);
	assert.ok(calls.every(call => call.options.redirect === 'manual' && call.options.method === 'GET'));
});

test('audit live: falha se o HSTS ou CSP em Report-Only desaparecer', async () => {
	const wrong = { ...headers, 'strict-transport-security': 'max-age=0' };
	delete wrong['content-security-policy-report-only'];
	const { fake } = mockFetch({ override: { [base + '/']: new Response(
		'<link rel="canonical" href="' + base + '/">', { status: 200, headers: wrong },
	) } });
	const result = await auditLiveSecurity({ fetchImpl: fake });
	assert.equal(result.ok, false);
	assert.ok(result.errors.some(error => error.includes('HSTS')));
	assert.ok(result.errors.some(error => error.includes('Report-Only')));
});

test('audit live: rejeita redirecionamento para host externo e query perdida', async () => {
	const { fake } = mockFetch({ override: {
		[www + '/']: new Response('', { status: 302, headers: { location: 'https://evil.example/' } }),
		[www + '/contato/?from=security-smoke&path=%2Fblog']:
			new Response('', { status: 302, headers: { location: base + '/contato/' } }),
	} });
	const result = await auditLiveSecurity({ fetchImpl: fake });
	assert.equal(result.ok, false);
	assert.ok(result.errors.some(error => error.includes('Location') || error.includes('destino')));
	assert.ok(result.errors.length >= 2);
});

test('audit live: rejeita noindex inesperado e HSTS preload/atraso', async () => {
	const { fake } = mockFetch({ override: { [base + '/']: new Response(
		'<link rel="canonical" href="' + base + '/"><meta name="robots" content="noindex,nofollow">',
		{ status: 200, headers: { ...headers, 'strict-transport-security': 'max-age=31536000; includeSubDomains; preload' } },
	) } });
	const result = await auditLiveSecurity({ fetchImpl: fake });
	assert.equal(result.ok, false);
	assert.ok(result.errors.some(error => error.includes('noindex')));
	assert.ok(result.errors.some(error => error.includes('subdomínios/preload')));
});
