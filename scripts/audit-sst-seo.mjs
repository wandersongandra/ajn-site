// Regressão de conteúdo técnico e SEO para as páginas de LTCAT, eSocial e perícias.
import { readFile } from 'node:fs/promises';

const origin = process.env.PUBLIC_SITE_ORIGIN?.replace(/\/+$/, '');
const indexing = process.env.PUBLIC_ALLOW_INDEXING;
const cases = [
  ['/emissao-ltcat/', ['LTCAT', 'previdenciária', 'médico do trabalho']],
  ['/empresa-ltcat/', ['LTCAT', 'responsabilidade técnica', 'orçamento']],
  ['/laudo-ltcat-insalubridade/', ['LTCAT', 'NR-15', 'trabalhista']],
  ['/servicos/gestao-do-e-social/', ['S-2210', 'S-2220', 'S-2240']],
  ['/servicos/pericias-em-periculosidade-e-insalubridade/', ['NR-15', 'NR-16', 'LTCAT']],
];
const failures = [];
if (!origin) failures.push('PUBLIC_SITE_ORIGIN deve corresponder ao ambiente usado no build.');
if (indexing !== 'true' && indexing !== 'false') failures.push('PUBLIC_ALLOW_INDEXING deve declarar explicitamente o ambiente do build.');
for (const [route, required] of cases) {
  const path = 'dist' + route + 'index.html';
  const html = await readFile(path, 'utf8');
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1] ?? '';
  const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1] ?? '';
  if (origin && !html.includes(`rel="canonical" href="${origin}${route}"`)) {
    failures.push(`${route}: canonical diferente do destino final`);
  }
  if (title.length < 25 || title.length > 70) failures.push(`${route}: título SEO inadequado (${title.length})`);
  if (description.length < 85 || description.length > 170 || description.includes('...')) {
    failures.push(`${route}: meta description incompleta (${description.length})`);
  }
  const robots = html.match(/<meta name="robots" content="([^"]+)"/)?.[1] ?? '';
  if (indexing === 'true' && /\bnoindex\b/i.test(robots)) failures.push(`${route}: build de produção contém noindex`);
  if (indexing === 'false' && !/\bnoindex\b/i.test(robots)) failures.push(`${route}: build de preview deve conter noindex`);
  if ((html.match(/<h1\b/g) ?? []).length !== 1) failures.push(`${route}: H1 duplicado ou ausente`);
  if (!html.includes('href="/contato"')) failures.push(`${route}: falta link para contato`);
  for (const word of required) if (!html.includes(word)) failures.push(`${route}: conteúdo necessário ausente: ${word}`);
}
const blog = await readFile('dist/blog/ltcat-guia-essencial-para-garantir-a-seguranca-no-ambiente-de-trabalho/index.html','utf8');
if (!blog.includes('class="blog-article__service-links"') || !blog.includes('href="/emissao-ltcat"')) {
  failures.push('Blog LTCAT: links para serviços reais ausentes.');
}
if (failures.length) {
  failures.forEach(msg => console.error('[sst-seo][FAIL]',msg));
  process.exitCode=1;
} else {
  console.log('[sst-seo] PASS: 5 páginas técnicas com SEO e CTA; ligações contextuais do Blog.');
}
