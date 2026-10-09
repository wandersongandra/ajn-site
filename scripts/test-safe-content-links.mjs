import assert from 'node:assert/strict';
import test from 'node:test';
import { isSafeContentHref } from '../src/utils/safe-content-href.mjs';
import { serializeJsonLd } from '../src/utils/json-ld.mjs';

test('permite caminhos locais da própria origem', () => {
	assert.equal(isSafeContentHref('/contato'), true);
	assert.equal(isSafeContentHref('/blog?tema=seguranca'), true);
	assert.equal(isSafeContentHref('/rotas%20codificadas/'), true);
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
	]) {
		assert.equal(isSafeContentHref(href), false, href);
	}
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
