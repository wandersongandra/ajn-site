import { mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const distDir = path.resolve('dist');
const siteOrigin = (process.env.PUBLIC_SITE_ORIGIN || 'https://www.ajnengenharia.com.br').replace(/\/+$/, '');
const allowIndexing = process.env.PUBLIC_ALLOW_INDEXING !== 'false';

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else files.push(full);
  }
  return files;
}

function routeFromHtml(file) {
  const rel = path.relative(distDir, file).split(path.sep).join('/');
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return `/${rel.slice(0, -'/index.html'.length)}`;
  return `/${rel.replace(/\.html$/, '')}`;
}

await mkdir(distDir, { recursive: true });
const files = await walk(distDir);
const routes = [...new Set(files
  .filter((file) => file.endsWith('.html'))
  .map(routeFromHtml)
  .filter((route) => route !== '/404'))]
  .sort();

const escapeXml = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...routes.map((route) => `  <url><loc>${escapeXml(`${siteOrigin}${route === '/' ? '/' : route}`)}</loc></url>`),
  '</urlset>',
  '',
].join('\n');

const robots = allowIndexing
  ? `User-agent: *\nAllow: /\n\nSitemap: ${siteOrigin}/sitemap.xml\n`
  : 'User-agent: *\nDisallow: /\n';

await writeFile(path.join(distDir, 'sitemap.xml'), sitemap, 'utf8');
await writeFile(path.join(distDir, 'robots.txt'), robots, 'utf8');

console.log(`[seo] sitemap.xml: ${routes.length} rotas`);
console.log(`[seo] robots.txt: ${allowIndexing ? 'indexação permitida' : 'indexação bloqueada'}`);
