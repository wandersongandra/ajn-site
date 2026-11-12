import type { MarketingContent } from '../types';

export const projetoSistemaIncendio = {
	slug: 'projeto-sistema-incendio',
	path: '/projeto-sistema-incendio',
	title: 'Projeto de Sistema de Incêndio para Edificações | AJN Engenharia',
	description: 'Elaboração de projeto de sistema de incêndio em Belo Horizonte e MG. Dimensionamento de redes preventivas, aprovação no CBMMG e suporte técnico para AVCB.',
	heading: 'Projeto de Sistema de Incêndio: Dimensionamento e Aprovação',
	images: [
		{ src: '/images/content/marketing/projeto-sistema-incendio/projeto-sistema-incendio-01.webp', alt: 'Projeto de sistema de incêndio em planta industrial e comercial' },
		{ src: '/images/content/marketing/projeto-sistema-incendio/projeto-sistema-incendio-02.webp', alt: 'Detalhamento de rede de incêndio e dispositivos de segurança' },
		{ src: '/images/content/marketing/projeto-sistema-incendio/projeto-sistema-incendio-03.webp', alt: 'Vistoria técnica de sistemas de incêndio em Minas Gerais' },
	],
	sections: [
		{
			heading: 'Como compatibilizar o projeto de sistema de incêndio com a edificação',
			paragraphs: [
				'Cada edificação apresenta condicionantes próprios de arquitetura, estrutura e operação: pé-direito elevado em galpões, estocagem porta-paletes, subsolos de estacionamento ou circulação intensa de público. O projeto de sistema de incêndio precisa posicionar tubulações, abrigos, centrais e rotas de fuga sem inviabilizar a rotina do imóvel e cumprindo integralmente as Instruções Técnicas do CBMMG.',
				'A AJN Consultoria e Engenharia desenvolve projetos de sistemas de incêndio em Belo Horizonte e Minas Gerais com foco na viabilidade construtiva e na aprovação técnica.',
			],
		},
		{
			heading: 'Entregáveis que compõem o projeto técnico',
			paragraphs: [
				'Ao contratar a AJN, sua empresa recebe o pacote técnico completo para tramitação e obra:',
			],
			lists: [
				{
					items: [
						'Plantas baixas e cortes esquemáticos com locação de todos os equipamentos preventivos nas convenções gráficas do CBMMG;',
						'Detalhes isométricos da rede de hidrantes, casa de bombas, barrilete e reservatório técnico;',
						'Memoriais descritivos e memoriais de cálculo hidráulico, populacional e de carga de incêndio;',
						'Anotação de Responsabilidade Técnica (ART) registrada no CREA-MG;',
						'Protocolo e acompanhamento das análises no sistema INFOSCIP.',
					],
				},
			],
		},
		{
			heading: 'Revisão de sistemas existentes para renovação de AVCB',
			paragraphs: [
				'Em imóveis que já possuem rede instalada, realizamos o diagnóstico em campo para verificar se o sistema físico corresponde ao projeto aprovado ou se é necessário atualizar o projeto conforme as modificações ocorridas na edificação.',
				{
					segments: [
						'Veja também nossas páginas sobre ',
						{ text: 'Combate a Incêndio em Belo Horizonte', href: '/combate-incendio-belo-horizonte/' },
						' e ',
						{ text: 'Regularização de Imóveis junto ao Corpo de Bombeiros', href: '/servicos/regularizacao-de-imoveis-junto-ao-corpo-de-bombeiros/' },
						'.',
					],
				},
			],
		},
		{
			heading: 'Solicite uma proposta para o seu projeto',
			paragraphs: [
				'Informe a área construída, a localização e o segmento de uso do imóvel para receber nosso orçamento.',
				{
					segments: [
						'Ligue para ',
						{ bold: true, text: '31 98473-4644' },
						' ou ',
						{ text: 'entre em contato com a AJN', href: '/contato/' },
						'.',
					],
				},
			],
		},
	],
} as const satisfies MarketingContent;
