function findTagEnd(html, start) {
	let quote = '';
	for (let index = start; index < html.length; index += 1) {
		const character = html[index];
		if (quote) {
			if (character === quote) quote = '';
		} else if (character === '"' || character === "'") {
			quote = character;
		} else if (character === '>') {
			return index;
		}
	}
	return -1;
}

function findScriptTag(html, from, closing) {
	const marker = closing ? '</script' : '<script';
	let index = from;
	while ((index = html.toLowerCase().indexOf(marker, index)) !== -1) {
		const nameEnd = index + marker.length;
		const next = html[nameEnd];
		if (next === '>' || /\s/.test(next ?? '')) {
			const tagEnd = findTagEnd(html, nameEnd);
			if (tagEnd !== -1) return { start: index, nameEnd, end: tagEnd };
			return null;
		}
		index = nameEnd;
	}
	return null;
}

export function extractScriptElements(html) {
	const scripts = [];
	let cursor = 0;
	let opening;
	while ((opening = findScriptTag(html, cursor, false))) {
		const closing = findScriptTag(html, opening.end + 1, true);
		if (!closing) break;
		scripts.push({
			attributes: html.slice(opening.nameEnd, opening.end),
			body: html.slice(opening.end + 1, closing.start),
		});
		cursor = closing.end + 1;
	}
	return scripts;
}

// Read attribute names without treating data-src or quoted strings like " src=x"
// as real HTML attributes. This is a lightweight audit parser, not a DOM sanitizer.
export function getHtmlAttributeValue(attributes, expectedName) {
	const source = String(attributes);
	const expected = expectedName.toLowerCase();
	let cursor = 0;
	while (cursor < source.length) {
		while (cursor < source.length && /\s/.test(source[cursor])) cursor += 1;
		if (source[cursor] === '/' || source[cursor] === '>') { cursor += 1; continue; }
		const start = cursor;
		while (cursor < source.length && !/[\s=/>]/.test(source[cursor])) cursor += 1;
		if (start === cursor) { cursor += 1; continue; }
		const name = source.slice(start, cursor).toLowerCase();
		while (cursor < source.length && /\s/.test(source[cursor])) cursor += 1;
		if (source[cursor] !== '=') continue;
		cursor += 1;
		while (cursor < source.length && /\s/.test(source[cursor])) cursor += 1;
		let value;
		if (source[cursor] === '"' || source[cursor] === "'") {
			const quote = source[cursor++];
			const valueStart = cursor;
			while (cursor < source.length && source[cursor] !== quote) cursor += 1;
			value = source.slice(valueStart, cursor);
			if (source[cursor] === quote) cursor += 1;
		} else {
			const valueStart = cursor;
			while (cursor < source.length && !/[\s>]/.test(source[cursor])) cursor += 1;
			value = source.slice(valueStart, cursor);
		}
		if (name === expected) return value;
	}
	return null;
}

export function hasExactHtmlAttribute(attributes, name) {
	if (!/^[a-z][a-z0-9-]*$/i.test(name)) throw new Error('Nome de atributo inválido');
	return getHtmlAttributeValue(attributes, name) !== null;
}

export function isJsonLdScript(attributes) {
	return getHtmlAttributeValue(attributes, 'type')?.toLowerCase() === 'application/ld+json';
}
