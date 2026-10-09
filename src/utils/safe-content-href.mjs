export function isSafeContentHref(href) {
	if (typeof href !== 'string' || href.length === 0) return false;

	try {
		const base = new URL('https://content.invalid');
		const url = new URL(href, base);
		if (href.startsWith('/')) {
			return !href.startsWith('//') && !href.includes('\\') && url.origin === base.origin;
		}
		return url.protocol === 'https:' && !url.username && !url.password;
	} catch {
		return false;
	}
}
