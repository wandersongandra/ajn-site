import type { MarketingContent } from '../types';

export const valorFazerLtcat = {
	slug: 'valor-fazer-ltcat',
	path: '/valor-fazer-ltcat',
	title: 'Valor para Fazer LTCAT: Como é Calculado o Orçamento | AJN',
	description: 'Saiba o que define o valor para fazer LTCAT em Belo Horizonte e MG: quantidade de funções, setores, agentes nocivos e medições quantitativas necessárias.',
	heading: 'Valor para Fazer LTCAT: Composição do Custo Técnico',
	images: [
		{ src: '/images/content/marketing/valor-fazer-ltcat/valor-fazer-ltcat-01.webp', alt: 'Avaliação técnica para definir o valor para fazer LTCAT' },
		{ src: '/images/content/marketing/valor-fazer-ltcat/valor-fazer-ltcat-02.webp', alt: 'Medição de ruído e agentes ambientais para o LTCAT' },
		{ src: '/images/content/marketing/valor-fazer-ltcat/valor-fazer-ltcat-03.webp', alt: 'Análise de exposição previdenciária em campo' },
	],
	sections: [
		{
			heading: 'Como é calculado o valor para fazer o LTCAT',
			paragraphs: [
				'O valor para fazer o Laudo Técnico das Condições Ambientais do Trabalho (LTCAT) depende diretamente do esforço de engenharia necessário para avaliar os ambientes e quantificar os agentes nocivos presentes na empresa.',
				'Atividades administrativas ou comerciais sem exposição a agentes físicos, químicos ou biológicos demandam um levantamento técnico objetivo para fundamentar a ausência de risco previdenciário. Já operações industriais, oficinas, hospitais e obras exigem medições instrumentais específicas.',
			],
		},
		{
			heading: 'Itens que impactam o orçamento do laudo',
			paragraphs: [
				'Para elaborar a proposta técnica, a AJN Consultoria e Engenharia avalia:',
			],
			lists: [
				{
					items: [
						'Localização e número de estabelecimentos (matriz, filiais ou canteiros de obra em BH e MG);',
						'Quantidade de setores operacionais, funções ativas e possibilidade de agrupamento técnico em GHE;',
						'Quantidade e tipo de medições quantitativas necessárias (dosimetria de ruído, estresse térmico IBUTG, vibração de corpo inteiro ou mãos e braços, amostragem e análise laboratorial de agentes químicos);',
						'Emissão de Anotação de Responsabilidade Técnica (ART) pelo engenheiro de segurança do trabalho responsável.',
					],
				},
			],
		},
		{
			heading: 'Economia ao contratar LTCAT junto com o PGR',
			paragraphs: [
				'Quando a empresa precisa atualizar tanto o PGR (NR-01) quanto o LTCAT, realizar a visita técnica e as medições quantitativas na mesma mobilização reduz custos de deslocamento e aproveita os dados de higiene ocupacional para ambos os documentos.',
				{
					segments: [
						'Confira também nossas páginas sobre ',
						{ text: 'Preço do LTCAT', href: '/ltcat-preco/' },
						' e ',
						{ text: 'Orçamento de LTCAT', href: '/orcamento-ltcat/' },
						'.',
					],
				},
			],
		},
		{
			heading: 'Peça uma cotação de LTCAT para sua empresa',
			paragraphs: [
				'Informe o CNAE, a cidade, o número de funcionários e as funções exercidas para receber nossa proposta comercial.',
				{
					segments: [
						'Ligue para ',
						{ bold: true, text: '31 98473-4644' },
						' ou ',
						{ text: 'solicite orçamento pelo site', href: '/contato/' },
						'.',
					],
				},
			],
		},
	],
} as const satisfies MarketingContent;
