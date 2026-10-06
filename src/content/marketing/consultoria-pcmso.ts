import type { MarketingContent } from '../types';

export const consultoriaPcmso = {
	slug: 'consultoria-pcmso',
	path: '/consultoria-pcmso',
	title: 'Consultoria pcmso - AJN Consultoria e Engenharia',
	description: 'Consultoria pcmso, desde a elaboração até a implementação e acompanhamento do programa....saiba mais sobre.',
	heading: 'Consultoria pcmso',
	images: [
		{ src: '/images/content/marketing/consultoria-pcmso/consultoria-pcmso-01.webp', alt: 'Consultoria pcmso' },
		{ src: '/images/content/marketing/consultoria-pcmso/consultoria-pcmso-02.webp', alt: 'Consultoria pcmso' },
		{ src: '/images/content/marketing/consultoria-pcmso/consultoria-pcmso-03.webp', alt: 'Consultoria pcmso' },
	],
	sections: [
		{
			heading: 'Serviços de consultoria pcmso da AJN Consultoria e Engenharia',
			paragraphs: [
				'A AJN Consultoria e Engenharia, sob a liderança do engenheiro Antônio Jorlei, é uma empresa especializada em segurança do trabalho, atuando no mercado há mais de 08 anos com projetos diversos.',
				'Localizada em Belo Horizonte, MG, a empresa oferece soluções abrangentes em saúde e segurança para ambientes de trabalho, incluindo consultoria pcmso.',
			],
		},
		{
			heading: 'O que é consultoria pcmso?',
			paragraphs: [
				'O Programa de Controle Médico de Saúde Ocupacional (PCMSO) é essencial para monitorar e promover a saúde dos trabalhadores, prevenindo doenças relacionadas ao trabalho.',
				'Além disso, o PCMSO garante a conformidade legal e melhoria contínua nas condições de trabalho, promovendo o bem-estar e a produtividade dos colaboradores.',
			],
		},
		{
			heading: 'Serviços Oferecidos',
			paragraphs: [
				'A AJN Consultoria e Engenharia disponibiliza serviços completos de consultoria pcmso, desde a elaboração até a implementação e acompanhamento do programa.',
				'Dessa forma, as empresas podem garantir que estão atendendo às exigências legais e protegendo a saúde de seus funcionários de maneira eficaz.',
			],
		},
		{
			heading: 'Vantagens da consultoria pcmso',
			paragraphs: [
				'Contar com a consultoria pcmso da AJN Consultoria e Engenharia traz inúmeras vantagens para as empresas.',
				'Além de assegurar a conformidade legal, a empresa também se beneficia ao promover um ambiente de trabalho mais seguro e saudável, o que resulta em colaboradores mais satisfeitos e produtivos.',
			],
			subsections: [{
				heading: 'Por que Escolher a AJN Consultoria e Engenharia?',
				paragraphs: [
					'A AJN Consultoria e Engenharia se destaca no mercado de segurança do trabalho pela especialização de Antônio Jorlei e sua equipe especializada.',
					'Com ampla experiência em projetos de segurança contra incêndios, a empresa oferece soluções personalizadas e eficientes para atender às necessidades específicas de cada cliente na consultoria pcmso.',
					'Para obter mais informações sobre os serviços de consultoria em PCMSO da AJN Consultoria e Engenharia e como podemos ajudar a sua empresa a garantir um ambiente de trabalho mais seguro e saudável, entre em contato conosco.',
					'Estamos à disposição para oferecer soluções sob medida que atendam às suas necessidades e contribuam para a excelência em segurança do trabalho.',
				],
			}],
		},
		{
			heading: 'Para saber mais sobre Consultoria pcmso',
			paragraphs: [{ segments: ['Ligue para ', { bold: true, text: '31 98473-4644' }, ' ou ', { text: 'clique aqui', href: '/contato' }, ' e entre em contato por email.'] }],
		},
	],
} as const satisfies MarketingContent;
