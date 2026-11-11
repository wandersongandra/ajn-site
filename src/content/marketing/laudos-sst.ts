import type { MarketingContent } from '../types';

export const laudosSst = {
	slug: 'laudos-sst',
	path: '/laudos-sst',
	title: 'Laudos de SST (Segurança e Saúde no Trabalho) | AJN Engenharia',
	description: 'Emissão de laudos de SST em Belo Horizonte e MG: LTCAT, laudos de insalubridade e periculosidade, avaliações quantitativas de higiene ocupacional e PGR.',
	heading: 'Laudos de SST: Engenharia de Segurança e Higiene Ocupacional',
	images: [
		{ src: '/images/content/marketing/valor-projeto-combate-incendio/valor-projeto-combate-incendio-01.webp', alt: 'Levantamento técnico para emissão de laudos de SST' },
		{ src: '/images/content/marketing/laudos-sst/laudos-sst-02.webp', alt: 'Avaliação de exposição ocupacional em ambiente produtivo' },
		{ src: '/images/content/marketing/laudos-sst/laudos-sst-03.webp', alt: 'Documentação de segurança e saúde no trabalho com ART' },
	],
	sections: [
		{
			heading: 'Como são elaborados os laudos de SST na prática',
			paragraphs: [
				'A emissão de laudos de SST exige levantamento presencial nos setores produtivos da empresa. A análise técnica avalia o ciclo real da tarefa, o tempo de exposição em cada posto, as fontes geradoras de agentes físicos, químicos ou biológicos e a eficácia das proteções instaladas.',
				'A AJN Consultoria e Engenharia realiza o levantamento completo de campo em Belo Horizonte e Minas Gerais para entregar laudos de SST tecnicamente defensáveis.',
			],
		},
		{
			heading: 'Escopo técnico de laudos e programas de SST',
			paragraphs: [
				'Atendemos empresas industriais, construtoras, prestadores de serviços, condomínios e comércios na emissão de:',
			],
			lists: [
				{
					items: [
						'Laudo Técnico das Condições Ambientais do Trabalho (LTCAT) conforme a Lei nº 8.213/1991 e o Decreto nº 3.048/1999;',
						'Laudo Técnico de Insalubridade (NR-15) e Laudo Técnico de Periculosidade (NR-16) com parecer conclusivo por função;',
						'Programa de Gerenciamento de Riscos (PGR - NR-01) e Programa de Controle Médico de Saúde Ocupacional (PCMSO - NR-07);',
						'Avaliações quantitativas de ruído contínuo ou de impacto, calor (IBUTG), vibração ocupacional e agentes químicos aerodispersoides.',
					],
				},
			],
		},
		{
			heading: 'Quando contratar ou revisar seus laudos de SST',
			paragraphs: [
				'A contratação é indicada na abertura de estabelecimentos, na mobilização de equipes para contratos em clientes, após reformas ou mudanças de máquinas e sempre que houver necessidade de atualizar a base técnica dos eventos do eSocial.',
				{
					segments: [
						'Confira também nossas páginas sobre ',
						{ text: 'Laudos de Segurança do Trabalho', href: '/laudos-seguranca-do-trabalho' },
						' e ',
						{ text: 'Emissão de LTCAT', href: '/emissao-ltcat' },
						'.',
					],
				},
			],
		},
		{
			heading: 'Solicite uma proposta técnica à AJN',
			paragraphs: [
				'Envie os dados do seu estabelecimento e a relação de cargos ativos para dimensionarmos o levantamento de SST.',
				{
					segments: [
						'Ligue para ',
						{ bold: true, text: '31 98473-4644' },
						' ou ',
						{ text: 'solicite orçamento pelo formulário', href: '/contato' },
						'.',
					],
				},
			],
		},
	],
} as const satisfies MarketingContent;
