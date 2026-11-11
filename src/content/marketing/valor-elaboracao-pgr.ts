import type { MarketingContent } from '../types';

export const valorElaboracaoPgr = {
	slug: 'valor-elaboracao-pgr',
	path: '/valor-elaboracao-pgr',
	title: 'Valor da Elaboração de PGR: O que Compõe o Custo | AJN',
	description: 'Entenda como é calculado o valor para elaboração de PGR (NR-01): porte da empresa, funções, visitas técnicas, inventário de riscos e medições ambientais.',
	heading: 'Valor da Elaboração de PGR: Fatores Técnicos de Custo',
	images: [
		{ src: '/images/content/marketing/valor-elaboracao-pgr/valor-elaboracao-pgr-01.webp', alt: 'Avaliação técnica para cálculo do valor de elaboração de PGR' },
		{ src: '/images/content/marketing/valor-elaboracao-pgr/valor-elaboracao-pgr-02.webp', alt: 'Inspeção de segurança do trabalho para PGR' },
		{ src: '/images/content/marketing/valor-elaboracao-pgr/valor-elaboracao-pgr-03.webp', alt: 'Documentação técnica do Programa de Gerenciamento de Riscos' },
	],
	sections: [
		{
			heading: 'Por que o valor da elaboração do PGR varia entre empresas',
			paragraphs: [
				'O valor para elaborar o Programa de Gerenciamento de Riscos (PGR) não é tabelado porque a NR-01 exige que o inventário de riscos e o plano de ação retratem a exposição real de cada ambiente operacional.',
				'Um escritório administrativo com funções homogêneas demanda um tempo de levantamento técnico muito diferente de uma indústria metalúrgica, transportadora ou obra civil com diversas áreas operacionais, máquinas rotativas, solda, inflamáveis e trabalho em altura.',
			],
		},
		{
			heading: 'Variáveis analisadas na formação do preço do PGR',
			paragraphs: [
				'Na composição da proposta comercial, a engenharia de segurança avalia os seguintes pontos:',
			],
			lists: [
				{
					items: [
						'Quantidade de unidades operacionais, metragem e localização (deslocamento técnico em BH, Região Metropolitana ou interior de MG);',
						'Número de funções distintas e complexidade do agrupamento por Grupos Homogêneos de Exposição (GHE);',
						'Necessidade de medições quantitativas de higiene ocupacional (dosimetria de ruído, avaliação de calor, vibração ou coleta de agentes químicos);',
						'Existência de documentação prévia confiável ou necessidade de levantamento cadastral completo em campo;',
						'Integração com o PCMSO (NR-07), LTCAT e parametrização de informações para o evento S-2240 do eSocial.',
					],
				},
			],
		},
		{
			heading: 'Cuidados com orçamentos padronizados sem visita técnica',
			paragraphs: [
				'Documentos emitidos à distância sem verificação das condições reais do estabelecimento costumam omitir perigos críticos ou atribuir riscos inexistentes, gerando inconsistências com o PCMSO e passivos em fiscalizações trabalhistas.',
				{
					segments: [
						'Conheça a metodologia de trabalho da AJN em nossa página sobre ',
						{ text: 'Elaboração de PGR', href: '/elaboracao-pgr' },
						'.',
					],
				},
			],
		},
		{
			heading: 'Solicite um levantamento de valor para sua empresa',
			paragraphs: [
				'Envie o CNAE, a cidade, o número de funcionários e as funções da sua empresa para receber um orçamento detalhado da AJN Consultoria e Engenharia.',
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
