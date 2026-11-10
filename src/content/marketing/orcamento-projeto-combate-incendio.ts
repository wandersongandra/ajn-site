import type { MarketingContent } from '../types';

export const orcamentoProjetoCombateIncendio = {
	slug: 'orcamento-projeto-combate-incendio',
	path: '/orcamento-projeto-combate-incendio',
	title: 'Orçamento de Projeto de Combate a Incêndio em BH e MG | AJN',
	description: 'Solicite orçamento de projeto de combate a incêndio (PSCIP) em Belo Horizonte e MG. Veja quais dados do imóvel informar para receber sua proposta técnica.',
	heading: 'Orçamento de Projeto de Combate a Incêndio',
	images: [
		{ src: '/images/content/marketing/orcamento-projeto-combate-incendio/orcamento-projeto-combate-incendio-01.webp', alt: 'Orçamento de projeto de combate a incêndio para empresas e condomínios' },
		{ src: '/images/content/marketing/orcamento-projeto-combate-incendio/orcamento-projeto-combate-incendio-02.webp', alt: 'Análise de plantas e sistemas preventivos para orçamento' },
		{ src: '/images/content/marketing/orcamento-projeto-combate-incendio/orcamento-projeto-combate-incendio-03.webp', alt: 'Levantamento técnico junto ao Corpo de Bombeiros CBMMG' },
	],
	sections: [
		{
			heading: 'Como solicitar um orçamento preciso de projeto de combate a incêndio',
			paragraphs: [
				'Para elaborar um orçamento de Projeto de Segurança Contra Incêndio e Pânico (PSCIP) sem surpresas ou aditivos posteriores, a engenharia precisa primeiro identificar em qual modalidade do Decreto Estadual nº 47.998/2020 o imóvel se enquadra e quais sistemas preventivos são exigidos.',
				'A AJN Consultoria e Engenharia analisa os dados preliminares da sua edificação em Belo Horizonte ou interior de Minas Gerais e apresenta uma proposta discriminando cada etapa técnica.',
			],
		},
		{
			heading: 'Dados do imóvel que agilizam a sua proposta',
			paragraphs: [
				'Ao entrar em contato conosco, procure informar:',
			],
			lists: [
				{
					items: [
						'Endereço completo ou município da edificação;',
						'Área total construída aproximada (em m²), número de pavimentos e altura;',
						'Atividade exercida no local (ex.: loja comercial, galpão de logística, indústria, escola, clínica, edifício residencial);',
						'Existência ou não de plantas arquitetônicas em arquivo digital (.DWG / AutoCAD ou Revit);',
						'Situação atual perante o CBMMG (primeiro projeto, modificação de projeto aprovado, resposta a notificação de fiscalização ou renovação de AVCB).',
					],
				},
			],
		},
		{
			heading: 'O que está incluído na proposta técnica da AJN',
			paragraphs: [
				'Nossos orçamentos detalham de forma transparente o levantamento em campo (quando necessário), a elaboração das pranchas e memoriais de cálculo dos sistemas exigidos, a emissão da ART de projeto e o acompanhamento da análise no portal INFOSCIP até a aprovação.',
				{
					segments: [
						'Consulte também nossas páginas sobre ',
						{ text: 'Preço de Projeto de Combate a Incêndio', href: '/projeto-combate-incendio-preco' },
						' e ',
						{ text: 'Projetos de Combate a Incêndio e Pânico (PPCIP)', href: '/servicos/projetos-de-combate-a-incendio-e-panico-ppcip' },
						'.',
					],
				},
			],
		},
		{
			heading: 'Peça seu orçamento à AJN Consultoria e Engenharia',
			paragraphs: [
				'Envie as informações básicas do seu imóvel para que nossa equipe prepare a cotação.',
				{
					segments: [
						'Ligue para ',
						{ bold: true, text: '31 98473-4644' },
						' ou ',
						{ text: 'solicite seu orçamento pelo site', href: '/contato' },
						'.',
					],
				},
			],
		},
	],
} as const satisfies MarketingContent;
