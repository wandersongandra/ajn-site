import type { MarketingContent } from '../types';

export const instalacaoPredialEletrica = {
	slug: 'instalacao-predial-eletrica',
	path: '/instalacao-predial-eletrica',
	title: 'Instalação predial elétrica - AJN Consultoria e Engenharia',
	description: 'Instalação predial elétrica bem executada traz inúmeros benefícios, como a redução de riscos de acidentes, a otimização do consumo de energia, a...',
	heading: 'Instalação predial elétrica',
	images: [
		{ src: '/images/content/marketing/instalacao-predial-eletrica/instalacao-predial-eletrica-01.webp', alt: 'Instalação predial elétrica' },
		{ src: '/images/content/marketing/instalacao-predial-eletrica/instalacao-predial-eletrica-02.webp', alt: 'Instalação predial elétrica' },
		{ src: '/images/content/marketing/instalacao-predial-eletrica/instalacao-predial-eletrica-03.webp', alt: 'Instalação predial elétrica' },
	],
	sections: [
		{
			heading: 'instalação predial elétrica: Qualidade e Segurança na Distribuição de Energia',
			paragraphs: [
				{ segments: ['Quando se trata de instalações elétricas em edifícios, a segurança e eficiência são fundamentais. A ', { bold: true, text: 'instalação predial elétrica' }, ' é um sistema complexo e estruturado, que abrange desde a entrada da energia até os pontos de consumo, seguindo as normas da ABNT NBR 5410 para baixa tensão.'] },
				'Essa padronização assegura a proteção contra choques, curtos-circuitos e incêndios, assegurando um ambiente seguro e funcional para os ocupantes do prédio.',
			],
		},
		{
			heading: 'Vantagens de uma instalação predial elétrica Bem Projetada',
			paragraphs: [
				{ segments: ['Uma ', { bold: true, text: 'instalação predial elétrica' }, ' bem executada traz inúmeros benefícios, como a redução de riscos de acidentes, a otimização do consumo de energia, a valorização do imóvel, a facilidade de manutenção e a conformidade com as normas vigentes.'] },
				'Além disso, a qualidade da instalação influencia diretamente no desempenho dos equipamentos elétricos e eletrônicos utilizados no edifício, prolongando sua vida útil e evitando danos por sobrecargas ou falhas na distribuição de energia.',
			],
			subsections: [{
				heading: 'A importância da Manutenção Preventiva em Instalações Elétricas',
				paragraphs: [
					'Manter a instalação elétrica predial em perfeitas condições é essencial para promover a segurança e o bom funcionamento do sistema.',
					'A manutenção preventiva, realizada por profissionais qualificados, identifica possíveis falhas antes que se tornem problemas graves, evitando interrupções no fornecimento de energia e prevenindo acidentes.',
					'Além disso, a manutenção periódica contribui para a eficiência energética do edifício, reduzindo desperdícios e impactos ambientais.',
				],
			}] ,
		},
		{
			heading: 'Serviços Especializados em instalação predial elétrica pela AJN Consultoria e Engenharia',
			paragraphs: [
				{ segments: ['A AJN Consultoria e Engenharia oferece serviços personalizados de consultoria e engenharia em ', { bold: true, text: 'instalação predial elétrica' }, ', atendendo às necessidades específicas de cada cliente.'] },
				'Com uma equipe de profissionais capacitados e experientes, a empresa assegura projetos seguros, eficientes e em conformidade com as normas técnicas e regulatórias.',
			],
			lists: [{ items: ['Emissão de laudos e projetos de combate a incêndio (AVCB/CLCB);', 'Elaboração e implementação de planos de manutenção, operação e controle (PMOC);', 'Instalação e manutenção de sistemas de refrigeração e climatização;', 'Gestão e emissão de laudos para equipamentos de movimento vertical;', 'Elaboração de planos de saúde ocupacional.'] }],
		},
		{
			heading: 'Entre em Contato e Promova uma instalação predial elétrica de Qualidade',
			paragraphs: [
				{ segments: ['Se você busca uma ', { bold: true, text: 'instalação predial elétrica' }, ' segura, eficiente e em conformidade com as normas, entre em contato conosco.'] },
				'Nossos especialistas estão preparados para oferecer as melhores soluções em consultoria e engenharia, assegurando a qualidade e a segurança do seu projeto.',
				'Invista na excelência da sua instalação elétrica predial e promova um ambiente seguro e funcional para você e seus ocupantes.',
			],
		},
		{
			heading: 'Para saber mais sobre Instalação predial elétrica',
			paragraphs: [{ segments: ['Ligue para ', { bold: true, text: '31 98473-4644' }, ' ou ', { text: 'clique aqui', href: '/contato' }, ' e entre em contato por email.'] }],
		},
	],
} as const satisfies MarketingContent;
