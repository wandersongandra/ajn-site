// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const site = (process.env.PUBLIC_SITE_ORIGIN || 'https://ajnengenharia.com.br').replace(/\/+$/, '');

// https://astro.build/config
export default defineConfig({
	site,
	integrations: [sitemap({
		// Redirecionamentos não representam páginas indexáveis.
		filter: (url) => !/^\/informacoes\/?$/.test(new URL(url).pathname),
	})],
	// Fallback estático do Astro; a hospedagem Apache aplica HTTP 301 via .htaccess.
	redirects: {
		'/informacoes': { destination: '/mapa-site', status: 301 },
		// content/remover-servicos-eletricos-elevadores
		'/analise-projetos-eletricos-bh': { destination: '/servicos', status: 301 },
		'/elevacao-vertical': { destination: '/servicos', status: 301 },
		'/elevador-bh': { destination: '/servicos', status: 301 },
		'/empresa-elevador': { destination: '/servicos', status: 301 },
		'/empresa-elevador-belo-horizonte': { destination: '/servicos', status: 301 },
		'/empresa-escada-rolante': { destination: '/servicos', status: 301 },
		'/empresa-plataforma-elevatoria': { destination: '/servicos', status: 301 },
		'/empresa-projeto-eletrico': { destination: '/servicos', status: 301 },
		'/empresa-projeto-eletrico-bh': { destination: '/servicos', status: 301 },
		'/empresas-elevadores-bh': { destination: '/servicos', status: 301 },
		'/empresas-manutencao-elevadores-bh': { destination: '/servicos', status: 301 },
		'/escada-rolante': { destination: '/servicos', status: 301 },
		'/escada-rolante-belo-horizonte': { destination: '/servicos', status: 301 },
		'/escada-rolante-bh': { destination: '/servicos', status: 301 },
		'/instalacao-predial-eletrica': { destination: '/servicos', status: 301 },
		'/instalacoes-eletricas-projeto': { destination: '/servicos', status: 301 },
		'/manutencao-elevadores-belo-horizonte': { destination: '/servicos', status: 301 },
		'/manutencao-elevadores-bh': { destination: '/servicos', status: 301 },
		'/orcamento-projeto-eletrico': { destination: '/servicos', status: 301 },
		'/plataforma-acessibilidade': { destination: '/servicos', status: 301 },
		'/plataforma-acessibilidade-bh': { destination: '/servicos', status: 301 },
		'/plataforma-acessibilidade-preco': { destination: '/servicos', status: 301 },
		'/plataforma-elevatoria': { destination: '/servicos', status: 301 },
		'/plataforma-elevatoria-belo-horizonte': { destination: '/servicos', status: 301 },
		'/plataforma-elevatoria-bh': { destination: '/servicos', status: 301 },
		'/plataforma-elevatoria-preco': { destination: '/servicos', status: 301 },
		'/preco-projetos-eletricos': { destination: '/servicos', status: 301 },
		'/projeto-eletrico': { destination: '/servicos', status: 301 },
		'/projeto-eletrico-belo-horizonte': { destination: '/servicos', status: 301 },
		'/projeto-eletrico-bh': { destination: '/servicos', status: 301 },
		'/projeto-eletrico-comercial': { destination: '/servicos', status: 301 },
		'/projeto-eletrico-industrial': { destination: '/servicos', status: 301 },
		'/projeto-eletrico-industrial-belo-horizonte': { destination: '/servicos', status: 301 },
		'/projeto-eletrico-industrial-preco': { destination: '/servicos', status: 301 },
		'/projeto-eletrico-preco': { destination: '/servicos', status: 301 },
		'/projeto-eletrico-residencial': { destination: '/servicos', status: 301 },
		'/projeto-eletrico-residencial-belo-horizonte': { destination: '/servicos', status: 301 },
		'/projeto-eletrico-residencial-completo': { destination: '/servicos', status: 301 },
		'/projeto-eletrico-residencial-orcamento': { destination: '/servicos', status: 301 },
		'/projeto-instalacao-eletrica-residencial': { destination: '/servicos', status: 301 },
		'/projeto-instalacoes-eletricas': { destination: '/servicos', status: 301 },
		'/projetos-eletricos-orcamento': { destination: '/servicos', status: 301 },
		'/projetos-eletricos-prediais': { destination: '/servicos', status: 301 },
		'/projetos-engenharia-eletrica': { destination: '/servicos', status: 301 },
		'/projetos-instalacoes-eletricas-prediais': { destination: '/servicos', status: 301 },
		'/servico-projeto-eletrico': { destination: '/servicos', status: 301 },
		'/projetos-spda': { destination: '/servicos', status: 301 },
		'/projetos-cabeamento-estruturado': { destination: '/servicos', status: 301 },
		'/servicos/projetos-eletricos-residenciais-comerciais-e-prediais-com-foco-em-qualidade-prazo-e-economia': { destination: '/servicos', status: 301 },
	},
});
