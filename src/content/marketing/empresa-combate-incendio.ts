import type { MarketingContent } from '../types';

export const empresaCombateIncendio = {
	slug: 'empresa-combate-incendio',
	path: '/empresa-combate-incendio',
	title: 'Empresa de Engenharia de Combate a Incêndio em MG | AJN',
	description: 'Empresa de engenharia de combate a incêndio em Belo Horizonte e MG: elaboração de projetos (PSCIP), aprovação no CBMMG, pré-vistoria e assessoria para AVCB.',
	heading: 'Empresa de Engenharia de Combate a Incêndio e Regularização',
	images: [
		{ src: '/images/content/marketing/empresa-combate-incendio/empresa-combate-incendio-01.webp', alt: 'Empresa de engenharia de combate a incêndio em Minas Gerais' },
		{ src: '/images/content/marketing/empresa-combate-incendio/empresa-combate-incendio-02.webp', alt: 'Vistoria técnica e dimensionamento de sistemas contra incêndio' },
		{ src: '/images/content/marketing/empresa-combate-incendio/empresa-combate-incendio-03.webp', alt: 'Projetos e regularização junto ao Corpo de Bombeiros CBMMG' },
	],
	sections: [
		{
			heading: 'Atuação de engenharia em prevenção e combate a incêndio',
			paragraphs: [
				'Ao buscar uma empresa de combate a incêndio para regularizar um galpão, indústria, comércio ou condomínio, é importante contar com engenharia habilitada que domine as Instruções Técnicas do Corpo de Bombeiros Militar de Minas Gerais (CBMMG) e o funcionamento do sistema INFOSCIP.',
				'Com sede em Belo Horizonte, a AJN Consultoria e Engenharia presta serviços técnicos de diagnóstico predial, elaboração e modificação de projetos (PSCIP/PPCIP) e assessoria técnica para obtenção e renovação de AVCB.',
			],
		},
		{
			heading: 'Serviços técnicos prestados pela AJN na área de incêndio',
			paragraphs: [
				'Acompanhamos o cliente em todas as etapas de engenharia exigidas pela legislação estadual:',
			],
			lists: [
				{
					items: [
						'Vistoria técnica de diagnóstico em edificações existentes para levantar não conformidades e pendências físicas;',
						'Levantamento arquitetônico e elaboração de Projeto Técnico (PT) ou Projeto Técnico Simplificado (PTS);',
						'Dimensionamento de hidrantes, mangotinhos, bombas de incêndio, sprinklers, alarme e detecção (SDAI), iluminação de emergência, sinalização, extintores e saídas de emergência;',
						'Tramitação eletrônica no portal INFOSCIP, resposta técnica a notificações de análise e emissão de ART;',
						'Pré-vistoria de comissionamento em campo e solicitação de vistoria final do CBMMG para emissão do AVCB.',
					],
				},
			],
		},
		{
			heading: 'Integração com Segurança do Trabalho e QSSMA',
			paragraphs: [
				'Para clientes corporativos e industriais, a AJN também integra a engenharia de incêndio às demandas de Segurança e Saúde no Trabalho (PGR, LTCAT, PCMSO, laudos e treinamentos de NRs), concentrando o atendimento técnico na mesma equipe de engenharia.',
				{
					segments: [
						'Conheça também nossas páginas de ',
						{ text: 'Empresa de Combate a Incêndio em BH', href: '/empresa-combate-incendio-bh/' },
						' e ',
						{ text: 'Projetos de Combate a Incêndio e Pânico (PPCIP)', href: '/servicos/projetos-de-combate-a-incendio-e-panico-ppcip/' },
						'.',
					],
				},
			],
		},
		{
			heading: 'Converse com a equipe técnica da AJN',
			paragraphs: [
				'Informe a localização do seu imóvel, a área construída e a sua necessidade atual para elaborarmos uma proposta técnica.',
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
