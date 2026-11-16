import assert from 'node:assert/strict';
import http from 'node:http';
import test from 'node:test';
import { auditLiveSecurity } from './audit-live-security.mjs';
import { parseLiveAuditConfig, runLiveHardeningAudit } from './audit-live-hardening.mjs';

const base = 'https://ajnengenharia.com.br';
const www = 'https://www.ajnengenharia.com.br';
const pages = ['/', '/servicos/', '/contato/', '/blog/'];
const headers = {
	'strict-transport-security': 'max-age=300',
	'content-security-policy': "default-src 'self'; script-src 'self'; form-action 'self'; img-src 'self' data:",
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
		if (pages.some(path => url === base + path) || url.startsWith(base + '/contato/?')) {
			return new Response('<!doctype html><link rel="canonical" href="' + url +
				'"><meta name="robots" content="index,follow">', { status: 200, headers });
		}
		if (url.startsWith(www + '/')) {
			const path = url.slice(www.length);
			return new Response('', { status: 301, headers: { location: base + path } });
		}
		if (url === 'http://ajnengenharia.com.br/') {
			return new Response('', { status: 301, headers: { location: base + '/' } });
		}
		if (url === 'http://www.ajnengenharia.com.br/') {
			return new Response('', { status: 301, headers: { location: www + '/' } });
		}
		throw new Error('Unexpected URL ' + url);
	}
	return { fake, calls };
}

test('audit live: cenário íntegro usa somente GET e valida cada salto permanente', async () => {
	const { fake, calls } = mockFetch();
	const result = await auditLiveSecurity({ fetchImpl: fake });
	assert.equal(result.ok, true, result.errors.join('\n'));
	assert.equal(calls.length, 13);
	assert.ok(calls.every(call => call.options.redirect === 'manual' && call.options.method === 'GET'));
});

test('audit live: falha se HSTS enfraquecer, CSP perder restrição ou Report-Only reaparecer', async () => {
	const wrong = {
		...headers,
		'strict-transport-security': 'max-age=0',
		'content-security-policy': "default-src 'self'; script-src 'self' 'unsafe-inline'",
		'content-security-policy-report-only': "default-src 'self'",
	};
	const { fake } = mockFetch({ override: { [base + '/']: new Response(
		'<link rel="canonical" href="' + base + '/">', { status: 200, headers: wrong },
	) } });
	const result = await auditLiveSecurity({ fetchImpl: fake });
	assert.equal(result.ok, false);
	assert.ok(result.errors.some(error => error.includes('HSTS')));
	assert.ok(result.errors.some(error => error.includes('CSP enforced')));
	assert.ok(result.errors.some(error => error.includes('Report-Only')));
});

test('audit live: rejeita redirecionamento para host externo e query perdida', async () => {
	const { fake } = mockFetch({ override: {
		[www + '/']: new Response('', { status: 301, headers: { location: 'https://evil.example/' } }),
		[www + '/contato/?from=security-smoke&path=%2Fblog']:
			new Response('', { status: 301, headers: { location: base + '/contato/' } }),
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

test('audit-live-hardening recusa credenciais em CLI/URL e envia Basic Auth somente via ambiente', async () => {
	for (const badArgs of [
		['node', 'audit-live-hardening.mjs', '--url=https://staging.example', '--basic-auth=user:pass'],
		['node', 'audit-live-hardening.mjs', '--url=https://staging.example', '--user=admin'],
		['node', 'audit-live-hardening.mjs', '--url=https://staging.example', '-u=admin'],
		['node', 'audit-live-hardening.mjs', '--url=https://user:pass@staging.example'],
	]) {
		assert.throws(() => parseLiveAuditConfig(badArgs, {}), /somente por variáveis de ambiente|não podem ser passadas em argumentos|na URL/);
	}

	const expectedAuth = 'Basic ' + Buffer.from('staging_user:S3gUr0#2026:colon', 'utf8').toString('base64');
	const parsedEnv = parseLiveAuditConfig(
		['node', 'audit-live-hardening.mjs', '--url=https://staging.example'],
		{ LIVE_AUDIT_BASIC_AUTH: 'staging_user:S3gUr0#2026:colon' }
	);
	assert.deepEqual(parsedEnv.basicAuth, { user: 'staging_user', pass: 'S3gUr0#2026:colon' });

	const redirectMap = new Map([
		['/sitemap.xml', '/sitemap-index.xml'],
		['/informacoes', '/mapa-site'],
		['/empresa', '/sobre/'],
		['/fale-conosco', '/contato/'],
		['/projetos-eletricos-prediais', '/servicos'],
		['/regularizacao-avcb', '/servicos/regularizacao-de-imoveis-junto-ao-corpo-de-bombeiros/'],
	]);
	const seenAuthHeaders = [];
	const server = http.createServer((req, res) => {
		seenAuthHeaders.push(req.headers.authorization || '');
		if (req.headers.authorization !== expectedAuth) {
			res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="AJN Staging"' });
			res.end('Unauthorized');
			return;
		}
		const secHeaders = {
			'Strict-Transport-Security': 'max-age=300',
			'Content-Security-Policy': "default-src 'self'; script-src 'self'",
			'X-Content-Type-Options': 'nosniff',
			'Cross-Origin-Opener-Policy': 'same-origin',
			'Cross-Origin-Resource-Policy': 'same-origin',
			'Referrer-Policy': 'strict-origin-when-cross-origin',
		};
		if (req.url === '/api/health') {
			res.writeHead(200, { ...secHeaders, 'Content-Type': 'application/json' });
			res.end(JSON.stringify({ status: 'ok', environment: 'staging' }));
			return;
		}
		if (req.url === '/') {
			res.writeHead(200, { ...secHeaders, 'Content-Type': 'text/html' });
			res.end('<!doctype html><html><body>ok</body></html>');
			return;
		}
		if (req.url === '/api/admin/auth/login' && req.method === 'POST') {
			res.writeHead(401, { ...secHeaders, 'Content-Type': 'application/json' });
			res.end('{"error":"Credenciais inválidas."}');
			return;
		}
		if (req.url === '/api/admin/auth/logout' && req.method === 'POST') {
			res.writeHead(403, { ...secHeaders, 'Content-Type': 'application/json' });
			res.end('{"error":"Origem não autorizada."}');
			return;
		}
		if (redirectMap.has(req.url)) {
			res.writeHead(301, { ...secHeaders, Location: redirectMap.get(req.url) });
			res.end();
			return;
		}
		res.writeHead(403, secHeaders);
		res.end('Forbidden');
	});

	await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
	try {
		const { port } = server.address();
		const serverUrl = `http://127.0.0.1:${port}`;

		// Sem credenciais de ambiente -> falha com 401 do .htpasswd simulado
		const unauthResult = await runLiveHardeningAudit(serverUrl, { env: {} });
		assert.equal(unauthResult.ok, false);

		// Com LIVE_AUDIT_BASIC_USER / LIVE_AUDIT_BASIC_PASS -> checa GET / unauth = 401 + 24 controles autenticados (25/25)
		const okResult = await runLiveHardeningAudit(serverUrl, {
			env: { LIVE_AUDIT_BASIC_USER: 'staging_user', LIVE_AUDIT_BASIC_PASS: 'S3gUr0#2026:colon' },
		});
		assert.equal(okResult.ok, true, okResult.failures.join('\n'));
		assert.equal(okResult.checks.length, 25);
		assert.equal(okResult.checks[0].name, 'GET / sem credenciais = 401 Basic Auth');
		assert.equal(okResult.checks[0].ok, true);
		assert.equal(okResult.basicAuthEnabled, true);
		assert.ok(seenAuthHeaders.some((h) => h === expectedAuth));
		assert.equal(JSON.stringify(okResult.checks).includes('S3gUr0#2026'), false);
	} finally {
		await new Promise((resolve) => server.close(resolve));
	}

	// Se o servidor de staging devolver 200 sem Basic Auth -> DEVE falhar mesmo com --expect-basic-auth / basicAuth
	const leakyServer = http.createServer((req, res) => {
		const secHeaders = {
			'Strict-Transport-Security': 'max-age=300',
			'Content-Security-Policy': "default-src 'self'",
			'X-Content-Type-Options': 'nosniff',
			'Cross-Origin-Opener-Policy': 'same-origin',
			'Cross-Origin-Resource-Policy': 'same-origin',
			'Referrer-Policy': 'strict-origin-when-cross-origin',
		};
		if (req.url === '/') {
			res.writeHead(200, { ...secHeaders, 'Content-Type': 'text/html' });
			res.end('<!doctype html><html><body>leaky</body></html>');
			return;
		}
		res.writeHead(404, secHeaders);
		res.end('Not Found');
	});
	await new Promise((resolve) => leakyServer.listen(0, '127.0.0.1', resolve));
	try {
		const { port } = leakyServer.address();
		const leakyResult = await runLiveHardeningAudit(`http://127.0.0.1:${port}`, {
			env: {},
			expectBasicAuth: true,
		});
		assert.equal(leakyResult.ok, false);
		assert.equal(leakyResult.checks[0].name, 'GET / sem credenciais = 401 Basic Auth');
		assert.equal(leakyResult.checks[0].ok, false);
	} finally {
		await new Promise((resolve) => leakyServer.close(resolve));
	}
});
