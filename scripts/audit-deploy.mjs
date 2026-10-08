// A-004: valida origem e política de indexação da saída estática da CI.
import { readFile } from 'node:fs/promises';

const origin = process.env.PUBLIC_SITE_ORIGIN?.replace(/\/+$/, '');
const indexing = process.env.PUBLIC_ALLOW_INDEXING;
const issues = [];

if (!origin || !/^https:\/\/[^\s]+$/.test(origin)) {
  issues.push('PUBLIC_SITE_ORIGIN deve ser uma URL HTTPS explícita.');
}
if (indexing !== 'true' && indexing !== 'false') {
  issues.push('PUBLIC_ALLOW_INDEXING deve ser true ou false explícito.');
}

let html = '';
let robots = '';
try {
  html = await readFile('dist/index.html', 'utf8');
  robots = await readFile('dist/robots.txt', 'utf8');
} catch {
  issues.push('Saída dist/index.html e/ou dist/robots.txt ausente.');
}

if (origin && html && !html.includes(`rel="canonical" href="${origin}/"`)) {
  issues.push('Canonical da home não corresponde à origem de build.');
}
if (indexing === 'false') {
  if (!/name="robots"\s+content="noindex,nofollow,noarchive"/.test(html)) {
    issues.push('Homologação não contém noindex correto.');
  }
  if (!robots.includes('Disallow: /')) issues.push('Robots de homologação não bloqueia indexação.');
} else if (indexing === 'true') {
  if (!/name="robots"\s+content="index,follow/.test(html)) {
    issues.push('Publicação indexável não contém index,follow.');
  }
  if (!robots.includes('Allow: /') || !robots.includes(`${origin}/sitemap-index.xml`)) {
    issues.push('Robots de publicação indexável não contém Allow/Sitemap coerentes.');
  }
}

if (issues.length) {
  issues.forEach(issue => console.error('[deploy][FAIL]', issue));
  process.exitCode = 1;
} else {
  console.log(`[deploy] PASS: origem ${origin}; indexação ${indexing}; canonical e robots coerentes.`);
}
