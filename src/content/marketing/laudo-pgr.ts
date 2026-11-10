import type { MarketingContent } from '../types';

export const laudoPgr = {
	slug: 'laudo-pgr',
	path: '/laudo-pgr',
	title: 'PGR é Laudo ou Programa? Entenda o Documento da NR-01 | AJN',
	description: 'Entenda por que muitas empresas buscam por Laudo PGR, o que a NR-01 realmente exige (Inventário de Riscos e Plano de Ação) e quando contratar laudos complementares.',
	heading: 'PGR (NR-01): Diferença entre o Programa e os Laudos Técnicos',
	images: [
		{ src: '/images/content/marketing/empresa-que-faz-pgr/empresa-que-faz-pgr-01.webp', alt: 'Análise técnica para elaboração do PGR conforme NR-01' },
		{ src: '/images/content/marketing/empresa-que-faz-pgr/empresa-que-faz-pgr-02.webp', alt: 'Levantamento de riscos ocupacionais em campo' },
		{ src: '/images/content/marketing/empresa-que-elabora-pgr/empresa-que-elabora-pgr-01.webp', alt: 'Inventário de riscos e plano de ação do PGR' },
	],
	sections: [
		{
			heading: 'Por que o termo laudo PGR é tão buscado pelas empresas',
			paragraphs: [
				'É muito comum que gestores, contadores e setores de compras procurem pela expressão laudo PGR quando precisam regularizar a documentação de Segurança e Saúde no Trabalho. Tecnicamente, porém, o PGR (Programa de Gerenciamento de Riscos) não é um laudo estático, e sim um programa contínuo regulamentado pela Norma Regulamentadora nº 01 (NR-01).',
				'Enquanto laudos como o LTCAT (previdenciário) e os laudos de insalubridade (NR-15) ou periculosidade (NR-16) emitem um parecer conclusivo sobre enquadramento legal, o PGR estrutura o gerenciamento de riscos ocupacionais da empresa no dia a dia.',
			],
		},
		{
			heading: 'Quais documentos compõem obrigatoriamente o PGR',
			paragraphs: [
				'De acordo com o item 1.5.7.1 da NR-01, o PGR deve conter, no mínimo, dois documentos técnicos elaborados sob responsabilidade da organização:',
			],
			lists: [
				{
					items: [
						'Inventário de Riscos Ocupacionais: consolida a identificação de perigos e a avaliação dos riscos físicos, químicos, biológicos, ergonômicos e de acidentes por setor, função ou grupo homogêneo de exposição;',
						'Plano de Ação: estabelece as medidas de prevenção a serem introduzidas, aprimoradas ou mantidas, com cronograma, responsáveis e formas de acompanhamento da aferição de resultados.',
					],
				},
			],
		},
		{
			heading: 'Quando o PGR precisa de medições e laudos complementares',
			paragraphs: [
				'Se durante o reconhecimento preliminar de riscos forem identificadas exposições a ruído contínuo, calor, vibração ou agentes químicos acima do nível de ação, a engenharia de segurança realiza medições quantitativas fundamentadas nas NHOs da Fundacentro e na NR-09.',
				{
					segments: [
						'Para contratar a estruturação completa do programa, acesse nossa página de ',
						{ text: 'Elaboração de PGR', href: '/elaboracao-pgr' },
						' ou consulte a página de ',
						{ text: 'Emissão de LTCAT', href: '/emissao-ltcat' },
						' caso sua demanda seja previdenciária.',
					],
				},
			],
		},
		{
			heading: 'Solicite atendimento técnico à AJN',
			paragraphs: [
				'A AJN Consultoria e Engenharia atende empresas em Belo Horizonte, Região Metropolitana e interior de Minas Gerais no levantamento de campo e na elaboração do PGR.',
				{
					segments: [
						'Ligue para ',
						{ bold: true, text: '31 98473-4644' },
						' ou ',
						{ text: 'solicite uma proposta técnica', href: '/contato' },
						'.',
					],
				},
			],
		},
	],
} as const satisfies MarketingContent;
