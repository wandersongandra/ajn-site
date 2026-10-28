import type { MarketingContent } from '../types';

export const pcmsoPreco = {
	slug: 'pcmso-preco',
	path: '/pcmso-preco',
	title: 'Preço do PCMSO: fatores de escopo e acompanhamento | AJN',
	description: 'Saiba como riscos ocupacionais, funções, número de empregados, exames e acompanhamento médico influenciam o preço do PCMSO para empresas.',
	heading: 'Preço do PCMSO',
	images: [
		{ src: '/images/content/marketing/pcmso-preco/pcmso-preco-01.webp', alt: 'Pcmso preço' },
		{ src: '/images/content/marketing/pcmso-preco/pcmso-preco-02.webp', alt: 'Pcmso preço' },
		{ src: '/images/content/marketing/pcmso-preco/pcmso-preco-03.webp', alt: 'Pcmso preço' },
	],
	sections: [
		{
			heading: 'Como é definido o preço do PCMSO?',
			paragraphs: [
				'O Programa de Controle Médico de Saúde Ocupacional (PCMSO) é regulamentado pela NR-7 e orienta o acompanhamento da saúde dos empregados em relação aos riscos ocupacionais identificados e avaliados no PGR.',
				'O preço depende do porte e da organização da empresa, dos riscos envolvidos, dos exames previstos e do acompanhamento necessário. A aplicabilidade das obrigações e eventuais dispensas deve ser verificada conforme o enquadramento da organização.',
				'A elaboração e o acompanhamento do programa devem observar a responsabilidade médica prevista na NR-7. O orçamento precisa separar o trabalho de gestão do PCMSO de exames, consultas e outros serviços eventualmente contratados.',
			],
		},
		{
			heading: 'Quais fatores influenciam o orçamento?',
			paragraphs: [
				'Uma cotação responsável considera as informações da empresa, os riscos ocupacionais e o conjunto de atividades que o médico responsável deverá planejar e acompanhar.',
				'Quantidade de empregados, distribuição por funções e unidades, tipos de exames, logística de atendimento e periodicidade do acompanhamento podem alterar o custo total.',
			],
			lists: [{ items: [
				'Quantidade de trabalhadores e funções com exposições distintas;',
				'Inventário de riscos ocupacionais e informações do PGR disponíveis;',
				'Unidades, turnos, localidade e forma de atendimento médico;',
				'Exames clínicos e complementares indicados conforme a avaliação médica e os riscos;',
				'Rotina de acompanhamento e documentos previstos na proposta.',
			] }],
		},
		{
			heading: 'Como comparar propostas de PCMSO',
			paragraphs: [
				'Antes de comparar preços, confirme se as propostas contemplam os mesmos entregáveis: planejamento médico, exames ocupacionais, emissão dos ASOs e acompanhamento periódico, conforme aplicável.',
				'Verifique quem responde tecnicamente pelo programa, como os dados dos empregados serão tratados e quais serviços adicionais serão cobrados à parte. Um preço isolado não demonstra a adequação do atendimento às necessidades da empresa.',
			],
		},
		{
			heading: 'Quais informações enviar para cotar o PCMSO?',
			paragraphs: [
				'Para orientar o levantamento inicial, informe o número de empregados, as funções, a localização das unidades, a situação do PGR e os serviços médicos já contratados.',
				'A AJN pode discutir o escopo e as condições de atendimento a partir dessas informações, sem antecipar exames ou conclusões que dependam da avaliação médica responsável.',
			],
		},
		{
			heading: 'Solicite uma proposta de PCMSO para sua empresa',
			paragraphs: [
				'Descreva a atividade da empresa, a quantidade de pessoas e o acompanhamento esperado. A equipe poderá avaliar as informações iniciais e orientar o próximo passo para elaborar uma proposta.',
				{ segments: ['Ligue para ', { bold: true, text: '31 98473-4644' }, ' ou ', { text: 'envie sua solicitação à AJN', href: '/contato/' }, '.'] },
			],
		},
	],
} as const satisfies MarketingContent;
