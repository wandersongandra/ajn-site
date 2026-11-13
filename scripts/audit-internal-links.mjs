import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const distDir = path.resolve('dist');
const origin = 'https://ajnengenharia.com.br';
const failures = [];

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
  if (rel.endsWith('/index.html')) return '/' + rel.slice(0, -'/index.html'.length);
  return '/' + rel.replace(/\.html$/, '');
}

function isStaticAsset(pathname) {
  return pathname.startsWith('/images/')
    || pathname.startsWith('/assets/')
    || pathname.startsWith('/fonts/')
    || pathname.startsWith('/styles/')
    || pathname.startsWith('/scripts/')
    || /\.[a-z0-9]{2,8}$/i.test(pathname);
}

const htmlFiles = (await walk(distDir)).filter((file) => file.endsWith('.html'));
for (const file of htmlFiles) {
  const route = routeFromHtml(file);
  const html = await readFile(file, 'utf8');
  if (/http-equiv=["']refresh["']/i.test(html) && /<title>\s*Redirecting to:/i.test(html)) continue;

  for (const match of html.matchAll(/\bhref=["']([^"']+)["']/gi)) {
    const raw = match[1];
    if (!raw || raw.startsWith('#') || /^(?:mailto|tel|javascript):/i.test(raw)) continue;

    let url;
    try {
      url = new URL(raw, origin);
    } catch {
      continue;
    }
    if (url.origin !== origin) continue;
    if (isStaticAsset(url.pathname)) continue;
    if (url.pathname !== '/' && !url.pathname.endsWith('/')) {
      failures.push(`${route}: link interno sem barra final -> ${raw}`);
    }
  }
}

if (failures.length) {
  for (const failure of failures) console.error('[internal-links][FAIL]', failure);
  process.exitCode = 1;
} else {
  console.log(`[internal-links] PASS — ${htmlFiles.length} páginas sem links internos para rotas não canônicas`);
}
