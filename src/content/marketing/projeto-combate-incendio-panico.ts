import type { MarketingContent } from '../types';

export const projetoCombateIncendioPanico = {
	slug: 'projeto-combate-incendio-panico',
	path: '/projeto-combate-incendio-panico',
	title: 'Projeto de Combate a Incêndio e Pânico (PSCIP / PPCIP) | AJN',
	description: 'Desenvolvimento de projeto de combate a incêndio e pânico em BH e MG. Enquadramento nas ITs do CBMMG, aprovação técnica e suporte para emissão de AVCB.',
	heading: 'Projeto de Combate a Incêndio e Pânico',
	images: [
		{ src: '/images/content/marketing/projeto-prevencao-incendio-panico/projeto-prevencao-incendio-panico-02.webp', alt: 'Projeto de combate a incêndio e pânico para empresas e condomínios' },
		{ src: '/images/content/marketing/projeto-combate-incendio-preco/projeto-combate-incendio-preco-03.webp', alt: 'Especificação técnica de sistemas preventivos contra incêndio' },
		{ src: '/images/content/marketing/consultoria-seguranca-saude-no-trabalho/consultoria-seguranca-saude-no-trabalho-03.webp', alt: 'Engenharia de segurança contra incêndio e pânico em Minas Gerais' },
	],
	sections: [
		{
			heading: 'Por que o projeto contempla tanto o combate ao incêndio quanto o controle de pânico',
			paragraphs: [
				'Em uma emergência real, a fumaça, a queda de energia e a dificuldade de orientação costumam causar acidentes graves antes mesmo da propagação das chamas. Por isso, o Projeto de Combate a Incêndio e Pânico (conhecido como PSCIP ou PPCIP) abrange tanto os sistemas de extinção do fogo quanto os meios seguros de abandono da edificação.',
				'A AJN Consultoria e Engenharia elabora projetos completos em Belo Horizonte e Minas Gerais, compatibilizando a arquitetura existente com as exigências do Corpo de Bombeiros Militar de Minas Gerais (CBMMG).',
			],
		},
		{
			heading: 'Sistemas de proteção ativa e passiva que compõem o projeto',
			paragraphs: [
				'O dimensionamento técnico equilibra medidas de controle de pânico e equipamentos de combate direto:',
			],
			lists: [
				{
					items: [
						'Meios de abandono e controle de pânico: cálculo populacional, dimensionamento de corredores, escadas enclausuradas, barras antipânico, iluminação de emergência e sinalização fotoluminescente de rotas de fuga;',
						'Proteção passiva: isolamento de risco entre edificações, compartimentação horizontal e vertical e controle de materiais de acabamento e revestimento (CMAR);',
						'Detecção e alarme: posicionamento de detectores ópticos/termovelocimétricos, acionadores manuais, avisadores sonoros e visuais e central endereçável ou convencional;',
						'Combate ativo: rede de extintores portáteis e sobre rodas, sistema de hidrantes e mangotinhos, bombas de incêndio e chuveiros automáticos (sprinklers).',
					],
				},
			],
		},
		{
			heading: 'Adequação de edificações existentes e galpões industriais',
			paragraphs: [
				'Quando uma empresa aluga um galpão ou muda o uso de um imóvel comercial, a carga de incêndio e o layout interno mudam. Nossa engenharia avalia o projeto anterior (se houver) e propõe soluções que aproveitem a infraestrutura instalada sempre que tecnicamente viável.',
				{
					segments: [
						'Veja mais detalhes em nossa página de ',
						{ text: 'Projetos de Combate a Incêndio e Pânico (PPCIP)', href: '/servicos/projetos-de-combate-a-incendio-e-panico-ppcip/' },
						'.',
					],
				},
			],
		},
		{
			heading: 'Fale com a AJN para iniciar seu projeto',
			paragraphs: [
				'Envie as plantas arquitetônicas (ou a metragem da edificação) e a descrição da atividade para elaborarmos sua proposta.',
				{
					segments: [
						'Ligue para ',
						{ bold: true, text: '31 98473-4644' },
						' ou ',
						{ text: 'entre em contato com nossa engenharia', href: '/contato/' },
						'.',
					],
				},
			],
		},
	],
} as const satisfies MarketingContent;
