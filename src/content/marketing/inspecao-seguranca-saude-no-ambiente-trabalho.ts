import type { MarketingContent } from '../types';

export const inspecaoSegurancaSaudeNoAmbienteTrabalho = {
	slug: 'inspecao-seguranca-saude-no-ambiente-trabalho',
	path: '/inspecao-seguranca-saude-no-ambiente-trabalho',
	title: 'Inspeção de Segurança e Saúde no Ambiente de Trabalho | AJN',
	description: 'Inspeção técnica de segurança e saúde no ambiente de trabalho em BH e MG: verificação de conformidade em NRs, registro fotográfico e plano de ação corretivo.',
	heading: 'Inspeção de Segurança e Saúde no Ambiente de Trabalho',
	images: [
		{ src: '/images/content/marketing/elaboracao-pgr/elaboracao-pgr-01.webp', alt: 'Inspeção técnica de segurança e saúde no ambiente de trabalho' },
		{ src: '/images/content/marketing/laudos-seguranca-do-trabalho/laudos-seguranca-do-trabalho-02.webp', alt: 'Verificação de equipamentos e condições operacionais em campo' },
		{ src: '/images/content/marketing/inspecao-seguranca-saude-no-ambiente-trabalho/inspecao-seguranca-saude-no-ambiente-trabalho-03.webp', alt: 'Levantamento de não conformidades e ações preventivas' },
	],
	sections: [
		{
			heading: 'Como funciona a inspeção técnica no ambiente de trabalho',
			paragraphs: [
				'A inspeção de segurança e saúde no ambiente de trabalho consiste na verificação presencial das condições operacionais de um canteiro de obras, planta industrial, centro logístico ou estabelecimento comercial para identificar desvios antes que se tornem acidentes ou autuações.',
				'Além da conferência documental, a vistoria em campo observa como as tarefas são executadas na prática, o estado de conservação de proteções coletivas (EPCs), a entrega e o uso de EPIs, a sinalização e a organização dos postos de trabalho.',
			],
		},
		{
			heading: 'Itens verificados durante as vistorias da AJN',
			paragraphs: [
				'O checklist de inspeção é customizado conforme as Normas Regulamentadoras aplicáveis à atividade da empresa:',
			],
			lists: [
				{
					items: [
						'Condições de máquinas, ferramentas manuais, painéis elétricos provisórios ou definitivos e dispositivos de parada de emergência (NR-10 e NR-12);',
						'Trabalhos críticos como atividades em altura (NR-35), espaços confinados (NR-33), movimentação de cargas e operações a quente;',
						'Permissões de Trabalho (PT), Análise Preliminar de Risco (APR) e validade de treinamentos e ASOs das equipes próprias e terceirizadas;',
						'Desobstrução de rotas de fuga, validade de extintores, hidrantes e sinalização de emergência;',
						'Condições sanitárias, áreas de vivência, ergonomia dos postos e armazenamento de produtos químicos (FDS/FISPQ).',
					],
				},
			],
		},
		{
			heading: 'Relatório técnico com evidências e prioridades de correção',
			paragraphs: [
				'Ao término da inspeção, a AJN entrega um relatório objetivo com registro fotográfico dos desvios encontrados, enquadramento técnico e classificação de criticidade para apoiar o gestor na tratativa com as equipes de manutenção e operação.',
				{
					segments: [
						'Veja também nossa página sobre ',
						{ text: 'Inspeções de Segurança do Trabalho', href: '/inspecoes-seguranca-do-trabalho/' },
						' e ',
						{ text: 'Mobilização e Acompanhamento Técnico', href: '/mobilizacao-pessoal-equipamentos/' },
						'.',
					],
				},
			],
		},
		{
			heading: 'Agende uma inspeção técnica com a AJN',
			paragraphs: [
				'Informe o local da obra ou unidade empresarial em Minas Gerais e o objetivo da vistoria para receber nossa proposta de atendimento.',
				{
					segments: [
						'Ligue para ',
						{ bold: true, text: '31 98473-4644' },
						' ou ',
						{ text: 'solicite contato pelo site', href: '/contato/' },
						'.',
					],
				},
			],
		},
	],
} as const satisfies MarketingContent;
