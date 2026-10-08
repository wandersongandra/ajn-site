// Regressão da limpeza: classes históricas removidas não devem reaparecer em HTML gerado.
// Isto verifica DOM estático e estrutura; não substitui comparação visual em navegador.
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const obsoleteClasses = new Set([
  'highlight-card', 'highlights', 'highlights-carousel', 'highlights__track',
  'about__grid', 'about__visual', 'about__copy',
  'portfolio__grid', 'portfolio__item',
]);

const errors = [];
const css = await readFile('src/styles/global.css', 'utf8');
for (const marker of [
  '/* Featured services */',
  '/* Continuous featured-services marquee',
  '/* Text-led home about section',
  '/* Portfolio */',
]) {
  if (css.includes(marker)) errors.push('CSS legado reintroduzido: ' + marker);
}

async function collectHtml(dir) {
  const results = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...await collectHtml(file));
    else if (entry.isFile() && entry.name.endsWith('.html')) results.push(file);
  }
  return results;
}

const pages = await collectHtml('dist');
if (pages.length < 100) errors.push('Build gerou menos páginas do que o esperado: ' + pages.length);
for (const file of pages) {
  const html = await readFile(file, 'utf8');
  for (const m of html.matchAll(/\bclass=["']([^"']+)["']/g)) {
    for (const className of m[1].split(/\s+/)) {
      if (obsoleteClasses.has(className)) {
        errors.push(path.relative('dist', file) + ': classe obsoleta ainda usada: ' + className);
      }
    }
  }
}
const home = await readFile('dist/index.html', 'utf8');
const about = await readFile('dist/sobre-nos/index.html', 'utf8');
for (const present of ['id="solucoes"', 'id="solutions-title"', 'data-clients-carousel', 'class="workflow__steps"']) {
  if (!home.includes(present)) errors.push('Home: estrutura ativa removida: ' + present);
}
if (!about.includes('class="about-page"') || !about.includes('data-about-page')) {
  errors.push('Página Sobre Nós atual não foi preservada.');
}
if (errors.length) {
  errors.forEach(error => console.error('[dead-css][FAIL]', error));
  process.exitCode = 1;
} else {
  console.log('[dead-css] PASS: ' + pages.length + ' páginas conferidas, seções vigentes preservadas, classes antigas ausentes.');
}
