import type { MarketingContent } from '../types';

export const projetoProtecaoIncendioPanico = {
	slug: 'projeto-protecao-incendio-panico',
	path: '/projeto-protecao-incendio-panico',
	title: 'Projeto de Proteção Contra Incêndio e Pânico em BH e MG | AJN',
	description: 'Elaboração de projeto de proteção contra incêndio e pânico em Belo Horizonte e MG: compartimentação, controle de fumaça, hidrantes, alarmes e aprovação no CBMMG.',
	heading: 'Projeto de Proteção Contra Incêndio e Pânico',
	images: [
		{ src: '/images/content/marketing/consultoria-pcmso/consultoria-pcmso-02.webp', alt: 'Vistoria de engenharia para projeto de proteção contra incêndio e pânico' },
		{ src: '/images/content/marketing/orcamento-projeto-combate-incendio/orcamento-projeto-combate-incendio-02.webp', alt: 'Detalhamento técnico de sistemas de proteção contra incêndio' },
		{ src: '/images/content/marketing/projeto-deteccao-incendio/projeto-deteccao-incendio-02.webp', alt: 'Central e dispositivos de proteção contra incêndio e pânico' },
	],
	sections: [
		{
			heading: 'Arquitetura de proteção passiva e ativa em edificações',
			paragraphs: [
				'O projeto de proteção contra incêndio e pânico integra medidas construtivas (proteção passiva) e sistemas operacionais (proteção ativa) para conter a propagação do fogo e da fumaça entre setores de uma edificação, preservando a estabilidade estrutural e o tempo necessário para evacuação.',
				'A AJN Consultoria e Engenharia atende construtoras, escritórios de arquitetura, indústrias e condomínios em Belo Horizonte e Minas Gerais na compatibilização e aprovação de projetos junto ao CBMMG.',
			],
		},
		{
			heading: 'Soluções técnicas contempladas no projeto de proteção',
			paragraphs: [
				'Em edificações de médio e grande porte, o projeto de proteção contra incêndio e pânico abrange:',
			],
			lists: [
				{
					items: [
						'Estudo de compartimentação horizontal e vertical (IT 07 do CBMMG) para limitar áreas de risco e eventualmente otimizar a exigência de sistemas;',
						'Especificação de resistência ao fogo das estruturas (TRRF - IT 06) e controle de materiais de acabamento e revestimento (CMAR - IT 38);',
						'Dimensionamento de escadas pressurizadas ou enclausuradas à prova de fumaça e rotas de fuga acessíveis;',
						'Projeto executivo de redes de hidrantes, mangotinhos, chuveiros automáticos (sprinklers) e sistemas de detecção e alarme endereçáveis;',
						'Memoriais técnicos, ART e tramitação eletrônica no portal INFOSCIP.',
					],
				},
			],
		},
		{
			heading: 'Compatibilização com projetos arquitetônicos e complementares',
			paragraphs: [
				'Envolver a engenharia de incêndio desde a concepção arquitetônica evita que reservas técnicas de água, casas de bombas, shafts de pressurização ou larguras de escadas precisem ser refeitos durante a obra.',
				{
					segments: [
						'Conheça mais detalhes em nossa página de ',
						{ text: 'Projetos de Combate a Incêndio e Pânico (PPCIP)', href: '/servicos/projetos-de-combate-a-incendio-e-panico-ppcip/' },
						'.',
					],
				},
			],
		},
		{
			heading: 'Solicite uma proposta técnica à AJN',
			paragraphs: [
				'Envie os dados do empreendimento ou edificação existente para análise da nossa equipe de engenharia.',
				{
					segments: [
						'Ligue para ',
						{ bold: true, text: '31 98473-4644' },
						' ou ',
						{ text: 'solicite orçamento pelo site', href: '/contato/' },
						'.',
					],
				},
			],
		},
	],
} as const satisfies MarketingContent;
