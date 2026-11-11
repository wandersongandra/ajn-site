import type { MarketingContent } from '../types';

export const servicosPcmso = {
	slug: 'servicos-pcmso',
	path: '/servicos-pcmso',
	title: 'Serviços de PCMSO e Gestão de Exames Ocupacionais | AJN',
	description: 'Serviços de PCMSO em Belo Horizonte e MG: elaboração do programa (NR-07), definição de grade de exames por GHE, acompanhamento de ASOs e suporte ao eSocial.',
	heading: 'Serviços de PCMSO e Controle de Saúde Ocupacional',
	images: [
		{ src: '/images/content/marketing/pcmso-preco/pcmso-preco-02.webp', alt: 'Serviços de PCMSO para empresas' },
		{ src: '/images/content/marketing/pcmso-preco/pcmso-preco-03.webp', alt: 'Acompanhamento de exames ocupacionais e ASOs' },
		{ src: '/images/content/marketing/empresa-pcmso/empresa-pcmso-03.webp', alt: 'Gestão integrada de saúde e segurança no trabalho' },
	],
	sections: [
		{
			heading: 'O que compõe a prestação de serviços de PCMSO',
			paragraphs: [
				'A gestão de saúde ocupacional de uma empresa envolve tanto o planejamento técnico do Programa de Controle Médico de Saúde Ocupacional (PCMSO - NR-07) quanto a rotina contínua de exames ligados a admissões, periódicos, mudanças de função, afastamentos e desligamentos.',
				'A AJN Consultoria e Engenharia organiza os serviços de PCMSO em Belo Horizonte e Minas Gerais para que o RH e o setor de SST tenham clareza sobre quais exames cada função exige e mantenham a documentação coerente com o PGR.',
			],
		},
		{
			heading: 'Atividades incluídas no suporte de saúde ocupacional',
			paragraphs: [
				'Conforme o escopo contratado pela empresa, o atendimento abrange:',
			],
			lists: [
				{
					items: [
						'Análise técnica do inventário de riscos do PGR para parametrização da matriz de exames clínicos e complementares por função;',
						'Emissão do documento-base do PCMSO sob coordenação de médico do trabalho;',
						'Atendimento para exames admissionais, periódicos, de retorno ao trabalho, de mudança de riscos e demissionais com emissão de ASO;',
						'Revisão técnica do programa quando surgem novas funções, setores ou agentes de exposição na operação;',
						'Elaboração do relatório analítico anual do PCMSO e orientação para o evento S-2220 do eSocial.',
					],
				},
			],
		},
		{
			heading: 'Mobilização rápida para contratos e obras',
			paragraphs: [
				'Em contratos industriais e obras civis, divergências entre os riscos descritos no PGR, o ASO do trabalhador e a função registrada bloqueiam a liberação em portaria. Nossa equipe confere a compatibilidade entre esses documentos antes da apresentação ao contratante.',
				{
					segments: [
						'Consulte a página principal do serviço de ',
						{ text: 'PCMSO e ASOs', href: '/servicos/pcmso-e-asos' },
						' e nossa página sobre ',
						{ text: 'Assessoria em Saúde Ocupacional', href: '/servicos/assessoria-e-consultoria-em-saude-ocupacional' },
						'.',
					],
				},
			],
		},
		{
			heading: 'Solicite uma proposta de serviços de PCMSO',
			paragraphs: [
				'Compartilhe o número de colaboradores, as funções e a cidade da sua empresa para receber uma cotação detalhada.',
				{
					segments: [
						'Ligue para ',
						{ bold: true, text: '31 98473-4644' },
						' ou ',
						{ text: 'entre em contato com a AJN', href: '/contato' },
						'.',
					],
				},
			],
		},
	],
} as const satisfies MarketingContent;
