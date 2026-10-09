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

export function hasExactHtmlAttribute(attributes, name) {
	if (!/^[a-z][a-z0-9-]*$/i.test(name)) throw new Error('Nome de atributo inválido');
	return new RegExp('(?:^|\\s)' + name + '\\s*=', 'i').test(attributes);
}

export function isJsonLdScript(attributes) {
	const match = /(?:^|\s)type\s*=\s*(["'])([^"']+)\1/i.exec(attributes);
	return match?.[2].toLowerCase() === 'application/ld+json';
}
