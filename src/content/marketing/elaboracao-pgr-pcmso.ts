import type { MarketingContent } from '../types';

export const elaboracaoPgrPcmso = {
	slug: 'elaboracao-pgr-pcmso',
	path: '/elaboracao-pgr-pcmso',
	title: 'Elaboração de PGR e PCMSO para Empresas | AJN Engenharia',
	description: 'Contrate a elaboração de PGR e PCMSO em Belo Horizonte e MG. Levantamento técnico de campo, inventário de riscos (NR-01) e controle médico ocupacional (NR-07).',
	heading: 'Elaboração de PGR e PCMSO para Empresas',
	images: [
		{ src: '/images/content/marketing/elaboracao-pgr-pcmso/elaboracao-pgr-pcmso-01.webp', alt: 'Elaboração de PGR e PCMSO em ambiente operacional' },
		{ src: '/images/content/marketing/elaboracao-pgr-pcmso/elaboracao-pgr-pcmso-02.webp', alt: 'Análise de riscos ocupacionais e programa médico' },
		{ src: '/images/content/marketing/elaboracao-pgr-pcmso/elaboracao-pgr-pcmso-03.webp', alt: 'Documentação técnica de segurança e saúde no trabalho' },
	],
	sections: [
		{
			heading: 'Relação direta entre o inventário do PGR e os exames do PCMSO',
			paragraphs: [
				'Na gestão de Segurança e Saúde no Trabalho (SST), o PGR (NR-01) e o PCMSO (NR-07) funcionam de maneira complementar. O PGR mapeia os perigos presentes nas instalações e classifica o nível de risco ocupacional de cada função, e o PCMSO utiliza esse inventário para definir o monitoramento clínico e laboratorial dos empregados.',
				'Sem um inventário de riscos bem estruturado no PGR, o PCMSO fica sem base técnica para indicar exames complementares (como audiometria, espirometria, raio-X de tórax ou dosagens toxicológicas) ou para justificar a ausência de exposições específicas.',
			],
		},
		{
			heading: 'O que compõe a entrega técnica de PGR e PCMSO',
			paragraphs: [
				'Ao contratar a elaboração conjunta com a AJN Consultoria e Engenharia, a empresa recebe a documentação estruturada conforme os requisitos normativos vigentes:',
			],
			lists: [
				{
					items: [
						'Reconhecimento in loco dos setores, postos de trabalho, máquinas, produtos químicos e rotinas operacionais;',
						'Inventário de riscos ocupacionais do PGR contendo identificação de perigos, fontes geradoras, grupos de exposição, avaliação de severidade e probabilidade e medidas de prevenção existentes;',
						'Plano de ação do PGR com cronograma de implantação, prioridades de controle e aferição das melhorias;',
						'Documento-base do PCMSO assinado por médico do trabalho responsável, com matriz de exames ocupacionais por função e diretrizes de vigilância da saúde.',
					],
				},
			],
		},
		{
			heading: 'Informações necessárias para dimensionar a proposta',
			paragraphs: [
				'O escopo de elaboração varia conforme o grau de risco da atividade, a quantidade de estabelecimentos (CNPJs ou canteiros de obra), o número de trabalhadores e a necessidade de medições quantitativas de agentes físicos ou químicos.',
				{
					segments: [
						'Veja mais informações em nossas páginas dedicadas à ',
						{ text: 'Elaboração de PGR', href: '/elaboracao-pgr' },
						' e ao serviço de ',
						{ text: 'PCMSO e ASOs', href: '/servicos/pcmso-e-asos' },
						'.',
					],
				},
			],
		},
		{
			heading: 'Fale com a AJN para cotar PGR e PCMSO',
			paragraphs: [
				'Informe os dados básicos da sua operação em Belo Horizonte ou interior de Minas Gerais para que nossa equipe apresente uma proposta técnica detalhada.',
				{
					segments: [
						'Ligue para ',
						{ bold: true, text: '31 98473-4644' },
						' ou ',
						{ text: 'solicite um orçamento', href: '/contato' },
						'.',
					],
				},
			],
		},
	],
} as const satisfies MarketingContent;
