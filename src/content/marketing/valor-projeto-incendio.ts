import type { MarketingContent } from '../types';

export const valorProjetoIncendio = {
	slug: 'valor-projeto-incendio',
	path: '/valor-projeto-incendio',
	title: 'Valor de Projeto de Incêndio (PSCIP / AVCB) em BH e MG | AJN',
	description: 'Descubra o que define o valor de um projeto de incêndio em Belo Horizonte e MG: área em m², ocupação, taxas do CBMMG e sistemas preventivos exigidos.',
	heading: 'Valor de Projeto de Incêndio: O que Considerar no Custo Total',
	images: [
		{ src: '/images/content/marketing/valor-projeto-incendio/valor-projeto-incendio-01.webp', alt: 'Cálculo do valor de projeto de incêndio para edificações' },
		{ src: '/images/content/marketing/valor-projeto-incendio/valor-projeto-incendio-02.webp', alt: 'Análise técnica de hidrantes, extintores e sinalização de emergência' },
		{ src: '/images/content/marketing/valor-projeto-incendio/valor-projeto-incendio-03.webp', alt: 'Aprovação de projeto de incêndio junto ao Corpo de Bombeiros' },
	],
	sections: [
		{
			heading: 'Diferença entre o custo do projeto, as taxas do CBMMG e a execução',
			paragraphs: [
				'Para planejar a regularização de um imóvel junto ao Corpo de Bombeiros, vale separar três parcelas distintas: o valor do projeto de engenharia (PSCIP), as taxas estaduais recolhidas via DAE (análise e vistoria do CBMMG) e o custo de compra e instalação física dos equipamentos.',
				'Um projeto de incêndio bem estudado atua diretamente na terceira parcela, que é sempre a mais alta: ao aplicar corretamente as Instruções Técnicas do CBMMG, o engenheiro evita exigências desnecessárias na obra e dimensiona tubulações e equipamentos sem desperdício.',
			],
		},
		{
			heading: 'Fatores que definem o valor do projeto de incêndio',
			paragraphs: [
				'A AJN Consultoria e Engenharia calcula o valor do projeto com base nos parâmetros objetivos do imóvel:',
			],
			lists: [
				{
					items: [
						'Metragem total construída e distribuição por pavimentos ou blocos;',
						'Divisão de ocupação e carga de incêndio (MJ/m²) segundo a IT 09 do CBMMG;',
						'Existência de plantas arquitetônicas atualizadas ou necessidade de medição em campo;',
						'Complexidade das medidas exigidas (sistemas básicos de extintores/sinalização versus redes hidráulicas pressurizadas, detecção automática e controle de fumaça);',
						'Modalidade do processo (projeto novo, modificação de projeto aprovado ou Processo Técnico Simplificado - PTS).',
					],
				},
			],
		},
		{
			heading: 'Atendimento em Belo Horizonte e Minas Gerais',
			paragraphs: [
				'Atendemos proprietários de imóveis, síndicos, contadores, arquitetos e gestores industriais com propostas claras, cronograma definido e emissão de ART.',
				{
					segments: [
						'Confira também nossas páginas de ',
						{ text: 'Preço de Projeto de Combate a Incêndio', href: '/projeto-combate-incendio-preco' },
						' e ',
						{ text: 'Regularização de Imóveis junto ao Corpo de Bombeiros', href: '/servicos/regularizacao-de-imoveis-junto-ao-corpo-de-bombeiros' },
						'.',
					],
				},
			],
		},
		{
			heading: 'Solicite uma cotação para o seu projeto de incêndio',
			paragraphs: [
				'Envie o endereço, a área aproximada e o tipo de atividade do imóvel para nossa equipe técnica.',
				{
					segments: [
						'Ligue para ',
						{ bold: true, text: '31 98473-4644' },
						' ou ',
						{ text: 'peça seu orçamento pelo site', href: '/contato' },
						'.',
					],
				},
			],
		},
	],
} as const satisfies MarketingContent;
