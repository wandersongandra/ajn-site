// Auditoria exclusiva da rota "Sobre nós" após build Astro.
import { readFile, stat } from 'node:fs/promises';

const [html, home, css, js, component, page] = await Promise.all([
	readFile('dist/sobre-nos/index.html', 'utf8'),
	readFile('dist/index.html', 'utf8'),
	readFile('src/styles/about-editorial.css', 'utf8'),
	readFile('src/scripts/about-motion.ts', 'utf8'),
	readFile('src/components/InstitutionalPage.astro', 'utf8'),
	readFile('src/pages/sobre-nos.astro', 'utf8'),
]);

const errors = [];
const check = (valid, message) => { if (!valid) errors.push(message); };
const start = html.indexOf('class="about-page"');
const end = html.indexOf('</main>', start);
const about = start >= 0 && end > start ? html.slice(start, end) : '';

check(Boolean(about) && about.includes('data-about-page'), 'Página institucional exclusiva não renderizada.');
check((html.match(/<h1\b/g) ?? []).length === 1, 'A rota precisa ter um único H1.');
check(about.includes('Conheça a AJN Consultoria e Engenharia'), 'H1 institucional ausente.');
check(html.includes('canonical') && html.includes('/sobre-nos'), 'Canonical da rota precisa ser preservado.');
check(html.includes('BreadcrumbList') && about.includes('aria-current="page"'), 'Breadcrumb acessível e schema JSON-LD obrigatórios.');
for (const title of ['Nossa atuação','Áreas de atendimento','O que orienta nosso trabalho',
	'Missão','Visão','Valores','Cada serviço começa com uma demanda concreta.']) {
	check(about.includes(title), 'Informação institucional ausente: ' + title);
}
for (const url of ['#atuacao','/servicos','/contato']) {
	check(about.includes(`href="${url}"`), 'Ação interna ausente: ' + url);
}
check(about.includes('id="atuacao"'), 'Âncora de atuação inexistente.');
check((about.match(/class="about-page__area"/g) ?? []).length === 3, 'Três áreas devem aparecer sem cartões fictícios.');
check((about.match(/class="about-page__principle"/g) ?? []).length === 3, 'Missão, visão e valores devem aparecer uma vez.');
check(!about.includes('persianas-automaticas') &&
	!about.includes('logo-icon.webp'), 'Fotos de persianas e ícone duplicado não devem estar na narrativa.');
check(!about.includes('líder em consultoria') &&
	!about.includes('superar as expectativas'), 'Copy institucional inflada reapareceu.');

const imgs = [...about.matchAll(/<img\b[^>]*>/g)].map(m => m[0]);
check(imgs.length === 2, `Esperadas duas fotografias institucionais, encontradas ${imgs.length}`);
let optimizedCount = 0;
for (const [index, img] of imgs.entries()) {
	const src = img.match(/\ssrc="([^"]+)"/)?.[1] ?? '';
	const srcset = img.match(/\ssrcset="([^"]+)"/)?.[1] ?? '';
	const widths = [...srcset.matchAll(/(\/_astro\/[^\s,]+\.webp)\s+([0-9]+)w/g)].map(m => m[1]);
	check(src.startsWith('/_astro/') && src.endsWith('.webp'), `Foto ${index + 1}: principal sem WebP Astro`);
	check(widths.length >= 2 && img.includes('sizes='), `Foto ${index + 1}: falta srcset responsivo`);
	check(img.includes('role="presentation"'), `Foto ${index + 1}: papel decorativo ausente`);
	check(/\swidth="[0-9]+"/.test(img) && /\sheight="[0-9]+"/.test(img),
		`Foto ${index + 1}: dimensões intrínsecas ausentes`);
	check(index === 0 ? img.includes('loading="eager"') : img.includes('loading="lazy"'),
		`Foto ${index + 1}: prioridade de carregamento inadequada`);
	for (const file of new Set([src, ...widths])) {
		if (!file) continue;
		try {
			const buf = await readFile('dist' + file);
			check(buf.toString('ascii', 0, 4) === 'RIFF' &&
				buf.toString('ascii', 8, 12) === 'WEBP',
				`Foto ${index + 1}: saída não é um arquivo WebP válido: ${file}`);
			optimizedCount++;
		} catch { errors.push(`Foto ${index + 1}: recurso não gerado: ${file}`); }
	}
}
check(optimizedCount >= 4, 'Imagens responsivas não foram efetivamente geradas.');
check((about.match(/data-about-reveal/g) ?? []).length >= 8, 'Entradas progressivas não estão na página.');
check(js.includes('IntersectionObserver') && js.includes('observer.unobserve') &&
	js.includes('prefers-reduced-motion') && js.includes('saveData'),
	'Animações precisam ser one-shot e respeitar redução de movimento/economia de dados.');
check(js.includes("root.classList.add('is-motion-ready')") &&
	css.includes('.about-page.is-motion-ready [data-about-reveal]'),
	'Conteúdo não pode depender de JS para ficar visível.');
check(!/addEventListener\s*\(\s*['"]scroll['"]/.test(js) && !js.includes('setInterval'),
	'Não usar eventos de scroll nem animações por intervalo.');
check(css.includes('@media (max-width: 780px)') &&
	css.includes('@media (max-width: 540px)') &&
	css.includes('@media (max-width: 350px)'),
	'Breakpoints de tablet, mobile e 320 px ausentes.');
check(css.includes(':focus-visible') && css.includes('@media (prefers-reduced-motion: reduce)'),
	'Foco de teclado e movimento reduzido ausentes.');
check(page.includes("import '../styles/about-editorial.css'") &&
	page.includes("import '../scripts/about-motion'"),
	'CSS e JS precisam carregar exclusivamente na rota sobre-nos.');
check(!home.includes('class="about-page"'), 'A mudança não pode inserir conteúdo sobre nós na Home.');
check(!component.includes('<PageShell'), 'Redesign precisa evitar segundo H1 e título genérico empilhado.');

if (errors.length) {
	for (const error of errors) console.error('[about][FAIL]', error);
	process.exitCode = 1;
} else {
	console.log('[about] PASS: 1 H1, 2 WebP responsivos, 3 áreas, valores, contatos, SEO, mobile e acessibilidade.');
}
