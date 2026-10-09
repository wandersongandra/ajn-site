import assert from 'node:assert/strict';
import test from 'node:test';
import { cspSourcesEqual, cspSourceIsExact, isAllowedResourceUrl } from './hosting-policy.mjs';
import { extractScriptElements, getHtmlAttributeValue, isJsonLdScript, hasExactHtmlAttribute } from './security-html.mjs';

const origin = 'https://ajnengenharia.com.br';
const policy = "style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self'";

test('CSP aceita somente as origens exatas nas diretivas corretas', () => {
	assert.equal(cspSourcesEqual(policy, 'style-src', ["'self'", 'https://fonts.googleapis.com']), true);
	assert.equal(cspSourcesEqual(policy, 'font-src', ["'self'", 'https://fonts.gstatic.com']), true);
	assert.equal(cspSourceIsExact(policy, 'style-src', 'https://fonts.googleapis.com.evil.test'), false);
	assert.equal(cspSourcesEqual("style-src 'self' https://fonts.googleapis.com.evil.test", 'style-src', ["'self'", 'https://fonts.googleapis.com']), false);
	assert.equal(cspSourcesEqual("style-src 'self' https://evil.test/path/fonts.googleapis.com", 'style-src', ["'self'", 'https://fonts.googleapis.com']), false);
	assert.equal(cspSourcesEqual("style-src 'self' https://fonts.googleapis.com; style-src https://evil.test", 'style-src', ["'self'", 'https://fonts.googleapis.com']), false);
});

test('recurso permitido depende da própria URL, não dos outros atributos da tag', () => {
	assert.equal(isAllowedResourceUrl('/assets/site.js', 'script', origin), true);
	assert.equal(isAllowedResourceUrl('https://fonts.googleapis.com/css2?family=Open+Sans', 'link', origin, true), true);
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
