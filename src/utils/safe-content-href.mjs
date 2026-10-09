export function isSafeContentHref(href) {
	if (typeof href !== 'string' || href.length === 0) return false;

	try {
		const base = new URL('https://content.invalid');
		if (href.startsWith('/')) {
			return !href.startsWith('//') && new URL(href, base).origin === base.origin;
		}
		if (!/^https:\/\//i.test(href)) return false;
		const url = new URL(href);
		return url.protocol === 'https:' && !url.username && !url.password;
	} catch {
		return false;
	}
}
