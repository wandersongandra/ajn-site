// Home AJN: validação do catálogo em destaque e da apresentação editorial.
// Inspeciona as seis opções reais geradas pelo Astro, sem solicitar páginas externas.
import { readFile, stat } from 'node:fs/promises';

const [html, style, motion, motionJs] = await Promise.all([
	readFile('dist/index.html', 'utf8'),
	readFile('src/styles/home-editorial.css', 'utf8'),
	readFile('src/styles/home-motion.css', 'utf8'),
	readFile('src/scripts/home-motion.ts', 'utf8'),
]);

const issues = [];
const check = (condition, message) => { if (!condition) issues.push(message); };
const start = html.indexOf('<section class="section solutions"');
const end = start >= 0 ? html.indexOf('</section>', start) : -1;
const section = start >= 0 && end >= 0 ? html.slice(start, end) : '';

check(section.length > 0 && section.includes('id="solucoes"'), 'Seção Serviços com âncora ausente.');
check(section.includes('id="solutions-title"'), 'Falta título associado à seção.');
check(section.includes('Segurança do trabalho e engenharia'), 'Novo título editorial ausente.');
check(section.includes('Consultoria em SST, saúde ocupacional, perícias'), 'Descrição técnica da seção ausente.');

const cards = [...section.matchAll(/<article\b[^>]*class="service-card"[^>]*>[\s\S]*?<\/article>/g)].map(m => m[0]);
check(cards.length === 6, `Esperados seis cards de serviço, encontrados ${cards.length}.`);
const hrefs = new Set();
for (const [index, card] of cards.entries()) {
	const link = card.match(/<a\b[^>]*class="home-service-card__link"[^>]*href="([^"]+)"[^>]*>/)?.[1];
	check(Boolean(link) && link.startsWith('/servicos/'), `Card ${index + 1}: link de serviço inexistente.`);
	if (link) {
		check(!hrefs.has(link), `Destino duplicado: ${link}`);
		hrefs.add(link);
	}
	check(/aria-label="Ver detalhes: [^"]+"/.test(card), `Card ${index + 1}: link sem nome acessível.`);
	check(/<h3\b[^>]*>[^<]+<\/h3>/.test(card), `Card ${index + 1}: H3 ausente.`);
	check(/<p\b[^>]*>[^<]+<\/p>/.test(card), `Card ${index + 1}: descrição ausente.`);
	const img = card.match(/<img\b[^>]*>/)?.[0] ?? '';
	const src = img.match(/\ssrc="([^"]+)"/)?.[1];
	const srcset = img.match(/\ssrcset="([^"]+)"/)?.[1] ?? '';
	const variants = [...srcset.matchAll(/(\/_astro\/[^\s,]+\.webp)\s+([0-9]+)w/g)];
	check(Boolean(src) && src.startsWith('/_astro/') && src.endsWith('.webp'),
		`Card ${index + 1}: a imagem precisa ser WebP otimizada pelo Astro.`);
	check(/alt=""/.test(img) && /loading="lazy"/.test(img) && /decoding="async"/.test(img),
		`Card ${index + 1}: foto decorativa deve carregar de forma otimizada.`);
	check(/\swidth="[0-9]+"/.test(img) && /\sheight="[0-9]+"/.test(img),
		`Card ${index + 1}: faltam dimensões intrínsecas.`);
	check(/\ssizes="[^"]+"/.test(img) && variants.length >= 2,
		`Card ${index + 1}: ausência de srcset responsivo com múltiplos tamanhos.`);
	check(/data-reveal/.test(card), `Card ${index + 1}: entrada progressiva ausente.`);
	check(card.includes('Ver serviço'), `Card ${index + 1}: ação não está clara.`);
	for (const imagePath of new Set([src, ...variants.map(v => v[1])])) {
		if (!imagePath) continue;
		try { check((await stat('dist' + imagePath)).isFile(), `Card ${index + 1}: recurso ausente: ${imagePath}`); }
		catch { issues.push(`Card ${index + 1}: imagem ausente: ${imagePath}`); }
	}
}
check(section.includes('href="/servicos"') && section.includes('Consultar todos os serviços'),
	'Link para catálogo integral ausente.');
check(!section.includes('solutions-carousel') && !section.includes('01 / 06'),
	'Carrossel automático ou numeração decorativa reapareceu.');

check(style.includes('grid-template-columns: minmax(0, 1.1fr) minmax(280px, .74fr)'),
	'Cabeçalho editorial não tem organização no desktop.');
check(style.includes('aspect-ratio: 16 / 10'), 'Fotografias devem ter proporção controlada.');
check(style.includes('.home-page .solutions .service-card h3') && style.includes('font-size: clamp(19px, 1.7vw, 22px)'),
	'Títulos de serviço permanecem pequenos.');
check(style.includes('.home-page .solutions .service-card p') && style.includes('font-size: 15px'),
	'Descrições dos cards permanecem pequenas.');
check(style.includes('.home-page .home-service-card__link:focus-visible'),
	'Cartões precisam de foco de teclado visível.');
check(style.includes('@media (max-width: 576px)') && style.includes('min-height: 0; padding: 23px 22px 25px'),
	'Conteúdo deve se ajustar a telas pequenas.');
check(motion.includes('.solutions .service-card[data-reveal]') &&
	motion.includes('transition-delay: 0ms, 0ms, 0ms, 0ms, 0ms') &&
	motion.includes('prefers-reduced-motion: reduce'),
	'Entradas precisam funcionar no mobile sem excesso de movimento.');
check(motionJs.includes('IntersectionObserver') && motionJs.includes('saveData') &&
	motionJs.includes("home.classList.add('motion-ready')"),
	'Sem JS, o conteúdo deve continuar visível.');

if (issues.length) {
	for (const issue of issues) console.error('[home-services][FAIL]', issue);
	process.exitCode = 1;
} else {
	console.log('[home-services] PASS: 6 cards, rotas únicas, imagens, CTAs, tipografia, mobile e animações acessíveis.');
}
