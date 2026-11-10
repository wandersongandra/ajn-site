import type { MarketingContent } from '../types';

export const consultoriaSegurancaDoTrabalho = {
	slug: "consultoria-seguranca-do-trabalho", path: "/consultoria-seguranca-do-trabalho",
	title: "Consultoria em Segurança do Trabalho em BH e MG | AJN Engenharia",
	description: "Consultoria em segurança do trabalho para indústrias, obras e empresas em BH e MG: elaboração de PGR, LTCAT, laudos técnicos, inspeções de campo e eSocial.",
	heading: "Consultoria em Segurança do Trabalho para Empresas",
	images: [
		{ src: "/images/content/marketing/consultoria-pcmso/consultoria-pcmso-02.webp", alt: "Consultoria em segurança do trabalho em campo" },
		{ src: "/images/content/marketing/consultoria-seguranca-do-trabalho/consultoria-seguranca-do-trabalho-02.webp", alt: "Acompanhamento técnico de segurança operacional" },
		{ src: "/images/content/marketing/elaboracao-pgr/elaboracao-pgr-01.webp", alt: "Avaliação de riscos ocupacionais e documentação de SST" },
	],
	sections: [
		{
			heading: "Atuação técnica em Segurança do Trabalho para operações reais",
			paragraphs: [
				"Uma consultoria em segurança do trabalho precisa ir além da entrega formal de pastas e certificados. Nas operações industriais, comerciais, logísticas e da construção civil, a gestão de SST exige reconhecimento preciso dos riscos no local de trabalho, definição de medidas de controle viáveis e documentação consistente para fiscalizações e contratos.",
				"Sediada em Belo Horizonte, a AJN Consultoria e Engenharia apoia empresas em Minas Gerais tanto em demandas pontuais de regularização documental quanto no acompanhamento técnico recorrente em campo."
			]
		},
		{
			heading: "Escopos atendidos pela consultoria de SST da AJN",
			paragraphs: [
				"O atendimento é moldado conforme o grau de risco e a estrutura interna de cada cliente:"
			],
			lists: [
				{
					items: [
						"Elaboração e atualização do Programa de Gerenciamento de Riscos (PGR - NR-01), com inventário de riscos e plano de ação;",
						"Emissão de Laudo Técnico das Condições Ambientais do Trabalho (LTCAT) e laudos de insalubridade (NR-15) e periculosidade (NR-16);",
						"Avaliações quantitativas de agentes físicos e químicos (dosimetria de ruído, calor, vibração, poeiras e vapores orgânicos);",
						"Apoio na estruturação das informações técnicas para os eventos de SST no eSocial (S-2210, S-2220 e S-2240);",
						"Inspeções técnicas de segurança em obras e plantas industriais, mobilização de terceiros e assistência técnica em perícias trabalhistas."
					]
				}
			]
		},
		{
			heading: "Integração com Saúde Ocupacional, Incêndio e Qualidade",
			paragraphs: [
				"Empresas que centralizam o suporte de engenharia conseguem manter coerência técnica entre o inventário do PGR, o PCMSO (NR-07) e os projetos de prevenção e combate a incêndio junto ao CBMMG.",
				{
					segments: [
						"Consulte nossas páginas de ",
						{ text: "Elaboração de PGR", href: "/elaboracao-pgr" },
						", ",
						{ text: "Emissão de LTCAT", href: "/emissao-ltcat" },
						" e ",
						{ text: "Consultoria da Qualidade", href: "/consultoria-da-qualidade" },
						"."
					]
				}
			]
		},
		{
			heading: "Converse com um engenheiro da AJN",
			paragraphs: [
				"Apresente o segmento da sua empresa, o número de colaboradores e a sua necessidade atual para avaliarmos o escopo técnico adequado.",
				{
					segments: [
						"Ligue para ",
						{ bold: true, text: "31 98473-4644" },
						" ou ",
						{ text: "solicite uma proposta técnica", href: "/contato" },
						"."
					]
				}
			]
		}
	],
} as const satisfies MarketingContent;
