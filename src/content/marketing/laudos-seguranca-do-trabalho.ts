import type { MarketingContent } from '../types';

export const laudosSegurancaDoTrabalho = {
	slug: 'laudos-seguranca-do-trabalho',
	path: '/laudos-seguranca-do-trabalho',
	title: 'Laudos de Segurança do Trabalho em BH e MG | AJN Engenharia',
	description: 'Elaboração de laudos de segurança do trabalho em Belo Horizonte e MG: LTCAT, Insalubridade (NR-15), Periculosidade (NR-16) e avaliações quantitativas.',
	heading: 'Laudos de Segurança do Trabalho para Empresas',
	images: [
		{ src: '/images/content/marketing/laudos-seguranca-do-trabalho/laudos-seguranca-do-trabalho-01.webp', alt: 'Vistoria técnica para emissão de laudos de segurança do trabalho' },
		{ src: '/images/content/marketing/laudos-seguranca-do-trabalho/laudos-seguranca-do-trabalho-02.webp', alt: 'Avaliação quantitativa de agentes ocupacionais em campo' },
		{ src: '/images/content/marketing/laudos-seguranca-do-trabalho/laudos-seguranca-do-trabalho-03.webp', alt: 'Levantamento de insalubridade, periculosidade e LTCAT' },
		{ src: '/images/content/marketing/laudos-seguranca-do-trabalho/laudos-seguranca-do-trabalho-04.webp', alt: 'Documentação de engenharia de segurança com ART' },
	],
	sections: [
		{
			heading: 'Diferença entre laudos técnicos e programas de SST',
			paragraphs: [
				'Na gestão trabalhista e previdenciária, é fundamental distinguir os programas contínuos de gerenciamento (como o PGR da NR-01 e o PCMSO da NR-07) dos laudos técnicos conclusivos. Enquanto os programas organizam as ações preventivas ao longo do ano, os laudos de segurança do trabalho atestam tecnicamente se uma exposição gera direito a adicionais em folha ou aposentadoria especial.',
				'A AJN Consultoria e Engenharia elabora laudos de segurança do trabalho em Belo Horizonte e Minas Gerais com levantamento presencial, instrumentação de higiene ocupacional calibrada e emissão de Anotação de Responsabilidade Técnica (ART).',
			],
		},
		{
			heading: 'Quais laudos de segurança do trabalho sua empresa pode precisar',
			paragraphs: [
				'O enquadramento depende das atividades executadas em cada setor da organização:',
			],
			lists: [
				{
					items: [
						'LTCAT (Laudo Técnico das Condições Ambientais do Trabalho): documento previdenciário exigido pela Lei nº 8.213/1991 para caracterizar exposição aos agentes nocivos do Decreto nº 3.048/1999 e alimentar o PPP eletrônico e o evento S-2240 do eSocial;',
						'Laudo de Insalubridade (NR-15): avalia agentes físicos, químicos e biológicos frente aos limites de tolerância da NR-15 para fundamentar o pagamento ou a descaracterização do adicional de insalubridade;',
						'Laudo de Periculosidade (NR-16): analisa atividades e áreas de risco envolvendo inflamáveis, explosivos, energia elétrica, radiações ionizantes ou segurança patrimonial;',
						'Relatórios de Medições Ambientais: dosimetrias de ruído, avaliações de calor (IBUTG), vibração ocupacional e coletas químicas conforme as NHOs da Fundacentro.',
					],
				},
			],
		},
		{
			heading: 'Valor jurídico de um laudo fundamentado em medições reais',
			paragraphs: [
				'Laudos genéricos baseados apenas em inspeção visual onde a norma exige medição quantitativa são facilmente desconsiderados em fiscalizações e perícias trabalhistas. Nosso levantamento registra metodologia, certificados de calibração dos equipamentos e eficácia das proteções coletivas e individuais.',
				{
					segments: [
						'Consulte também nossas páginas sobre ',
						{ text: 'Emissão de LTCAT', href: '/emissao-ltcat' },
						' e ',
						{ text: 'Laudo LTCAT e Insalubridade', href: '/laudo-ltcat-insalubridade' },
						'.',
					],
				},
			],
		},
		{
			heading: 'Solicite orçamento de laudos à AJN',
			paragraphs: [
				'Informe a cidade da sua empresa, o ramo de atividade e a relação de funções para dimensionarmos o levantamento técnico.',
				{
					segments: [
						'Ligue para ',
						{ bold: true, text: '31 98473-4644' },
						' ou ',
						{ text: 'solicite uma proposta técnica', href: '/contato' },
						'.',
					],
				},
			],
		},
	],
} as const satisfies MarketingContent;
