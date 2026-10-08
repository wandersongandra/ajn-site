export interface NavigationItem {
	label: string;
	href: string;
	children?: NavigationItem[];
}

export const site = {
	name: 'AJN Consultoria e Engenharia',
	address: 'Rua Egeu, 34 - Minaslândia, Belo Horizonte - MG',
	fullAddress: 'Rua Egeu, 34 - Minaslândia, Belo Horizonte - MG - CEP: 31.812-120',
	phone: '(31) 98473-4644',
	phoneHref: 'https://web.whatsapp.com/send?phone=5531984734644&text=Ol%C3%A1%21%20Gostaria%20de%20mais%20informa%C3%A7%C3%B5es%20sobre%20as%20ofertas%20da%20AJN%20Consultoria%20e%20Engenharia',
	email: 'faleconosco@ajnengenharia.com.br',
	trainingUrl: 'https://ajntreinamentos.formasegnr.com',
	instagram: 'https://www.instagram.com/ajnengenharia/',
	linkedin: 'https://www.linkedin.com/company/ajn-consultoria-e-engenharia/',
} as const;

export const navigation: NavigationItem[] = [
	{ label: 'Home', href: '/' },
	{ label: 'Sobre Nós', href: '/sobre-nos' },
	{
		label: 'Serviços',
		href: '/servicos',
		children: [
			{ label: 'Assessoria e consultoria em saúde ocupacional', href: '/servicos/assessoria-e-consultoria-em-saude-ocupacional' },
			{ label: 'Gestão Ambiental', href: '/servicos/gestao-ambiental' },
			{ label: 'Gestão da Qualidade', href: '/servicos/gestao-da-qualidade' },
			{ label: 'Gestão do E-Social', href: '/servicos/gestao-do-e-social' },
			{ label: 'PCMSO e ASOs', href: '/servicos/pcmso-e-asos' },
			{ label: 'Perícias em Periculosidade e Insalubridade', href: '/servicos/pericias-em-periculosidade-e-insalubridade' },
			{ label: 'Projetos de Combate a Incêndio e Pânico - PPCIP', href: '/servicos/projetos-de-combate-a-incendio-e-panico-ppcip' },
			{ label: 'Projetos Elétricos Residenciais, Comerciais e Prediais', href: '/projetos-eletricos-prediais' },
			{ label: 'Regularização de imóveis junto ao corpo de bombeiros', href: '/servicos/regularizacao-de-imoveis-junto-ao-corpo-de-bombeiros' },
			{ label: 'Treinamento de NRs', href: '/servicos/treinamento-de-nrs' },
		],
	},
	{ label: 'Blog', href: '/blog' },
	{ label: 'Contato', href: '/contato' },
	{ label: 'Informações', href: '/informacoes' },
];

export const hero = {
	image: '/images/hero/banner.webp',
	eyebrow: 'AJN Consultoria e Engenharia',
	title: 'Segurança do trabalho e engenharia para operações que não podem parar.',
	description: 'Consultoria técnica, gestão de riscos, engenharia e saúde ocupacional para empresas que precisam trabalhar com segurança, conformidade e controle.',
	areas: ['Segurança do Trabalho', 'Engenharia', 'Saúde Ocupacional', 'Treinamentos'],
} as const;

export const about = {
	title: 'AJN Consultoria e Engenharia',
	areas: ['Segurança do Trabalho', 'Engenharia', 'Saúde Ocupacional', 'Treinamentos'],
	paragraphs: [
		'A AJN Consultoria e Engenharia é uma empresa especializada em serviços de qualidade, saúde, segurança e meio ambiente (QSSMA). Nosso objetivo é oferecer soluções completas, como treinamentos, gestão de contratos, fornecimento de equipes qualificadas, acompanhamento técnico, além de mobilização de pessoas, máquinas e equipamentos. Também realizamos perícias relacionadas à insalubridade e periculosidade, sempre com excelência e compromisso.',
		'Destacamo-nos na gestão de equipe e contratos de Segurança do Trabalho.',
		'Treinamentos on line na nossa plataforma de cursos e presencial.',
		'Emissão de laudos técnicos, principalmente de máquinas e equipamentos, para atendimento à NR-12.',
		'Projetos de combate a incêndio (PPCI), trabalhando em conformidade com o Corpo de Bombeiros para garantir a segurança e a proteção em seus ambientes, além da emissão do AVCB/CLCB.',
	],
	image: '/images/about/fachada.webp',
	secondaryImage: '/images/about/persianas-automaticas.webp',
} as const;

export const clients = Array.from({ length: 10 }, (_, index) => ({
	src: `/images/clients/cliente-${String(index + 1).padStart(2, '0')}.png`,
	alt: 'Cliente AJN Consultoria e Engenharia',
}));

export const missionVisionValues = [
	{
		title: 'NOSSA MISSÃO',
		text: 'Fornecer serviços de alta qualidade em QSSMA e gestão de equipamentos, contribuindo para a segurança, eficiência e conformidade de nossos clientes.',
	},
	{
		title: 'NOSSA VISÃO',
		text: 'Ser reconhecida nacionalmente, como uma empresa líder em consultoria em engenharia, destinada a projetos voltado a área de Qualidade, Saúde, Segurança, Meio Ambiente e combate a incêndio, oferecendo soluções inovadoras e sustentáveis para clientes em busca de excelência nesses serviços.',
	},
	{
		title: 'NOSSOS VALORES',
		text: 'Mantemos uma comunicação aberta e transparente, prazos rigorosamente cumpridos e soluções customizadas para atender às necessidades específicas de cada cliente. Oferecemos soluções eficazes, inovadoras e sustentáveis para o negócio.',
	},
] as const;

export const services = [
	{ title: 'Assessoria e Consultoria em Segurança do Trabalho', href: '/servicos/assessoria-e-consultoria-em-saude-ocupacional', description: 'Oferecemos suporte técnico e estratégico para identificar, avaliar e controlar riscos ocupacionais...', image: '/images/services/assessoria-e-consultoria-em-seguranca-do-trabalho.png' },
	{ title: 'Gestão de E-Social', href: '/servicos/gestao-do-e-social', description: 'A gestão do eSocial é essencial para garantir que as empresas cumpram todas as obrigações trabalhistas, previdenciárias e fiscais de forma integrada e eficiente.', image: '/images/services/gestao-de-esocial.png' },
	{ title: 'Gestão de Meio Ambiente', href: '/servicos/gestao-ambiental', description: 'Segregação, armazenamento e destinação correta dos resíduos', image: '/images/services/gestao-de-meio-ambiente.png' },
	{ title: 'Gestão de Qualidade', href: '/servicos/gestao-da-qualidade', description: 'Este documento detalha os critérios de qualidade que devem ser seguidos durante a execução da obra.', image: '/images/services/gestao-de-qualidade.png' },
	{ title: 'Gestão de PCMSO e ASOs', href: '/servicos/pcmso-e-asos', description: 'O PCMSO deve ser constantemente revisado e atualizado com base nos riscos identificados no Programa de Gerenciamento de Riscos (PGR).', image: '/images/services/gestao-de-PCMSO-e-ASOs.png' },
	{ title: 'Perícia em Insalubridade e Periculosidade', href: '/servicos/pericias-em-periculosidade-e-insalubridade', description: 'Avalia se o ambiente de trabalho expõe os trabalhadores a agentes nocivos à saúde, como produtos químicos, ruídos, vibrações, radiações, entre outros.', image: '/images/services/pericia-em-insalubridade-e-periculosidade.png' },
	{ title: 'Projetos de Combate a Incêndio', href: '/servicos/projetos-de-combate-a-incendio-e-panico-ppcip', description: 'Elaboração de projetos conforme normativas para atender às necessidades específicas de segurança contra incêndios de edificações comerciais, residenciais e industriais, de pequeno, médio e grande porte.', image: '/images/services/projetos-de-combate-a-incendio.png' },
	{ title: 'Regularização de Imóveis - CBM', href: '/servicos/regularizacao-de-imoveis-junto-ao-corpo-de-bombeiros', description: 'Elaboração de projetos conforme normativas para atender às necessidades específicas de segurança contra incêndios de edificações comerciais, residenciais e industriais, de pequeno, médio e grande porte.', image: '/images/services/regularizacao-de-imoveis-cbm.png' },
	{ title: 'Treinamentos NRS', href: '/servicos/treinamento-de-nrs', description: 'Saiba mais sobre os treinamentos', image: '/images/services/treinamentos-nrs.png' },
] as const;

export const portfolio = [
	{ src: '/images/featured/emissao-laudos-01.webp', alt: 'Portfólio AJN Consultoria e Engenharia 2' },
	...([3, 4, 5, 6, 7, 8].map((number) => ({
		src: `/images/portfolio/portfolio-${String(number).padStart(2, '0')}.webp`,
		alt: `Portfólio AJN Consultoria e Engenharia ${number}`,
	}))),
];

export const workflowSteps = [
	{
		number: '01',
		icon: 'diagnostic',
		title: 'Diagnóstico',
		text: 'Visitamos sua empresa, avaliamos os riscos e mapeamos as obrigações legais aplicáveis.',
	},
	{
		number: '02',
		icon: 'proposal',
		title: 'Proposta',
		text: 'Apresentamos um plano sob medida, com escopo, prazos e valores claros — sem surpresas.',
	},
	{
		number: '03',
		icon: 'execution',
		title: 'Execução',
		text: 'Implementamos programas, laudos, projetos e treinamentos com equipe técnica habilitada.',
	},
	{
		number: '04',
		icon: 'follow-up',
		title: 'Acompanhamento',
		text: 'Monitoramos prazos, atualizamos documentos e damos suporte contínuo à sua equipe.',
	},
] as const;

export const highlights = [
	{ title: 'Orçamento de projeto elétrico', href: '/orcamento-projeto-eletrico', image: '/images/featured/orcamento-projeto-eletrico-01.webp' },
	{ title: 'Combate a incêndio belo horizonte', href: '/combate-incendio-belo-horizonte', image: '/images/featured/combate-incendio-belo-horizonte-01.webp' },
	{ title: 'Empresas de manutenção de elevadores em bh', href: '/empresas-manutencao-elevadores-bh', image: '/images/featured/empresas-manutencao-elevadores-bh-01.webp' },
	{ title: 'Emissão de laudos', href: '/emissao-laudos', image: '/images/featured/emissao-laudos-01.webp' },
] as const;
