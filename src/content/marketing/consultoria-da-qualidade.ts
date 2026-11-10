import type { MarketingContent } from '../types';

export const consultoriaDaQualidade = {
	slug: 'consultoria-da-qualidade',
	path: '/consultoria-da-qualidade',
	title: 'Consultoria da Qualidade e Inspeções em Obras | AJN Engenharia',
	description: 'Consultoria da qualidade para obras e operações em BH e MG: Fichas de Verificação de Serviço (FVS), Plano da Qualidade, não conformidades e comissionamento.',
	heading: 'Consultoria da Qualidade e Controle Técnico de Campo',
	images: [
		{ src: '/images/content/marketing/consultoria-da-qualidade/consultoria-da-qualidade-01.webp', alt: 'Consultoria da qualidade e inspeção técnica em campo' },
		{ src: '/images/content/marketing/consultoria-da-qualidade/consultoria-da-qualidade-02.webp', alt: 'Verificação de serviços e controle documental de qualidade' },
		{ src: '/images/content/marketing/consultoria-da-qualidade/consultoria-da-qualidade-03.webp', alt: 'Acompanhamento de padrões construtivos e operacionais' },
	],
	sections: [
		{
			heading: 'Como funciona a consultoria da qualidade em obras e contratos',
			paragraphs: [
				'Na rotina de obras civis, montagens eletromecânicas e operações industriais, falhas de execução geram retrabalho, atraso de cronograma e glosas de medição. A consultoria da qualidade estrutura critérios claros de aceitação para que cada etapa executada em campo seja conferida antes da liberação da fase seguinte.',
				'A AJN Consultoria e Engenharia apoia construtoras, incorporadoras e indústrias em Belo Horizonte e Minas Gerais na elaboração do Plano da Qualidade da Obra (PQO), na aplicação de Fichas de Verificação de Serviço (FVS) e no controle de materiais e ensaios tecnológicos.',
			],
		},
		{
			heading: 'Entregas técnicas no acompanhamento da qualidade',
			paragraphs: [
				'O escopo de atendimento é definido conforme o porte do empreendimento e as exigências técnicas do contratante ou de normas como PBQP-H (SiAC) e ISO 9001:',
			],
			lists: [
				{
					items: [
						'Elaboração e implantação de Procedimentos Executivos (PE) e Fichas de Verificação de Serviço (FVS) para fundações, estruturas, alvenaria, instalações e acabamentos;',
						'Inspeção de recebimento e armazenamento de materiais críticos em canteiro ou almoxarifado;',
						'Abertura, investigação de causa raiz e acompanhamento de Relatórios de Não Conformidade (RNC) junto às equipes de produção e empreiteiros;',
						'Organização de data book, registros de ensaios (concreto, solos, solda, estanqueidade) e listas de pendências para comissionamento e entrega final;',
						'Auditorias internas de campo para avaliar a aderência das equipes aos padrões estabelecidos pelo cliente.',
					],
				},
			],
		},
		{
			heading: 'Integração entre qualidade de execução e segurança',
			paragraphs: [
				'Quando a verificação técnica de qualidade caminha junto com a engenharia de segurança do trabalho, desvios de montagem, instalações provisórias inadequadas e falhas de especificação são corrigidos antes de comprometerem a operação ou gerarem acidentes.',
				{
					segments: [
						'Conheça também a página do serviço de ',
						{ text: 'Gestão da Qualidade', href: '/servicos/gestao-da-qualidade' },
						' e veja como estruturamos o controle técnico para o seu contrato.',
					],
				},
			],
		},
		{
			heading: 'Solicite uma proposta técnica à AJN',
			paragraphs: [
				'Informe o tipo de obra ou operação, a localização em Minas Gerais, o estágio atual do empreendimento e os requisitos exigidos pelo contrato para receber uma proposta compatível com a sua demanda.',
				{
					segments: [
						'Ligue para ',
						{ bold: true, text: '31 98473-4644' },
						' ou ',
						{ text: 'solicite contato técnico', href: '/contato' },
						'.',
					],
				},
			],
		},
	],
} as const satisfies MarketingContent;
