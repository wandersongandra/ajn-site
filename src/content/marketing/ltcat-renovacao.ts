import type { MarketingContent } from '../types';

export const ltcatRenovacao = {
	slug: 'ltcat-renovacao',
	path: '/ltcat-renovacao',
	title: 'Renovação e Atualização de LTCAT: Quando é Obrigatória | AJN',
	description: 'Saiba quando fazer a renovação ou atualização do LTCAT da sua empresa conforme a Instrução Normativa do INSS e o Decreto 3.048/99. Atendimento em BH e MG.',
	heading: 'Renovação e Atualização Técnica do LTCAT',
	images: [
		{ src: '/images/content/marketing/ltcat-renovacao/ltcat-renovacao-01.webp', alt: 'Vistoria para renovação e atualização de LTCAT' },
		{ src: '/images/content/marketing/ltcat-renovacao/ltcat-renovacao-02.webp', alt: 'Reavaliação de agentes nocivos e layout operacional' },
		{ src: '/images/content/marketing/ltcat-renovacao/ltcat-renovacao-03.webp', alt: 'Atualização de laudo técnico previdenciário' },
	],
	sections: [
		{
			heading: 'O LTCAT tem prazo de validade ou precisa de renovação?',
			paragraphs: [
				'A legislação previdenciária (Lei nº 8.213/1991 e Instrução Normativa PRES/INSS nº 128/2022) não fixa data de vencimento em calendário para o LTCAT, mas determina que o laudo seja atualizado sempre que ocorrerem alterações no ambiente de trabalho ou na organização das atividades.',
				'Na prática, porém, manter um LTCAT antigo sem revisão por vários anos gera passivos graves quando a empresa muda máquinas, cria novas funções, substitui EPIs ou precisa comprovar a contemporaneidade dos dados no evento S-2240 do eSocial.',
			],
		},
		{
			heading: 'Situações que exigem a atualização imediata do LTCAT',
			paragraphs: [
				'De acordo com as normas previdenciárias, o laudo precisa ser revisto ou renovado sempre que houver:',
			],
			lists: [
				{
					items: [
						'Mudança de layout das instalações, ampliação de galpão ou transferência de endereço;',
						'Substituição ou acréscimo de máquinas, equipamentos ou matérias-primas e produtos químicos;',
						'Adoção ou alteração de tecnologia de proteção coletiva (EPC), como enclausuramento acústico ou sistemas de exaustão;',
						'Criação de novos cargos/funções ou alteração na rotina de exposição dos trabalhadores;',
						'Atingimento de níveis de ação em avaliações ambientais que exijam novo monitoramento quantitativo.',
					],
				},
			],
		},
		{
			heading: 'Como a AJN realiza a revisão do seu LTCAT',
			paragraphs: [
				'Nossa equipe avalia o LTCAT anterior da empresa, confere in loco o que mudou nos setores produtivos, executa novas medições instrumentais onde houve alteração de processo e emite o laudo atualizado com nova ART, mantendo o histórico técnico preservado para emissões de PPP.',
				{
					segments: [
						'Veja mais informações em nossa página de ',
						{ text: 'Emissão de LTCAT', href: '/emissao-ltcat' },
						' e ',
						{ text: 'LTCAT e Evento eSocial', href: '/ltcat-evento-esocial' },
						'.',
					],
				},
			],
		},
		{
			heading: 'Solicite a atualização do LTCAT da sua empresa',
			paragraphs: [
				'Informe à AJN Consultoria e Engenharia a data do seu último laudo e o porte atual da operação para avaliarmos o escopo de renovação.',
				{
					segments: [
						'Ligue para ',
						{ bold: true, text: '31 98473-4644' },
						' ou ',
						{ text: 'entre em contato conosco', href: '/contato' },
						'.',
					],
				},
			],
		},
	],
} as const satisfies MarketingContent;
