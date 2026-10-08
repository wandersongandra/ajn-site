// Regression checks for AJN's public SEO metadata and editorial service catalog.
import { readFile } from 'node:fs/promises';

const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};
const read = (path) => readFile(path, 'utf8');

const [home, services, contact, pgr, pcmso, catalog] = await Promise.all([
  read('dist/index.html'),
  read('dist/servicos/index.html'),
  read('dist/contato/index.html'),
  read('dist/elaboracao-pgr/index.html'),
  read('dist/servicos/pcmso-e-asos/index.html'),
  read('src/content/services/catalog.ts'),
]);

const origin = (process.env.PUBLIC_SITE_ORIGIN || 'https://ajnengenharia.com.br').replace(/\/+$/, '');
for (const [name, html, route] of [
  ['Home', home, '/'],
  ['Serviços', services, '/servicos/'],
  ['Contato', contact, '/contato/'],
  ['Elaboração PGR', pgr, '/elaboracao-pgr/'],
  ['PCMSO', pcmso, '/servicos/pcmso-e-asos/'],
]) {
  check(html.includes(`rel="canonical" href="${origin}${route}"`), `${name}: canonical deve refletir URL pública com barra final.`);
  const title = html.match(/<title>(.*?)<\/title>/s)?.[1] ?? '';
  const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1] ?? '';
  check(title.length >= 24 && title.length <= 68, `${name}: título SEO ausente ou fora de faixa (${title.length}).`);
  check(description.length >= 85 && description.length <= 170, `${name}: descrição SEO inadequada (${description.length}).`);
  check(!/noindex/.test(html.match(/<meta name="robots" content="([^"]+)"/)?.[1] ?? '') || process.env.PUBLIC_ALLOW_INDEXING !== 'true', `${name}: versão pública não pode usar noindex.`);
}
const excerpts = [...catalog.matchAll(/description: '([^']+)'/g)].map((match) => match[1]);
check(excerpts.length === 10, `Catálogo de serviços deve ter 10 descrições, encontrou ${excerpts.length}.`);
for (const excerpt of excerpts) {
  check(excerpt.length > 60, `Descrição excessivamente curta no catálogo: ${excerpt}`);
  check(!/\.\.\.|Saiba mais|^\d+\s*-/.test(excerpt), `Descrição truncada ou extraída sem revisão: ${excerpt}`);
}
check(pgr.includes('inventário de riscos ocupacionais') && pgr.includes('plano de ação'), 'PGR: conteúdo técnico essencial ausente.');
check(pcmso.includes('NR-7') && pcmso.includes('ASO'), 'PCMSO: contexto médico e documental ausente.');

if (failures.length) {
  failures.forEach((failure) => console.error('[editorial][FAIL]', failure));
  process.exitCode = 1;
} else {
  console.log('[editorial] PASS: 5 páginas, URL canônica, conteúdo técnico e 10 descrições de serviços.');
}
