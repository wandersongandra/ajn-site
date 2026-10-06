export const prerender = true;
export function GET() {
	const configuredOrigin = import.meta.env.PUBLIC_SITE_ORIGIN ?? 'https://www.ajnengenharia.com.br';
	const origin = new URL(configuredOrigin).origin;
	const noindex = import.meta.env.PUBLIC_SITE_NOINDEX === 'true';
	const body = noindex ? 'User-agent: *\nDisallow: /\n' : `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`;
	return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
