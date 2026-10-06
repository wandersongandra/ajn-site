// @ts-check
import { defineConfig } from 'astro/config';

const site = process.env.PUBLIC_SITE_ORIGIN || 'https://www.ajnengenharia.com.br';

export default defineConfig({
	output: 'static',
	site,
	trailingSlash: 'never',
});
