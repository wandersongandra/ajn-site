import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const distDir = path.resolve('dist');

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

const files = (await walk(distDir)).filter((file) => file.endsWith('.html'));
const errors = [];
const warnings = [];
const titles = new Map();
const descriptions = new Map();

function routeFromFile(file) {
  const rel = path.relative(distDir, file).split(path.sep).join('/');
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return `/${rel.slice(0, -'/index.html'.length)}`;
  return `/${rel.replace(/\.html$/, '')}`;
}

for (const file of files) {
  const route = routeFromFile(file);
  const html = await readFile(file, 'utf8');

  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim();
  const description = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i)?.[1]?.trim();
  const canonical = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)?.[1]?.trim();
  const robots = html.match(/<meta\s+name=["']robots["']\s+content=["']([^"']+)["']/i)?.[1]?.trim();
  const h1Count = (html.match(/<h1\b/gi) || []).length;

  if (!title) errors.push(`${route}: title ausente`);
  if (!description) errors.push(`${route}: meta description ausente`);
  if (!canonical) errors.push(`${route}: canonical ausente`);
  if (!robots) errors.push(`${route}: meta robots ausente`);
  if (h1Count !== 1) errors.push(`${route}: esperado 1 H1, encontrado ${h1Count}`);

  if (title) {
    if (titles.has(title)) warnings.push(`title duplicado: ${route} e ${titles.get(title)}`);
    else titles.set(title, route);
  }
  if (description) {
    if (descriptions.has(description)) warnings.push(`description duplicada: ${route} e ${descriptions.get(description)}`);
    else descriptions.set(description, route);
  }
}

console.log(`[audit:seo] HTML auditados: ${files.length}`);
for (const warning of warnings) console.warn(`[audit:seo][WARN] ${warning}`);

if (errors.length) {
  for (const error of errors) console.error(`[audit:seo][FAIL] ${error}`);
  process.exitCode = 1;
} else {
  console.log('[audit:seo] PASS: title, description, canonical, robots e H1 válidos em todas as páginas geradas.');
}
