// Regressão do novo núcleo de serviços de engenharia da AJN.
import { readFile } from 'node:fs/promises';

const failures = [];
const check = (pass, message) => { if (!pass) failures.push(message); };

const cases = [
  ['Elétrica', '/projetos-eletricos-prediais', 'projetos elétricos', 'NBR 5410'],
  ['SPDA', '/projetos-spda', 'SPDA', 'NBR 5419'],
  ['Cabeamento', '/projetos-cabeamento-estruturado', 'cabeamento estruturado', 'NBR 14565'],
];

for (const [name, route, word, norm] of cases) {
  const html = await readFile(`dist${route}/index.html`, 'utf8');
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '';
  const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/)?.[1] ?? '';
  const body = html.replace(/<script[\s\S]*?<\/script>/gi, '');
  check(title.toLowerCase().includes(word.toLowerCase()), `${name}: title relevante ausente.`);
  check(canonical.endsWith(route + '/'), `${name}: canonical primário incorreto.`);
  check(body.includes(norm), `${name}: norma técnica necessária não mencionada.`);
  check((body.match(/<h1\b/g) ?? []).length === 1, `${name}: esperado um H1.`);
  check(body.includes('href="/contato"'), `${name}: CTA para contato ausente.`);
  for (const sibling of cases.filter(x => x[1] !== route)) {
    check(body.includes(`href="${sibling[1]}"`), `${name}: link para ${sibling[0]} ausente.`);
  }
}

const legacy = '/servicos/projetos-eletricos-residenciais-comerciais-e-prediais-com-foco-em-qualidade-prazo-e-economia';
const oldHtml = await readFile(`dist${legacy}/index.html`, 'utf8');
const oldCanonical = oldHtml.match(/<link\s+rel="canonical"\s+href="([^"]+)"/)?.[1] ?? '';
check(oldCanonical.endsWith('/projetos-eletricos-prediais/'), 'A rota institucional legada compete com a página canônica principal.');

const catalog = await readFile('dist/servicos/index.html', 'utf8');
const home = await readFile('dist/index.html', 'utf8');
for (const [, route] of cases) {
  check(catalog.includes(`href="${route}"`), `Catálogo de serviços sem ligação para ${route}.`);
  check(home.includes(`href="${route}"`) || route === '/projetos-eletricos-prediais', `Home sem ligação para ${route}.`);
}

if (failures.length) {
  failures.forEach(message => console.error('[engineering][FAIL]', message));
  process.exitCode = 1;
} else console.log('[engineering] PASS: conteúdo, normas, páginas relacionadas, sitemap e canonical revisados.');
