// Regressão editorial e de acessibilidade do processo da AJN.
// O HTML é gerado pelo Astro; o funcionamento visual completo exige revisão em navegador.
import { readFile } from 'node:fs/promises';

const [html, css, motion, source] = await Promise.all([
	readFile('dist/index.html', 'utf8'),
	readFile('src/styles/home-editorial.css', 'utf8'),
	readFile('src/styles/home-motion.css', 'utf8'),
	readFile('src/components/DifferentialsSection.astro', 'utf8'),
]);
const failures = [];
const check = (ok, why) => { if (!ok) failures.push(why); };
const section = html.match(/<section\b[^>]*class="differentials section"[^>]*>[\s\S]*?<\/section>/)?.[0] ?? '';

check(Boolean(section), 'Seção de processo não encontrada.');
check(/<h2\b[^>]*id="differentials-title"/.test(section), 'Título H2 do processo ausente.');
check(section.includes('Da primeira conversa à entrega do serviço'), 'Título editorial não foi aplicado.');
check(section.includes('Primeiro definimos a demanda e o escopo.'), 'Texto do processo ausente.');
check(!section.includes('Entenda as etapas, desde o levantamento inicial'), 'Texto antigo reapareceu.');

const ordered = section.match(/<ol\b[^>]*class="workflow__steps"[^>]*>[\s\S]*?<\/ol>/)?.[0] ?? '';
check(Boolean(ordered), 'Etapas não estão em lista ordenada.');
const steps = [...ordered.matchAll(/<li\b[^>]*class="workflow__step"[^>]*>/g)];
check(steps.length === 4, `Esperadas 4 etapas, encontradas ${steps.length}.`);
check((ordered.match(/class="workflow__step-number" aria-hidden="true"/g) ?? []).length === 4,
	'Números visuais devem ser omitidos da leitura redundante.');
check((ordered.match(/class="workflow__step-copy"/g) ?? []).length === 4,
	'Cada etapa precisa de uma área de texto organizada.');
check((ordered.match(/<h3\b/g) ?? []).length === 4, 'Quatro títulos H3 necessários.');
for (const title of [
	'Levantamento inicial',
	'Proposta e escopo',
	'Execução técnica',
	'Entrega e orientação',
]) {
	check(ordered.includes(title), `Etapa ausente: ${title}`);
}
check(!ordered.includes('workflow__step-icon') && !ordered.includes('<svg'),
	'A sequência não deve recuperar ícones decorativos de template.');
check((ordered.match(/data-reveal/g) ?? []).length === 4,
	'As quatro etapas precisam de animação progressiva sem JS obrigatório.');
check(ordered.includes('--reveal-delay: 270ms'), 'Última etapa deve ter progressão de 90ms.');

check(css.includes('font-size: 14.5px') && css.includes('.home-page .workflow__step p'),
	'Tipografia dos parágrafos deve ter no mínimo 14,5 px nesta seção.');
check(css.includes('grid-template-columns: repeat(4, minmax(0, 1fr))') &&
	css.includes('grid-template-columns: repeat(2, minmax(0, 1fr))') &&
	css.includes('grid-template-columns: 1fr'),
	'Layout precisa de 4, 2 e 1 coluna conforme viewport.');
check(css.includes('border: 0;') && css.includes('border-right: 1px solid #dde7da'),
	'A apresentação deve usar divisórias, não quatro cartões fechados.');
check(motion.includes('.home-page.motion-ready .workflow__step[data-reveal]') &&
	motion.includes('prefers-reduced-motion: reduce') &&
	motion.includes('transition-delay: 0ms, 0ms, 0ms, 0ms'),
	'Animações precisam respeitar movimento reduzido e remover atraso mobile.');
check(!/<(?:h[1-6]|p)\b[^>]*style=["'][^"']*opacity:\s*0/i.test(section),
	'Conteúdo textual não pode depender de JavaScript para aparecer.');
check(source.includes('aria-label="Etapas do atendimento da AJN"'),
	'A lista precisa ter descrição acessível.');

if (failures.length) {
	for (const failure of failures) console.error('[workflow][FAIL]', failure);
	process.exitCode = 1;
} else {
	console.log('[workflow] PASS: 4 etapas, tipografia, navegação sem ícones, layouts e acessibilidade.');
}
