import { readFile } from 'node:fs/promises';
import path from 'node:path';

// Pares remanescentes com risco histórico de título sobreposto (elétrica/elevação removidos).
const expected = {
	'/empresa-que-elabora-pgr': 'Consultoria para PGR e gerenciamento de riscos | AJN',
	'/empresa-que-faz-pgr': 'Elaboração de PGR para empresas | AJN Consultoria e Engenharia',
	'/pcmso-preco': 'Preço de PCMSO: fatores de escopo | AJN',
	'/preco-pcmso': 'Orçamento de PCMSO para empresas | AJN',
	'/projeto-prevencao-combate-incendio': 'Projeto de prevenção contra incêndio: orientação | AJN',
	'/elaboracao-pgr': 'Elaboração de PGR e gestão de riscos ocupacionais | AJN',
};

const titles = [];
const failures = [];

for (const [route, expectedTitle] of Object.entries(expected)) {
	const htmlPath = path.join('dist', route.slice(1), 'index.html');
	const html = await readFile(htmlPath, 'utf8');
	const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim();
	if (title !== expectedTitle) failures.push(`${route}: título encontrado ${JSON.stringify(title)}`);
	titles.push(title);
}

if (new Set(titles).size !== titles.length) {
	failures.push('os títulos explícitos ainda não são únicos');
}

if (failures.length > 0) {
	console.error('[fase7-seo][FAIL]');
	for (const failure of failures) console.error(`- ${failure}`);
	process.exitCode = 1;
} else {
	console.log(`[fase7-seo] PASS: ${titles.length} títulos de páginas candidatas a sobreposição são únicos.`);
}
