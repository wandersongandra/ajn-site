import type { MarketingContent } from '../types';

export const segurancaDoTrabalhoPcmso = {
	slug: 'seguranca-do-trabalho-pcmso',
	path: '/seguranca-do-trabalho-pcmso',
	title: 'Segurança do Trabalho e PCMSO: Integração NR-01 e NR-07 | AJN',
	description: 'Entenda como a Engenharia de Segurança do Trabalho alimenta o PCMSO (NR-07) por meio do inventário de riscos do PGR e das medições de higiene ocupacional.',
	heading: 'Segurança do Trabalho e PCMSO: Conexão entre Engenharia e Saúde',
	images: [
		{ src: '/images/content/marketing/seguranca-do-trabalho-pcmso/seguranca-do-trabalho-pcmso-01.webp', alt: 'Integração entre segurança do trabalho e PCMSO' },
		{ src: '/images/content/marketing/seguranca-do-trabalho-pcmso/seguranca-do-trabalho-pcmso-02.webp', alt: 'Levantamento de higiene ocupacional para subsidiar o PCMSO' },
		{ src: '/images/content/marketing/seguranca-do-trabalho-pcmso/seguranca-do-trabalho-pcmso-03.webp', alt: 'Gestão de riscos ocupacionais e controle médico' },
	],
	sections: [
		{
			heading: 'Por que o PCMSO depende do levantamento de Segurança do Trabalho',
			paragraphs: [
				'Para definir os exames complementares do PCMSO, o médico do trabalho precisa saber a quais agentes físicos, químicos, biológicos e ergonômicos cada função está exposta e em qual intensidade. Quem produz essa base técnica é a Engenharia de Segurança do Trabalho, por meio do PGR (NR-01) e das medições quantitativas de higiene ocupacional.',
				'Quando uma atividade apresenta ruído acima do nível de ação, poeiras minerais, fumos metálicos, solventes orgânicos ou trabalho em altura (NR-35), essa informação técnica da engenharia determina os exames específicos que passarão a constar no PCMSO e no ASO do trabalhador.',
			],
		},
		{
			heading: 'Como a AJN integra os levantamentos de campo ao controle médico',
			paragraphs: [
				'Na AJN Consultoria e Engenharia, o processo é conduzido sem lacunas entre o que ocorre na operação e o que vai para o documento médico:',
			],
			lists: [
				{
					items: [
						'Vistoria técnica presencial para mapear processos, máquinas, matérias-primas e tempo real de exposição de cada cargo;',
						'Execução de dosimetrias de ruído, avaliações de calor, vibração e agentes químicos quando necessário para quantificar a exposição;',
						'Classificação dos riscos no inventário do PGR e definição de medidas de controle coletivas (EPC) e individuais (EPI);',
						'Repasse estruturado da matriz de riscos por GHE para elaboração do PCMSO (NR-07), garantindo coerência entre o PGR, o LTCAT e os ASOs.',
					],
				},
			],
		},
		{
			heading: 'Evite divergências em auditorias e no eSocial',
			paragraphs: [
				'Manter a segurança do trabalho e o PCMSO compatibilizados evita que um trabalhador realize atividades críticas sem aptidão clínica registrada no ASO ou que o evento S-2220 apresente inconsistências perante o evento S-2240 no eSocial.',
				{
					segments: [
						'Conheça nossas páginas de ',
						{ text: 'PCMSO e ASOs', href: '/servicos/pcmso-e-asos' },
						' e ',
						{ text: 'Medições Ambientais Ocupacionais', href: '/medicoes-ambientais-ocupacionais' },
						'.',
					],
				},
			],
		},
		{
			heading: 'Solicite orçamento integrado à AJN',
			paragraphs: [
				'Fale com nossa equipe em Belo Horizonte para estruturar a documentação de segurança do trabalho e saúde ocupacional da sua empresa.',
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
