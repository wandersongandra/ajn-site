import type { MarketingContent } from '../types';

export const orcamentoPgr = {
	slug: 'orcamento-pgr',
	path: '/orcamento-pgr',
	title: 'Orçamento de PGR (NR-01) para Empresas | AJN Engenharia',
	description: 'Solicite orçamento de PGR em Belo Horizonte e MG. Veja quais dados informar sobre unidades, funções e processos para dimensionar o Programa de Gerenciamento de Riscos.',
	heading: 'Orçamento de PGR conforme a NR-01',
	images: [
		{ src: '/images/content/marketing/orcamento-pgr/orcamento-pgr-01.webp', alt: 'Orçamento de PGR para empresas' },
		{ src: '/images/content/marketing/orcamento-pgr/orcamento-pgr-02.webp', alt: 'Vistoria técnica para orçamento de PGR' },
		{ src: '/images/content/marketing/orcamento-pgr/orcamento-pgr-03.webp', alt: 'Análise de inventário de riscos e plano de ação' },
	],
	sections: [
		{
			heading: 'Como é dimensionado o orçamento do PGR',
			paragraphs: [
				'O Programa de Gerenciamento de Riscos (PGR), exigido pela NR-01, deve refletir as condições reais de cada estabelecimento. Por isso, o orçamento técnico depende da complexidade dos processos produtivos, da quantidade de setores e funções, da localização das unidades e da necessidade de avaliações quantitativas de agentes ambientais.',
				'A AJN Consultoria e Engenharia analisa o contexto operacional da empresa antes de emitir a proposta, diferenciando claramente o levantamento do inventário de riscos e plano de ação das eventuais medições instrumentais complementares.',
			],
		},
		{
			heading: 'Informações que agilizam a sua cotação de PGR',
			paragraphs: [
				'Ao solicitar seu orçamento, compartilhe os dados básicos do estabelecimento para que nossa equipe de engenharia possa delimitar o escopo com precisão:',
			],
			lists: [
				{
					items: [
						'CNPJ, ramo de atividade (CNAE) e endereço da unidade ou canteiro de obras;',
						'Relação de cargos/funções ativos e número aproximado de trabalhadores;',
						'Resumo das principais operações executadas (ex.: escritório administrativo, comércio, oficina mecânica, indústria metalúrgica, construção civil);',
						'Informação sobre documentos anteriores disponíveis (PGR vigente, LTCAT, PCMSO ou relatórios de medições);',
						'Prazo desejado ou exigência específica de cliente contratante para mobilização.',
					],
				},
			],
		},
		{
			heading: 'O que verificar ao comparar propostas de PGR',
			paragraphs: [
				'Confira se o orçamento prevê visita técnica presencial para reconhecimento de riscos, emissão de Anotação de Responsabilidade Técnica (ART) quando cabível e estruturação compatível com o envio de eventos de SST ao eSocial e com o PCMSO da empresa.',
				{
					segments: [
						'Saiba mais sobre o escopo técnico em nossa página de ',
						{ text: 'Elaboração de PGR', href: '/elaboracao-pgr/' },
						'.',
					],
				},
			],
		},
		{
			heading: 'Peça seu orçamento de PGR à AJN',
			paragraphs: [
				'Nossa equipe atende empresas em Belo Horizonte, Região Metropolitana e interior de Minas Gerais.',
				{
					segments: [
						'Ligue para ',
						{ bold: true, text: '31 98473-4644' },
						' ou ',
						{ text: 'envie os dados para orçamento', href: '/contato/' },
						'.',
					],
				},
			],
		},
	],
} as const satisfies MarketingContent;
