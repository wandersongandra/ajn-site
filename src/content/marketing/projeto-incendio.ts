import type { MarketingContent } from '../types';

export const projetoIncendio = {
	slug: 'projeto-incendio',
	path: '/projeto-incendio',
	title: 'Projeto Contra Incêndio para Empresas e Condomínios | AJN',
	description: 'Elaboração e aprovação de projeto contra incêndio em Belo Horizonte e MG junto ao CBMMG. Projetos novos, modificações de layout e regularização para AVCB.',
	heading: 'Projeto Contra Incêndio: Engenharia e Aprovação no CBMMG',
	images: [
		{ src: '/images/content/marketing/orcamento-projeto-combate-incendio/orcamento-projeto-combate-incendio-02.webp', alt: 'Desenvolvimento de projeto contra incêndio em Minas Gerais' },
		{ src: '/images/content/marketing/projeto-deteccao-incendio/projeto-deteccao-incendio-02.webp', alt: 'Sistemas de detecção e alarme integrados ao projeto contra incêndio' },
		{ src: '/images/content/marketing/projeto-prevencao-incendio-panico/projeto-prevencao-incendio-panico-03.webp', alt: 'Vistoria técnica de equipamentos preventivos contra incêndio' },
	],
	sections: [
		{
			heading: 'Quando o projeto contra incêndio é obrigatório',
			paragraphs: [
				'Toda edificação de uso coletivo (comercial, industrial, logística, educacional, hospitalar ou residencial multifamiliar) precisa atender às medidas de segurança contra incêndio estabelecidas pela legislação estadual para obter ou renovar o Auto de Vistoria do Corpo de Bombeiros (AVCB) e o alvará de funcionamento.',
				'A AJN Consultoria e Engenharia elabora projetos contra incêndio em Belo Horizonte e Minas Gerais tanto para empreendimentos em fase de construção quanto para imóveis já ocupados que precisam regularizar sua situação.',
			],
		},
		{
			heading: 'Fases do desenvolvimento do projeto na AJN',
			paragraphs: [
				'Conduzimos o processo técnico do levantamento inicial até a aprovação final:',
			],
			lists: [
				{
					items: [
						'Diagnóstico preliminar e enquadramento normativo conforme área, altura, divisão de ocupação e carga de incêndio;',
						'Vistoria e conferência arquitetônica em campo para compatibilizar a planta com as paredes, escadas, aberturas e instalações reais do imóvel;',
						'Elaboração das pranchas técnicas de medidas de segurança, detalhes isométricos, quadros resumo e memoriais de cálculo;',
						'Emissão de ART de projeto e protocolo digital no sistema INFOSCIP do CBMMG, com acompanhamento integral até o deferimento.',
					],
				},
			],
		},
		{
			heading: 'Modificação de projeto por alteração de layout ou área',
			paragraphs: [
				'Se o imóvel já possui projeto aprovado, mas passou por ampliação de área, construção de mezanino, fechamento de divisórias ou mudança de atividade econômica, é necessário elaborar a atualização ou modificação do projeto contra incêndio antes de solicitar nova vistoria.',
				{
					segments: [
						'Saiba mais em nossas páginas de ',
						{ text: 'Regularização de Imóveis junto ao Corpo de Bombeiros', href: '/servicos/regularizacao-de-imoveis-junto-ao-corpo-de-bombeiros/' },
						' e ',
						{ text: 'Projetos de Combate a Incêndio e Pânico (PPCIP)', href: '/servicos/projetos-de-combate-a-incendio-e-panico-ppcip/' },
						'.',
					],
				},
			],
		},
		{
			heading: 'Solicite análise técnica para o seu imóvel',
			paragraphs: [
				'Entre em contato com a equipe de engenharia da AJN informando o endereço, a metragem e a finalidade da edificação.',
				{
					segments: [
						'Ligue para ',
						{ bold: true, text: '31 98473-4644' },
						' ou ',
						{ text: 'envie uma mensagem pelo formulário', href: '/contato/' },
						'.',
					],
				},
			],
		},
	],
} as const satisfies MarketingContent;
