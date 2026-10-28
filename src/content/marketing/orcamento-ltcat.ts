import type { MarketingContent } from '../types';

export const orcamentoLtcat = {
	slug: 'orcamento-ltcat',
	path: '/orcamento-ltcat',
	title: 'Orçamento de LTCAT para empresas | AJN Consultoria e Engenharia',
	description: 'Solicite orçamento de LTCAT para sua empresa. Conheça as etapas de levantamento, avaliação de exposição, responsabilidade técnica e entrega do laudo.',
	heading: 'Orçamento de LTCAT para empresas',
	images: [
		{ src: '/images/content/marketing/empresa-que-faz-ltcat/empresa-que-faz-ltcat-01.webp', alt: 'Orçamento ltcat' },
		{ src: '/images/content/marketing/empresa-ltcat/empresa-ltcat-02.webp', alt: 'Orçamento ltcat' },
		{ src: '/images/content/marketing/empresa-que-faz-ltcat/empresa-que-faz-ltcat-02.webp', alt: 'Orçamento ltcat' },
	],
	sections: [
		{
			heading: 'Orçamento de LTCAT com escopo definido para sua operação',
			paragraphs: [
				'A elaboração do LTCAT exige análise das condições de trabalho e das exposições a agentes nocivos pertinentes à finalidade previdenciária do laudo. A AJN inicia o atendimento com a compreensão das atividades, dos ambientes e da documentação disponível.',
				'A partir dessas informações, a equipe pode organizar uma proposta com as etapas e entregáveis previstos, sujeitos à avaliação técnica das condições encontradas.',
			],
		},
		{
			heading: 'Etapas que podem compor a contratação',
			paragraphs: [
				'Os procedimentos necessários variam conforme a natureza das atividades e os agentes a serem investigados. Por isso, a proposta deve identificar o que está incluído e eventuais condições para levantamentos complementares.',
			],
			lists: [{ items: [
				'Alinhamento do escopo com os responsáveis pela empresa;',
				'Planejamento de visitas e acesso aos ambientes de trabalho;',
				'Levantamento das atividades, funções e condições de exposição;',
				'Avaliações e medições tecnicamente indicadas, quando necessárias;',
				'Análise e emissão do LTCAT por profissional legalmente habilitado;',
				'Entrega do laudo e orientação sobre os limites do documento contratado.',
			] }],
		},
		{
			heading: 'Informações que agilizam sua proposta',
			paragraphs: [
				'Informe a cidade, a quantidade de unidades, o ramo de atividade, as funções a serem avaliadas e o prazo desejado. Se a empresa já dispõe de PGR, inventário de riscos ou avaliações anteriores, esses materiais podem auxiliar a análise inicial.',
				'O LTCAT fornece elementos para a avaliação previdenciária da exposição ocupacional, mas não substitui os programas de prevenção nem determina automaticamente o direito à aposentadoria especial.',
			],
		},
		{
			heading: 'Converse com a AJN para receber uma proposta',
			paragraphs: [
				'Compartilhe o cenário da sua empresa para que possamos orientar o levantamento de informações e avaliar a viabilidade do atendimento ao escopo solicitado.',
				{ segments: ['Ligue para ', { bold: true, text: '31 98473-4644' }, ' ou ', { text: 'solicite um orçamento de LTCAT', href: '/contato/' }, '.'] },
			],
		},
	],
} as const satisfies MarketingContent;
