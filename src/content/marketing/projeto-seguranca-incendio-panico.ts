import type { MarketingContent } from '../types';

export const projetoSegurancaIncendioPanico = {
	slug: 'projeto-seguranca-incendio-panico',
	path: '/projeto-seguranca-incendio-panico',
	title: 'Projeto de Segurança Contra Incêndio e Pânico (PSCIP) | AJN',
	description: 'Elaboração de PSCIP (Projeto de Segurança Contra Incêndio e Pânico) em Belo Horizonte e MG: aprovação no INFOSCIP/CBMMG e regularização para AVCB.',
	heading: 'Projeto de Segurança Contra Incêndio e Pânico (PSCIP)',
	images: [
		{ src: '/images/content/marketing/projeto-seguranca-incendio-panico/projeto-seguranca-incendio-panico-01.webp', alt: 'Elaboração de PSCIP Projeto de Segurança Contra Incêndio e Pânico' },
		{ src: '/images/content/marketing/projeto-seguranca-incendio-panico/projeto-seguranca-incendio-panico-02.webp', alt: 'Vistoria técnica de rotas de fuga e hidrantes' },
		{ src: '/images/content/marketing/projeto-seguranca-incendio-panico/projeto-seguranca-incendio-panico-03.webp', alt: 'Dimensionamento de medidas preventivas conforme CBMMG' },
		{ src: '/images/content/marketing/projeto-seguranca-incendio-panico/projeto-seguranca-incendio-panico-04.webp', alt: 'Inspeção de sistemas de alarme e iluminação de emergência' },
		{ src: '/images/content/marketing/projeto-seguranca-incendio-panico/projeto-seguranca-incendio-panico-05.webp', alt: 'Plantas técnicas de segurança contra incêndio e pânico' },
		{ src: '/images/content/marketing/projeto-seguranca-incendio-panico/projeto-seguranca-incendio-panico-06.webp', alt: 'Acompanhamento de aprovação para emissão de AVCB' },
	],
	sections: [
		{
			heading: 'O que é o PSCIP exigido pelo Corpo de Bombeiros em MG',
			paragraphs: [
				'Em Minas Gerais, a nomenclatura oficial adotada pelo Corpo de Bombeiros Militar (CBMMG) para o projeto preventivo de edificações é PSCIP (Projeto de Segurança Contra Incêndio e Pânico). Esse conjunto de plantas, memoriais e documentos de responsabilidade técnica comprova que o imóvel atende aos parâmetros estaduais de proteção à vida e ao patrimônio.',
				'A AJN Consultoria e Engenharia elabora e tramita o PSCIP para indústrias, galpões, comércios, condomínios, escolas, clínicas e prédios corporativos em Belo Horizonte e em todo o estado.',
			],
		},
		{
			heading: 'Modalidades de PSCIP conforme o porte da edificação',
			paragraphs: [
				'O enquadramento técnico define qual rito o processo seguirá junto ao CBMMG:',
			],
			lists: [
				{
					items: [
						'Projeto Técnico Simplificado (PTS): aplicável a edificações com área e altura reduzidas e menor carga de incêndio, permitindo trâmite mais célere com dimensionamento das medidas essenciais in loco;',
						'Projeto Técnico (PT): exigido para edificações com área superior a 930 m², altura acima de 12 metros, locais de reunião de público ou alto risco industrial, demandando análise prévia das plantas e memoriais de cálculo no sistema INFOSCIP antes da vistoria;',
						'Modificação ou Atualização de PSCIP: indicada quando o imóvel já possui projeto aprovado, mas sofreu acréscimo de área, mudança de layout interno, troca de ocupação ou atualização para a norma vigente.',
					],
				},
			],
		},
		{
			heading: 'Acompanhamento técnico até a liberação do AVCB',
			paragraphs: [
				'Nossa equipe assume desde o levantamento arquitetônico (quando o imóvel não possui plantas em CAD/BIM) até a aprovação no INFOSCIP e a orientação técnica para a vistoria final do AVCB.',
				{
					segments: [
						'Saiba mais em nossa página do serviço de ',
						{ text: 'Projetos de Combate a Incêndio e Pânico (PPCIP)', href: '/servicos/projetos-de-combate-a-incendio-e-panico-ppcip/' },
						' e ',
						{ text: 'Regularização de Imóveis junto ao Corpo de Bombeiros', href: '/servicos/regularizacao-de-imoveis-junto-ao-corpo-de-bombeiros/' },
						'.',
					],
				},
			],
		},
		{
			heading: 'Inicie seu PSCIP com a AJN Consultoria e Engenharia',
			paragraphs: [
				'Envie a metragem da edificação, o endereço e a atividade desenvolvida para receber nosso orçamento detalhado.',
				{
					segments: [
						'Ligue para ',
						{ bold: true, text: '31 98473-4644' },
						' ou ',
						{ text: 'solicite contato pelo site', href: '/contato/' },
						'.',
					],
				},
			],
		},
	],
} as const satisfies MarketingContent;
