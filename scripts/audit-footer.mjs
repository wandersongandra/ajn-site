// Auditoria do rodapé institucional da AJN no build Astro.
// Conferir todas as rotas estáticas, não somente a home.
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('dist');
const problems = [];
const check = (valid, context) => { if (!valid) problems.push(context); };

async function htmlFiles(dir) {
	const result = [];
	for (const entry of await readdir(dir, { withFileTypes: true })) {
		const file = path.join(dir, entry.name);
		if (entry.isDirectory()) result.push(...await htmlFiles(file));
		else if (entry.name.endsWith('.html')) result.push(file);
	}
	return result;
}

const files = await htmlFiles(root);
const requiredLinks = ['/', '/sobre-nos', '/servicos', '/blog', '/contato', '/informacoes', '/mapa-site'];
const legacy = [
	'A empresa se destaca na prestação de serviços',
	'com atendimento personalizado e atuação preventiva',
	'(Lei 9610 de 19/02/1998)',
];
const css = await readFile('src/styles/global.css', 'utf8');

check(files.length >= 100, `Poucas páginas geradas para a auditoria: ${files.length}`);
let checked = 0;
for (const file of files) {
	const route = path.relative(root, file).replaceAll(path.sep, '/');
	const html = await readFile(file, 'utf8');
	const footer = html.match(/<footer\b[^>]*class="site-footer"[^>]*>[\s\S]*?<\/footer>/)?.[0] ?? '';
	check(Boolean(footer), `${route}: rodapé não encontrado`);
	if (!footer) continue;
	checked++;

	for (const phrase of legacy) {
		check(!footer.includes(phrase), `${route}: texto antigo no rodapé: ${phrase}`);
	}
	check(footer.includes('/images/branding/ajn-logo-hd.webp'),
		`${route}: logotipo HD da AJN ausente`);
	check(footer.includes('aria-label="AJN Consultoria e Engenharia — início"'),
		`${route}: marca sem retorno acessível à home`);
	check(footer.includes('Razão social') &&
		footer.includes('AJN Consultoria e Engenharia') &&
		footer.includes('50.970.588/0001-84'),
		`${route}: dados cadastrais incompletos`);
	check(footer.includes('Rua Egeu, 34') &&
		footer.includes('31812-120') || footer.includes('31.812-120'),
		`${route}: endereço confirmado ausente`);
	check(footer.includes('(31) 98473-4644') &&
		footer.includes('faleconosco@ajnengenharia.com.br'),
		`${route}: contato real ausente`);
	check(footer.includes('href="/contato"') &&
		footer.includes('Solicitar atendimento'),
		`${route}: CTA de contato ausente`);
	for (const url of requiredLinks) {
		check(footer.includes(`href="${url}"`), `${route}: link de navegação ausente: ${url}`);
	}
	for (const network of ['LinkedIn da AJN', 'Instagram da AJN', 'WhatsApp da AJN']) {
		check(footer.includes(`aria-label="${network}"`), `${route}: rede social sem nome: ${network}`);
	}
	check(footer.includes('Todos os direitos reservados.') && /©\s*\d{4}/.test(footer),
		`${route}: copyright atualizado ausente`);
}

check(css.includes('grid-template-columns: minmax(215px, 1.18fr)') &&
	css.includes('@media (max-width: 1100px)') &&
	css.includes('@media (max-width: 640px)'),
	'Layout não contempla desktop, tablet e mobile');
check(css.includes('.site-footer .footer__menu a:focus-visible') &&
	css.includes('.site-footer .footer__social a:focus-visible'),
	'Navegação de teclado precisa de foco visível');
check(css.includes('font-size: 14px') &&
	css.includes('color: #c9d7cb') &&
	css.includes('min-height: 48px'),
	'Legibilidade e alvo de toque do rodapé não foram assegurados');
check(css.includes('prefers-reduced-motion: reduce'),
	'Efeitos do rodapé precisam respeitar redução de movimento');
if (problems.length) {
	for (const item of problems) console.error('[footer][FAIL]', item);
	process.exitCode = 1;
} else {
	console.log(`[footer] PASS: ${checked} páginas com rodapé, links, dados oficiais, foco e responsividade.`);
}
