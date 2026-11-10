import type { MarketingContent } from '../types';

export const projetoDeteccaoIncendio = {
	slug: 'projeto-deteccao-incendio',
	path: '/projeto-deteccao-incendio',
	title: 'Projeto de Detecção e Alarme de Incêndio (SDAI / NBR 17240) | AJN',
	description: 'Elaboração de projeto de detecção e alarme de incêndio (SDAI) em BH e MG conforme IT 14 do CBMMG e ABNT NBR 17240. Dimensionamento de detectores, acionadores e centrais.',
	heading: 'Projeto de Detecção e Alarme de Incêndio (SDAI)',
	images: [
		{ src: '/images/content/marketing/projeto-deteccao-incendio/projeto-deteccao-incendio-01.webp', alt: 'Projeto de detecção e alarme de incêndio SDAI' },
		{ src: '/images/content/marketing/projeto-deteccao-incendio/projeto-deteccao-incendio-02.webp', alt: 'Dimensionamento de detectores de fumaça e acionadores manuais' },
		{ src: '/images/content/marketing/projeto-deteccao-incendio/projeto-deteccao-incendio-03.webp', alt: 'Central de alarme de incêndio conforme NBR 17240 e IT 14' },
	],
	sections: [
		{
			heading: 'Por que o sistema de detecção e alarme exige projeto específico',
			paragraphs: [
				'O Sistema de Detecção e Alarme de Incêndio (SDAI) tem a função de identificar fumaça, elevação anormal de temperatura ou chama nos primeiros minutos do sinistro, alertando imediatamente a brigada e os ocupantes da edificação. Para evitar pontos cegos ou disparos falsos constantes, o dimensionamento deve seguir a Instrução Técnica 14 (IT 14) do CBMMG e a norma ABNT NBR 17240.',
				'A AJN Consultoria e Engenharia desenvolve projetos de detecção e alarme de incêndio em Belo Horizonte e Minas Gerais, integrados ao PSCIP da edificação ou detalhados para execução em campo.',
			],
		},
		{
			heading: 'Critérios técnicos definidos no projeto de detecção',
			paragraphs: [
				'O projeto especifica a tecnologia e a distribuição exata dos componentes conforme a geometria e o ambiente de cada setor:',
			],
			lists: [
				{
					items: [
						'Seleção do tipo de detector para cada ambiente: óptico de fumaça para áreas administrativas e circulações, termovelocimétrico para copas/cozinhas e oficinas com poeira ou vapores, ou barreiras ópticas lineares (feixe) para galpões de pé-direito elevado;',
						'Cálculo do raio de cobertura dos detectores em função da altura do teto, inclinação da cobertura e presença de vigas ou entre-forros;',
						'Posicionamento de acionadores manuais (botoeiras quebra-vidro ou rearmáveis) e avisadores sonoros e visuais nas rotas de fuga conforme distâncias máximas de caminhamento;',
						'Definição da central de alarme (endereçável ou convencional), autonomia de baterias, topologia dos laços e especificação de cabos blindados resistentes ao fogo.',
					],
				},
			],
		},
		{
			heading: 'Integração com o PSCIP e aprovação no Corpo de Bombeiros',
			paragraphs: [
				'Todas as pranchas e memoriais do sistema de detecção e alarme são compatibilizados com as demais medidas preventivas do imóvel para aprovação no INFOSCIP e conferência na vistoria de emissão do AVCB.',
				{
					segments: [
						'Conheça também nossa página de ',
						{ text: 'Projetos de Combate a Incêndio e Pânico (PPCIP)', href: '/servicos/projetos-de-combate-a-incendio-e-panico-ppcip' },
						' e ',
						{ text: 'Sistemas de Incêndio em BH', href: '/sistemas-incendio-bh' },
						'.',
					],
				},
			],
		},
		{
			heading: 'Solicite orçamento para projeto de detecção de incêndio',
			paragraphs: [
				'Informe a área construída, o pé-direito e o uso da edificação para receber uma proposta técnica da AJN.',
				{
					segments: [
						'Ligue para ',
						{ bold: true, text: '31 98473-4644' },
						' ou ',
						{ text: 'fale com nossa engenharia pelo site', href: '/contato' },
						'.',
					],
				},
			],
		},
	],
} as const satisfies MarketingContent;
