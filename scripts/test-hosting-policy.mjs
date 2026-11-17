import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { cspSourcesEqual, cspSourceIsExact, isAllowedResourceUrl } from './hosting-policy.mjs';
import { extractScriptElements, getHtmlAttributeValue, isJsonLdScript, hasExactHtmlAttribute, stripScriptElements } from './security-html.mjs';
import { MAX_CSP_HEADER_BYTES, decodeHtmlEntitiesInStyle, syncCspStyleHashes, verifyCspStyleHashes, verifyHtaccessCspSync } from './sync-csp-style-hashes.mjs';

const origin = 'https://ajnengenharia.com.br';
const policy = "style-src 'self'; font-src 'self'; script-src 'self'";

test('CSP aceita somente as origens exatas nas diretivas corretas', () => {
	assert.equal(cspSourcesEqual(policy, 'style-src', ["'self'"]), true);
	assert.equal(cspSourcesEqual(policy, 'font-src', ["'self'"]), true);
	assert.equal(cspSourceIsExact(policy, 'style-src', 'https://fonts.googleapis.com.evil.test'), false);
	assert.equal(cspSourcesEqual("style-src 'self' https://fonts.googleapis.com", 'style-src', ["'self'"]), false);
	assert.equal(cspSourcesEqual("style-src 'self' https://evil.test/path/fonts.googleapis.com", 'style-src', ["'self'"]), false);
	assert.equal(cspSourcesEqual("style-src 'self'; style-src https://evil.test", 'style-src', ["'self'"]), false);
});

test('recurso permitido depende da própria URL, não dos outros atributos da tag', () => {
	assert.equal(isAllowedResourceUrl('/assets/site.js', 'script', origin), true);
	assert.equal(isAllowedResourceUrl('/styles/site.css', 'link', origin, true), true);
	assert.equal(isAllowedResourceUrl('https://fonts.googleapis.com/css2?family=Open+Sans', 'link', origin, true), false);
	assert.equal(isAllowedResourceUrl('https://fonts.googleapis.com.evil.test/css', 'link', origin, true), false);
	assert.equal(isAllowedResourceUrl('https://evil.test/fonts.gstatic.com/file', 'link', origin, true), false);
	assert.equal(isAllowedResourceUrl('https://evil.test/img.jpg', 'img', origin), false);
	assert.equal(isAllowedResourceUrl('javascript:alert(1)', 'script', origin), false);
	assert.equal(isAllowedResourceUrl('https://user:password@ajnengenharia.com.br/x', 'img', origin), false);
	assert.equal(isAllowedResourceUrl('data:image/png;base64,aGVsbG8=', 'img', origin), true);
	const tagAttributes = ' data-src="https://fonts.gstatic.com/image.png" src="https://evil.test/image.png"';
	assert.equal(isAllowedResourceUrl(getHtmlAttributeValue(tagAttributes, 'src'), 'img', origin), false);
	assert.equal(hasExactHtmlAttribute(' data-src="https://fonts.gstatic.com/resource"', 'src'), false);
});

test('reconhece fechamentos script estranhos sem confiar em data-src ou data-type', () => {
	const fragments = extractScriptElements('<script data-src="/x.js">alert(1)</script\t\n other>' +
		'<script data-type="application/ld+json">alert(2)</script >' +
		'<script type="application/ld+json">{"ok":true}</script>');
	assert.equal(fragments.length, 3);
	assert.equal(fragments.filter(el => el.body.trim() &&
		!isJsonLdScript(el.attributes) && !hasExactHtmlAttribute(el.attributes, 'src')).length, 2);
	assert.equal(isJsonLdScript(fragments[2].attributes), true);
});

test('remove apenas elementos script completos ao preparar o corpo textual', () => {
	const html = 'antes <SCRIPT data-note="a > b">alert(1)</SCRIPT> depois ' +
		'<script type="application/ld+json">{"ok":true}</script> fim';
	assert.equal(stripScriptElements(html), 'antes  depois  fim');
});

test('preserva texto parecido com script e elementos incompletos', () => {
	const html = 'string <scripture>texto</scripture> e <script>incompleto';
	assert.equal(stripScriptElements(html), html);
});

test('CSP de public/.htaccess cobre 100% dos atributos style das 182 páginas de dist/ e respeita o limite de 4 KB', () => {
	const distDir = resolve(process.cwd(), 'dist');
	const htaccessPath = resolve(process.cwd(), 'public', '.htaccess');
	if (!existsSync(distDir)) {
		return;
	}
	const result = verifyCspStyleHashes({ distDir, htaccessPath });
	assert.equal(result.ok, true, `Falhas CSP: ${result.errors.join(' | ')}`);
	assert.equal(result.htmlFileCount, 182, 'Deve validar todas as 182 páginas HTML de dist/');
	assert.ok(
		result.cspByteLength <= MAX_CSP_HEADER_BYTES,
		`Header CSP (${result.cspByteLength} bytes) não pode passar de ${MAX_CSP_HEADER_BYTES} bytes`
	);

	// Prova de falha: atributo style ausente da lista ou CSP > 4 KB deve falhar
	const fakeMap = new Map([['dist/index.html', ['color: #ff00ff; font-size: 999px;']]]);
	const failMissingHash = verifyCspStyleHashes({ distDir, htaccessPath, perFileStyles: fakeMap });
	assert.equal(failMissingHash.ok, false);
	assert.match(failMissingHash.errors.join(' '), /Estilo inline sem hash/);

	const tmpDir = mkdtempSync(join(tmpdir(), 'ajn-csp-size-'));
	try {
		const oversizedHtaccess = join(tmpDir, '.htaccess');
		const hugeHashes = Array.from({ length: 100 }, (_, i) => `'sha256-${String(i).padStart(43, 'A')}='`).join(' ');
		writeFileSync(
			oversizedHtaccess,
			`Header always set Content-Security-Policy "default-src 'self'; style-src 'self' 'unsafe-hashes' ${hugeHashes}"\n`,
			'utf8'
		);
		const failOversized = verifyCspStyleHashes({
			distDir,
			htaccessPath: oversizedHtaccess,
			perFileStyles: new Map(),
		});
		assert.equal(failOversized.ok, false);
		assert.match(failOversized.errors.join(' '), /ultrapassa o limite máximo de 4096 bytes/);

		// Prova de sincronia: public/.htaccess e dist/.htaccess devem coincidir e falha se divergirem
		const distHtaccessPath = join(distDir, '.htaccess');
		if (existsSync(distHtaccessPath)) {
			const syncOk = verifyHtaccessCspSync([htaccessPath, distHtaccessPath]);
			assert.equal(syncOk.ok, true, `Divergência .htaccess: ${syncOk.errors.join(' | ')}`);
			assert.equal(syncOk.entries.length, 2);
			assert.equal(syncOk.entries[0].cspSha256, syncOk.entries[1].cspSha256);
			assert.equal(syncOk.entries[0].fileSha256, syncOk.entries[1].fileSha256);
		}
		writeFileSync(
			oversizedHtaccess,
			`Header always set Content-Security-Policy "default-src 'self'; style-src 'self'"\n`,
			'utf8'
		);
		const syncFail = verifyHtaccessCspSync([htaccessPath, oversizedHtaccess]);
		assert.equal(syncFail.ok, false);
		assert.match(syncFail.errors.join(' '), /CSP divergiu/);
	} finally {
		rmSync(tmpDir, { recursive: true, force: true });
	}
});

test('decodeHtmlEntitiesInStyle decodifica entidades em passada única sem dupla decodificação', () => {
	assert.equal(decodeHtmlEntitiesInStyle('&amp;lt;'), '&lt;');
	assert.equal(decodeHtmlEntitiesInStyle('&amp;gt;'), '&gt;');
	assert.equal(decodeHtmlEntitiesInStyle('&amp;quot;a&amp;quot;'), '&quot;a&quot;');
	assert.equal(decodeHtmlEntitiesInStyle('&amp;#39;x&#39;'), '&#39;x\'');
	assert.equal(
		decodeHtmlEntitiesInStyle('content: &quot;ok&quot;; border: &#34;1&#34;; font: &#39;a&#39; &apos;b&apos;; expr: &lt;x&gt; &amp;'),
		'content: "ok"; border: "1"; font: \'a\' \'b\'; expr: <x> &'
	);
});

test('syncCspStyleHashes e verifyCspStyleHashes tratam ENOENT sem race condition de existsSync', () => {
	const tmpDir = mkdtempSync(join(tmpdir(), 'ajn-csp-enoent-'));
	try {
		const fakeDist = join(tmpDir, 'dist');
		mkdirSync(fakeDist, { recursive: true });
		writeFileSync(join(fakeDist, 'index.html'), '<p style="display: none;"></p>', 'utf8');
		const publicHt = join(tmpDir, 'public', '.htaccess');
		mkdirSync(join(tmpDir, 'public'), { recursive: true });
		writeFileSync(publicHt, 'Header always set Content-Security-Policy "default-src \'self\'; style-src \'self\'"\n', 'utf8');
		// dist/.htaccess não existe: syncCspStyleHashes deve ignorar ENOENT e atualizar public/.htaccess
		const res = syncCspStyleHashes({
			rootDir: tmpDir,
			distDir: fakeDist,
			publicHtaccessPath: publicHt,
			distHtaccessPath: join(fakeDist, '.htaccess'),
		});
		assert.equal(res.htmlFileCount, 1);
		const missingVerify = verifyCspStyleHashes({
			distDir: fakeDist,
			htaccessPath: join(tmpDir, 'nao-existe', '.htaccess'),
		});
		assert.equal(missingVerify.ok, false);
		assert.match(missingVerify.errors[0], /ausente/);
	} finally {
		rmSync(tmpDir, { recursive: true, force: true });
	}
});
