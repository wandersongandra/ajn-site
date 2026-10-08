// A-017 — valida imagens e versões srcset que realmente serão requisitadas pelo navegador.
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(process.env.AJN_DIST_DIR || 'dist');
const issues = new Map();
const checked = new Set();
const routes = [];

async function walk(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (entry.name.endsWith('.html')) files.push(full);
  }
  return files;
}

const htmlFiles = await walk(root);
for (const file of htmlFiles) {
  const route = path.relative(root, file).replaceAll(path.sep, '/');
  routes.push(route);
  const html = await readFile(file, 'utf8');
  const resources = [];
  for (const match of html.matchAll(/<(?:img|source|video|link)\b[^>]*>/gi)) {
    const tag = match[0];
    const src = tag.match(/\s(?:src|poster)=["']([^"']+)["']/i)?.[1];
    if (src) resources.push(src);
    const set = tag.match(/\ssrcset=["']([^"']+)["']/i)?.[1];
    if (set) resources.push(...set.split(',').map(v => v.trim().split(/\s+/)[0]));
    if (/^<link\b/i.test(tag) && /\bas=["']image["']/i.test(tag)) {
      const href = tag.match(/\shref=["']([^"']+)["']/i)?.[1];
      if (href) resources.push(href);
    }
  }

  for (const resource of resources) {
    if (!resource || /^(?:data:|blob:|https?:\/\/|\/\/)/i.test(resource)) continue;
    let relative;
    try {
      const parsed = new URL(resource.replaceAll('&amp;', '&'), 'https://ajn.invalid/' + route);
      relative = decodeURIComponent(parsed.pathname).replace(/^\/+/, '');
    } catch {
      issues.set(resource, `${route}: URL de mídia inválida (${resource})`);
      continue;
    }
    const candidate = path.resolve(root, relative);
    if (candidate !== root && !candidate.startsWith(root + path.sep)) {
      issues.set(resource, `${route}: caminho de mídia fora da saída do build (${resource})`);
      continue;
    }
    if (checked.has(candidate)) continue;
    checked.add(candidate);
    try {
      if (!(await stat(candidate)).isFile()) throw new Error('not file');
    } catch {
      issues.set(resource, `${route}: mídia ausente no build (${resource})`);
    }
  }
}

if (issues.size) {
  for (const issue of issues.values()) console.error('[assets][FAIL]', issue);
  process.exitCode = 1;
} else {
  console.log(`[assets] PASS: ${routes.length} páginas e ${checked.size} recursos locais verificados.`);
}
