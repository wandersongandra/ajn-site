import type { APIRoute } from 'astro';

export const prerender = true;

export const GET: APIRoute = () => {
	const siteOrigin = (import.meta.env.PUBLIC_SITE_ORIGIN ?? 'https://www.ajnengenharia.com.br').replace(/\/+$/, '');
	const allowIndexing = import.meta.env.PUBLIC_ALLOW_INDEXING === 'true';

	const body = allowIndexing
		? `User-agent: *\nAllow: /\n\nSitemap: ${siteOrigin}/sitemap-index.xml\n`
		: 'User-agent: *\nDisallow: /\n';

	return new Response(body, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
		},
	});
};
