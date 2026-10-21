// Static performance and rendering-safety gate. Run after `npm run build`.
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };
const remoteFontHosts = new Set(['fonts.googleapis.com', 'fonts.gstatic.com']);
function containsRemoteFontLink(html) {
	for (const [, , rawHref] of html.matchAll(/<link\b[^>]*\bhref\s*=\s*(["'])(.*?)\1/gi)) {
		try {
			const url = new URL(rawHref, 'https://ajn.invalid');
			if (url.protocol === 'https:' && remoteFontHosts.has(url.hostname.toLowerCase())) return true;
		} catch {
			// Malformed URLs are handled by the hosting/security audits.
		}
	}
	return false;
}
const distFiles = [];

async function walk(directory) {
	for (const entry of await readdir(directory, { withFileTypes: true })) {
		const filepath = path.join(directory, entry.name);
		if (entry.isDirectory()) await walk(filepath);
		else distFiles.push(filepath);
	}
}

await walk('dist');
const htmlFiles = distFiles.filter((filepath) => filepath.endsWith('.html'));
check(htmlFiles.length >= 160, `Build incompleto: apenas ${htmlFiles.length} HTML encontrados.`);

let imageCount = 0;
let scriptCount = 0;
for (const filepath of htmlFiles) {
	const html = await readFile(filepath, 'utf8');
	check(!containsRemoteFontLink(html), `${filepath}: fonte externa encontrada.`);
	for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
		imageCount++;
		const tag = match[0];
		const width = Number(tag.match(/\swidth="(\d+)"/i)?.[1]);
		const height = Number(tag.match(/\sheight="(\d+)"/i)?.[1]);
		check(width > 0 && height > 0, `${filepath}: imagem sem dimensões intrínsecas: ${tag.slice(0, 180)}`);
	}
	for (const match of html.matchAll(/<script\b([^>]*)>/gi)) {
		const attributes = match[1];
		if (!/\ssrc="/i.test(attributes)) continue;
		scriptCount++;
		check(/\sdefer(?:\s|=|>|$)/i.test(attributes) || /\stype="module"/i.test(attributes),
			`${filepath}: script local sem defer/module.`);
	}
	if (filepath.includes(`${path.sep}servicos${path.sep}`) && html.includes('service-detail-wp__image')) {
		const heroImage = html.match(/<div class="service-detail-wp__image">\s*<img\b[^>]*>/i)?.[0] ?? '';
		check(/fetchpriority="high"/.test(heroImage) && /loading="eager"/.test(heroImage) &&
			/decoding="async"/.test(heroImage), `${filepath}: imagem crítica sem prioridades explícitas.`);
	}
}

const expectedFonts = [
	'public/fonts/archivo-latin-600.woff2',
	'public/fonts/archivo-latin-700.woff2',
	'public/fonts/ibm-plex-sans-latin-400.woff2',
	'public/fonts/ibm-plex-sans-latin-500.woff2',
	'public/fonts/ibm-plex-sans-latin-600.woff2',
];
let fontBytes = 0;
for (const filepath of expectedFonts) {
	try {
		const details = await stat(filepath);
		check(details.isFile() && details.size > 0, `Fonte ausente ou vazia: ${filepath}`);
		fontBytes += details.size;
	} catch {
		failures.push(`Fonte ausente: ${filepath}`);
	}
}
check(fontBytes <= 140 * 1024, `Subset de fontes acima de 140 KiB: ${fontBytes} B.`);

const homeData = await readFile('src/data/home.ts', 'utf8');
check(!/image:\s*['"]\/images\/services\/[^'"]+\.png/i.test(homeData),
	'Fallback da Home ainda referencia PNG pesado no catálogo.');
const fontCss = await readFile('src/styles/fonts.css', 'utf8');
check((fontCss.match(/font-display:\s*swap/g) ?? []).length === expectedFonts.length,
	'Cada fonte local deve declarar font-display: swap.');

if (failures.length) {
	for (const failure of failures) console.error('[performance][FAIL]', failure);
	process.exitCode = 1;
} else {
	console.log(`[performance] PASS: ${htmlFiles.length} HTML, ${imageCount} imagens com dimensões, ` +
		`${scriptCount} scripts locais defer/module e ${Math.round(fontBytes / 1024)} KiB de fontes locais.`);
}
