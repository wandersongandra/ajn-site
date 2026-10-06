import type { MarketingContent } from '../types';

export const escadaRolante = {
	slug: 'escada-rolante',
	path: '/escada-rolante',
	title: 'Escada rolante - AJN Consultoria e Engenharia',
	description: 'Escada rolante contribui significativamente para a acessibilidade de espaços públicos e privados, atendendo às necessidades de mobilidade de pessoas com...',
	heading: 'Escada rolante',
	images: [
		{ src: '/images/content/marketing/escada-rolante/escada-rolante-01.webp', alt: 'Escada rolante' },
		{ src: '/images/content/marketing/escada-rolante/escada-rolante-02.webp', alt: 'Escada rolante' },
		{ src: '/images/content/marketing/escada-rolante/escada-rolante-03.webp', alt: 'Escada rolante' },
	],
	sections: [
		{
			heading: 'escada rolante: Comodidade e Eficiência em Grandes Espaços',
			paragraphs: [
				'A escada rolante é equipamento essencial em ambientes de alto fluxo, proporcionando a locomoção de pessoas entre diferentes andares de forma confortável, rápida e segura.',
				'Com degraus móveis que se movem continuamente, são amplamente utilizadas em shoppings, aeroportos, estações de metrô e outros locais de grande circulação.',
			],
		},
		{
			heading: 'Vantagens da escada rolante nas Edificações',
			paragraphs: [
				'Além de oferecer praticidade e agilidade no deslocamento, a escada rolante contribui significativamente para a acessibilidade de espaços públicos e privados, atendendo às necessidades de mobilidade de pessoas com diferentes idades e capacidades físicas.',
				'Sua instalação é um investimento que agrega valor ao ambiente, proporcionando uma experiência positiva aos usuários.',
			],
			subsections: [{
				heading: 'Manutenção Preventiva: Certeza de Funcionamento Adequado',
				paragraphs: [
					'Para assegurar o bom desempenho e a segurança da escada rolante, é fundamental contar com serviços especializados de consultoria e engenharia.',
					'A manutenção preventiva é essencial para identificar e corrigir possíveis falhas no funcionamento do equipamento, assegurando sua operação contínua e prolongando sua vida útil.',
				],
			}],
		},
		{
			heading: 'Segurança e Conformidade com Normas Vigentes',
			paragraphs: [
				'A segurança dos usuários é uma prioridade na operação de escada rolante, sendo fundamental o cumprimento das normas técnicas e regulatórias estabelecidas para esse tipo de equipamento.',
				'A AJN Consultoria e Engenharia oferece serviços especializados em gestão e emissão de laudos, assegurando a conformidade com as exigências legais e a segurança das instalações.',
			],
		},
		{
			heading: 'Consultoria Especializada em Escadas Rolantes',
			paragraphs: [
				'A equipe da AJN Consultoria e Engenharia possui expertise no planejamento, instalação, manutenção e atualização de escadas rolantes, oferecendo soluções personalizadas de acordo com as necessidades de cada cliente.',
				'Com foco em qualidade, segurança e eficiência, a empresa se destaca pela excelência de seus serviços e pelo compromisso em atender as expectativas dos clientes.',
				'Se você busca uma consultoria especializada em escada rolante para promover a segurança e o bom funcionamento do seu equipamento, entre em contato conosco.',
				'Nossa equipe está preparada para oferecer as melhores soluções em consultoria e engenharia, contribuindo para o sucesso e a excelência de seu empreendimento.',
			],
		},
		{
			heading: 'Para saber mais sobre Escada rolante',
			paragraphs: [{ segments: ['Ligue para ', { bold: true, text: '31 98473-4644' }, ' ou ', { text: 'clique aqui', href: '/contato' }, ' e entre em contato por email.'] }],
		},
	],
} as const satisfies MarketingContent;
