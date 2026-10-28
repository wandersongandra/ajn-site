// Regressão do núcleo de serviços de engenharia mantidos pela AJN (sem elétrica/SPDA/cabeamento).
import { readFile } from 'node:fs/promises';
import { stripScriptElements } from './security-html.mjs';

const failures = [];
const check = (pass, message) => { if (!pass) failures.push(message); };

const cases = [
  ['PPCIP', '/servicos/projetos-de-combate-a-incendio-e-panico-ppcip', 'incêndio', 'PPCIP'],
  ['CBM', '/servicos/regularizacao-de-imoveis-junto-ao-corpo-de-bombeiros', 'bombeiros', 'Bombeiros'],
  ['Ambiental', '/servicos/gestao-ambiental', 'ambiental', 'resíduo'],
  ['Qualidade', '/servicos/gestao-da-qualidade', 'qualidade', 'qualidade'],
];

for (const [name, route, word, marker] of cases) {
  const html = await readFile(`dist${route}/index.html`, 'utf8');
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '';
  const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/)?.[1] ?? '';
  const body = stripScriptElements(html);
  check(title.toLowerCase().includes(word.toLowerCase()) || body.toLowerCase().includes(word.toLowerCase()), `${name}: título/corpo relevante ausente.`);
  check(canonical.includes(route) || canonical.endsWith(route + '/'), `${name}: canonical incorreto (${canonical}).`);
  check(body.toLowerCase().includes(marker.toLowerCase()), `${name}: marcador técnico necessário não mencionado.`);
  check((body.match(/<h1\b/g) ?? []).length === 1, `${name}: esperado um H1.`);
  check(body.includes('href="/contato/"'), `${name}: CTA para contato ausente.`);
}

const catalog = await readFile('dist/servicos/index.html', 'utf8');
const home = await readFile('dist/index.html', 'utf8');
for (const [, route] of cases) {
  check(catalog.includes(`href="${route}"`), `Catálogo de serviços sem ligação para ${route}.`);
}

// Removidos: elétrica, SPDA e cabeamento não devem mais aparecer como oferta ativa.
for (const gone of ['/projetos-eletricos-prediais', '/projetos-spda', '/projetos-cabeamento-estruturado', '/servicos/projetos-eletricos-residenciais-comerciais-e-prediais-com-foco-em-qualidade-prazo-e-economia']) {
  check(!catalog.includes(`href="${gone}"`), `Catálogo ainda liga para serviço removido ${gone}.`);
  check(!home.includes(`href="${gone}"`), `Home ainda liga para serviço removido ${gone}.`);
}

if (failures.length) {
  failures.forEach(message => console.error('[engineering][FAIL]', message));
  process.exitCode = 1;
} else console.log('[engineering] PASS: PPCIP, CBM, ambiental e qualidade revisados; elétrica/SPDA/cabeamento ausentes do catálogo.');
