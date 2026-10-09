// Auditoria do índice por assunto e da rota antiga /informacoes após o build.
import { readFile, readdir } from 'node:fs/promises';

const problems = [];
const check = (valid, message) => { if (!valid) problems.push(message); };
const [html, catalog, routing, serverRules, headerCheck, footerCheck, style] = await Promise.all([
	readFile('dist/mapa-site/index.html', 'utf8'),
	readFile('src/content/route-catalog.ts', 'utf8'),
	readFile('astro.config.mjs', 'utf8'),
	readFile('dist/.htaccess', 'utf8'),
	readFile('dist/index.html', 'utf8'),
	readFile('dist/sobre-nos/index.html', 'utf8'),
	readFile('src/styles/sitemap-editorial.css', 'utf8'),
]);

const entries = [...catalog.matchAll(/path:\s*"([^"]+)"\s*,\s*title:/g)].map(m => m[1]);
check(entries.length >= 140, 'O catálogo perdeu páginas inesperadamente.');
check(new Set(entries).size === entries.length, 'O catálogo possui URLs duplicadas.');
check(!entries.includes('/informacoes'), 'Rota antiga ainda no catálogo.');
check(entries.includes('/mapa-site'), 'Mapa do site precisa constar no catálogo.');

const start = html.indexOf('class="site-index"');
const end = html.indexOf('</main>', start);
const content = start >= 0 && end > start ? html.slice(start, end) : '';
check(Boolean(content), 'Novo mapa do site não foi renderizado.');
check((html.match(/<h1\b/g) ?? []).length === 1, 'Mapa do site precisa de um único H1.');
const groups = ['institucional','servicos','sst','incendio','eletrica','elevacao','artigos'];
for (const group of groups) {
	check(content.includes(`href="#${group}"`), `Atalho de grupo ausente: ${group}`);
	check(content.includes(`id="${group}"`), `Seção de grupo ausente: ${group}`);
}
const paths = [...content.matchAll(/<li>\s*<a\s+href="(\/[^"]*)"/g)].map(m => m[1]);
check(paths.length === entries.length,
	`Mapa HTML tem ${paths.length} links, mas catálogo tem ${entries.length}.`);
check(new Set(paths).size === paths.length, 'Um ou mais links se repetem entre os grupos.');
const missing = entries.filter(x => !paths.includes(x));
const extra = paths.filter(x => !entries.includes(x));
check(missing.length === 0, `Rotas fora do mapa: ${missing.join(', ')}`);
check(extra.length === 0, `URLs estranhas no mapa: ${extra.join(', ')}`);
check(!paths.includes('/informacoes'), 'Mapa do site ainda anuncia rota redundante.');
check(!content.includes('<small>/'), 'Caminhos crus não devem poluir o layout do mapa.');
check(content.includes('aria-label="Categorias do mapa do site"'), 'Categorias precisam de navegação acessível.');
check(style.includes(':focus-visible') && style.includes('@media (max-width: 730px)') &&
	style.includes('@media (max-width: 440px)') &&
	style.includes('prefers-reduced-motion: reduce'),
	'Estilos precisam de foco, breakpoints e movimento reduzido.');

for (const [name, page] of [['Home', headerCheck],['Sobre nós', footerCheck],['Mapa do site', html]]) {
	const nav = page.match(/<nav\b[^>]*id="primary-navigation"[^>]*>[\s\S]*?<\/nav>/)?.[0] ?? '';
	const footer = page.match(/<footer\b[^>]*class="site-footer"[^>]*>[\s\S]*?<\/footer>/)?.[0] ?? '';
	check(!nav.includes('href="/informacoes"') && !footer.includes('href="/informacoes"'),
		`${name}: link legado de Informações continua visível.`);
	check(footer.includes('href="/mapa-site"'), `${name}: mapa não está no rodapé.`);
}

check(/RedirectMatch\s+301\s+\^\/informacoes\/\?\$\s+\/mapa-site/.test(serverRules),
	'Hostinger precisa de HTTP 301 em .htaccess para /informacoes e /informacoes/.');
check(routing.includes("'/informacoes': { destination: '/mapa-site', status: 301 }"),
	'Fallback de redirecionamento do Astro está ausente.');
let redirectHtml = '';
for(const path of ['dist/informacoes/index.html','dist/informacoes.html']) {
	try { redirectHtml = await readFile(path,'utf8'); break; } catch {}
}
check(redirectHtml.includes('/mapa-site') && /http-equiv=["']refresh["']/i.test(redirectHtml),
	'Fallback de /informacoes não aponta para /mapa-site por meta refresh.');

const files=await readdir('dist');
let sitemapContent = '';
for(const file of files.filter(x => /^sitemap.*\.xml$/.test(x))) {
	const sitemap = await readFile(`dist/${file}`, 'utf8');
	sitemapContent += sitemap;
	check(!sitemap.includes('/informacoes'), `Rota redirecionada permaneceu no arquivo ${file}`);
}
check(sitemapContent.includes('/politica-de-privacidade/'), 'Política de Privacidade ausente do sitemap.');
check(sitemapContent.includes('/termos-de-uso/'), 'Termos de Uso ausentes do sitemap.');

if(problems.length) {
	for(const issue of problems) console.error('[sitemap][FAIL]',issue);
	process.exitCode = 1;
} else console.log(`[sitemap] PASS: ${paths.length} rotas em ${groups.length}+ categorias, 301 Apache, fallback Astro e navegação limpa.`);
