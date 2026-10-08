// A-016 — canonical e Open Graph precisam apontar para a URL final do sitemap.
// Verifica todos os HTMLs gerados, não apenas as páginas do menu.
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('dist');
const origin = (process.env.PUBLIC_SITE_ORIGIN || 'https://www.ajnengenharia.com.br').replace(/\/+$/, '');
const errors = [];

async function walk(dir) {
  const output = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) output.push(...await walk(file));
    else if (entry.name.endsWith('.html')) output.push(file);
  }
  return output;
}

const files = await walk(root);
const names = await readdir(root);
const sitemaps = names.filter(name => /^sitemap-\d+\.xml$/.test(name));
if (!sitemaps.length) errors.push('Sitemap gerado não encontrado em dist/.');

const locs = new Set();
for (const name of sitemaps) {
  const sitemap = await readFile(path.join(root, name), 'utf8');
  for (const match of sitemap.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)) locs.add(match[1]);
}

let checked = 0;
for (const file of files) {
  const relative = path.relative(root, file).split(path.sep).join('/');
  if (relative === '404.html' || relative === '404/index.html') continue;
  const route = relative === 'index.html'
    ? '/'
    : '/' + relative.replace(/\/?index\.html$/, '').replace(/\.html$/, '').replace(/\/+$/, '') + '/';
  const expected = origin + route;
  const html = await readFile(file, 'utf8');
  const canonical = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)?.[1];
  const ogUrl = html.match(/<meta\s+property=["']og:url["']\s+content=["']([^"']+)["']/i)?.[1];
  checked++;
  if (canonical !== expected) errors.push(`${route}: canonical = ${canonical || 'ausente'}; esperado ${expected}`);
  if (ogUrl !== expected) errors.push(`${route}: og:url = ${ogUrl || 'ausente'}; esperado ${expected}`);
  if (!locs.has(expected)) errors.push(`${route}: URL final ausente do sitemap ${expected}`);
}

if (errors.length) {
  for (const error of errors) console.error('[canonical][FAIL]', error);
  process.exitCode = 1;
} else {
  console.log(`[canonical] PASS: ${checked} páginas, canonical/og:url correspondem ao sitemap e à URL final.`);
}
