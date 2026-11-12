import type { MarketingContent } from '../types';

export const empresaQueFazLtcat = {
	slug: 'empresa-que-faz-ltcat',
	path: '/empresa-que-faz-ltcat',
	title: 'Empresa que Faz LTCAT em BH e MG: Como Contratar | AJN',
	description: 'Procurando empresa que faz LTCAT em Belo Horizonte e MG? Conheça o escopo de vistoria, medições quantitativas, emissão de ART e base para o PPP e eSocial.',
	heading: 'Empresa que Faz LTCAT: Levantamento e Emissão com ART',
	images: [
		{ src: '/images/content/marketing/empresa-que-faz-ltcat/empresa-que-faz-ltcat-01.webp', alt: 'Vistoria técnica de empresa que faz LTCAT' },
		{ src: '/images/content/marketing/empresa-que-faz-ltcat/empresa-que-faz-ltcat-02.webp', alt: 'Avaliação quantitativa de agentes nocivos para LTCAT' },
		{ src: '/images/content/marketing/empresa-que-faz-ltcat/empresa-que-faz-ltcat-03.webp', alt: 'Elaboração de Laudo Técnico das Condições Ambientais do Trabalho' },
	],
	sections: [
		{
			heading: 'Quem pode emitir o LTCAT e o que exigir ao contratar',
			paragraphs: [
				'Conforme o Art. 58, § 1º da Lei nº 8.213/1991, o Laudo Técnico das Condições Ambientais do Trabalho (LTCAT) deve ser expedido exclusivamente por engenheiro de segurança do trabalho ou médico do trabalho legalmente habilitado.',
				'Ao contratar uma empresa que faz LTCAT, é indispensável verificar se o serviço inclui vistoria presencial no estabelecimento, medições quantitativas dos agentes nocivos conforme as metodologias da NHO/Fundacentro e do Decreto nº 3.048/1999 e emissão da respectiva Anotação de Responsabilidade Técnica (ART) no CREA ou registro médico.',
			],
		},
		{
			heading: 'Como a AJN conduz a elaboração do LTCAT',
			paragraphs: [
				'A AJN Consultoria e Engenharia atende empresas em Belo Horizonte e em todo o estado de Minas Gerais seguindo etapas técnicas rigorosas:',
			],
			lists: [
				{
					items: [
						'Levantamento de todos os setores, funções e descrições profissiográficas reais das atividades executadas;',
						'Reconhecimento dos agentes físicos, químicos e biológicos listados no Anexo IV do Decreto nº 3.048/1999 e na Tabela 24 do eSocial;',
						'Realização de medições instrumentais com equipamentos calibrados (como dosimetria de ruído, avaliação de calor por IBUTG, vibração e coleta de agentes químicos);',
						'Avaliação técnica das medidas de proteção coletiva (EPC) e individual (EPI), verificando os requisitos de eficácia, validade e registro de entrega exigidos pela legislação previdenciária;',
						'Emissão de parecer conclusivo por função/GHE para preenchimento seguro do PPP eletrônico e do evento S-2240 do eSocial.',
					],
				},
			],
		},
		{
			heading: 'Por que o PGR não substitui o LTCAT',
			paragraphs: [
				'O PGR (NR-01) tem finalidade trabalhista e preventiva, ao passo que o LTCAT possui finalidade previdenciária (avaliação do direito à aposentadoria especial e alíquotas de financiamento do SAT/GIIL-RAT). Utilizar apenas o PGR para responder ao evento S-2240 expõe a empresa a autuações da Receita Federal.',
				{
					segments: [
						'Veja mais detalhes em nossas páginas de ',
						{ text: 'Emissão de LTCAT', href: '/emissao-ltcat/' },
						' e ',
						{ text: 'Preço do LTCAT', href: '/ltcat-preco/' },
						'.',
					],
				},
			],
		},
		{
			heading: 'Solicite orçamento de LTCAT à AJN',
			paragraphs: [
				'Envie a cidade da unidade, o ramo de atividade e a relação de funções para receber uma proposta técnica detalhada.',
				{
					segments: [
						'Ligue para ',
						{ bold: true, text: '31 98473-4644' },
						' ou ',
						{ text: 'fale com nossa engenharia', href: '/contato/' },
						'.',
					],
				},
			],
		},
	],
} as const satisfies MarketingContent;
