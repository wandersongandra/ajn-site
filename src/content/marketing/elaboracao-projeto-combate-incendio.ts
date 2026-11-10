import type { MarketingContent } from '../types';

export const elaboracaoProjetoCombateIncendio = {
	slug: 'elaboracao-projeto-combate-incendio',
	path: '/elaboracao-projeto-combate-incendio',
	title: 'Elaboração de Projeto de Combate a Incêndio (PSCIP) | AJN',
	description: 'Elaboração de projeto de combate a incêndio em Belo Horizonte e MG conforme as Instruções Técnicas do CBMMG para aprovação no INFOSCIP e emissão de AVCB.',
	heading: 'Elaboração de Projeto de Combate a Incêndio e Pânico',
	images: [
		{ src: '/images/content/marketing/projeto-combate-incendio-preco/projeto-combate-incendio-preco-01.webp', alt: 'Elaboração de projeto de combate a incêndio para edificações' },
		{ src: '/images/content/marketing/projeto-combate-incendio-preco/projeto-combate-incendio-preco-03.webp', alt: 'Dimensionamento técnico de hidrantes, alarmes e rotas de fuga' },
		{ src: '/images/content/marketing/projeto-seguranca-incendio-panico/projeto-seguranca-incendio-panico-05.webp', alt: 'Plantas técnicas e aprovação junto ao Corpo de Bombeiros' },
	],
	sections: [
		{
			heading: 'Etapas da elaboração do projeto de combate a incêndio em MG',
			paragraphs: [
				'Em Minas Gerais, a elaboração do Projeto de Segurança Contra Incêndio e Pânico (PSCIP) segue o Decreto Estadual nº 47.998/2020 e as Instruções Técnicas (ITs) do Corpo de Bombeiros Militar de Minas Gerais (CBMMG). O trabalho de engenharia define exatamente quais medidas preventivas a edificação precisa instalar de acordo com a área construída, a altura, o uso e a carga de incêndio.',
				'A AJN Consultoria e Engenharia desenvolve projetos novos, modificações de projetos aprovados e adequações de imóveis existentes em Belo Horizonte, Região Metropolitana e interior do estado.',
			],
		},
		{
			heading: 'O que é dimensionado no projeto técnico',
			paragraphs: [
				'Cada edificação recebe o dimensionamento específico para o seu enquadramento (Projeto Técnico - PT ou Projeto Técnico Simplificado - PTS):',
			],
			lists: [
				{
					items: [
						'Classificação da edificação por ocupação, altura, área total e levantamento da carga de incêndio específica (IT 09 do CBMMG);',
						'Dimensionamento de saídas de emergência, larguras de escadas, rampas, portas corta-fogo e distâncias máximas a percorrer (IT 08);',
						'Distribuição de unidades extintoras (IT 16), iluminação de emergência (IT 13) e sinalização fotoluminescente de orientação e salvamento (IT 15);',
						'Cálculo hidráulico de rede de hidrantes e mangotinhos (IT 17), reserva técnica de incêndio (RTI), casa de bombas e chuveiros automáticos (sprinklers), quando exigidos;',
						'Projeto de detecção e alarme de incêndio (IT 14 e NBR 17240), controle de fumaça e brigada de incêndio (IT 12).',
					],
				},
			],
		},
		{
			heading: 'Tramitação no INFOSCIP até a vistoria do AVCB',
			paragraphs: [
				'Além de entregar as pranchas gráficas, memoriais de cálculo e ART de projeto, nossa equipe conduz o protocolo eletrônico no sistema INFOSCIP do CBMMG, responde a eventuais notificações de análise e orienta a etapa posterior de execução e vistoria para emissão do AVCB.',
				{
					segments: [
						'Conheça também a página oficial de ',
						{ text: 'Projetos de Combate a Incêndio e Pânico (PPCIP)', href: '/servicos/projetos-de-combate-a-incendio-e-panico-ppcip' },
						' e ',
						{ text: 'Regularização de Imóveis junto ao Corpo de Bombeiros', href: '/servicos/regularizacao-de-imoveis-junto-ao-corpo-de-bombeiros' },
						'.',
					],
				},
			],
		},
		{
			heading: 'Solicite orçamento para elaboração do seu projeto',
			paragraphs: [
				'Informe a metragem aproximada do imóvel, o número de pavimentos, o endereço e o tipo de atividade exercida no local.',
				{
					segments: [
						'Ligue para ',
						{ bold: true, text: '31 98473-4644' },
						' ou ',
						{ text: 'solicite proposta técnica pelo site', href: '/contato' },
						'.',
					],
				},
			],
		},
	],
} as const satisfies MarketingContent;
