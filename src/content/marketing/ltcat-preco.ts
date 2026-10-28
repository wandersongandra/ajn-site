import type { MarketingContent } from '../types';

export const ltcatPreco = {
	slug: 'ltcat-preco',
	path: '/ltcat-preco',
	title: 'Preço do LTCAT: fatores que influenciam o orçamento | AJN',
	description: 'Entenda como atividades, agentes nocivos, visitas e medições podem influenciar o preço do LTCAT. Saiba quais dados enviar para solicitar uma proposta.',
	heading: 'Preço do LTCAT',
	images: [
		{ src: '/images/content/marketing/ltcat-preco/ltcat-preco-01.webp', alt: 'Ltcat preço' },
		{ src: '/images/content/marketing/ltcat-preco/ltcat-preco-02.webp', alt: 'Ltcat preço' },
		{ src: '/images/content/marketing/ltcat-preco/ltcat-preco-03.webp', alt: 'Ltcat preço' },
	],
	sections: [
		{
			heading: 'O que influencia o preço de um LTCAT?',
			paragraphs: [
				'O Laudo Técnico das Condições Ambientais do Trabalho (LTCAT) documenta condições de exposição a agentes nocivos para fins previdenciários. Sua finalidade e seus critérios técnicos não se confundem com os do PGR.',
				'Não existe um valor único para elaborar o LTCAT. O escopo depende das atividades exercidas, dos ambientes avaliados, dos agentes que precisam ser investigados e da necessidade de avaliações quantitativas.',
				'Uma proposta adequada deve deixar claro quais unidades, funções, visitas e levantamentos estão contemplados, além dos prazos e entregáveis.',
			],
		},
		{
			heading: 'Informações necessárias para solicitar uma proposta',
			paragraphs: [
				'A AJN pode analisar a demanda a partir de informações iniciais sobre a operação. Caso existam documentos e avaliações anteriores, eles ajudam a delimitar o trabalho, mas não substituem a verificação técnica necessária.',
			],
			lists: [{ items: [
				'Cidade e endereço das unidades a serem avaliadas;',
				'Atividades, setores, funções e quantidade aproximada de trabalhadores;',
				'Processos produtivos, equipamentos e possíveis agentes de exposição;',
				'Turnos, condições de acesso e disponibilidade para visitas;',
				'Documentação técnica ou avaliações ambientais já existentes, quando houver.',
			] }],
		},
		{
			heading: 'O que conferir no orçamento do LTCAT',
			paragraphs: [
				'Compare propostas pelo escopo técnico e não somente pelo valor. Verifique se estão previstas as visitas, as medições necessárias, a análise dos resultados e a emissão do laudo com responsabilidade técnica aplicável.',
				'O documento oferece subsídios para a avaliação previdenciária das condições de exposição; por si só, não garante enquadramento em aposentadoria especial nem substitui as demais obrigações de SST.',
			],
			lists: [{ items: [
				'Locais, funções e agentes incluídos na avaliação;',
				'Critérios para definir medições e levantamentos adicionais;',
				'Prazos, formato de entrega e tratamento de eventuais complementações;',
				'Responsável técnico e condições da prestação de serviços.',
			] }],
		},
		{
			heading: 'Solicite uma avaliação de escopo à AJN',
			paragraphs: [
				'Conte à equipe quais unidades e atividades precisam ser avaliadas. Com essas informações, será possível discutir o escopo do LTCAT e os dados necessários para preparar uma proposta compatível com sua operação.',
				{ segments: ['Fale pelo telefone ', { bold: true, text: '31 98473-4644' }, ' ou ', { text: 'entre em contato para solicitar um orçamento', href: '/contato/' }, '.'] },
			],
		},
	],
} as const satisfies MarketingContent;
