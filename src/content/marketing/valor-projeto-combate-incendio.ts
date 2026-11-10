import type { MarketingContent } from '../types';

export const valorProjetoCombateIncendio = {
	slug: 'valor-projeto-combate-incendio',
	path: '/valor-projeto-combate-incendio',
	title: 'Valor de Projeto de Combate a Incêndio: Como Avaliar | AJN',
	description: 'Entenda como é composto o valor de um projeto de combate a incêndio em BH e MG: metragem, complexidade dos sistemas (hidrantes, alarme, sprinklers) e aprovação no CBMMG.',
	heading: 'Valor de Projeto de Combate a Incêndio: Composição Técnica',
	images: [
		{ src: '/images/content/marketing/valor-projeto-combate-incendio/valor-projeto-combate-incendio-01.webp', alt: 'Avaliação do valor de projeto de combate a incêndio' },
		{ src: '/images/content/marketing/valor-projeto-combate-incendio/valor-projeto-combate-incendio-02.webp', alt: 'Inspeção de sistemas preventivos para dimensionamento de projeto' },
		{ src: '/images/content/marketing/valor-projeto-combate-incendio/valor-projeto-combate-incendio-03.webp', alt: 'Engenharia de incêndio e aprovação no Corpo de Bombeiros' },
	],
	sections: [
		{
			heading: 'Como é formado o valor de um projeto de combate a incêndio',
			paragraphs: [
				'O valor de um projeto de combate a incêndio varia conforme o volume de horas de engenharia necessário para levantar a arquitetura do imóvel, calcular os sistemas preventivos exigidos e conduzir o processo administrativo junto ao Corpo de Bombeiros (CBMMG).',
				'Um comércio térreo de 300 m² que exige apenas extintores, iluminação e sinalização possui um custo de projeto significativamente menor do que um galpão industrial de 3.000 m² que demanda cálculo hidráulico de rede de hidrantes, casa de bombas, reservatório técnico e sistema de detecção e alarme.',
			],
		},
		{
			heading: 'Critérios técnicos que impactam o investimento',
			paragraphs: [
				'Na análise da edificação, quatro variáveis principais determinam o valor da proposta:',
			],
			lists: [
				{
					items: [
						'Necessidade de levantamento arquitetônico (as-built): imóveis que já possuem plantas atualizadas em formato .DWG dispensam a medição completa de alvenarias e esquadrias do zero;',
						'Enquadramento normativo (PTS ou PT): processos que exigem análise de plantas na seção técnica do CBMMG envolvem memoriais de cálculo mais extensos e acompanhamento de notificações;',
						'Quantidade de disciplinas projetadas: inclusão de rede de hidrantes, chuveiros automáticos (sprinklers), detecção de fumaça, pressurização de escadas ou proteção para líquidos inflamáveis e GLP;',
						'Escopo complementar: contratação apenas da aprovação do projeto ou inclusão de pré-vistoria e assessoria até a emissão do AVCB.',
					],
				},
			],
		},
		{
			heading: 'Compare escopos completos antes de contratar',
			paragraphs: [
				'Ao avaliar propostas de diferentes profissionais, verifique se o valor informado contempla a ART de projeto, a tramitação no INFOSCIP até o deferimento final e as eventuais revisões solicitadas pelo analista do Corpo de Bombeiros.',
				{
					segments: [
						'Veja também nossas páginas sobre ',
						{ text: 'Orçamento de Projeto de Combate a Incêndio', href: '/orcamento-projeto-combate-incendio' },
						' e ',
						{ text: 'Elaboração de Projeto de Combate a Incêndio', href: '/elaboracao-projeto-combate-incendio' },
						'.',
					],
				},
			],
		},
		{
			heading: 'Consulte o valor para a sua edificação com a AJN',
			paragraphs: [
				'Informe a metragem, a cidade e o tipo de uso do imóvel para receber uma proposta detalhada da AJN Consultoria e Engenharia.',
				{
					segments: [
						'Ligue para ',
						{ bold: true, text: '31 98473-4644' },
						' ou ',
						{ text: 'solicite orçamento pelo formulário', href: '/contato' },
						'.',
					],
				},
			],
		},
	],
} as const satisfies MarketingContent;
