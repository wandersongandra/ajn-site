import { readFile } from 'node:fs/promises';
import path from 'node:path';

const expected = {
	'/escada-rolante-belo-horizonte': 'Escada rolante em Belo Horizonte | AJN',
	'/escada-rolante-bh': 'Escada rolante em BH: segurança e operação | AJN',
	'/plataforma-elevatoria-belo-horizonte': 'Plataforma elevatória em Belo Horizonte | AJN',
	'/plataforma-elevatoria-bh': 'Plataforma elevatória em BH: usos e segurança | AJN',
	'/projeto-eletrico-belo-horizonte': 'Projeto elétrico em Belo Horizonte | AJN',
	'/projeto-eletrico-bh': 'Projeto elétrico em BH: escopo e segurança | AJN',
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
	failures.push('os seis títulos explícitos ainda não são únicos');
}

if (failures.length > 0) {
	console.error('[fase7-seo][FAIL]');
	for (const failure of failures) console.error(`- ${failure}`);
	process.exitCode = 1;
} else {
	console.log(`[fase7-seo] PASS: ${titles.length} títulos de páginas candidatas a sobreposição são únicos.`);
}
