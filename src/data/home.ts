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
			{ label: 'Avaliações e Medições Ambientais', href: '/medicoes-ambientais-ocupacionais' },
			{ label: 'Perícias em Periculosidade e Insalubridade', href: '/servicos/pericias-em-periculosidade-e-insalubridade' },
			{ label: 'Projetos de Combate a Incêndio e Pânico - PPCIP', href: '/servicos/projetos-de-combate-a-incendio-e-panico-ppcip' },
			{ label: 'Projetos Elétricos Residenciais, Comerciais e Prediais', href: '/projetos-eletricos-prediais' },
			{ label: 'Projetos de SPDA', href: '/projetos-spda' },
			{ label: 'Projetos de Cabeamento Estruturado', href: '/projetos-cabeamento-estruturado' },
			{ label: 'Regularização de imóveis junto ao corpo de bombeiros', href: '/servicos/regularizacao-de-imoveis-junto-ao-corpo-de-bombeiros' },
			{ label: 'Treinamento de NRs', href: '/servicos/treinamento-de-nrs' },
		],
	},
	{ label: 'Blog', href: '/blog' },
	{ label: 'Contato', href: '/contato' },
];

export const hero = {
	image: '/images/hero/banner.webp',
	eyebrow: 'AJN Consultoria e Engenharia',
	title: 'Consultoria em segurança do trabalho, laudos e projetos de engenharia.',
	description: 'PGR, PCMSO, ASOs, eSocial, inspeções e projetos técnicos para empresas. Conte o que precisa para avaliarmos o serviço e o escopo.',
	areas: ['Segurança do Trabalho', 'Engenharia', 'Saúde Ocupacional', 'Treinamentos'],
} as const;

// Identificação conferida pelas marcas fornecidas pela AJN. Hemarcon mantém o arquivo existente.
export const clients = [
	{ src: '/images/clients/cliente-01-hd.webp', alt: 'BRAVO Consultoria, Treinamento e Prevenção' },
	{ src: '/images/clients/cliente-02-hd.webp', alt: 'Construtora Vereda' },
	{ src: '/images/clients/cliente-03-hd.webp', alt: 'Doutor Agora' },
	{ src: '/images/clients/cliente-04-hd.webp', alt: 'GreenYellow' },
	{ src: '/images/clients/cliente-05.png', alt: 'Hemarcon' },
	{ src: '/images/clients/cliente-06-hd.webp', alt: 'Reciclart' },
	{ src: '/images/clients/cliente-07-hd.webp', alt: 'Santa Maria Ecologic' },
	{ src: '/images/clients/cliente-08-hd.webp', alt: 'Supernova Participações' },
	{ src: '/images/clients/cliente-09-hd.webp', alt: 'Techsystem Elevadores' },
	{ src: '/images/clients/cliente-10-hd.webp', alt: 'Uptec Construção e Tecnologia' },
] as const;
export const services = [
	{ title: 'Assessoria e consultoria em saúde ocupacional', href: '/servicos/assessoria-e-consultoria-em-saude-ocupacional', description: 'Apoio à identificação de perigos, avaliação de riscos e definição de medidas de prevenção no ambiente de trabalho.', image: '/images/services/assessoria-e-consultoria-em-seguranca-do-trabalho.png' },
	{ title: 'Gestão de E-Social', href: '/servicos/gestao-do-e-social', description: 'Orientação e organização das informações de Saúde e Segurança do Trabalho enviadas ao eSocial.', image: '/images/services/gestao-de-esocial.png' },
	{ title: 'Gestão de Meio Ambiente', href: '/servicos/gestao-ambiental', description: 'Orientação sobre segregação, armazenamento e destinação de resíduos conforme a operação.', image: '/images/services/gestao-de-meio-ambiente.png' },
	{ title: 'Gestão de Qualidade', href: '/servicos/gestao-da-qualidade', description: 'Organização dos critérios e registros de qualidade aplicáveis aos serviços e à execução de obras.', image: '/images/services/gestao-de-qualidade.png' },
	{ title: 'Gestão de PCMSO e ASOs', href: '/servicos/pcmso-e-asos', description: 'Organização do acompanhamento de saúde ocupacional e dos ASOs, conforme os riscos das atividades.', image: '/images/services/gestao-de-PCMSO-e-ASOs.png' },
	{ title: 'Perícia em Insalubridade e Periculosidade', href: '/servicos/pericias-em-periculosidade-e-insalubridade', description: 'Avaliações técnicas de condições de exposição para subsidiar perícias e documentos trabalhistas.', image: '/images/services/pericia-em-insalubridade-e-periculosidade.png' },
	{ title: 'Projetos de Combate a Incêndio', href: '/servicos/projetos-de-combate-a-incendio-e-panico-ppcip', description: 'Projetos e documentação de prevenção e combate a incêndio, conforme as exigências aplicáveis a cada edificação.', image: '/images/services/projetos-de-combate-a-incendio.png' },
	{ title: 'Regularização de Imóveis - CBM', href: '/servicos/regularizacao-de-imoveis-junto-ao-corpo-de-bombeiros', description: 'Elaboração de projetos conforme normativas para atender às necessidades específicas de segurança contra incêndios de edificações comerciais, residenciais e industriais, de pequeno, médio e grande porte.', image: '/images/services/regularizacao-de-imoveis-cbm.png' },
	{ title: 'Treinamentos de NRs', href: '/servicos/treinamento-de-nrs', description: 'Capacitações relacionadas às Normas Regulamentadoras, conforme a atividade e os requisitos do treinamento.', image: '/images/services/treinamentos-nrs.png' },
] as const;

export const workflowSteps = [
	{
		number: '01',
		title: 'Levantamento inicial',
		text: 'Você apresenta a demanda. Verificamos as atividades e os documentos que precisam ser considerados.',
	},
	{
		number: '02',
		title: 'Proposta e escopo',
		text: 'Detalhamos o serviço, os prazos e as condições para sua análise antes do início.',
	},
	{
		number: '03',
		title: 'Execução técnica',
		text: 'Realizamos as inspeções, os levantamentos, os laudos ou os projetos previstos no escopo.',
	},
	{
		number: '04',
		title: 'Entrega e orientação',
		text: 'Entregamos o serviço contratado e explicamos os encaminhamentos previstos.',
	},
] as const;
