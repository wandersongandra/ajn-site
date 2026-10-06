import type { MarketingContent } from '../types';

export const projetosEngenhariaEletrica = {
	slug: 'projetos-engenharia-eletrica',
	path: '/projetos-engenharia-eletrica',
	title: 'Projetos de engenharia elétrica - AJN Consultoria e Engenharia',
	description: 'Projetos de engenharia elétrica desenvolvidos pela ajn consultoria e engenharia são conduzidos por profissionais habilitados e experientes, que se...',
	heading: 'Projetos de engenharia elétrica',
	images: [
		{ src: '/images/content/marketing/projetos-engenharia-eletrica/projetos-engenharia-eletrica-01.webp', alt: 'Projetos de engenharia elétrica' },
		{ src: '/images/content/marketing/projetos-engenharia-eletrica/projetos-engenharia-eletrica-02.webp', alt: 'Projetos de engenharia elétrica' },
		{ src: '/images/content/marketing/projetos-engenharia-eletrica/projetos-engenharia-eletrica-03.webp', alt: 'Projetos de engenharia elétrica' },
	],
	sections: [
		{
			heading: 'AJN Consultoria e Engenharia: Especialista em projetos de engenharia elétrica',
			paragraphs: [
				'A AJN Consultoria e Engenharia se destaca no mercado como uma empresa especializada em projetos de engenharia elétrica e serviços de consultoria e engenharia, com foco em Qualidade, Saúde, Segurança e Meio Ambiente (QSSMA).',
				'Com uma ampla gama de serviços técnicos especializados, a empresa se dedica a oferecer soluções personalizadas e inovadoras para seus clientes, visando sempre a segurança, eficiência e conformidade técnica em todas as suas operações.',
			],
		},
		{
			heading: 'Serviços Oferecidos',
			paragraphs: [
				'Entre os serviços oferecidos pela AJN Consultoria e Engenharia, destacam-se a gestão e emissão de laudos e projetos de combate a incêndio (AVCB/CLCB) em conformidade com as normas do Corpo de Bombeiros.',
				'Além disso, a empresa é especializada na elaboração e implementação de planos de manutenção, operação e controle (PMOC), bem como na instalação e manutenção de sistemas de refrigeração e climatização.',
				'A AJN também realiza a gestão e emissão de laudos e responsabilidade técnica para manutenção e instalação de equipamentos de movimento vertical, como elevadores, escadas e esteiras rolantes.',
			],
			subsections: [{
				heading: 'Compromisso com a Qualidade e a Segurança',
				paragraphs: [
					'A atuação da AJN Consultoria e Engenharia se pauta pela busca da conformidade técnica e regulatória em todas as suas operações, assegurando a segurança, eficiência e conformidade com as normas vigentes.',
					'A empresa conta com profissionais altamente qualificados e comprometidos com a excelência na prestação de serviços, sempre buscando superar as expectativas de seus clientes e parceiros.',
				],
			}],
		},
		{
			heading: 'Missão e Valores',
			paragraphs: [
				'A missão da AJN Consultoria e Engenharia é fornecer serviços em projetos de engenharia elétrica, QSSMA e gestão de equipamentos, contribuindo para a segurança, eficiência e conformidade das operações de seus clientes.',
				'A empresa baseia seus valores na comunicação transparente, no cumprimento rigoroso de prazos e na entrega de soluções eficazes e sustentáveis, adaptadas às necessidades específicas de cada projeto ou contrato.',
			],
		},
		{
			heading: 'projetos de engenharia elétrica: Excelência e Inovação',
			paragraphs: [
				'Os projetos de engenharia elétrica desenvolvidos pela AJN Consultoria e Engenharia são conduzidos por profissionais habilitados e experientes, que se dedicam a planejar, dimensionar e documentar sistemas elétricos de forma segura e eficiente.',
				'Com expertise em diferentes tipos de edificações e instalações, a empresa assegura desempenho, segurança e conformidade técnica em todos os seus projetos.',
				'Se você busca por soluções em projetos de engenharia elétrica que atendam às mais altas exigências de qualidade e segurança, entre em contato com a AJN Consultoria e Engenharia.',
				'Nossa equipe está preparada para oferecer as melhores soluções para o seu negócio, com profissionalismo, comprometimento e inovação.',
				'Descubra como podemos ajudar a transformar os seus projetos em realidade. Entre em contato conosco e solicite um orçamento sem compromisso!',
			],
		},
		{
			heading: 'Para saber mais sobre Projetos de engenharia elétrica',
			paragraphs: [{ segments: ['Ligue para ', { bold: true, text: '31 98473-4644' }, ' ou ', { text: 'clique aqui', href: '/contato' }, ' e entre em contato por email.'] }],
		},
	],
} as const satisfies MarketingContent;
