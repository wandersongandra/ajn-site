import type { MarketingContent } from '../types';

export const projetoInstalacaoEletricaResidencial = {
	slug: 'projeto-instalacao-eletrica-residencial',
	path: '/projeto-instalacao-eletrica-residencial',
	title: 'Projeto de instalação elétrica residencial - AJN Consultoria e Engenharia',
	description: 'Projeto de instalação elétrica residencial é um documento técnico fundamental para promover a segurança, eficiência e adequação de todo o sistema...',
	heading: 'Projeto de instalação elétrica residencial',
	images: [
		{ src: '/images/content/marketing/projeto-instalacao-eletrica-residencial/projeto-instalacao-eletrica-residencial-01.webp', alt: 'Projeto de instalação elétrica residencial' },
		{ src: '/images/content/marketing/projeto-instalacao-eletrica-residencial/projeto-instalacao-eletrica-residencial-02.webp', alt: 'Projeto de instalação elétrica residencial' },
		{ src: '/images/content/marketing/projeto-instalacao-eletrica-residencial/projeto-instalacao-eletrica-residencial-03.webp', alt: 'Projeto de instalação elétrica residencial' },
	],
	sections: [
		{
			heading: 'Conheça a Importância de um projeto de instalação elétrica residencial',
			paragraphs: [
				{ segments: ['Um ', { bold: true, text: 'projeto de instalação elétrica residencial' }, ' é um documento técnico fundamental para promover a segurança, eficiência e adequação de todo o sistema elétrico de uma residência.'] },
				'Ele define de forma detalhada como será distribuída e instalada a rede elétrica, contemplando desde a localização dos pontos de iluminação e tomadas até os circuitos, quadros de distribuição e dispositivos de proteção.',
				'Além disso, um projeto bem elaborado assegura o correto funcionamento de todos os equipamentos elétricos e o atendimento às normas técnicas vigentes, evitando riscos de curtos-circuitos, sobrecargas e acidentes elétricos.',
			],
		},
		{
			heading: 'Vantagens de Contar com um projeto de instalação elétrica residencial Personalizado',
			paragraphs: [{ segments: ['Ao investir em um ', { bold: true, text: 'projeto de instalação elétrica residencial' }, ' personalizado, o proprietário assegura uma série de benefícios, como:'] }],
			lists: [{ items: ['a otimização do uso da energia elétrica;', 'a redução de custos com manutenção e reparos;', 'a valorização do imóvel;', 'a segurança dos moradores;', 'a conformidade com as normas técnicas e de segurança.'] }],
		},
		{
			heading: 'Processo de Elaboração de um Projeto Elétrico Residencial',
			paragraphs: [
				{ segments: ['A elaboração de um ', { bold: true, text: 'projeto de instalação elétrica residencial' }, ' envolve etapas como:'] },
			],
			lists: [{ items: ['o levantamento das necessidades do imóvel;', 'o dimensionamento dos circuitos e cargas elétricas;', 'a definição dos tipos de condutores e dispositivos de proteção;', 'a distribuição dos pontos de iluminação e tomadas;', 'a escolha dos materiais e equipamentos adequados;', 'a elaboração de plantas e diagramas elétricos detalhados.'] }],
		},
		{
			heading: 'Contrate a AJN Consultoria e Engenharia para seu projeto de instalação elétrica residencial',
			paragraphs: [
				'A empresa AJN Consultoria e Engenharia oferece serviços especializados em consultoria e engenharia, com foco em Qualidade, Saúde, Segurança e Meio Ambiente.',
				'Com uma equipe de profissionais experientes e qualificados, a AJN está preparada para desenvolver projetos de instalação elétrica residencial sob medida para as necessidades de cada cliente.',
				'Além disso, a empresa assegura a conformidade com as normas técnicas e de segurança, bem como a utilização de materiais de qualidade e tecnologia de ponta.',
				{ segments: ['Entre em contato conosco e solicite um orçamento para o seu ', { bold: true, text: 'projeto de instalação elétrica residencial' }, '. Promovemos um serviço de excelência, com soluções personalizadas e eficientes para a sua residência.'] },
				'Invista na segurança e no conforto do seu lar com a AJN Consultoria e Engenharia!',
			],
		},
		{
			heading: 'Para saber mais sobre Projeto de instalação elétrica residencial',
			paragraphs: [{ segments: ['Ligue para ', { bold: true, text: '31 98473-4644' }, ' ou ', { text: 'clique aqui', href: '/contato' }, ' e entre em contato por email.'] }],
		},
	],
} as const satisfies MarketingContent;
