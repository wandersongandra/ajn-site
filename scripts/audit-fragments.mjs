// A-005: valida fragmentos/âncoras da saída Astro, inclusive links entre páginas.
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(process.env.AJN_DIST_DIR || 'dist');
const origin = process.env.PUBLIC_SITE_ORIGIN || 'https://ajn.invalid';
const baseUrl = new URL(origin);
const failures = [];

async function filesUnder(dir) {
  const all = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) all.push(...await filesUnder(full));
    else if (entry.name.endsWith('.html')) all.push(full);
  }
  return all;
}

function routeFor(file) {
  const relative = path.relative(root, file).split(path.sep).join('/');
  if (relative === 'index.html') return '/';
  if (relative.endsWith('/index.html')) return '/' + relative.slice(0, -'/index.html'.length);
  return '/' + relative.replace(/\.html$/, '');
}

function keyFor(route) {
  return route.replace(/\/+$/, '') || '/';
}

function attrValues(html, attribute) {
  const escaped = attribute.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matcher = new RegExp('\\s' + escaped + '\\s*=\\s*(["\\\'])(.*?)\\1', 'gi');
  return [...html.matchAll(matcher)].map((match) => match[2]);
}

let files;
try { files = await filesUnder(root); }
catch (error) {
  console.error(`[fragments][FAIL] Sem HTML gerado em ${root}: ${error.message}`);
  process.exit(1);
}

const pages = new Map();
for (const file of files) {
  const route = routeFor(file);
  const html = await readFile(file, 'utf8');
  const ids = new Set([...attrValues(html, 'id'), ...attrValues(html, 'name')]);
  pages.set(keyFor(route), { route, ids, hrefs: attrValues(html, 'href') });
}

let checked = 0;
for (const page of pages.values()) {
  for (const rawHref of page.hrefs) {
    if (!rawHref.includes('#')) continue;
    const href = rawHref.replaceAll('&amp;', '&');
    let target;
    try { target = new URL(href, new URL(page.route, baseUrl)); }
    catch {
      failures.push(`${page.route}: URL inválida ${rawHref}`);
      continue;
    }
    if (target.origin !== baseUrl.origin || !target.hash || target.hash === '#') continue;
    let fragment;
    try { fragment = decodeURIComponent(target.hash.slice(1)); }
    catch {
      failures.push(`${page.route}: fragmento malformado ${rawHref}`);
      continue;
    }
    if (!fragment) continue;
    const pathKey = keyFor(target.pathname.replace(/\.html$/, ''));
    const destination = pages.get(pathKey);
    if (!destination) continue; // a existência da rota é verificada pela auditoria SEO.
    checked++;
    if (!destination.ids.has(fragment)) {
      failures.push(`${page.route}: destino sem âncora ${target.pathname}#${fragment}`);
    }
  }
}

if (failures.length) {
  failures.forEach((failure) => console.error('[fragments][FAIL]', failure));
  process.exitCode = 1;
} else {
  console.log(`[fragments] PASS: ${pages.size} páginas e ${checked} referências a âncoras locais.`);
}
