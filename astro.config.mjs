// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const site = (process.env.PUBLIC_SITE_ORIGIN || 'https://ajnengenharia.com.br').replace(/\/+$/, '');
const sitemapExcludedPaths = new Set([
	'/informacoes',
	'/servicos/projetos-eletricos-residenciais-comerciais-e-prediais-com-foco-em-qualidade-prazo-e-economia',
]);
/** @param {string} url */
const normalizeSitemapPath = (url) => new URL(url).pathname.replace(/\/+$/, '') || '/';

// https://astro.build/config
export default defineConfig({
	site,
	integrations: [sitemap({
		// Redirecionamentos e páginas legadas canonicalizadas não representam URLs indexáveis.
		filter: (url) => !sitemapExcludedPaths.has(normalizeSitemapPath(url)),
	})],
	// Fallback estático do Astro; a hospedagem Apache aplica HTTP 301 via .htaccess.
	redirects: { '/informacoes': { destination: '/mapa-site', status: 301 } },
});
