import type { MarketingContent } from '../types';

export const projetoProtecaoIncendio = {
	slug: 'projeto-protecao-incendio',
	path: '/projeto-protecao-incendio',
	title: 'Projeto de Proteção Contra Incêndio para Empresas | AJN',
	description: 'Desenvolvimento de projeto de proteção contra incêndio em BH e MG. Dimensionamento técnico conforme ITs do CBMMG e normas ABNT para obtenção de AVCB.',
	heading: 'Projeto de Proteção Contra Incêndio',
	images: [
		{ src: '/images/content/marketing/orcamento-projeto-combate-incendio/orcamento-projeto-combate-incendio-01.webp', alt: 'Projeto de proteção contra incêndio para edificações comerciais e industriais' },
		{ src: '/images/content/marketing/orcamento-projeto-combate-incendio/orcamento-projeto-combate-incendio-02.webp', alt: 'Dimensionamento de equipamentos de proteção contra incêndio' },
		{ src: '/images/content/marketing/orcamento-projeto-combate-incendio/orcamento-projeto-combate-incendio-03.webp', alt: 'Acompanhamento técnico para aprovação e AVCB' },
	],
	sections: [
		{
			heading: 'Dimensionamento técnico de proteção contra incêndio',
			paragraphs: [
				'O projeto de proteção contra incêndio traduz as exigências das normas estaduais e da ABNT em plantas executivas, isométricos e memoriais de cálculo para que a edificação conte com sistemas de prevenção e combate confiáveis.',
				'Sediada em Belo Horizonte, a AJN Consultoria e Engenharia elabora projetos de proteção contra incêndio para imóveis comerciais, galpões, indústrias, clínicas, escolas e condomínios em todo o estado de Minas Gerais.',
			],
		},
		{
			heading: 'Medidas de proteção avaliadas em cada edificação',
			paragraphs: [
				'A definição dos sistemas obrigatórios parte do enquadramento técnico do imóvel no Decreto Estadual nº 47.998/2020 do CBMMG:',
			],
			lists: [
				{
					items: [
						'Proteção por extintores de incêndio portáteis e sobre rodas distribuídos conforme raio máximo de caminhamento e classe de risco;',
						'Iluminação de emergência e sinalização de orientação de rotas de fuga e identificação de equipamentos;',
						'Sistemas de detecção automática de fumaça/temperatura e alarme de incêndio;',
						'Rede de hidrantes, mangotinhos, casa de bombas de incêndio, reservatório técnico e registro de recalque;',
						'Saídas de emergência dimensionadas para o fluxo populacional de cada pavimento.',
					],
				},
			],
		},
		{
			heading: 'Do protocolo no Corpo de Bombeiros à emissão do AVCB',
			paragraphs: [
				'Entregamos o projeto completo com Anotação de Responsabilidade Técnica (ART), acompanhamos a análise junto ao CBMMG e orientamos o proprietário ou gestor na fase de adequação física e solicitação da vistoria final para emissão do AVCB.',
				{
					segments: [
						'Consulte também nossas páginas sobre ',
						{ text: 'Regularização de Imóveis junto ao Corpo de Bombeiros', href: '/servicos/regularizacao-de-imoveis-junto-ao-corpo-de-bombeiros/' },
						' e ',
						{ text: 'Projetos de Combate a Incêndio e Pânico (PPCIP)', href: '/servicos/projetos-de-combate-a-incendio-e-panico-ppcip/' },
						'.',
					],
				},
			],
		},
		{
			heading: 'Peça uma proposta para o seu projeto',
			paragraphs: [
				'Informe a metragem, a cidade e a atividade desenvolvida no imóvel para receber nosso orçamento técnico.',
				{
					segments: [
						'Ligue para ',
						{ bold: true, text: '31 98473-4644' },
						' ou ',
						{ text: 'entre em contato com a AJN', href: '/contato/' },
						'.',
					],
				},
			],
		},
	],
} as const satisfies MarketingContent;
