import type { MarketingContent } from '../types';

export const projetoSistemaIncendio = {
	slug: 'projeto-sistema-incendio',
	path: '/projeto-sistema-incendio',
	title: 'Projeto de sistema de incêndio - AJN Consultoria e Engenharia',
	description: 'Projeto de sistema de incêndio requer conhecimento técnico e especialização para garantir que todas as exigências das normas e legislações vigentes sejam...',
	heading: 'Projeto de sistema de incêndio',
	images: [
		{ src: '/images/content/marketing/projeto-sistema-incendio/projeto-sistema-incendio-01.webp', alt: 'Projeto de sistema de incêndio' },
		{ src: '/images/content/marketing/projeto-sistema-incendio/projeto-sistema-incendio-02.webp', alt: 'Projeto de sistema de incêndio' },
		{ src: '/images/content/marketing/projeto-sistema-incendio/projeto-sistema-incendio-03.webp', alt: 'Projeto de sistema de incêndio' },
	],
	sections: [
		{
			heading: 'A importância do projeto de sistema de incêndio',
			paragraphs: [
				'Quando se trata de segurança do trabalho, um dos aspectos mais cruciais a serem considerados é o projeto de sistema de incêndio. Essa medida preventiva é fundamental para proteger vidas e patrimônios, evitando danos irreparáveis em casos de incêndios.',
				'É por isso que a AJN Consultoria e Engenharia se destaca no mercado, oferecendo serviços especializados na elaboração de projetos de combate a incêndio.',
			],
		},
		{
			heading: 'Conformidade com normas técnicas e legislações vigentes',
			paragraphs: [
				'A elaboração de um projeto de sistema de incêndio requer conhecimento técnico e especialização para garantir que todas as exigências das normas e legislações vigentes sejam atendidas.',
				'Com uma equipe qualificada e experiente, a AJN Consultoria e Engenharia assegura que seus projetos estejam conforme todas as regulamentações, proporcionando segurança e tranquilidade aos seus clientes.',
			],
		},
		{
			heading: 'Serviços oferecidos pela AJN Consultoria e Engenharia',
			paragraphs: [],
			lists: [{ items: [
				'Prevenção e combate a incêndios, com consultoria e projeto',
				'Segurança ocupacional, qualidade, saúde e consultoria ambiental',
				'Relatórios de especialistas e relatórios de responsabilidade técnica',
				'Certificações e serviços de treinamento NRs',
				'Mobilização de equipe qualificada e preparada',
			]}],
		},
		{
			heading: 'Profissionalismo e comprometimento no projeto de sistema de incêndio',
			paragraphs: [
				'O engenheiro Antônio Jorlei, responsável pela AJN Consultoria e Engenharia, é um profissional especializado em QSMS, com mais de 8 anos de experiência no mercado de engenharia.',
				'Sua dedicação e especialização garantem que todo projeto de sistema de incêndio seja executado com profissionalismo e comprometimento, visando sempre a excelência e a satisfação dos clientes.',
			],
			subsections: [{
				heading: 'Entre em contato conosco!',
				paragraphs: [
					'Se você busca garantir a segurança e a proteção do seu patrimônio, conte com a AJN Consultoria e Engenharia.',
					'Nossa equipe está preparada para oferecer soluções personalizadas e eficientes em projeto de sistema de incêndio. Entre em contato conosco e saiba como podemos ajudar a proteger o seu negócio!',
				],
			}],
		},
		{
			heading: 'Para saber mais sobre Projeto de sistema de incêndio',
			paragraphs: [{ segments: ['Ligue para ', { bold: true, text: '31 98473-4644' }, ' ou ', { text: 'clique aqui', href: '/contato' }, ' e entre em contato por email.'] }],
		},
	],
} as const satisfies MarketingContent;
