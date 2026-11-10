import type { MarketingContent } from '../types';

export const combateIncendioBeloHorizonte = {
	slug: 'combate-incendio-belo-horizonte',
	path: '/combate-incendio-belo-horizonte',
	title: 'Combate a Incêndio em Belo Horizonte | Projetos e AVCB | AJN',
	description: 'Projetos e engenharia de combate a incêndio em Belo Horizonte: levantamento técnico, PPCIP, adequação normativa e suporte para AVCB e CLCB na AJN.',
	heading: 'Combate a incêndio em Belo Horizonte',
	images: [
		{ src: '/images/content/marketing/combate-incendio-belo-horizonte/combate-incendio-belo-horizonte-01.webp', alt: 'Combate a incêndio em Belo Horizonte' },
		{ src: '/images/content/marketing/combate-incendio-belo-horizonte/combate-incendio-belo-horizonte-02.webp', alt: 'Projeto de prevenção e combate a incêndio em Belo Horizonte' },
		{ src: '/images/content/marketing/combate-incendio-belo-horizonte/combate-incendio-belo-horizonte-03.webp', alt: 'Regularização de edificação junto ao Corpo de Bombeiros em BH' },
	],
	sections: [
		{
			heading: 'Engenharia e projetos de combate a incêndio em Belo Horizonte',
			paragraphs: [
				'A prevenção e o combate a incêndio em Belo Horizonte exigem projeto técnico elaborado de acordo com as Instruções Técnicas do Corpo de Bombeiros Militar de Minas Gerais (CBMMG) e com o uso real da edificação.',
				'A AJN Consultoria e Engenharia atua em Qualidade, Saúde, Segurança e Meio Ambiente (QSSMA), atendendo empresas, condomínios, indústrias e comércios que precisam elaborar projetos ou regularizar imóveis.',
				{
					segments: [
						'Veja também nossos serviços de ',
						{ text: 'projetos de combate a incêndio e pânico (PPCIP)', href: '/servicos/projetos-de-combate-a-incendio-e-panico-ppcip' },
						' e ',
						{ text: 'regularização de imóveis junto ao Corpo de Bombeiros', href: '/servicos/regularizacao-de-imoveis-junto-ao-corpo-de-bombeiros' },
						'.',
					],
				},
			],
		},
		{
			heading: 'Elaboração de PPCIP e dimensionamento de medidas preventivas',
			paragraphs: [
				'Nossa equipe técnica desenvolve projetos de combate a incêndio em Belo Horizonte considerando área construída, altura, ocupação, carga de incêndio e capacidade de público da edificação.',
				'O trabalho inclui o dimensionamento de sinalização de emergência, iluminação de emergência, extintores, saídas de emergência, sistemas de detecção e alarme, hidrantes e demais itens exigidos pela legislação estadual.',
			],
			subsections: [{
				heading: 'Suporte técnico para obtenção e renovação de AVCB/CLCB',
				paragraphs: [
					'O Auto de Vistoria do Corpo de Bombeiros (AVCB) e o Certificado de Licença do Corpo de Bombeiros (CLCB) são emitidos pelo CBMMG para atestar que a edificação possui as medidas de segurança contra incêndio e pânico previstas nas normas.',
					'A AJN faz o levantamento prévio do imóvel, elabora a documentação técnica necessária, orienta a correção de pendências e acompanha o processo até a vistoria em Belo Horizonte e região metropolitana.',
				],
			}],
		},
		{
			heading: 'Vistoria prévia para edificações novas e existentes',
			paragraphs: [
				'Imóveis que passaram por reforma, ampliação de área ou mudança de atividade geralmente precisam atualizar o projeto de prevenção contra incêndio antes de pedir nova vistoria.',
				'Realizamos levantamentos no local para conferir os equipamentos instalados, comparar a situação física com o projeto aprovado e indicar os ajustes necessários antes do protocolo no Corpo de Bombeiros.',
			],
		},
		{
			heading: 'Consultoria em Segurança e Saúde Ocupacional',
			paragraphs: [
				'Na AJN Consultoria e Engenharia, o projeto contra incêndio pode ser contratado junto com outros documentos e treinamentos de Segurança e Saúde no Trabalho (SST).',
				'Realizamos consultoria técnica, treinamentos em Normas Regulamentadoras, elaboração de PGR, gestão de PCMSO e medições ambientais para empresas em Belo Horizonte.',
				'Se você precisa avaliar um imóvel ou elaborar um projeto técnico contra incêndio e pânico, fale com nossa equipe para solicitar um orçamento.',
			],
		},
		{
			heading: 'Para saber mais sobre combate a incêndio em Belo Horizonte',
			paragraphs: [{ segments: ['Ligue para ', { bold: true, text: '31 98473-4644' }, ' ou ', { text: 'clique aqui', href: '/contato' }, ' e entre em contato por email.'] }],
		},
	],
} as const satisfies MarketingContent;
