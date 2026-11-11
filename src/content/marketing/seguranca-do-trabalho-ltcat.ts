import type { MarketingContent } from '../types';

export const segurancaDoTrabalhoLtcat = {
	slug: 'seguranca-do-trabalho-ltcat',
	path: '/seguranca-do-trabalho-ltcat',
	title: 'LTCAT na Segurança do Trabalho: Finalidade e Diferenças | AJN',
	description: 'Entenda o papel do LTCAT na gestão de Segurança do Trabalho, a diferença técnica para o PGR e os Laudos de Insalubridade (NR-15) e como contratar em BH e MG.',
	heading: 'Segurança do Trabalho e LTCAT: Enquadramento Técnico e Previdenciário',
	images: [
		{ src: '/images/content/marketing/seguranca-do-trabalho-ltcat/seguranca-do-trabalho-ltcat-01.webp', alt: 'Engenharia de segurança do trabalho na elaboração de LTCAT' },
		{ src: '/images/content/marketing/seguranca-do-trabalho-ltcat/seguranca-do-trabalho-ltcat-02.webp', alt: 'Avaliação de agentes físicos, químicos e biológicos no ambiente laboral' },
		{ src: '/images/content/marketing/seguranca-do-trabalho-ltcat/seguranca-do-trabalho-ltcat-03.webp', alt: 'Documentação técnica para gestão previdenciária e trabalhista' },
	],
	sections: [
		{
			heading: 'Qual é o papel do LTCAT dentro da Segurança do Trabalho',
			paragraphs: [
				'Embora seja elaborado por engenheiro de segurança do trabalho ou médico do trabalho, o Laudo Técnico das Condições Ambientais do Trabalho (LTCAT) responde à legislação previdenciária (Lei nº 8.213/1991 e Decreto nº 3.048/1999). Sua função é documentar se o trabalhador esteve exposto de modo habitual e permanente a agentes nocivos capazes de ensejar aposentadoria especial.',
				'Na rotina das empresas, o levantamento técnico feito para o LTCAT compartilha dados de campo com o gerenciamento de riscos ocupacionais (PGR) e com a avaliação de insalubridade (NR-15).',
			],
		},
		{
			heading: 'Diferenças práticas entre LTCAT, PGR e Laudo de Insalubridade',
			paragraphs: [
				'Confundir esses três documentos é uma das principais causas de autuação trabalhista e fiscal:',
			],
			lists: [
				{
					items: [
						'LTCAT (Previdenciário): analisa os agentes nocivos do Anexo IV do Decreto nº 3.048/1999 para fins de aposentadoria especial, financiamento do SAT/RAT (alíquota FAP/RAT) e preenchimento do PPP e do evento S-2240 do eSocial;',
						'PGR - NR-01 (Trabalhista/Preventivo): mapeia todos os perigos (físicos, químicos, biológicos, ergonômicos e de acidentes) e define um plano de ação contínuo para evitar lesões e adoecimentos;',
						'Laudo de Insalubridade - NR-15 (Trabalhista/Remuneratório): avalia exclusivamente os Anexos da NR-15 da Portaria MTb nº 3.214/1978 para definir se cabe ou não o pagamento de adicional de insalubridade (10%, 20% ou 40%) em folha.',
					],
				},
			],
		},
		{
			heading: 'Por que elaborar os documentos na mesma vistoria de engenharia',
			paragraphs: [
				'Como as medições quantitativas de higiene ocupacional (dosimetria de ruído, calor, vibração e agentes químicos) servem de insumo para os três documentos, contratar a avaliação integrada com a AJN evita retrabalho e garante que os números medidos sejam coerentes em todas as esferas.',
				{
					segments: [
						'Consulte também nossas páginas sobre ',
						{ text: 'Laudo LTCAT e Insalubridade', href: '/laudo-ltcat-insalubridade' },
						' e ',
						{ text: 'Emissão de LTCAT', href: '/emissao-ltcat' },
						'.',
					],
				},
			],
		},
		{
			heading: 'Fale com a equipe técnica da AJN',
			paragraphs: [
				'Atendemos indústrias, construtoras, transportadoras e empresas de serviços em Belo Horizonte e Minas Gerais.',
				{
					segments: [
						'Ligue para ',
						{ bold: true, text: '31 98473-4644' },
						' ou ',
						{ text: 'solicite orçamento pelo site', href: '/contato' },
						'.',
					],
				},
			],
		},
	],
} as const satisfies MarketingContent;
