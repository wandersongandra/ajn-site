import type { MarketingContent } from '../types';

export const periciasInsalubridadePericulosidade = {
	slug: 'pericias-insalubridade-periculosidade',
	path: '/pericias-insalubridade-periculosidade',
	title: 'Perícias de Insalubridade e Periculosidade (NR-15 e NR-16) | AJN',
	description: 'Assistência técnica em perícias judiciais trabalhistas e emissão de laudos de insalubridade (NR-15) e periculosidade (NR-16) para empresas em BH e MG.',
	heading: 'Perícias de Insalubridade e Periculosidade e Assistência Técnica',
	images: [
		{ src: '/images/content/marketing/pericias-insalubridade-periculosidade/pericias-insalubridade-periculosidade-01.webp', alt: 'Avaliação pericial de insalubridade e periculosidade' },
		{ src: '/images/content/marketing/pericias-insalubridade-periculosidade/pericias-insalubridade-periculosidade-02.webp', alt: 'Medição instrumental para perícia trabalhista' },
		{ src: '/images/content/marketing/pericias-insalubridade-periculosidade/pericias-insalubridade-periculosidade-03.webp', alt: 'Elaboração de quesitos e parecer técnico de engenharia' },
	],
	sections: [
		{
			heading: 'Atuação técnica em perícias trabalhistas e laudos preventivos',
			paragraphs: [
				'A caracterização de insalubridade (NR-15) ou periculosidade (NR-16) depende de critérios estritamente técnicos: limites de tolerância, metodologia de medição, tempo de exposição em áreas de risco e eficácia comprovada dos Equipamentos de Proteção Coletiva e Individual.',
				'A AJN Consultoria e Engenharia atua em duas áreas complementares para empresas em Belo Horizonte e Minas Gerais: na emissão preventiva dos laudos de insalubridade e periculosidade para orientar a folha de pagamento e na assistência técnica patronal em reclamações trabalhistas.',
			],
		},
		{
			heading: 'Etapas da assistência técnica em perícias judiciais',
			paragraphs: [
				'Quando a empresa é intimada para uma perícia judicial de insalubridade ou periculosidade, o acompanhamento por assistente técnico habilitado (Art. 465 do CPC e Art. 826 da CLT) estrutura a defesa técnica em todas as fases do processo:',
			],
			lists: [
				{
					items: [
						'Análise da petição inicial, da contestação e do histórico documental do paradigma/reclamante (PGR, LTCAT, fichas de EPI com CA, ordens de serviço e treinamentos);',
						'Formulação de quesitos técnicos estratégicos e objetivos para resposta do perito oficial do juízo;',
						'Acompanhamento presencial da diligência pericial, conferindo a metodologia de medição aplicada e as informações prestadas no local;',
						'Elaboração de Parecer Técnico Concordante ou Discordante dentro do prazo processual e formulação de quesitos suplementares para impugnação de conclusões tecnicamente equivocadas.',
					],
				},
			],
		},
		{
			heading: 'Laudos internos de NR-15 e NR-16 para segurança jurídica',
			paragraphs: [
				'Além da atuação contenciosa, elaboramos laudos técnicos de insalubridade e periculosidade por função e setor para que o RH e o departamento jurídico saibam com exatidão quais atividades ensejam o pagamento de adicionais e quais medidas de engenharia neutralizam o agente.',
				{
					segments: [
						'Conheça também a página do serviço de ',
						{ text: 'Perícias em Periculosidade e Insalubridade', href: '/servicos/pericias-em-periculosidade-e-insalubridade' },
						' e nossa página sobre ',
						{ text: 'Laudo LTCAT e Insalubridade', href: '/laudo-ltcat-insalubridade' },
						'.',
					],
				},
			],
		},
		{
			heading: 'Acione a AJN para perícias ou laudos técnicos',
			paragraphs: [
				'Informe a comarca da diligência, a data agendada para a perícia ou os cargos que precisam de avaliação técnica para atendimento imediato.',
				{
					segments: [
						'Ligue para ',
						{ bold: true, text: '31 98473-4644' },
						' ou ',
						{ text: 'fale com nossa engenharia', href: '/contato' },
						'.',
					],
				},
			],
		},
	],
} as const satisfies MarketingContent;
