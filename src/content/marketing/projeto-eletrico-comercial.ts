import type { MarketingContent } from '../types';

export const projetoEletricoComercial = {
	slug: 'projeto-eletrico-comercial',
	path: '/projeto-eletrico-comercial',
	title: 'Projeto elétrico comercial - AJN Consultoria e Engenharia',
	description: 'Projeto elétrico comercial personalizado, seguro e em conformidade com todas as normas, a ajn consultoria e engenharia é a escolha certa....',
	heading: 'Projeto elétrico comercial',
	images: [
		{ src: '/images/content/marketing/projeto-eletrico-comercial/projeto-eletrico-comercial-01.webp', alt: 'Projeto elétrico comercial' },
		{ src: '/images/content/marketing/projeto-eletrico-comercial/projeto-eletrico-comercial-02.webp', alt: 'Projeto elétrico comercial' },
		{ src: '/images/content/marketing/projeto-eletrico-comercial/projeto-eletrico-comercial-03.webp', alt: 'Projeto elétrico comercial' },
	],
	sections: [
		{
			heading: 'AJN Consultoria e Engenharia: Especialista em projeto elétrico comercial',
			paragraphs: [
				'A AJN Consultoria e Engenharia é uma empresa renomada no ramo de Serviços de consultoria e engenharia e projeto elétrico comercial, com um foco especial em Qualidade, Saúde, Segurança e Meio Ambiente (QSSMA).',
				'A empresa oferece uma ampla gama de serviços especializados, incluindo gestão de contratos, treinamentos, perícias técnicas e, especialmente, projetos elétricos comerciais.',
			],
		},
		{
			heading: 'Vantagens de um projeto elétrico comercial Personalizado',
			paragraphs: [
				'Um projeto elétrico comercial sob medida é essencial para estabelecimentos comerciais que possuem demandas específicas, tais como:',
				'A AJN Consultoria e Engenharia se destaca na elaboração de projetos que levam em consideração todas essas particularidades, assegurando uma instalação elétrica segura, eficiente e em conformidade com as normas vigentes.',
			],
			lists: [{ items: ['uma maior carga elétrica;', 'uma variedade de equipamentos;', 'uma alta circulação de pessoas.'] }],
			subsections: [{
				heading: 'Elaboração de Projetos de Combate a Incêndio e Pânico',
				paragraphs: [
					'Além do projeto elétrico comercial, a AJN oferece serviços de elaboração de projetos de combate a incêndio e pânico.',
					'A empresa se responsabiliza por toda a gestão e emissão de laudos necessários, assegurando a segurança dos ocupantes do estabelecimento e o cumprimento das normas estabelecidas pelo Corpo de Bombeiros.',
				],
			}],
		},
		{
			heading: 'Gestão de Conformidade e Treinamentos de Segurança',
			paragraphs: [
				'Para estabelecimentos comerciais que buscam estar em conformidade com todas as normas de segurança, a AJN Consultoria e Engenharia oferece serviços de gestão de conformidade, além de treinamentos especializados em segurança e saúde ocupacional.',
				'A empresa se compromete em fornecer soluções personalizadas e eficazes para cada cliente, adaptando-se às necessidades específicas de cada projeto.',
			],
		},
		{
			heading: 'Certeza de Segurança, Eficiência e Conformidade',
			paragraphs: [
				'A missão da AJN Consultoria e Engenharia é assegurar a segurança, eficiência e conformidade das operações de seus clientes, por meio de serviços especializados em QSSMA e gestão de equipamentos.',
				'Com uma equipe altamente qualificada e valores pautados na transparência, cumprimento de prazos e sustentabilidade, a empresa se destaca no mercado de consultoria e engenharia.',
			],
		},
		{
			heading: 'Entre em Contato Conosco para Transformar seu projeto elétrico comercial em Realidade',
			paragraphs: [
				'Se você busca um projeto elétrico comercial personalizado, seguro e em conformidade com todas as normas, a AJN Consultoria e Engenharia é a escolha certa.',
				'Entre em contato conosco e descubra como podemos ajudar o seu estabelecimento a alcançar a excelência em sua instalação elétrica.',
				'Transforme suas ideias em realidade com a expertise e profissionalismo da AJN Consultoria e Engenharia.',
			],
		},
		{
			heading: 'Para saber mais sobre Projeto elétrico comercial',
			paragraphs: [{ segments: ['Ligue para ', { bold: true, text: '31 98473-4644' }, ' ou ', { text: 'clique aqui', href: '/contato' }, ' e entre em contato por email.'] }],
		},
	],
} as const satisfies MarketingContent;
