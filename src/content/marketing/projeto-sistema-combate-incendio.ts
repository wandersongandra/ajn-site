import type { MarketingContent } from '../types';

export const projetoSistemaCombateIncendio = {
	slug: 'projeto-sistema-combate-incendio',
	path: '/projeto-sistema-combate-incendio',
	title: 'Projeto de Sistema de Combate a Incêndio: Hidrantes, Alarme e Sprinklers | AJN',
	description: 'Elaboração de projeto de sistema de combate a incêndio em BH e MG: cálculo hidráulico de hidrantes, casa de bombas, sprinklers, detecção e alarme.',
	heading: 'Projeto de Sistema de Combate a Incêndio',
	images: [
		{ src: '/images/content/marketing/projeto-sistema-combate-incendio/projeto-sistema-combate-incendio-01.webp', alt: 'Projeto de sistema de combate a incêndio com rede de hidrantes' },
		{ src: '/images/content/marketing/projeto-sistema-combate-incendio/projeto-sistema-combate-incendio-02.webp', alt: 'Dimensionamento de casa de bombas e tubulação de incêndio' },
		{ src: '/images/content/marketing/projeto-sistema-combate-incendio/projeto-sistema-combate-incendio-03.webp', alt: 'Engenharia de sistemas preventivos e de combate a incêndio' },
	],
	sections: [
		{
			heading: 'Engenharia executiva para sistemas fixos e portáteis de combate',
			paragraphs: [
				'Para que uma instalação de combate a incêndio funcione quando acionada e seja aprovada em vistoria do Corpo de Bombeiros, cada subsistema precisa ser dimensionado por cálculo de engenharia. Tubulações subdimensionadas ou bombas selecionadas sem curva de perda de carga resultam em falta de pressão nos hidrantes mais desfavoráveis.',
				'A AJN Consultoria e Engenharia desenvolve projetos completos de sistemas de combate a incêndio em Belo Horizonte e Minas Gerais, entregando plantas, detalhes isométricos e memoriais de cálculo prontos para aprovação e execução.',
			],
		},
		{
			heading: 'Sistemas dimensionados no projeto técnico',
			paragraphs: [
				'Nosso escopo de engenharia abrange os principais sistemas exigidos pelo CBMMG e pelas normas da ABNT:',
			],
			lists: [
				{
					items: [
						'Sistema de Hidrantes e Mangotinhos (IT 17 e NBR 13714): traçado da rede, diâmetros, perda de carga, pressão e vazão nos hidrantes mais desfavoráveis, especificação de bomba principal e bomba jockey e volume da Reserva Técnica de Incêndio (RTI);',
						'Sistema de Chuveiros Automáticos / Sprinklers (IT 18 e NBR 10897): malha de distribuição, fator K dos bicos, válvulas de governo e alarme (VGA) e cálculo hidráulico por área de operação;',
						'Sistema de Detecção e Alarme de Incêndio (IT 14 e NBR 17240): arquitetura da central, laços, detectores pontuais ou lineares, acionadores manuais e avisadores;',
						'Unidades Extintoras, Iluminação de Emergência e Sinalização Fotoluminescente (ITs 13, 15 e 16).',
					],
				},
			],
		},
		{
			heading: 'Documentação clara para cotação e montagem da obra',
			paragraphs: [
				'Um projeto de sistema de combate a incêndio bem detalhado permite que o cliente cote a instalação com diferentes empreiteiras usando a mesma base técnica de materiais e diâmetros, evitando aditivos inesperados durante a montagem.',
				{
					segments: [
						'Consulte também nossas páginas sobre ',
						{ text: 'Sistemas de Incêndio em BH', href: '/sistemas-incendio-bh/' },
						' e ',
						{ text: 'Projetos de Combate a Incêndio e Pânico (PPCIP)', href: '/servicos/projetos-de-combate-a-incendio-e-panico-ppcip/' },
						'.',
					],
				},
			],
		},
		{
			heading: 'Fale com a engenharia da AJN',
			paragraphs: [
				'Envie as informações da sua edificação ou planta industrial para dimensionarmos o projeto do sistema de combate a incêndio.',
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
