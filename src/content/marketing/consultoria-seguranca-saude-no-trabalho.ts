import type { MarketingContent } from '../types';

export const consultoriaSegurancaSaudeNoTrabalho = {
	slug: "consultoria-seguranca-saude-no-trabalho", path: "/consultoria-seguranca-saude-no-trabalho",
	title: "Consultoria em Segurança e Saúde no Trabalho (SST) | AJN Engenharia",
	description: "Consultoria integrada em Segurança e Saúde no Trabalho (SST) em BH e MG: alinhamento técnico entre PGR (NR-01), PCMSO (NR-07), LTCAT e eventos do eSocial.",
	heading: "Consultoria em Segurança e Saúde no Trabalho (SST)",
	images: [
		{ src: "/images/content/marketing/consultoria-seguranca-saude-no-trabalho/consultoria-seguranca-saude-no-trabalho-01.webp", alt: "Consultoria em segurança e saúde no trabalho" },
		{ src: "/images/content/marketing/consultoria-seguranca-saude-no-trabalho/consultoria-seguranca-saude-no-trabalho-02.webp", alt: "Análise de riscos ocupacionais e saúde do trabalhador" },
		{ src: "/images/content/marketing/consultoria-seguranca-saude-no-trabalho/consultoria-seguranca-saude-no-trabalho-03.webp", alt: "Acompanhamento de programas de SST em campo" },
	],
	sections: [
		{
			heading: "Gestão conjunta de Engenharia de Segurança e Medicina Ocupacional",
			paragraphs: [
				"Na prática das empresas, separar a engenharia de segurança do controle médico ocupacional costuma gerar retrabalho: funções cadastradas com nomes divergentes, agentes nocivos avaliados de forma diferente entre o PGR e o LTCAT e exames médicos que não conversam com a exposição real do trabalhador.",
				"A consultoria em Segurança e Saúde no Trabalho (SST) da AJN Consultoria e Engenharia unifica o diagnóstico de campo para que a documentação preventiva, previdenciária e médica mantenha total consistência técnica."
			]
		},
		{
			heading: "Principais entregas da consultoria em SST",
			paragraphs: [
				"Atendemos empresas de diversos portes em Belo Horizonte e Minas Gerais com escopo técnico modular:"
			],
			lists: [
				{
					items: [
						"Mapeamento de GHE (Grupos Homogêneos de Exposição) e descrição técnica das atividades por cargo;",
						"Elaboração do PGR (NR-01) integrado ao planejamento do PCMSO (NR-07) e à emissão de ASOs;",
						"Medições de higiene ocupacional (ruído, calor, agentes químicos e vibração) com equipamentos calibrados;",
						"Elaboração de LTCAT para subsidiar o Perfil Profissiográfico Previdenciário (PPP eletrônico) e o evento S-2240 do eSocial;",
						"Capacitações operacionais nas Normas Regulamentadoras aplicáveis (como NR-01, NR-06, NR-10, NR-12, NR-18, NR-33 e NR-35)."
					]
				}
			]
		},
		{
			heading: "Quando contratar uma revisão completa de SST",
			paragraphs: [
				"Mudanças de layout, abertura de novas filiais, mobilização de equipes em clientes industriais ou notificações do Ministério do Trabalho e do eSocial exigem revisão técnica imediata dos programas vigentes.",
				{
					segments: [
						"Veja mais detalhes sobre o serviço de ",
						{ text: "Assessoria e Consultoria em Saúde Ocupacional", href: "/servicos/assessoria-e-consultoria-em-saude-ocupacional/" },
						" e ",
						{ text: "PCMSO e ASOs", href: "/servicos/pcmso-e-asos/" },
						"."
					]
				}
			]
		},
		{
			heading: "Solicite diagnóstico e proposta à AJN",
			paragraphs: [
				"Informe o ramo de atuação da empresa, a localização e o número de empregados para estruturarmos uma proposta compatível com a sua operação.",
				{
					segments: [
						"Ligue para ",
						{ bold: true, text: "31 98473-4644" },
						" ou ",
						{ text: "fale com a AJN pelo formulário de contato", href: "/contato/" },
						"."
					]
				}
			]
		}
	],
} as const satisfies MarketingContent;
