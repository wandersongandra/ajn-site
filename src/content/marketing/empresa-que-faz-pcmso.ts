import type { MarketingContent } from '../types';

export const empresaQueFazPcmso = {
	slug: 'empresa-que-faz-pcmso',
	path: '/empresa-que-faz-pcmso',
	title: 'Empresa que Faz PCMSO: Como Contratar com Segurança | AJN',
	description: 'Precisa contratar uma empresa que faz PCMSO em BH e MG? Saiba quais documentos reunir, como funciona a integração com o PGR e o que conferir na proposta.',
	heading: 'Empresa que Faz PCMSO: Critérios para Contratação Técnica',
	images: [
		{ src: '/images/content/marketing/pcmso-preco/pcmso-preco-01.webp', alt: 'Contratação de empresa que faz PCMSO' },
		{ src: '/images/content/marketing/empresa-que-faz-pcmso/empresa-que-faz-pcmso-02.webp', alt: 'Avaliação de riscos ocupacionais e grade de exames do PCMSO' },
		{ src: '/images/content/marketing/seguranca-do-trabalho-pcmso/seguranca-do-trabalho-pcmso-03.webp', alt: 'Documentação de saúde ocupacional conforme NR-07' },
	],
	sections: [
		{
			heading: 'Quando sua organização precisa contratar o PCMSO',
			paragraphs: [
				'Empresas que admitem trabalhadores regidos pela CLT precisam manter o controle médico de saúde ocupacional conforme os critérios da Norma Regulamentadora nº 07 (NR-07), observadas as regras específicas de enquadramento para MEI, ME e EPP previstas na NR-01.',
				'Além da exigência legal trabalhista e do envio do evento S-2220 ao eSocial, grandes contratantes da indústria, mineração e construção civil exigem a apresentação do PCMSO vigente e dos ASOs compatíveis antes de liberar o acesso de prestadores de serviço às suas unidades.',
			],
		},
		{
			heading: 'Documentos e informações para iniciar o PCMSO',
			paragraphs: [
				'Para que a AJN Consultoria e Engenharia estruture o programa sem atrasos, recomendamos reunir as seguintes informações iniciais:',
			],
			lists: [
				{
					items: [
						'Cartão CNPJ, endereço dos estabelecimentos e descrição das atividades operacionais;',
						'Relação atualizada de cargos/funções, setores e número de empregados em cada posto;',
						'Inventário de riscos do PGR vigente (caso a empresa ainda não possua o PGR, elaboramos os dois programas de forma conjunta);',
						'Histórico do PCMSO anterior ou exigências específicas do contrato em que a equipe será mobilizada.',
					],
				},
			],
		},
		{
			heading: 'O que verificar na proposta técnica',
			paragraphs: [
				'Antes de fechar contrato, confirme se o orçamento discrimina claramente o valor de elaboração do documento-base do PCMSO, a indicação de médico responsável, o fluxo para realização de exames clínicos e complementares e as regras para inclusão de novos cargos ao longo da vigência.',
				{
					segments: [
						'Veja como funciona a composição de custos em nossa página sobre ',
						{ text: 'Preço de PCMSO', href: '/preco-pcmso/' },
						' e conheça o serviço de ',
						{ text: 'PCMSO e ASOs', href: '/servicos/pcmso-e-asos/' },
						'.',
					],
				},
			],
		},
		{
			heading: 'Solicite atendimento à AJN Consultoria e Engenharia',
			paragraphs: [
				'Atendemos empresas em Belo Horizonte, Região Metropolitana e interior de Minas Gerais com integração entre engenharia de segurança e saúde ocupacional.',
				{
					segments: [
						'Ligue para ',
						{ bold: true, text: '31 98473-4644' },
						' ou ',
						{ text: 'envie sua solicitação de orçamento', href: '/contato/' },
						'.',
					],
				},
			],
		},
	],
} as const satisfies MarketingContent;
