import type { MarketingContent } from '../types';

export const servicoProjetoEletrico = {
	slug: 'servico-projeto-eletrico',
	path: '/servico-projeto-eletrico',
	title: 'Serviço de projeto elétrico - AJN Consultoria e Engenharia',
	description: 'Serviço de projeto elétrico de alta qualidade, realizado por uma empresa especializada e comprometida com a segurança e eficiência de suas instalações,...',
	heading: 'Serviço de projeto elétrico',
	images: [
		{ src: '/images/content/marketing/servico-projeto-eletrico/servico-projeto-eletrico-01.webp', alt: 'Serviço de projeto elétrico' },
		{ src: '/images/content/marketing/servico-projeto-eletrico/servico-projeto-eletrico-02.webp', alt: 'Serviço de projeto elétrico' },
		{ src: '/images/content/marketing/servico-projeto-eletrico/servico-projeto-eletrico-03.webp', alt: 'Serviço de projeto elétrico' },
	],
	sections: [
		{ heading: 'serviço de projeto elétrico: A Importância da Consultoria Especializada', paragraphs: [
			'Serviço de projeto elétrico: Um dos pilares fundamentais em qualquer empreendimento ou construção que envolva sistemas elétricos é o projeto elétrico.',
			'É por meio desse serviço que são planejadas e detalhadas todas as instalações elétricas, assegurando um funcionamento seguro e eficiente.',
			'Buscar a expertise de uma consultoria especializada nesse tipo de serviço é essencial para assegurar a qualidade e conformidade das instalações.',
		] },
		{ heading: 'AJN Consultoria e Engenharia: Especialista em serviço de projeto elétrico', paragraphs: [
			'A AJN Consultoria e Engenharia se destaca no mercado de serviços de consultoria e engenharia ao oferecer soluções completas e personalizadas para serviço de projeto elétrico.',
			'Com expertise reconhecida e uma equipe qualificada, a empresa assegura a elaboração de projetos de alta qualidade, seguindo as normas técnicas e de segurança vigentes.',
		], subsections: [{ heading: 'Vantagens de Contratar o serviço de projeto elétrico da AJN', paragraphs: ['Ao optar pelo serviço de projeto elétrico da AJN Consultoria e Engenharia, os clientes contam com uma série de benefícios. Dentre eles, destacam-se:'], lists: [{ items: [
			'Projetos personalizados de acordo com as necessidades de cada cliente;',
			'Conformidade com normas técnicas e de segurança;',
			'Equipe especializada e experiente na elaboração de projetos elétricos;',
			'Certeza de eficiência e segurança nas instalações elétricas;',
			'Acompanhamento técnico durante todas as etapas do projeto.',
		] }] }] },
		{ heading: 'Qualidade, Segurança e Eficiência: Pilares dos Projetos Elétricos da AJN', paragraphs: [
			'A AJN Consultoria e Engenharia preza pela excelência em seus serviços, sempre buscando oferecer soluções que promovem a qualidade, segurança e eficiência nas instalações elétricas de seus clientes.',
			'Com uma abordagem personalizada e foco nas necessidades específicas de cada projeto, a empresa se destaca pela entrega de resultados superiores.',
		] },
		{ heading: 'Contate a AJN Consultoria e Engenharia para seu Projeto Elétrico', paragraphs: [
			'Se você busca por um serviço de projeto elétrico de alta qualidade, realizado por uma empresa especializada e comprometida com a segurança e eficiência de suas instalações, não hesite em contatar a AJN Consultoria e Engenharia.',
			'Nossa equipe está preparada para atender às suas demandas e promover o sucesso do seu projeto elétrico. Entre em contato conosco e solicite um orçamento sem compromisso!',
		] },
		{ heading: 'Para saber mais sobre Serviço de projeto elétrico', paragraphs: [{ segments: ['Ligue para ', { bold: true, text: '31 98473-4644' }, ' ou ', { text: 'clique aqui', href: '/contato' }, ' e entre em contato por email.'] }] },
	],
} as const satisfies MarketingContent;
