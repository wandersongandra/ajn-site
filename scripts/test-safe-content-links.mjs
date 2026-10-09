import assert from 'node:assert/strict';
import test from 'node:test';
import { isSafeContentHref } from '../src/utils/safe-content-href.mjs';

test('permite caminhos locais da própria origem', () => {
	assert.equal(isSafeContentHref('/contato'), true);
	assert.equal(isSafeContentHref('/blog?tema=seguranca'), true);
});

test('permite links HTTPS sem credenciais', () => {
	assert.equal(isSafeContentHref('https://www.gov.br/'), true);
});

test('rejeita esquemas executáveis, origem relativa externa e HTTP', () => {
	for (const href of ['javascript:alert(1)', 'data:text/html,teste', '//evil.example/path', '/\\evil.example/path', 'http://example.com']) {
		assert.equal(isSafeContentHref(href), false, href);
	}
});

test('rejeita credenciais embutidas em links HTTPS', () => {
	assert.equal(isSafeContentHref('https://user:password@example.com/'), false);
});

test('rejeita valores vazios e tipos não string', () => {
	assert.equal(isSafeContentHref(''), false);
	assert.equal(isSafeContentHref(null), false);
});
