import type { MarketingContent } from '../types';

export const orcamentoPcmso = {
	slug: 'orcamento-pcmso',
	path: '/orcamento-pcmso',
	title: 'Orçamento de PCMSO em Belo Horizonte | AJN',
	description: 'Precisa de orçamento de PCMSO em Belo Horizonte? Saiba quais dados da empresa, trabalhadores e riscos ajudam a definir o escopo do programa.',
	heading: 'Orçamento de PCMSO para empresas em Belo Horizonte',
	images: [
		{ src: '/images/content/marketing/pcmso-preco/pcmso-preco-01.webp', alt: 'Imagem de apoio à gestão de saúde ocupacional' },
		{ src: '/images/content/marketing/pcmso-preco/pcmso-preco-03.webp', alt: 'Imagem de apoio à organização de documentos de PCMSO' },
		{ src: '/images/content/marketing/seguranca-do-trabalho-pcmso/seguranca-do-trabalho-pcmso-03.webp', alt: 'Imagem de apoio ao acompanhamento de exames ocupacionais' },
	],
	sections: [
		{
			heading: 'Como solicitar uma proposta de PCMSO',
			paragraphs: [
				'Para avaliar o atendimento, a AJN precisa entender o porte da empresa, suas atividades e os riscos ocupacionais identificados. Uma proposta para um escritório e outra para uma operação industrial podem envolver necessidades diferentes.',
				'O PCMSO, previsto na NR-7, considera os riscos ocupacionais e exige definição de responsabilidades médicas, exames e acompanhamento conforme o caso. O preço depende desse escopo; não existe um valor único adequado a todas as empresas.',
			],
		},
		{
			heading: 'Informações que ajudam a preparar o orçamento',
			paragraphs: [
				'Na solicitação, descreva a cidade de cada unidade, o segmento de atuação, o número aproximado de trabalhadores, as funções e os turnos. Informe também se há PGR, PCMSO anterior e exames ocupacionais em andamento.',
				'Com esses dados, é possível identificar dúvidas, delimitar o serviço solicitado e verificar a necessidade de levantamentos adicionais antes da proposta.',
			],
			lists: [{ items: [
				'Unidades, municípios e atividades exercidas;',
				'Quantidade de trabalhadores e funções;',
				'PGR ou inventário de riscos disponível, quando houver;',
				'Situação atual do PCMSO e dos ASOs;',
				'Prazo desejado e necessidades de acompanhamento.',
			] }],
		},
		{
			heading: 'Programa médico e gestão dos ASOs: escopos diferentes',
			paragraphs: [
				'A elaboração do programa e a definição clínica dos exames cabem ao profissional médico legalmente habilitado. A organização de agendas, vencimentos e documentos de ASO pode fazer parte de uma frente administrativa de saúde ocupacional, conforme o contrato.',
				{ segments: ['Para entender o funcionamento dessa gestão, consulte a página de ', { text: 'PCMSO e ASOs da AJN', href: '/servicos/pcmso-e-asos' }, '.'] },
			],
		},
		{
			heading: 'Receba uma avaliação de escopo da AJN',
			paragraphs: [
				'A AJN atende empresas de Belo Horizonte e região conforme a demanda e a viabilidade de atendimento. Envie as informações disponíveis; a equipe poderá orientar a próxima etapa e o que deve constar na proposta.',
				{ segments: ['Para iniciar, ', { text: 'solicite um orçamento pelo contato da AJN', href: '/contato' }, '.'] },
			],
		},
	],
} as const satisfies MarketingContent;
