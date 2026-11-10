import type { MarketingContent } from '../types';

export const projetoSegurancaIncendio = {
	slug: 'projeto-seguranca-incendio',
	path: '/projeto-seguranca-incendio',
	title: 'Projeto de Segurança Contra Incêndio em BH e MG | AJN Engenharia',
	description: 'Elaboração de projeto de segurança contra incêndio em Belo Horizonte e MG conforme Instruções Técnicas do CBMMG para aprovação e emissão de AVCB.',
	heading: 'Projeto de Segurança Contra Incêndio',
	images: [
		{ src: '/images/content/marketing/projeto-seguranca-incendio/projeto-seguranca-incendio-01.webp', alt: 'Projeto de segurança contra incêndio em edificação comercial e industrial' },
		{ src: '/images/content/marketing/projeto-seguranca-incendio/projeto-seguranca-incendio-02.webp', alt: 'Levantamento de engenharia para segurança contra incêndio' },
		{ src: '/images/content/marketing/projeto-seguranca-incendio/projeto-seguranca-incendio-03.webp', alt: 'Sistemas preventivos e aprovação junto ao CBMMG' },
	],
	sections: [
		{
			heading: 'Engenharia aplicada ao projeto de segurança contra incêndio',
			paragraphs: [
				'O projeto de segurança contra incêndio estabelece os parâmetros técnicos para que uma edificação previna o surgimento de focos de fogo, permita o abandono seguro dos ocupantes e disponha de recursos eficazes de extinção.',
				'A AJN Consultoria e Engenharia atua em Belo Horizonte e Minas Gerais na elaboração de projetos novos, substituição de projetos antigos e regularização de imóveis existentes perante o Corpo de Bombeiros Militar de Minas Gerais (CBMMG).',
			],
		},
		{
			heading: 'Etapas técnicas cumpridas na elaboração do projeto',
			paragraphs: [
				'Cada projeto é desenvolvido a partir das características reais da construção e da operação:',
			],
			lists: [
				{
					items: [
						'Estudo preliminar de enquadramento no Decreto Estadual nº 47.998/2020 conforme área construída, altura, ocupação e carga de incêndio;',
						'Conferência das plantas arquitetônicas em campo para validar larguras de escadas, corredores, saídas de emergência e distâncias máximas a percorrer;',
						'Dimensionamento dos sistemas preventivos obrigatórios (extintores, iluminação de emergência, sinalização fotoluminescente, alarme, detecção, hidrantes, sprinklers e brigada de incêndio);',
						'Geração de memoriais de cálculo, quadros de áreas, pranchas técnicas padronizadas e emissão de ART;',
						'Protocolo e acompanhamento técnico no sistema INFOSCIP até a aprovação final pelo CBMMG.',
					],
				},
			],
		},
		{
			heading: 'Suporte técnico na fase de adequação e vistoria',
			paragraphs: [
				'Após a aprovação do projeto, nossa equipe orienta a etapa de execução dos sistemas e realiza pré-vistoria técnica no imóvel antes de acionar a vistoria oficial do Corpo de Bombeiros para emissão do AVCB.',
				{
					segments: [
						'Acesse também nossas páginas sobre ',
						{ text: 'Projetos de Combate a Incêndio e Pânico (PPCIP)', href: '/servicos/projetos-de-combate-a-incendio-e-panico-ppcip' },
						' e ',
						{ text: 'Regularização de Imóveis junto ao Corpo de Bombeiros', href: '/servicos/regularizacao-de-imoveis-junto-ao-corpo-de-bombeiros' },
						'.',
					],
				},
			],
		},
		{
			heading: 'Solicite orçamento para o seu projeto',
			paragraphs: [
				'Informe a cidade, a metragem construída e a atividade do imóvel para receber uma proposta técnica da AJN.',
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
