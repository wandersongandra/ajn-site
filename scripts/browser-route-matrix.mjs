// Phase 4 acceptance matrix: every generated HTML route at mobile and desktop.
import { chromium } from 'playwright';
import { readdir } from 'node:fs/promises';
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
		for (const route of routes) {
			const page = await context.newPage();
			const errors = [];
			page.on('pageerror', (error) => errors.push(error.message));
			try {
				// This route is intentionally a static meta-refresh fallback. Letting
				// the browser follow it destroys the original document context, so
				// validate the redirect artifact without navigating.
				if (route === '/informacoes/') {
					const response = await context.request.get(new URL(route, base).href);
					const body = await response.text();
					check(response.ok(), `${scenario.name} ${route}: redirect artifact HTTP OK`);
					check(/http-equiv="refresh"/i.test(body) && body.includes('/mapa-site'),
						`${scenario.name} ${route}: fallback 301/meta refresh incompleto`);
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
				}));
				check(data.main, `${scenario.name} ${route}: main sem identificação`);
				check(!data.overflow, `${scenario.name} ${route}: overflow horizontal`);
				check(data.missingDimensions === 0, `${scenario.name} ${route}: ${data.missingDimensions} imagens sem dimensões`);
				check(errors.length === 0, `${scenario.name} ${route}: exceções (${errors.join('; ')})`);
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
