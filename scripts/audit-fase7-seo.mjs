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
	'/consultoria-seguranca-do-trabalho': 'Consultoria em segurança do trabalho em BH | AJN',
	'/elaboracao-pgr-pcmso': 'Elaboração de PGR e PCMSO para empresas | AJN',
	'/elaboracao-do-pgr-pcmso': 'PGR e PCMSO: como os programas se relacionam | AJN',
	'/servicos-pcmso': 'Serviços de PCMSO: o que avaliar | AJN',
	'/servicos/projetos-de-combate-a-incendio-e-panico-ppcip': 'PPCIP: projeto contra incêndio e regularização | AJN',
	'/blog/esocial-sst-diferencas-entre-s2210-s2220-e-s2240': 'S-2210, S-2220 e S-2240: diferenças e exemplos | AJN',
	'/blog/avaliacao-de-iluminamento-posto-de-trabalho-nho-11': 'NHO 11: como medir iluminamento no trabalho | AJN',
};

const titles = [];
const failures = [];

for (const [route, expectedTitle] of Object.entries(expected)) {
	const htmlPath = path.join('dist', route.slice(1), 'index.html');
	const html = await readFile(htmlPath, 'utf8');
	const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim();
	if (title !== expectedTitle) failures.push(`${route}: título encontrado ${JSON.stringify(title)}`);
	titles.push(title);
	if (['/consultoria-seguranca-do-trabalho', '/elaboracao-pgr-pcmso', '/elaboracao-do-pgr-pcmso', '/servicos-pcmso', '/servicos/projetos-de-combate-a-incendio-e-panico-ppcip', '/blog/esocial-sst-diferencas-entre-s2210-s2220-e-s2240', '/blog/avaliacao-de-iluminamento-posto-de-trabalho-nho-11'].includes(route)) {
		const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1] ?? '';
		if (description.length < 85 || description.length > 170) failures.push(`${route}: meta description inadequada (${description.length})`);
		if ((html.match(/<h1\b/g) ?? []).length !== 1) failures.push(`${route}: H1 ausente ou duplicado`);
		if (/Elaboração de do PGR/i.test(html)) failures.push(`${route}: título legado com erro gramatical`);
		if (!html.includes('href="/contato/"')) failures.push(`${route}: falta ligação para contato`);
	}
}

if (new Set(titles).size !== titles.length) {
	failures.push('os títulos explícitos ainda não são únicos');
}

const expectedEditorialLinks = {
	'/blog': [
		'/blog/esocial-sst-diferencas-entre-s2210-s2220-e-s2240/',
		'/blog/avaliacao-de-iluminamento-posto-de-trabalho-nho-11/',
		'/blog/ppcip-avcb-clcb-como-organizar-a-regularizacao-do-imovel/',
	],
	'/servicos/gestao-do-e-social': [
		'/blog/esocial-sst-diferencas-entre-s2210-s2220-e-s2240/',
		'/blog/ppp-facil-o-ue-e-como-consultar-e-sua-importancia/',
	],
	'/servicos/projetos-de-combate-a-incendio-e-panico-ppcip': [
		'/blog/ppcip-avcb-clcb-como-organizar-a-regularizacao-do-imovel/',
	],
	'/servicos/pcmso-e-asos': [
		'/blog/seguranca-do-trabalho-e-pcmso-gestao-da-saude-ocupacional/',
	],
	'/servicos/treinamento-de-nrs': [
		'/blog/nr-35-trabalho-em-altura-e-seguranca/',
	],
	'/medicoes-ambientais-ocupacionais': [
		'/blog/avaliacao-de-iluminamento-posto-de-trabalho-nho-11/',
	],
};

for (const [route, targets] of Object.entries(expectedEditorialLinks)) {
	const html = await readFile(path.join('dist', route.slice(1), 'index.html'), 'utf8');
	for (const href of targets) {
		if (!html.includes(`href="${href}"`)) failures.push(`${route}: falta link editorial para ${href}`);
	}
}

if (failures.length > 0) {
	console.error('[fase7-seo][FAIL]');
	for (const failure of failures) console.error(`- ${failure}`);
	process.exitCode = 1;
} else {
	console.log(`[fase7-seo] PASS: ${titles.length} títulos de páginas candidatas a sobreposição são únicos.`);
}
