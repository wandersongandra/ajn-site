// Regressão da seção "Onde atuamos" da Home da AJN.
// Verifica conteúdo, legibilidade, escopo visual e funcionamento sem animação.
import { readFile } from 'node:fs/promises';

const [html, innerHtml, styles, motion, motionJs] = await Promise.all([
	readFile('dist/index.html', 'utf8'),
	readFile('dist/sobre-nos/index.html', 'utf8'),
	readFile('src/styles/home-editorial.css', 'utf8'),
	readFile('src/styles/home-motion.css', 'utf8'),
	readFile('src/scripts/home-motion.ts', 'utf8'),
]);

const failures = [];
const check = (valid, message) => { if (!valid) failures.push(message); };

const match = html.match(/<section\b[^>]*class="section home-sectors"[^>]*>[\s\S]*?<\/section>/);
const section = match?.[0] ?? '';
check(Boolean(match), 'Seção de setores ausente na home.');
check(section.includes('id="home-sectors-title"'), 'Título da seção sem associação acessível.');
check(section.includes('Da indústria ao canteiro de obras'), 'Título original da atuação foi perdido.');
check(section.includes('A AJN avalia cada caso'), 'Texto sobre atendimento não está presente.');
check(!section.includes('Uma obra, uma indústria e um escritório têm rotinas diferentes.'),
	'Texto genérico anterior ainda aparece.');
check(/href="\/contato"[^>]*>[\s\S]*?Conversar com a AJN/.test(section),
	'CTA deve ir para o contato com linguagem direta.');
const cards = [...section.matchAll(/<article\b[^>]*class="home-sector-card"[^>]*>/g)];
check(cards.length === 4, `Esperados quatro setores, encontrados ${cards.length}.`);
for (const label of ['Indústria', 'Construção civil', 'Comércio e serviços', 'Contratos terceirizados']) {
	check(section.includes(label), `Setor ausente: ${label}`);
}
check((section.match(/data-reveal/g) ?? []).length === 5, 'Cabeçalho e quatro cards precisam de entrada progressiva.');
check(section.includes('--reveal-delay: 255ms'), 'Sequência da animação não foi aplicada.');

check(styles.includes('font-size: 14.5px') && styles.includes('.home-page .home-sector-card p'),
	'Texto dos cards não foi ampliado de 13 px.');
check(styles.includes('background: linear-gradient(110deg, #f0f5ef'),
	'Fundo e tons da seção não foram aplicados.');
check(styles.includes('.home-page .home-sectors__link:focus-visible'),
	'CTA sem foco visível explícito.');
check(styles.includes('@media (max-width: 576px)') && styles.includes('grid-template-columns: 1fr'),
	'Grid de setores precisa de versão de coluna única no mobile.');
check(motion.includes('.home-page.motion-ready .home-sector-card[data-reveal]') &&
	motion.includes('prefers-reduced-motion: reduce') &&
	motion.includes('transition-delay: 0ms, 0ms, 0ms, 0ms, 0ms, 0ms'),
	'Transições precisam ser progressivas, reduzidas no mobile e respeitar movimento reduzido.');
check(motionJs.includes('IntersectionObserver') && motionJs.includes('prefers-reduced-motion') &&
	motionJs.includes('saveData'), 'Entrada de cards precisa respeitar acessibilidade e economia de dados.');

check(!html.includes('class="social-rail"'), 'Barra social lateral ainda sobrepõe os setores da home.');
check(html.includes('class="whatsapp-float"'), 'Contato WhatsApp precisa continuar acessível.');
check(innerHtml.includes('class="social-rail"'), 'Páginas internas devem preservar a barra social.');

if (failures.length) {
	for (const issue of failures) console.error('[sectors][FAIL]', issue);
	process.exitCode = 1;
} else {
	console.log('[sectors] PASS: copy, 4 cards, motion, teclado, mobile e redes sociais preservados.');
}
