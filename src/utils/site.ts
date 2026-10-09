const DEFAULT_SITE_ORIGIN = 'https://ajnengenharia.com.br';

export { serializeJsonLd } from './json-ld.mjs';

export const siteOrigin = (import.meta.env.PUBLIC_SITE_ORIGIN ?? DEFAULT_SITE_ORIGIN).replace(/\/+$/, '');

export function absoluteSiteUrl(pathOrUrl: string): string {
	if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
	return `${siteOrigin}/${pathOrUrl.replace(/^\/+/, '')}`;
}
