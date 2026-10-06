import { marketingPages } from '../content/marketing';
import { servicePages } from '../content/services';
export const prerender = true;
const staticRoutes = ['/', '/sobre-nos', '/servicos', '/blog', '/contato', '/informacoes', '/mapa-site', '/blog/a-importancia-do-ltcat-para-a-seguranca-do-trabalho-e-a-protecao-do-ambiente-profissional'];
export function GET() {
	const configuredOrigin = import.meta.env.PUBLIC_SITE_ORIGIN ?? 'https://www.ajnengenharia.com.br';
	const origin = new URL(configuredOrigin).origin;
	const routes = [...new Set([...staticRoutes, ...servicePages.map((page) => page.path), ...marketingPages.map((page) => page.path)])].sort();
	const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes.map((route) => `  <url><loc>${new URL(route, origin + '/').href}</loc></url>`).join('\n')}\n</urlset>\n`;
	return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
