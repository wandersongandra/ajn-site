import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const config = await readFile('public/.htaccess', 'utf8');
const condition = config.match(/^\s*RewriteCond \%\{HTTP_HOST\} (.+)$/m)?.[1] ?? '';
const rule = config.match(/^\s*RewriteRule \^ (.+)$/m)?.[1] ?? '';
const hostPattern = new RegExp(condition.match(/^(.+?) \[NC\]$/)?.[1] ?? '(?!)', 'i');
const destination = rule.match(/^(https:\/\/[^%]+)(%\{REQUEST_URI\})(?: \[R=(\d+),([^\]]+)\])?$/);

function redirectFor(input) {
	const request = new URL(input);
	if (!hostPattern.test(request.host)) return null;
	assert.ok(destination, 'expected a fixed HTTPS destination plus original request path');
	return `${destination[1]}${request.pathname}${request.search}`;
}

test('uses a host-anchored temporary redirect before existing route redirects', () => {
	assert.match(condition, /^\^www\\\.ajnengenharia\\\.com\\\.br/);
	assert.match(condition, /\$ \[NC\]$/);
	assert.equal(destination?.[3], '302');
	assert.ok(config.indexOf('RewriteRule') < config.indexOf('RedirectMatch'));
});

test('preserves HTTPS, encoded paths, and query strings without redirect loops', () => {
	for (const [input, expected] of [
		['http://www.ajnengenharia.com.br/servicos?utm=a%2Fb&next=%2Fcontato', 'https://ajnengenharia.com.br/servicos?utm=a%2Fb&next=%2Fcontato'],
		['https://WWW.ajnengenharia.com.br/a%20b/%E2%9C%93?x=1%26y%3D2', 'https://ajnengenharia.com.br/a%20b/%E2%9C%93?x=1%26y%3D2'],
		['https://www.ajnengenharia.com.br/%252e%252e/contato?q=%3F%23', 'https://ajnengenharia.com.br/%252e%252e/contato?q=%3F%23'],
	]) {
		assert.equal(redirectFor(input), expected);
		assert.equal(redirectFor(expected), null);
	}
});

test('does not redirect apex, suffix lookalikes, or unrelated hosts', () => {
	assert.equal(redirectFor('https://ajnengenharia.com.br/servicos'), null);
	assert.equal(redirectFor('https://www.ajnengenharia.com.br.evil.test/'), null);
	assert.equal(redirectFor('https://evil.test/?host=www.ajnengenharia.com.br'), null);
});

test('keeps the fixed apex origin and does not pass through request host or port', () => {
	assert.equal(redirectFor('https://www.ajnengenharia.com.br:8443/contato'), 'https://ajnengenharia.com.br/contato');
	assert.equal(destination?.[1], 'https://ajnengenharia.com.br');
	assert.match(rule, /\[R=302,L,NE\]$/);
});
