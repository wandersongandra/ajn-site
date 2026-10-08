// Auditoria de animacoes da AJN: falha se a nova camada ocultar conteudo sem JS,
// ignorar preferencias de acessibilidade ou depender de handlers de scroll.
import { readFile } from 'node:fs/promises';

const [layout, css, js, homeCss, homeJs, homeHtml, aboutHtml, servicesHtml, blogHtml] = await Promise.all([
	readFile('src/layouts/BaseLayout.astro', 'utf8'),
	readFile('src/styles/inner-motion.css', 'utf8'),
	readFile('src/scripts/inner-motion.ts', 'utf8'),
	readFile('src/styles/home-motion.css', 'utf8'),
	readFile('src/scripts/home-motion.ts', 'utf8'),
	readFile('dist/index.html', 'utf8'),
	readFile('dist/sobre-nos/index.html', 'utf8'),
	readFile('dist/servicos/index.html', 'utf8'),
	readFile('dist/blog/index.html', 'utf8'),
]);

const issues = [];
const check = (ok, explanation) => { if (!ok) issues.push(explanation); };

check(layout.includes("import '../styles/inner-motion.css';"), 'O layout precisa carregar o estilo de movimento.');
check(layout.includes("import '../scripts/inner-motion';"), 'O layout precisa ativar o script de movimento.');
check(js.includes("'IntersectionObserver' in window") && js.includes('observer.unobserve'),
	'Entradas precisam usar IntersectionObserver que desconecta os alvos ja vistos.');
check(js.includes("main.classList.add('inner-motion-ready')") &&
	css.includes('#conteudo-principal.inner-motion-ready [data-motion-enter]'),
	'O CSS so pode ocultar antes da entrada apos a inicializacao do script.');
check(js.includes('getBoundingClientRect') && js.includes("element.classList.add('is-visible')"),
	'O conteudo na janela inicial precisa ficar visivel antes da classe de animacao.');
check(js.includes("matchMedia('(prefers-reduced-motion: reduce)')") &&
	css.includes('@media (prefers-reduced-motion: reduce)'),
	'Movimento reduzido deve funcionar tanto no JS quanto no CSS.');
check(js.includes('saveData') && js.includes("!dataSaver"),
	'Respeitar economia de dados.');
check(js.includes("main.querySelector('.home-page')") &&
	js.includes('slice(0, 48)'),
	'A home nao pode receber animacao duplicada e deve haver limite de observacao.');
check(!/addEventListener\s*\(\s*['"]scroll['"]/.test(js + homeJs),
	'Nao usar listeners de scroll de alta frequencia.');
check(!/requestAnimationFrame|setInterval|animation-iteration-count\s*:\s*infinite/i.test(css + js),
	'Nenhuma animacao precisa de loop continuo ou frame JS.');
check(homeCss.includes('home-service-card__link:hover > img') &&
	homeCss.includes('@media (max-width: 640px)'),
	'O aprimoramento da home precisa manter zoom sutil e entrada mobile curta.');

for (const [name, html] of [
	['home', homeHtml], ['sobre-nos', aboutHtml],
	['servicos', servicesHtml], ['blog', blogHtml],
]) {
	check(html.includes('id="conteudo-principal"'), `Landmark principal ausente em ${name}.`);
	check(!/<(?:body|main)[^>]*style=["'][^"']*opacity\s*:\s*0/i.test(html),
		`A raiz de ${name} nao pode iniciar invisivel no HTML.`);
}

if (issues.length) {
	issues.forEach(issue => console.error('[motion][FAIL]', issue));
	process.exitCode = 1;
} else {
	console.log('[motion] PASS: 4 modelos de pagina, JS progressivo, preferencias, limite e nenhuma animacao continua.');
}
