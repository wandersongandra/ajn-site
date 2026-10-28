import type { MarketingContent } from '../types';

export const ltcatOrcamento = {
	slug: "ltcat-orcamento", path: "/ltcat-orcamento",
	title: "Como solicitar orçamento de LTCAT | AJN Consultoria e Engenharia",
	description: "Veja quais informações reunir antes de solicitar orçamento de LTCAT: unidades, funções, agentes nocivos, avaliações existentes e escopo da visita técnica.",
	heading: "Como solicitar orçamento de LTCAT",
	images: [
		{ src: "/images/content/marketing/empresa-ltcat/empresa-ltcat-01.webp", alt: "Ltcat orçamento" },
		{ src: "/images/content/marketing/empresa-que-faz-ltcat/empresa-que-faz-ltcat-02.webp", alt: "Ltcat orçamento" },
		{ src: "/images/content/marketing/empresa-ltcat/empresa-ltcat-03.webp", alt: "Ltcat orçamento" },
	],
	sections: [
		{
			heading: "O que reunir antes de pedir orçamento de LTCAT",
			paragraphs: [
				"O LTCAT registra informações técnicas sobre condições de exposição a agentes nocivos para fins previdenciários. Antes de solicitar sua elaboração, vale organizar os dados básicos da empresa e identificar os ambientes que precisam ser avaliados.",
				"Esse levantamento inicial permite discutir o escopo da contratação. A definição final das avaliações e medições depende da análise técnica das atividades e condições de trabalho.",
			],
		},
		{
			heading: "Checklist para preparar a solicitação",
			paragraphs: [
				"Quanto mais claro for o contexto da operação, mais objetiva poderá ser a proposta. Não é necessário antecipar uma conclusão sobre exposição ou enquadramento previdenciário.",
			],
			lists: [{ items: [
				"Razão social e localização das unidades que serão atendidas;",
				"Setores, funções, atividades e quantidade aproximada de trabalhadores;",
				"Descrição dos processos, equipamentos e materiais utilizados;",
				"Possíveis exposições a agentes físicos, químicos ou biológicos;",
				"Documentos e medições anteriores, se disponíveis;",
				"Restrições de acesso, turnos e prazo desejado para o serviço.",
			] }],
		},
		{
			heading: "Como avaliar o escopo recebido",
			paragraphs: [
				"Confirme se a proposta contempla as unidades e funções de interesse, visitas técnicas, critérios de medição quando necessários e entrega do laudo com responsável habilitado conforme a legislação aplicável.",
				"Também devem ficar claros os prazos, as informações que a empresa precisa disponibilizar e como serão tratadas situações que exijam levantamentos complementares.",
			],
			lists: [{ items: [
				"Delimitação dos ambientes e atividades incluídos;",
				"Condições para avaliações quantitativas e complementações;",
				"Prazo, entregáveis e responsabilidade técnica.",
			] }],
		},
		{
			heading: "Envie os dados iniciais à AJN",
			paragraphs: [
				"A AJN Consultoria e Engenharia pode avaliar sua solicitação a partir das informações da operação e orientar os próximos passos para a composição de uma proposta técnica.",
				{ segments: ["Converse pelo ", { bold: true, text: "31 98473-4644" }, " ou ", { text: "envie os dados para avaliação de escopo", href: "/contato/" }, "."] },
			],
		},
	],
} as const satisfies MarketingContent;
