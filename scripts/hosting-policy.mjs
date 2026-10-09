// Regras puras usadas pela auditoria de compatibilidade da CSP proposta.
// Comparações são por origem/termo completo, nunca substrings de URLs.
export function cspTokens(policy, directive) {
	const matches = String(policy).split(';')
		.map(section => section.trim().split(/\s+/).filter(Boolean))
		.filter(tokens => tokens[0]?.toLowerCase() === directive.toLowerCase());
	if (matches.length !== 1) return null; // falta ou duplicação de diretiva
	return matches[0].slice(1);
}

export function cspSourceIsExact(policy, directive, source) {
	return cspTokens(policy, directive)?.includes(source) === true;
}

export function cspSourcesEqual(policy, directive, expectedSources) {
	const tokens = cspTokens(policy, directive);
	return tokens !== null &&
		tokens.length === expectedSources.length &&
		tokens.every(token => expectedSources.includes(token));
}

export function isAllowedResourceUrl(rawUrl, kind, productionOrigin, isStylesheet = false) {
	if (!rawUrl || typeof rawUrl !== 'string') return false;
	if (rawUrl.startsWith('data:')) return kind === 'img' || kind === 'source';
	let url;
	try { url = new URL(rawUrl, productionOrigin); }
	catch { return false; }
	if (url.username || url.password) return false;
	if (url.protocol !== 'https:') return false;
	if (url.origin === productionOrigin) return true;
	return kind === 'link' && isStylesheet && url.origin === 'https://fonts.googleapis.com';
}
