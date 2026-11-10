import type { MarketingContent } from '../types';

export const elaboracaoDoPgrPcmso = {
	slug: 'elaboracao-do-pgr-pcmso',
	path: '/elaboracao-do-pgr-pcmso',
	title: 'Elaboração do PGR e PCMSO Integrados | AJN Engenharia',
	description: 'Elaboração do PGR e PCMSO de forma integrada conforme NR-01 e NR-07. Alinhamento entre inventário de riscos ocupacionais, plano de ação e exames médicos.',
	heading: 'Elaboração do PGR e do PCMSO com Integração Técnica',
	images: [
		{ src: '/images/content/marketing/elaboracao-do-pgr-pcmso/elaboracao-do-pgr-pcmso-01.webp', alt: 'Elaboração do PGR e PCMSO para empresas' },
		{ src: '/images/content/marketing/elaboracao-do-pgr-pcmso/elaboracao-do-pgr-pcmso-02.webp', alt: 'Levantamento de riscos ocupacionais para PGR e PCMSO' },
		{ src: '/images/content/marketing/elaboracao-do-pgr-pcmso/elaboracao-do-pgr-pcmso-03.webp', alt: 'Acompanhamento de programas de engenharia e saúde ocupacional' },
	],
	sections: [
		{
			heading: 'Por que elaborar o PGR e o PCMSO de forma conjunta',
			paragraphs: [
				'Pela redação vigente da NR-01 e da NR-07, o Programa de Controle Médico de Saúde Ocupacional (PCMSO) deve ser construído com base nos riscos físicos, químicos, biológicos, ergonômicos e de acidentes identificados no Programa de Gerenciamento de Riscos (PGR).',
				'Quando a empresa contrata o PGR e o PCMSO em momentos desconectados ou com bases de cargos diferentes, surgem divergências entre os riscos apontados no inventário e a grade de exames clínicos e complementares dos Atestados de Saúde Ocupacional (ASOs).',
			],
		},
		{
			heading: 'Como a AJN conduz a estruturação dos dois programas',
			paragraphs: [
				'A AJN Consultoria e Engenharia organiza o levantamento técnico em etapas coordenadas para que a documentação trabalhista e os eventos de SST no eSocial utilizem a mesma estrutura de setores, funções e Grupos Homogêneos de Exposição (GHE):',
			],
			lists: [
				{
					items: [
						'Vistoria técnica nos ambientes de trabalho para reconhecimento dos processos produtivos, postos operacionais e medidas de proteção existentes;',
						'Consolidação do inventário de riscos ocupacionais e do plano de ação do PGR conforme os critérios da NR-01;',
						'Definição técnica de avaliações quantitativas de higiene ocupacional (como ruído, calor ou agentes químicos) quando necessárias para subsidiar o controle médico;',
						'Planejamento do PCMSO pelo médico responsável (NR-07), vinculando cada risco identificado no PGR aos exames admissionais, periódicos, de retorno ao trabalho, de mudança de riscos e demissionais.',
					],
				},
			],
		},
		{
			heading: 'Quando revisar o PGR e o PCMSO da empresa',
			paragraphs: [
				'O inventário de riscos do PGR deve ser mantido atualizado sempre que ocorrerem mudanças em instalações, processos, matérias-primas, funções ou medidas de controle, além das revisões periódicas previstas na NR-01. Qualquer alteração de risco relevante no PGR deve refletir imediatamente no planejamento médico do PCMSO.',
				{
					segments: [
						'Consulte também os detalhes sobre ',
						{ text: 'Elaboração de PGR', href: '/elaboracao-pgr' },
						' e o serviço de ',
						{ text: 'PCMSO e ASOs', href: '/servicos/pcmso-e-asos' },
						'.',
					],
				},
			],
		},
		{
			heading: 'Solicite orçamento para elaboração do PGR e PCMSO',
			paragraphs: [
				'Envie o CNPJ, a cidade da unidade, o segmento de atuação e a relação de funções com o número aproximado de empregados para receber uma proposta detalhada.',
				{
					segments: [
						'Ligue para ',
						{ bold: true, text: '31 98473-4644' },
						' ou ',
						{ text: 'entre em contato com a AJN', href: '/contato' },
						'.',
					],
				},
			],
		},
	],
} as const satisfies MarketingContent;
