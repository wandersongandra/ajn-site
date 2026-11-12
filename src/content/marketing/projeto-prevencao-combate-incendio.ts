import type { MarketingContent } from '../types';

export const projetoPrevencaoCombateIncendio = {
	slug: 'projeto-prevencao-combate-incendio',
	path: '/projeto-prevencao-combate-incendio',
	title: 'Projeto de Prevenção e Combate a Incêndio em BH e MG | AJN',
	description: 'Elaboração de projeto de prevenção e combate a incêndio para indústrias, galpões, comércios e condomínios em BH e MG conforme normas do CBMMG e ABNT.',
	heading: 'Projeto de Prevenção e Combate a Incêndio',
	images: [
		{ src: '/images/content/marketing/projeto-prevencao-combate-incendio/projeto-prevencao-combate-incendio-01.webp', alt: 'Projeto de prevenção e combate a incêndio em edificação' },
		{ src: '/images/content/marketing/projeto-prevencao-combate-incendio/projeto-prevencao-combate-incendio-02.webp', alt: 'Inspeção de sistemas de hidrantes e extintores' },
		{ src: '/images/content/marketing/projeto-prevencao-combate-incendio/projeto-prevencao-combate-incendio-03.webp', alt: 'Engenharia de prevenção contra incêndios e regularização' },
	],
	sections: [
		{
			heading: 'Como o projeto de prevenção e combate a incêndio protege a operação',
			paragraphs: [
				'Um projeto de prevenção e combate a incêndio bem estruturado atua antes que o sinistro ocorra: define distâncias seguras de armazenamento, especifica o controle de materiais de acabamento, dimensiona o sistema de detecção precoce e garante que a brigada e o Corpo de Bombeiros tenham pressão e vazão de água suficientes em caso de acionamento.',
				'A AJN Consultoria e Engenharia desenvolve projetos técnicos personalizados para galpões logísticos, plantas industriais, estabelecimentos comerciais e condomínios em Belo Horizonte e Minas Gerais.',
			],
		},
		{
			heading: 'Critérios técnicos aplicados no dimensionamento',
			paragraphs: [
				'Nossa engenharia aplica as Instruções Técnicas do CBMMG e as normas da ABNT pertinentes a cada medida de segurança:',
			],
			lists: [
				{
					items: [
						'Levantamento da carga de incêndio específica em MJ/m² (IT 09) conforme os materiais estocados ou processados no local;',
						'Dimensionamento de saídas de emergência, escadas protegidas e portas corta-fogo (IT 08 e NBR 9077);',
						'Especificação de extintores portáteis e sobre rodas por classe de fogo A, B, C ou D (IT 16 e NBR 12693);',
						'Cálculo de perda de carga, diâmetros de tubulação, abrigos de mangueiras, conjunto motobomba e reserva técnica de incêndio (IT 17 e NBR 13714);',
						'Projetos especiais para áreas com líquidos inflamáveis e combustíveis (IT 25), GLP (IT 23) ou sistemas de chuveiros automáticos.',
					],
				},
			],
		},
		{
			heading: 'Apoio para obtenção de AVCB e exigências de seguradoras',
			paragraphs: [
				'Além de viabilizar a emissão ou renovação do AVCB junto ao Corpo de Bombeiros, manter o projeto de prevenção e combate a incêndio aprovado e executado em conformidade técnica é condição exigida pelas seguradoras para validação de apólices patrimoniais.',
				{
					segments: [
						'Consulte também a página do serviço de ',
						{ text: 'Projetos de Combate a Incêndio e Pânico (PPCIP)', href: '/servicos/projetos-de-combate-a-incendio-e-panico-ppcip/' },
						'.',
					],
				},
			],
		},
		{
			heading: 'Solicite uma proposta técnica à AJN',
			paragraphs: [
				'Compartilhe os dados do seu imóvel ou empreendimento para avaliarmos o escopo do projeto de prevenção e combate a incêndio.',
				{
					segments: [
						'Ligue para ',
						{ bold: true, text: '31 98473-4644' },
						' ou ',
						{ text: 'solicite orçamento pelo site', href: '/contato/' },
						'.',
					],
				},
			],
		},
	],
} as const satisfies MarketingContent;
