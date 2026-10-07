// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const site = (process.env.PUBLIC_SITE_ORIGIN || 'https://www.ajnengenharia.com.br').replace(/\/+$/, '');

// https://astro.build/config
export default defineConfig({
	site,
	integrations: [sitemap()],
	redirects: {},
});
