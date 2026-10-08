// Quality gate dedicado ao cabeçalho do site publicado pelo Astro.
// Executar após build: node scripts/audit-header.mjs
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const pages = [
	['/', 'dist/index.html'],
	['/sobre-nos', 'dist/sobre-nos/index.html'],
	['/servicos', 'dist/servicos/index.html'],
	['/blog', 'dist/blog/index.html'],
	['/contato', 'dist/contato/index.html'],
	['/mapa-site', 'dist/mapa-site/index.html'],
];
const links = ['/', '/sobre-nos', '/servicos', '/blog', '/contato'];
const failures = [];
let inspected = 0;

for (const [route, file] of pages) {
	let html;
	try {
		html = await readFile(path.resolve(file), 'utf8');
	} catch {
		failures.push(route + ': página estática não foi gerada (' + file + ')');
		continue;
	}
	const headerMarkup = html.match(/<header\b[^>]*\bid="site-header"[^>]*>[\s\S]*?<\/header>/i)?.[0];
	if (!headerMarkup) {
		failures.push(route + ': cabeçalho principal não encontrado');
		continue;
	}
	inspected++;
	const check = (valid, issue) => {
		if (!valid) failures.push(route + ': ' + issue);
	};

	check(/<nav\b[^>]*\bid="primary-navigation"/i.test(headerMarkup), 'nav principal ausente');
	check(/<nav\b[^>]*aria-label="Navegação principal"/i.test(headerMarkup), 'nav sem rótulo acessível');
	check(/<button\b[^>]*\bdata-menu-toggle\b[^>]*>/i.test(headerMarkup), 'botão de menu mobile ausente');
	check(/<button\b[^>]*\bdata-menu-toggle\b[^>]*aria-expanded="false"|<button\b[^>]*aria-expanded="false"[^>]*\bdata-menu-toggle\b/i.test(headerMarkup), 'menu mobile sem estado inicial fechado');
	check(/<button\b[^>]*\bdata-submenu-toggle\b[^>]*>|<button\b[^>]*aria-controls="submenu-servicos"[^>]*>/i.test(headerMarkup), 'controle específico do submenu ausente');
	check(headerMarkup.includes('id="submenu-servicos"'), 'submenu Serviços sem ID de destino');
	check(headerMarkup.includes('aria-controls="submenu-servicos"'), 'submenu Serviços sem associação acessível');
	for (const href of links) {
		check(headerMarkup.includes('href="' + href + '"'), 'link ausente ' + href);
	}
	check(headerMarkup.includes('href="https://ajntreinamentos.formasegnr.com"'), 'link externo de treinamentos incorreto');
	check(headerMarkup.includes('target="_blank"') && headerMarkup.includes('rel="noopener noreferrer"'), 'link externo sem proteções');
	if (links.includes(route)) {
	check(new RegExp('href="' + route + '"[^>]*aria-current="page"', 'i').test(headerMarkup),
		'marcação aria-current da rota ausente');
	}
	check(!headerMarkup.includes('href="/informacoes"'), 'Informações não pode constar no cabeçalho');
}

if (failures.length > 0) {
	for (const issue of failures) console.error('[header][FAIL] ' + issue);
	process.exitCode = 1;
} else {
	console.log('[header] PASS: ' + inspected + ' páginas, navegação completa, item ativo, submenu e treinamento seguros.');
}
