import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(process.cwd(), 'dist');
const strictLinks = process.env.AUDIT_STRICT_LINKS === '1';
const configuredOrigin = process.env.PUBLIC_SITE_ORIGIN || 'https://www.ajnengenharia.com.br';
const siteOrigin = new URL(configuredOrigin).origin;
const errors = [];
const warnings = [];

async function walk(directory) {
	const entries = await readdir(directory, { withFileTypes: true });
	const files = [];
	for (const entry of entries) {
		const full = path.join(directory, entry.name);
		if (entry.isDirectory()) files.push(...await walk(full));
		else files.push(full);
	}
	return files;
}
async function exists(file) { try { await access(file); return true; } catch { return false; } }
function pageRoute(file) {
	const rel = path.relative(root, file).replaceAll('\\\\', '/');
	if (rel === 'index.html') return '/';
	if (rel.endsWith('/index.html')) return '/' + rel.slice(0, -'/index.html'.length);
	if (rel.endsWith('.html')) return '/' + rel.slice(0, -'.html'.length);
	return '/' + rel;
}
function attrFromTag(html, tag, attr, marker) {
	const tags = html.match(new RegExp('<' + tag + '\\b[^>]*>', 'gi')) || [];
	const found = tags.find((item) => new RegExp(marker, 'i').test(item));
	return found?.match(new RegExp(attr + '=["\\\']([^"\\\']+)["\\\']', 'i'))?.[1] ?? null;
}
function internalPath(value) {
	if (!value || value.startsWith('#') || /^(mailto:|tel:|javascript:|data:)/i.test(value)) return null;
	try { const url = new URL(value, siteOrigin + '/'); return url.origin === siteOrigin ? decodeURIComponent(url.pathname) : null; } catch { return null; }
}
async function routeExists(urlPath) {
	if (urlPath === '/') return exists(path.join(root, 'index.html'));
	const clean = urlPath.replace(/^\\/+|\\/+$/g, '');
	for (const candidate of [path.join(root, clean, 'index.html'), path.join(root, clean + '.html'), path.join(root, clean)]) if (await exists(candidate)) return true;
	return false;
}

const files = await walk(root);
const htmlFiles = files.filter((file) => file.endsWith('.html'));
for (const file of htmlFiles) {
	const route = pageRoute(file);
	const html = await readFile(file, 'utf8');
	const h1Count = (html.match(/<h1\\b/gi) || []).length;
	const title = html.match(/<title>([^<]+)<\\/title>/i)?.[1]?.trim();
	const description = attrFromTag(html, 'meta', 'content', 'name=["\\\']description["\\\']');
	const canonical = attrFromTag(html, 'link', 'href', 'rel=["\\\']canonical["\\\']');
	const robots = attrFromTag(html, 'meta', 'content', 'name=["\\\']robots["\\\']');
	if (h1Count !== 1) errors.push(`${route}: expected exactly one H1, found ${h1Count}`);
	if (!title) errors.push(`${route}: missing title`);
	if (!description) errors.push(`${route}: missing meta description`);
	if (!canonical) errors.push(`${route}: missing canonical`);
	if (!robots) errors.push(`${route}: missing robots meta`);
	for (const match of html.matchAll(/(?:href|src)=["']([^"'#]+)["']/gi)) {
		const local = internalPath(match[1]);
		if (!local) continue;
		if (/\\.(?:css|js|png|jpe?g|webp|svg|ico|pdf|woff2?)$/i.test(local)) {
			if (!await exists(path.join(root, local.replace(/^\\//, '')))) errors.push(`${route}: missing asset ${local}`);
		} else if (!await routeExists(local)) warnings.push(`${route}: unresolved internal route ${local}`);
	}
}
const uniqueErrors = [...new Set(errors)];
const uniqueWarnings = [...new Set(warnings)];
console.log(`Audited ${htmlFiles.length} HTML pages.`);
for (const warning of uniqueWarnings) console.warn(`WARN: ${warning}`);
for (const error of uniqueErrors) console.error(`ERROR: ${error}`);
if (uniqueErrors.length || (strictLinks && uniqueWarnings.length)) process.exit(1);
