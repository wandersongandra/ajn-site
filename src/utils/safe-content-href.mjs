export function isSafeContentHref(href) {
	if (
		typeof href !== 'string' ||
		href.length === 0 ||
		href !== href.trim() ||
		/[\p{Cc}\p{Zl}\p{Zp}\\]/u.test(href)
	) return false;

	try {
		if (/[\p{Cc}\p{Zl}\p{Zp}\\]/u.test(decodeURIComponent(href))) return false;
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
