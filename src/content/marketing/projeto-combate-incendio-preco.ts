import type { MarketingContent } from '../types';

export const projetoCombateIncendioPreco = {
	slug: 'projeto-combate-incendio-preco',
	path: '/projeto-combate-incendio-preco',
	title: 'Preço de Projeto de Combate a Incêndio: O que Influencia | AJN',
	description: 'Saiba como é calculado o preço de um projeto de combate a incêndio em BH e MG: área construída, enquadramento no CBMMG (PT ou PTS), sistemas exigidos e levantamento arquitetônico.',
	heading: 'Preço de Projeto de Combate a Incêndio: Fatores de Orçamento',
	images: [
		{ src: '/images/content/marketing/projeto-combate-incendio-preco/projeto-combate-incendio-preco-01.webp', alt: 'Avaliação técnica para preço de projeto de combate a incêndio' },
		{ src: '/images/content/marketing/projeto-combate-incendio-preco/projeto-combate-incendio-preco-02.webp', alt: 'Levantamento de área e medidas preventivas contra incêndio' },
		{ src: '/images/content/marketing/projeto-combate-incendio-preco/projeto-combate-incendio-preco-03.webp', alt: 'Dimensionamento de sistemas de hidrantes, alarme e extintores' },
	],
	sections: [
		{
			heading: 'O que define o preço de um projeto de combate a incêndio',
			paragraphs: [
				'O preço para elaborar um projeto de combate a incêndio depende da modalidade de processo exigida pelo Corpo de Bombeiros Militar de Minas Gerais (CBMMG) e da complexidade dos sistemas que precisam ser calculados.',
				'Edificações menores e de baixo risco que se enquadram em Projeto Técnico Simplificado (PTS) exigem um escopo mais enxuto do que indústrias, centros logísticos, escolas, hospitais ou condomínios verticais enquadrados em Projeto Técnico Completo (PT), que necessitam de aprovação prévia das plantas no sistema INFOSCIP.',
			],
		},
		{
			heading: 'Variáveis analisadas na proposta comercial',
			paragraphs: [
				'Para apresentar um orçamento preciso, a AJN Consultoria e Engenharia verifica os seguintes itens do imóvel:',
			],
			lists: [
				{
					items: [
						'Área total construída (m²), altura da edificação e número de pavimentos;',
						'Classificação da ocupação e carga de incêndio (comércio, indústria, depósito, reunião de público, serviços ou multifamiliar);',
						'Disponibilidade de plantas arquitetônicas atualizadas em formato editável (.DWG/BIM) ou necessidade de levantamento cadastral (as-built) em campo;',
						'Sistemas exigidos pelas Tabelas do Decreto Estadual nº 47.998/2020 (extintores, iluminação, sinalização, alarme e detecção, hidrantes, sprinklers, controle de fumaça);',
						'Taxas estaduais de análise e vistoria (DAE do CBMMG) e emissão de Anotação de Responsabilidade Técnica (ART).',
					],
				},
			],
		},
		{
			heading: 'Como um projeto bem dimensionado reduz o custo da obra',
			paragraphs: [
				'Economizar no projeto técnico contratando soluções mal calculadas costuma multiplicar o gasto na etapa de instalação: tubulações superdimensionadas, bombas incorretas ou exigências apontadas apenas na vistoria final dos Bombeiros geram retrabalho caro.',
				{
					segments: [
						'Confira também nossas páginas sobre ',
						{ text: 'Orçamento de Projeto de Combate a Incêndio', href: '/orcamento-projeto-combate-incendio/' },
						' e ',
						{ text: 'Projetos de Combate a Incêndio e Pânico (PPCIP)', href: '/servicos/projetos-de-combate-a-incendio-e-panico-ppcip/' },
						'.',
					],
				},
			],
		},
		{
			heading: 'Solicite uma cotação para o seu imóvel',
			paragraphs: [
				'Informe a cidade, a metragem aproximada e o tipo de uso do imóvel para receber uma proposta detalhada da AJN.',
				{
					segments: [
						'Ligue para ',
						{ bold: true, text: '31 98473-4644' },
						' ou ',
						{ text: 'peça seu orçamento pelo site', href: '/contato/' },
						'.',
					],
				},
			],
		},
	],
} as const satisfies MarketingContent;
