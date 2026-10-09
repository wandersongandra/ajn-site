export function extractScriptElements(html) {
	return [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)].map(([, attributes, body]) => ({
		attributes,
		body,
	}));
}
