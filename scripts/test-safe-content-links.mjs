import assert from 'node:assert/strict';
import test from 'node:test';
import { isSafeContentHref } from '../src/utils/safe-content-href.mjs';
import { serializeJsonLd } from '../src/utils/json-ld.mjs';
import { extractScriptElements } from './security-html.mjs';

test('permite caminhos locais da própria origem', () => {
	assert.equal(isSafeContentHref('/contato'), true);
	assert.equal(isSafeContentHref('/blog?tema=seguranca'), true);
	assert.equal(isSafeContentHref('/rotas%20codificadas/'), true);
	assert.equal(isSafeContentHref('/segmento%2Fsubsegmento'), true);
});

test('permite links HTTPS sem credenciais', () => {
	assert.equal(isSafeContentHref('https://www.gov.br/'), true);
});

test('rejeita esquemas executáveis, origem relativa externa e HTTP', () => {
	for (const href of [
		'javascript:alert(1)',
		'JaVaScRiPt:alert(1)',
		'java%73cript:alert(1)',
		'javascript%3Aalert(1)',
		'data:text/html,teste',
		'data%3Atext/html,teste',
		'vbscript:msgbox(1)',
		'vbscript%3Amsgbox(1)',
		'//evil.example/path',
		'/\\evil.example/path',
		'\\\\evil.example/path',
		'relative/path',
		'../contato',
		'http://example.com',
		'ftp://example.com/file',
		'mailto:contato@example.com',
		'file:///C:/Windows/win.ini',
		'blob:https://example.com/id',
		'https://example.com/%ZZ',
		'/path%ZZ',
		'https://example.com/%0aheader',
		'/path%5c..%5cother',
		'/path\u0000suffix',
		'/path\u007fsuffix',
		'/path\nsuffix',
		'/path\r\nsuffix',
		'/path\u0085suffix',
		'/path%E2%80%A8suffix',
		'https://example.com/path\ttab',
		'https://example.com/%C2%85suffix',
	]) {
		assert.equal(isSafeContentHref(href), false, href);
	}
});

test('a política usada pela auditoria SEO rejeita esquemas não autorizados e URLs malformadas', () => {
	for (const href of [
		'data:text/html,conteudo',
		'vbscript:msgbox(1)',
		'javascript:alert(1)',
		'//externo.example/rota',
		'/\\externo.example/rota',
		'https://user:pass@example.com/',
		'ftp://example.com/arquivo',
		'/rota%ZZ',
		'/rota%0d%0aheader',
	]) {
		assert.equal(isSafeContentHref(href), false, href);
	}
	assert.equal(isSafeContentHref('/servicos/?origem=seo'), true);
	assert.equal(isSafeContentHref('https://www.gov.br/'), true);
});

test('normaliza caminhos locais sem escapar da origem permitida', () => {
	assert.equal(isSafeContentHref('/a/../contato'), true);
	assert.equal(isSafeContentHref('/%2e%2e/contato'), true);
});

test('rejeita credenciais embutidas em links HTTPS', () => {
	assert.equal(isSafeContentHref('https://user:password@example.com/'), false);
	assert.equal(isSafeContentHref('https://user%40example.com@example.com/'), false);
});

test('rejeita valores vazios e tipos não string', () => {
	assert.equal(isSafeContentHref(''), false);
	assert.equal(isSafeContentHref(null), false);
});

test('escapa payload HTML e preserva JSON-LD válido', () => {
	const payload = {
		'@type': 'Organization',
		name: '</script><img src=x onerror="alert(1)"> & AJN',
		separator: '\u2028\u2029',
	};
	const serialized = serializeJsonLd(payload);

	assert.equal(serialized.includes('</script'), false);
	assert.equal(serialized.includes('<img'), false);
	assert.equal(serialized.includes('&'), false);
	assert.deepEqual(JSON.parse(serialized), payload);
});

test('reconhece tags de fechamento script com whitespace e atributos inesperados', () => {
	const scripts = extractScriptElements('<script type="application/ld+json">{"ok":true}</script ><script src="/a.js">run()</script\t\n bar><script src="/b.js">next()</script>');
	assert.equal(scripts.length, 3);
	assert.equal(scripts[0].body, '{"ok":true}');
	assert.equal(scripts[1].attributes, ' src="/a.js"');
	assert.equal(scripts[1].body, 'run()');
	assert.equal(scripts[2].attributes, ' src="/b.js"');
});
