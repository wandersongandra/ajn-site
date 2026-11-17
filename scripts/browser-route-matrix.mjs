// Phase 4 acceptance matrix: every generated HTML route at mobile and desktop.
import { chromium } from 'playwright';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const base = process.env.BASE_URL || 'http://127.0.0.1:4321';
const failures = [];
let assertions = 0;
function check(ok, message) {
	assertions++;
	if (!ok) failures.push(message);
}

async function collect(directory, prefix = '') {
	const routes = [];
	for (const entry of await readdir(directory, { withFileTypes: true })) {
		const relative = path.join(prefix, entry.name);
		if (entry.isDirectory()) {
			routes.push(...await collect(path.join(directory, entry.name), relative));
		} else if (entry.name === 'index.html') {
			const route = '/' + prefix.replaceAll(path.sep, '/').replace(/^\/+|\/+$/g, '') + '/';
			routes.push(route === '//' ? '/' : route);
		}
	}
	return routes;
}

const routes = [...new Set(await collect('dist'))].sort();
check(routes.length >= 160, `Matriz incompleta: ${routes.length} rotas HTML.`);
// A matriz valida cada fallback contra seu destino 301 declarado, em vez de
// pressupor que todos os antigos caminhos apontem para /servicos.
const astroConfig = await readFile('astro.config.mjs', 'utf8');
const htaccessRaw = await readFile('public/.htaccess', 'utf8');
const rawCspHeader = htaccessRaw.match(/^\s*Header always set Content-Security-Policy\s+"([^"]+)"/m)?.[1] ?? '';
check(Boolean(rawCspHeader), 'CSP ausente em public/.htaccess');
// Em servidor local HTTP (127.0.0.1), removemos apenas upgrade-insecure-requests para não reescrever sub-recursos locais para https://127.0.0.1
const localCspHeader = rawCspHeader
	.split(';')
	.map((part) => part.trim())
	.filter((part) => part && part.toLowerCase() !== 'upgrade-insecure-requests')
	.join('; ');
const redirectDestinations = new Map(
	[...astroConfig.matchAll(/'([^']+)':\s*\{\s*destination:\s*'([^']+)',\s*status:\s*301\s*\}/g)]
		.map(([, source, destination]) => [source, destination]),
);
const browser = await chromium.launch({ headless: true });
try {
	for (const scenario of [
		{ name: 'mobile-reduced', width: 390, reducedMotion: 'reduce' },
		{ name: 'desktop', width: 1440, reducedMotion: 'no-preference' },
	]) {
		const context = await browser.newContext({
			viewport: { width: scenario.width, height: 850 },
			reducedMotion: scenario.reducedMotion,
			locale: 'pt-BR',
		});
		await context.addInitScript(() => {
			window.__cspViolations = [];
			document.addEventListener('securitypolicyviolation', (event) => {
				window.__cspViolations.push(`${event.violatedDirective}:${event.blockedURI || 'inline'}`);
			});
		});
		await context.route('https://challenges.cloudflare.com/turnstile/v0/api.js*', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/javascript; charset=utf-8',
				body: 'window.turnstile = window.turnstile || { getResponse: () => "XXXX.DUMMY.TOKEN.XXXX", reset: () => {} };',
			});
		});
		await context.route(`${base}/**`, async (route) => {
			const response = await route.fetch();
			const headers = { ...response.headers() };
			if ((headers['content-type'] || '').includes('text/html')) {
				headers['content-security-policy'] = localCspHeader;
			}
			await route.fulfill({ response, headers });
		});
		for (const route of routes) {
			const page = await context.newPage();
			const errors = [];
			const cspConsoleErrors = [];
			page.on('pageerror', (error) => errors.push(error.message));
			page.on('console', (msg) => {
				if (msg.type() === 'error' && /Content Security Policy|violat/i.test(msg.text())) {
					cspConsoleErrors.push(msg.text());
				}
			});
			try {
				// Seguir um meta-refresh apaga o contexto da rota original; validar
				// diretamente o HTML estático e seu destino 301 equivalente.
				const artifact = await context.request.get(new URL(route, base).href);
				const body = await artifact.text();
				const refreshMatch = body.match(/http-equiv=["']refresh["'][^>]*content=["'][^"']*url=([^"']+)["']/i)
					|| body.match(/content=["'][^"']*url=([^"']+)["'][^>]*http-equiv=["']refresh["']/i);
				if (refreshMatch) {
					const destination = refreshMatch[1];
					check(artifact.ok(), `${scenario.name} ${route}: redirect artifact HTTP OK`);
					const expected = redirectDestinations.get(route.replace(/\/+$/, ''));
					check(expected !== undefined && destination === expected,
						`${scenario.name} ${route}: fallback meta refresh diverge do 301 (esperado=${expected ?? 'não cadastrado'}, dest=${destination})`);
					continue;
				}
				const response = await page.goto(new URL(route, base).href, {
					waitUntil: 'domcontentloaded', timeout: 45000,
				});
				check(response?.ok(), `${scenario.name} ${route}: HTTP ${response?.status() ?? 'sem resposta'}`);
				const data = await page.evaluate(() => ({
					main: Boolean(document.querySelector('main#conteudo-principal')),
					overflow: document.documentElement.scrollWidth > innerWidth + 3,
					missingDimensions: [...document.images].filter((image) => {
						const width = Number(image.getAttribute('width'));
						const height = Number(image.getAttribute('height'));
						return !(width > 0 && height > 0);
					}).length,
					cspDomViolations: Array.isArray(window.__cspViolations) ? window.__cspViolations : [],
				}));
				check(data.main, `${scenario.name} ${route}: main sem identificação`);
				check(!data.overflow, `${scenario.name} ${route}: overflow horizontal`);
				check(data.missingDimensions === 0, `${scenario.name} ${route}: ${data.missingDimensions} imagens sem dimensões`);
				check(errors.length === 0, `${scenario.name} ${route}: exceções (${errors.join('; ')})`);
				const allCspViolations = [...cspConsoleErrors, ...data.cspDomViolations];
				check(allCspViolations.length === 0, `${scenario.name} ${route}: violações CSP (${allCspViolations.join('; ')})`);
			} catch (error) {
				failures.push(`${scenario.name} ${route}: ${error.message}`);
			} finally {
				await page.close();
			}
		}
		await context.close();
	}
} finally {
	await browser.close();
}

if (failures.length) {
	for (const failure of failures) console.error('[route-matrix][FAIL]', failure);
	console.error(`Route matrix FAILED: ${failures.length}/${assertions}`);
	process.exitCode = 1;
} else {
	console.log(`Route matrix PASS: ${routes.length} routes × 2 viewports, ${assertions} assertions.`);
}
