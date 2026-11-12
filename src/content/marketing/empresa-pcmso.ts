import type { MarketingContent } from '../types';

export const empresaPcmso = {
	slug: 'empresa-pcmso',
	path: '/empresa-pcmso',
	title: 'Empresa de PCMSO em Belo Horizonte e MG | AJN Engenharia',
	description: 'Procurando empresa de PCMSO em BH e MG? A AJN estrutura o Programa de Controle Médico de Saúde Ocupacional (NR-07) integrado ao PGR e aos exames ocupacionais.',
	heading: 'Empresa de PCMSO: Estruturação e Acompanhamento Técnico',
	images: [
		{ src: '/images/content/marketing/pcmso-preco/pcmso-preco-01.webp', alt: 'Atendimento técnico de empresa de PCMSO' },
		{ src: '/images/content/marketing/pcmso-preco/pcmso-preco-03.webp', alt: 'Gestão de saúde ocupacional e exames periódicos' },
		{ src: '/images/content/marketing/empresa-pcmso/empresa-pcmso-03.webp', alt: 'Integração entre engenharia de segurança e medicina ocupacional' },
	],
	sections: [
		{
			heading: 'O que avaliar ao contratar uma empresa de PCMSO',
			paragraphs: [
				'Na escolha de uma empresa para elaborar e gerir o PCMSO (NR-07), o ponto principal é verificar como o prestador conecta a medicina do trabalho com a engenharia de segurança. Pela norma vigente, o médico responsável pelo PCMSO precisa apoiar-se no inventário de riscos do PGR para definir quais exames complementares são obrigatórios para cada função.',
				'A AJN Consultoria e Engenharia atua de forma integrada em Belo Horizonte e Minas Gerais, evitando que o cliente receba um PCMSO desconectado da realidade operacional ou com cobranças de exames desnecessários.',
			],
		},
		{
			heading: 'Escopo de atendimento em saúde ocupacional',
			paragraphs: [
				'O suporte técnico é organizado conforme o porte do quadro de funcionários e a rotina de contratações da organização:',
			],
			lists: [
				{
					items: [
						'Levantamento de cargos, setores e exposições ocupacionais em conjunto com a equipe de engenharia (PGR e LTCAT);',
						'Elaboração e atualização do documento-base do PCMSO sob responsabilidade de médico habilitado;',
						'Definição clara da grade de exames clínicos e complementares por função e Grupo Homogêneo de Exposição (GHE);',
						'Orientação sobre prazos de vencimento de exames periódicos, retorno ao trabalho, mudança de riscos e emissão de ASOs;',
						'Suporte na organização das informações para o evento S-2220 do eSocial e mobilização de colaboradores em contratos industriais e obras.',
					],
				},
			],
		},
		{
			heading: 'Diferença entre a gestão do programa e os exames avulsos',
			paragraphs: [
				'Emitir Atestados de Saúde Ocupacional (ASOs) de forma avulsa não substitui a existência do PCMSO vigente e do relatório analítico exigido pela NR-07. Em fiscalizações trabalhistas ou auditorias de clientes, é o programa estruturado que comprova o controle médico das exposições.',
				{
					segments: [
						'Confira também os detalhes em nossa página de ',
						{ text: 'PCMSO e ASOs', href: '/servicos/pcmso-e-asos/' },
						' e saiba como solicitar um ',
						{ text: 'Orçamento de PCMSO', href: '/orcamento-pcmso/' },
						'.',
					],
				},
			],
		},
		{
			heading: 'Peça uma proposta para sua empresa',
			paragraphs: [
				'Envie o segmento da empresa, a localização e o número de colaboradores para avaliarmos o escopo ideal de atendimento.',
				{
					segments: [
						'Ligue para ',
						{ bold: true, text: '31 98473-4644' },
						' ou ',
						{ text: 'entre em contato com a AJN', href: '/contato/' },
						'.',
					],
				},
			],
		},
	],
} as const satisfies MarketingContent;
