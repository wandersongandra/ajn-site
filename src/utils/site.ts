const DEFAULT_SITE_ORIGIN = 'https://www.ajnengenharia.com.br';

export const siteOrigin = (import.meta.env.PUBLIC_SITE_ORIGIN ?? DEFAULT_SITE_ORIGIN).replace(/\/+$/, '');

export function absoluteSiteUrl(pathOrUrl: string): string {
	if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
	return `${siteOrigin}/${pathOrUrl.replace(/^\/+/, '')}`;
}

export function serializeJsonLd(value: unknown): string {
	const serialized = JSON.stringify(value);
	return (serialized ?? 'null')
		.replace(/</g, '\\u003c')
		.replace(/>/g, '\\u003e')
		.replace(/&/g, '\\u0026')
		.replace(/\u2028/g, '\\u2028')
		.replace(/\u2029/g, '\\u2029');
}
