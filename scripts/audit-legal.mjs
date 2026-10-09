import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const issues = [];
const expect = (ok, note) => { if (!ok) issues.push(note); };
const pages = [
	['privacidade', 'dist/politica-de-privacidade/index.html', '/politica-de-privacidade/'],
	['termos', 'dist/termos-de-uso/index.html', '/termos-de-uso/'],
];
const origin = process.env.PUBLIC_SITE_ORIGIN?.replace(/\/+$/, '');
const indexing = process.env.PUBLIC_ALLOW_INDEXING;
expect(Boolean(origin), 'PUBLIC_SITE_ORIGIN ausente.');
expect(indexing === 'true' || indexing === 'false', 'PUBLIC_ALLOW_INDEXING não configurado.');
for (const [label, filename, route] of pages) {
	let html = '';
	try { html = await readFile(filename, 'utf8'); }
	catch { issues.push(label + ': HTML compilado não encontrado.'); continue; }
	expect(html.includes('rel="canonical" href="' + origin + route + '"'), label + ': canonical incompatível.');
	const robots = /<meta name="robots" content="([^"]+)"/i.exec(html)?.[1] ?? '';
	expect(indexing === 'true' ? !/\bnoindex\b/i.test(robots) : /\bnoindex\b/i.test(robots), label + ': indexação incorreta.');
	expect((html.match(/<h1\b/g) ?? []).length === 1, label + ': deve haver H1 único.');
	expect(html.includes('class="legal-document"'), label + ': falta estrutura de leitura editorial.');
	expect(html.includes('aria-label="Nesta') || html.includes('aria-label="Nestes'), label + ': navegação interna ausente.');
	expect(html.includes('href="/politica-de-privacidade/"') && html.includes('href="/termos-de-uso/"'), label + ': links legais recíprocos ausentes.');
	expect(html.includes('50.970.588/0001-84') || label === 'termos', label + ': responsável identificado incorretamente.');
	if (label === 'privacidade') {
		for (const key of ['id="responsavel"', 'id="dados-pessoais"', 'id="finalidades"', 'id="compartilhamento"', 'id="retencao"', 'id="cookies"', 'id="direitos"']) {
			expect(html.includes(key), 'privacidade: seção ausente: ' + key);
		}
		expect(html.includes('href="https://policies.google.com/privacy"'), 'privacidade: Google Fonts sem aviso externo.');
		expect(html.includes('não implementa cookies próprios'), 'privacidade: inventário honesto sobre cookies ausente.');
	}
	if (label === 'termos') {
		expect(html.includes('href="/politica-de-privacidade/#cookies"'), 'termos: falta link para cookies.');
	}
}
const home = await readFile('dist/index.html', 'utf8');
expect(home.includes('href="/politica-de-privacidade/#cookies"'), 'rodapé precisa disponibilizar seção de cookies.');
expect(home.includes('id="ajn-privacy-notice"') && home.includes('data-privacy-acknowledge'), 'aviso de privacidade ausente do layout.');
expect(home.includes('data-privacy-open'), 'rodapé sem controle para rever aviso.');
expect(home.includes('/scripts/privacy-notice.js'), 'script de aviso ausente.');
const policyHtml = await readFile('dist/politica-de-privacidade/index.html', 'utf8');
expect(policyHtml.includes('armazenamento local do navegador') && policyHtml.includes('180 dias'), 'Política não explica armazenamento de preferência.');
const contactTemplate = await readFile('src/components/ContactPage.astro', 'utf8');
expect(contactTemplate.includes('href="/politica-de-privacidade/"'), 'futuro formulário deve fornecer link para privacidade.');
const executablePaths = ['public/scripts', 'src'];
async function walk(dir) {
	let entries;
	try { entries = await readdir(dir, { withFileTypes: true }); } catch { return []; }
	const found = [];
	for (const entry of entries) {
		const filename = join(dir, entry.name);
		if (entry.isDirectory()) found.push(...await walk(filename));
		else if (/\.(?:js|mjs|ts)$/.test(filename)) found.push(filename);
	}
	return found;
}
const ownScripts = (await Promise.all(executablePaths.map(walk))).flat();
const cookieWrite = /\bdocument\s*\.\s*cookie\b|\blocalStorage\b|\bsessionStorage\b|\bindexedDB\b/i;
const trackers = /\bgtag\s*\(|\bfbq\s*\(|googletagmanager\.com|google-analytics\.com|connect\.facebook\.net|doubleclick\.net|hotjar\.com|clarity\.ms|adsbygoogle/i;
for (const filename of ownScripts) {
	const content = await readFile(filename, 'utf8');
	if (filename.replaceAll('\\', '/').endsWith('/scripts/privacy-notice.js')) {
    expect(content.includes("ajn-privacy-notice-ack-v1") && content.includes('localStorage.setItem(key, String(Date.now()))') && !/document\\s*\\.\\s*cookie/i.test(content), 'Aviso de privacidade: armazenamento não corresponde ao uso informado.');
  } else {
    expect(!cookieWrite.test(content), filename + ': armazenamento/cookies encontrados; reavaliar consentimento e política.');
  }
	expect(!trackers.test(content), filename + ': possível rastreamento encontrado; reavaliar antes de ativar.');
}
const externalScripts = /<script\b[^>]*\ssrc\s*=\s*["']https?:\/\//i;
expect(!externalScripts.test(home), 'script externo de terceiros encontrado na home; verificar cookies e consentimento.');
if (issues.length) {
	issues.forEach(message => console.error('[legal][FAIL] ' + message));
	process.exitCode = 1;
} else {
	console.log('[legal] PASS: páginas legais, links, cookies, indexação e ausência de rastreadores próprios conhecidos em ' + ownScripts.length + ' fontes.');
}
