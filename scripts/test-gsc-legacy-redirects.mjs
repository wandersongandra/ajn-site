import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [apache, astro, catalog] = await Promise.all([
	readFile('public/.htaccess', 'utf8'),
	readFile('astro.config.mjs', 'utf8'),
	readFile('src/content/route-catalog.ts', 'utf8'),
]);

const expected = new Map([
	['/blog/avcb-o-que-voce-precisa-saber-sobre-o-auto-de-vistoria-do-corpo-de-bombeiros', '/blog/ppcip-avcb-clcb-como-organizar-a-regularizacao-do-imovel/'],
	['/blog/ltcat-evento-esocial-o-que-voce-precisa-saber-para-estar-atualizado', '/ltcat-evento-esocial/'],
	['/blog/sistemas-contra-incendio-bh-o-que-voce-precisa-saber', '/sistemas-incendio-bh/'],
	['/regularizacao-avcb', '/servicos/regularizacao-de-imoveis-junto-ao-corpo-de-bombeiros/'],
	['/avcb-auto-vistoria-do-corpo-bombeiros', '/servicos/regularizacao-de-imoveis-junto-ao-corpo-de-bombeiros/'],
	['/renovacao-avcb-preco', '/servicos/regularizacao-de-imoveis-junto-ao-corpo-de-bombeiros/'],
	['/renovacao-avcb', '/servicos/regularizacao-de-imoveis-junto-ao-corpo-de-bombeiros/'],
	['/orcamento-avcb', '/servicos/regularizacao-de-imoveis-junto-ao-corpo-de-bombeiros/'],
	['/avcb-custo', '/servicos/regularizacao-de-imoveis-junto-ao-corpo-de-bombeiros/'],
	['/laudo-tecnico-avcb', '/servicos/regularizacao-de-imoveis-junto-ao-corpo-de-bombeiros/'],
	['/avcb-orcamento', '/servicos/regularizacao-de-imoveis-junto-ao-corpo-de-bombeiros/'],
	['/empresa-avcb', '/servicos/regularizacao-de-imoveis-junto-ao-corpo-de-bombeiros/'],
]);

const apacheRules = [...apache.matchAll(/^\s*RedirectMatch\s+301\s+(\S+)\s+(\S+)\s*$/gm)]
	.map(([, pattern, target]) => ({ pattern: new RegExp(pattern), target }));
const astroRoutes = new Map([...astro.matchAll(/'([^']+)':\s*\{\s*destination:\s*'([^']+)',\s*status:\s*301\s*\}/g)]
	.map(([, source, target]) => [source, target]));
const sitemapSet = astro.match(/const redirectedPaths = new Set\(\[([\s\S]*?)\]\);/)?.[1] ?? '';
const sitemapExclusions = new Set([...sitemapSet.matchAll(/^\s*'([^']+)',/gm)].map(([, path]) => path));
const catalogRoutes = new Set([...catalog.matchAll(/path:\s*"([^"]+)"/g)].map(([, path]) => path));

function apacheDestination(path) {
	return apacheRules.find(({ pattern }) => pattern.test(path))?.target ?? null;
}

test('12 URLs antigas do GSC redirecionam permanentemente para páginas equivalentes', () => {
	assert.equal(expected.size, 12);
	for (const [source, target] of expected) {
		assert.equal(apacheDestination(source), target, `Apache: ${source}`);
		assert.equal(apacheDestination(`${source}/`), target, `Apache com barra: ${source}`);
		assert.equal(astroRoutes.get(source), target, `Fallback Astro: ${source}`);
		assert.ok(sitemapExclusions.has(source), `Sitemap não pode publicar ${source}`);
		assert.ok(catalogRoutes.has(target.replace(/\/$/, '')), `Destino precisa existir no catálogo: ${target}`);
	}
});

test('URLs removidas ou estranhas não ganham redirecionamento enganoso', () => {
	for (const path of [
		'/wp-json/complianz/v1/',
		'/servicos/revolucione-seus-espacos-o-guia-completo-para-aluguel-de-moveis',
		'/blog/metodos-poderosos-para-expandir-sua-presenca-digital-e-atrair-mais-clientes',
		'/blog-tags/ltcat+renovacao',
		'/regularizacao-avcb-falso',
	]) {
		assert.equal(apacheDestination(path), null, `Não redirecionar ${path}`);
		assert.equal(astroRoutes.has(path), false, `Astro não deve criar ${path}`);
	}
});
