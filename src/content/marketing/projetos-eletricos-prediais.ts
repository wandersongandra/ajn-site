import type { MarketingContent } from '../types';

export const projetosEletricosPrediais = {
	slug: 'projetos-eletricos-prediais', path: '/projetos-eletricos-prediais',
	title: 'Projetos elétricos prediais - AJN Consultoria e Engenharia',
	description: 'Projetos elétricos prediais que unam qualidade, segurança e eficiência energética, a ajn é a parceira ideal.',
	heading: 'Projetos elétricos prediais',
	images: [
		{ src: '/images/content/marketing/projetos-eletricos-prediais/projetos-eletricos-prediais-01.webp', alt: 'Projetos elétricos prediais' },
		{ src: '/images/content/marketing/projetos-eletricos-prediais/projetos-eletricos-prediais-02.webp', alt: 'Projetos elétricos prediais' },
		{ src: '/images/content/marketing/projetos-eletricos-prediais/projetos-eletricos-prediais-03.webp', alt: 'Projetos elétricos prediais' },
	],
	sections: [
		{ heading: 'projetos elétricos prediais: Qualidade e Eficiência Energética', paragraphs: [
			'A atuação da AJN Consultoria e Engenharia abrange uma série de serviços especializados, com destaque para os projetos elétricos prediais.',
			'Esses projetos representam uma etapa fundamental no planejamento e na execução de instalações elétricas em edifícios comerciais, residenciais e industriais.',
			'A elaboração de projetos elétricos prediais visa promover o fornecimento e o uso da energia elétrica de forma segura, eficiente e em conformidade com as normas técnicas vigentes.',
			'Os projetos elétricos prediais desenvolvidos pela AJN Consultoria e Engenharia são pautados pela qualidade, eficiência energética e segurança.',
			'A equipe de profissionais altamente qualificados da empresa utiliza as melhores práticas do mercado e tecnologias inovadoras para promover a excelência na elaboração de projetos elétricos prediais que atendam às necessidades e expectativas dos clientes.',
		] },
		{ heading: 'Benefícios dos projetos elétricos prediais da AJN', paragraphs: ['Ao optar pelos serviços de projetos elétricos prediais da AJN Consultoria e Engenharia, os clientes contam com uma série de benefícios que impactam diretamente na qualidade, segurança e eficiência de suas instalações elétricas.', 'Dentre os principais benefícios, destacam-se:'], lists: [{ items: [
			'Economia de Energia: Os projetos visam a otimização do consumo de energia, contribuindo para a redução de custos operacionais;',
			'Segurança: A certeza de instalações elétricas seguras e em conformidade com as normas de segurança vigentes;',
			'Confiabilidade: Projetos que asseguram o fornecimento contínuo de energia, evitando falhas e interrupções;',
			'Sustentabilidade: Incentivo ao uso de tecnologias sustentáveis e práticas ecoeficientes na gestão energética.',
		] }], subsections: [{ heading: 'Conte com a Experiência da AJN em Projetos Elétricos', paragraphs: [
			'A AJN Consultoria e Engenharia possui vasta experiência na elaboração de projetos elétricos prediais para os mais diversos tipos de edificações.',
			'Contando com uma equipe multidisciplinar e comprometida com a excelência, a empresa se destaca pela qualidade de seus serviços e pela capacidade de oferecer soluções personalizadas de acordo com as necessidades de cada cliente.',
			'Se você busca por projetos elétricos prediais que unam qualidade, segurança e eficiência energética, a AJN é a parceira ideal. Entre em contato conosco e saiba mais sobre como podemos contribuir para o sucesso do seu empreendimento!',
		] }] },
		{ heading: 'Para saber mais sobre Projetos elétricos prediais', paragraphs: [{ segments: ['Ligue para ', { bold: true, text: '31 98473-4644' }, ' ou ', { text: 'clique aqui', href: '/contato' }, ' e entre em contato por email.'] }] },
	],
} as const satisfies MarketingContent;
