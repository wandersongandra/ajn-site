// Regressão da primeira dobra da Home AJN.
// Inspeciona HTML gerado e salvaguardas de tipografia, responsividade e movimento.
import { readFile } from 'node:fs/promises';

const [html, styles, motion, homeStyle, tokens] = await Promise.all([
	readFile('dist/index.html', 'utf8'),
	readFile('src/styles/home-editorial.css', 'utf8'),
	readFile('src/styles/home-motion.css', 'utf8'),
	readFile('src/styles/home.css', 'utf8'),
	readFile('src/styles/global.css', 'utf8'),
]);

const issues = [];
const check = (ok, message) => { if (!ok) issues.push(message); };
const section = html.match(/<section\b[^>]*class="hero"[^>]*>[\s\S]*?<\/section>/)?.[0] ?? '';

check(Boolean(section), 'Hero da home não foi gerado.');
check((html.match(/<h1\b/g) ?? []).length === 1, 'A página precisa de apenas um H1.');
check(section.includes('id="hero-title"'), 'H1 do hero sem identificador.');
check(/Consultoria em segurança do trabalho, laudos e projetos de engenharia\./.test(section),
	'H1 específico de serviços não foi renderizado.');
check(/PGR, PCMSO, ASOs, eSocial, inspeções e projetos técnicos para empresas\./.test(section),
	'Texto de apoio deve mencionar serviços documentados.');
check(!section.includes('Conte com a AJN para avaliar a demanda'),
	'Copy genérica antiga não pode retornar.');

const links = [...section.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>/g)].map(match => match[1]);
check(links.length === 2 && links.includes('/contato') && links.includes('/servicos'),
	'Hero deve oferecer apenas contato e catálogo; sem CTAs duplicados.');
const aside = section.match(/<aside\b[^>]*class="hero__panel"[^>]*>[\s\S]*?<\/aside>/)?.[0] ?? '';
check(Boolean(aside) && aside.includes('aria-label="Principais frentes de atendimento da AJN"'),
	'Painel de serviços deve ter um rótulo acessível.');
check((aside.match(/<li\b/g) ?? []).length === 3, 'Painel deve apresentar três frentes técnicas.');
for (const label of ['Programas e laudos', 'Saúde ocupacional', 'Atividades em campo']) {
	check(aside.includes(label), `Frente de atendimento ausente: ${label}`);
}
check(!aside.includes('✓') && !aside.includes('hero__panel a'),
	'O painel não deve ter checkmarks decorativos ou CTA duplicado.');

check(styles.includes('.home-page .hero__content h1') &&
	styles.includes('font-weight: var(--font-weight-heading)') &&
	styles.includes('letter-spacing: var(--tracking-display)'),
	'H1 precisa consumir os tokens tipográficos compartilhados.');
check(styles.includes('background-image:') &&
	styles.includes('linear-gradient(100deg') &&
	styles.includes('var(--hero-image)'),
	'Fotografia e gradiente devem continuar presentes.');
check(styles.includes('.home-page .hero__panel::before { display: none; }') &&
	styles.includes('border-left: 3px solid #a2cba4'),
	'Painel editorial não deve recuperar a bolinha falsa de status.');
// A escala H1 compartilhada substitui intencionalmente o clamp mobile 34–42px e o tracking apertado.
check(styles.includes('minmax(254px, .72fr)') &&
	styles.includes('font-size: var(--type-h1)') &&
	tokens.includes('--type-h1: clamp(2.25rem, calc(4vw + 1rem), 3.5rem)') &&
	styles.includes('.home-page .hero__panel { display: none; }'),
	'Desktop, tablet e mobile precisam de layout e tipografia próprios.');
check(styles.includes('min-height: 54px') &&
	styles.includes('.home-page .hero__actions > .button:focus-visible'),
	'CTAs devem ter alvo de toque e foco visível.');
check(motion.includes('prefers-reduced-motion: reduce') &&
	homeStyle.includes('animation: none !important'),
	'Efeitos da primeira dobra precisam respeitar movimento reduzido.');
check(!/<(?:h1|p|a)\b[^>]*style=["'][^"']*opacity\s*:\s*0/i.test(section),
	'Conteúdo crítico não pode iniciar oculto inline.');

if (issues.length) {
	for (const issue of issues) console.error('[hero][FAIL]', issue);
	process.exitCode = 1;
} else {
	console.log('[hero] PASS: H1, serviços, CTAs, painel, tipografia, responsividade e movimento acessível.');
}
