import type { MarketingContent } from '../types';

export const marketingDetailPage = {
	slug: 'emissao-laudos',
	path: '/emissao-laudos',
	title: 'Emissão de Laudos Técnicos de Engenharia e SST | AJN',
	description: 'Emissão de laudos técnicos em Belo Horizonte e MG: LTCAT, insalubridade (NR-15), periculosidade (NR-16), vistorias de engenharia e medições ambientais com ART.',
	heading: 'Emissão de Laudos Técnicos de Engenharia e Segurança',
	images: [
		{ src: '/images/featured/emissao-laudos-01.webp', alt: 'Emissão de laudos técnicos de engenharia e segurança do trabalho' },
		{ src: '/images/content/emissao-laudos/emissao-laudos-02.webp', alt: 'Vistoria presencial e medições para emissão de laudos' },
		{ src: '/images/content/emissao-laudos/emissao-laudos-03.webp', alt: 'Elaboração de pareceres e laudos técnicos com ART' },
	],
	sections: [
		{
			heading: 'Como funciona a emissão de laudos técnicos na AJN',
			paragraphs: [
				'A emissão de um laudo técnico requer levantamento presencial no local da operação, coleta de evidências ou medições instrumentais e enquadramento nas normas regulamentadoras, previdenciárias ou da ABNT aplicáveis ao caso.',
				'Sediada em Belo Horizonte, a AJN Consultoria e Engenharia emite laudos técnicos assinados por profissionais legalmente habilitados e acompanhados da respectiva Anotação de Responsabilidade Técnica (ART) junto ao CREA-MG.',
			],
		},
		{
			heading: 'Principais laudos e pareceres emitidos',
			paragraphs: [
				'Atendemos demandas trabalhistas, previdenciárias, contratuais e de regularização de imóveis:',
			],
			lists: [
				{
					items: [
						'Laudo Técnico das Condições Ambientais do Trabalho (LTCAT) para fins previdenciários, PPP eletrônico e evento S-2240 do eSocial;',
						'Laudos de Insalubridade (NR-15) e de Periculosidade (NR-16) por setor, cargo ou função;',
						'Relatórios de avaliações quantitativas de ruído, calor, vibração e agentes químicos (higiene ocupacional);',
						'Pareceres de assistência técnica patronal em perícias judiciais trabalhistas;',
						'Laudos técnicos e memoriais para processos de regularização e renovação de AVCB junto ao Corpo de Bombeiros (CBMMG).',
					],
				},
			],
		},
		{
			heading: 'Informações necessárias para solicitar a emissão',
			paragraphs: [
				'Para elaborar o orçamento, avaliamos a finalidade do laudo (previdenciária, trabalhista, mobilização contratual ou regularização predial), o endereço da unidade e as atividades envolvidas.',
				{
					segments: [
						'Veja também as páginas específicas de ',
						{ text: 'Emissão de LTCAT', href: '/emissao-ltcat' },
						', ',
						{ text: 'Perícias em Periculosidade e Insalubridade', href: '/servicos/pericias-em-periculosidade-e-insalubridade' },
						' e ',
						{ text: 'Medições Ambientais Ocupacionais', href: '/medicoes-ambientais-ocupacionais' },
						'.',
					],
				},
			],
		},
		{
			heading: 'Fale com a engenharia da AJN',
			paragraphs: [
				'Descreva qual laudo técnico sua empresa precisa emitir ou atualizar para receber nossa proposta detalhada.',
				{
					segments: [
						'Ligue para ',
						{ bold: true, text: '31 98473-4644' },
						' ou ',
						{ text: 'entre em contato pelo site', href: '/contato' },
						'.',
					],
				},
			],
		},
	],
} as const satisfies MarketingContent;
