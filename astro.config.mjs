// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const site = (process.env.PUBLIC_SITE_ORIGIN || 'https://www.ajnengenharia.com.br').replace(/\/+$/, '');

// https://astro.build/config
export default defineConfig({
	site,
	integrations: [sitemap({
		// Redirecionamentos não representam páginas indexáveis.
		filter: (url) => !/^\/informacoes\/?$/.test(new URL(url).pathname),
	})],
	// Fallback estático do Astro; a hospedagem Apache aplica HTTP 301 via .htaccess.
	redirects: { '/informacoes': { destination: '/mapa-site', status: 301 } },
});
