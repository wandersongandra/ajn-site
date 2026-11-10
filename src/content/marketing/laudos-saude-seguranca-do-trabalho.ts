import type { MarketingContent } from '../types';

export const laudosSaudeSegurancaDoTrabalho = {
	slug: 'laudos-saude-seguranca-do-trabalho',
	path: '/laudos-saude-seguranca-do-trabalho',
	title: 'Laudos de Saúde e Segurança do Trabalho em BH e MG | AJN',
	description: 'Elaboração de laudos de saúde e segurança do trabalho para empresas: LTCAT, Insalubridade (NR-15), Periculosidade (NR-16), PGR e medições ambientais com ART.',
	heading: 'Laudos de Saúde e Segurança do Trabalho',
	images: [
		{ src: '/images/content/marketing/elaboracao-pgr/elaboracao-pgr-01.webp', alt: 'Vistoria para elaboração de laudos de saúde e segurança do trabalho' },
		{ src: '/images/content/marketing/laudos-seguranca-do-trabalho/laudos-seguranca-do-trabalho-02.webp', alt: 'Avaliação técnica e medições ocupacionais em campo' },
		{ src: '/images/content/marketing/elaboracao-pgr/elaboracao-pgr-02.webp', alt: 'Emissão de documentação técnica de SST com ART' },
	],
	sections: [
		{
			heading: 'Quais laudos e programas compõem a documentação de SST',
			paragraphs: [
				'A regularidade trabalhista e previdenciária de uma empresa depende de um conjunto de laudos técnicos e programas que documentam as condições do ambiente de trabalho, fundamentam o pagamento ou a neutralização de adicionais e alimentam o eSocial.',
				'A AJN Consultoria e Engenharia elabora laudos de saúde e segurança do trabalho em Belo Horizonte e Minas Gerais com levantamento presencial, instrumentação calibrada e emissão de Anotação de Responsabilidade Técnica (ART).',
			],
		},
		{
			heading: 'Principais documentos técnicos elaborados pela AJN',
			paragraphs: [
				'Cada documento atende a uma norma específica e possui finalidade jurídica distinta:',
			],
			lists: [
				{
					items: [
						'LTCAT (Laudo Técnico das Condições Ambientais do Trabalho): avalia a exposição a agentes nocivos físicos, químicos e biológicos para fins previdenciários (aposentadoria especial, PPP eletrônico e evento S-2240 do eSocial);',
						'Laudo de Insalubridade (NR-15): verifica se as atividades ultrapassam os limites de tolerância fixados pelo Ministério do Trabalho e se os EPCs/EPIs neutralizam o agente;',
						'Laudo de Periculosidade (NR-16): analisa operações com inflamáveis, explosivos, energia elétrica, radiações ionizantes ou segurança patrimonial;',
						'PGR (NR-01) e PCMSO (NR-07): programas obrigatórios de gerenciamento de riscos ocupacionais e controle médico de saúde ocupacional;',
						'Relatórios de Medições Ambientais: avaliações quantitativas de ruído, calor (IBUTG), vibração (VCI e VMB) e agentes químicos segundo as NHOs da Fundacentro.',
					],
				},
			],
		},
		{
			heading: 'Como definir quais laudos sua empresa realmente precisa',
			paragraphs: [
				'Nem todo estabelecimento precisa contratar todos os laudos existentes. Na análise inicial do CNAE, das funções e dos processos produtivos, nossa engenharia indica apenas os documentos exigíveis para a sua operação e para os contratos que você atende.',
				{
					segments: [
						'Consulte também nossas páginas sobre ',
						{ text: 'Emissão de LTCAT', href: '/emissao-ltcat' },
						', ',
						{ text: 'Elaboração de PGR', href: '/elaboracao-pgr' },
						' e ',
						{ text: 'Medições Ambientais Ocupacionais', href: '/medicoes-ambientais-ocupacionais' },
						'.',
					],
				},
			],
		},
		{
			heading: 'Peça um orçamento de laudos de SST',
			paragraphs: [
				'Informe a cidade, o segmento da empresa e a quantidade de funções e colaboradores para receber uma proposta detalhada da AJN.',
				{
					segments: [
						'Ligue para ',
						{ bold: true, text: '31 98473-4644' },
						' ou ',
						{ text: 'fale com nossa equipe técnica', href: '/contato' },
						'.',
					],
				},
			],
		},
	],
} as const satisfies MarketingContent;
