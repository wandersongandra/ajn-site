import type { MarketingContent } from '../types';

export const projetoEletrico = {
	slug: "projeto-eletrico", path: "/projeto-eletrico",
	title: "Projeto elétrico - AJN Consultoria e Engenharia",
	description: "Projeto elétrico, a empresa também oferece uma variedade de serviços relacionados à gestão de equipamentos, conformidade com normas de segurança, meio...",
	heading: "Projeto elétrico",
	images: [
		{ src: "/images/content/marketing/projeto-eletrico/projeto-eletrico-01.webp", alt: "Projeto elétrico" },
		{ src: "/images/content/marketing/projeto-eletrico/projeto-eletrico-02.webp", alt: "Projeto elétrico" },
		{ src: "/images/content/marketing/projeto-eletrico/projeto-eletrico-03.webp", alt: "Projeto elétrico" },
	],
	sections: [
		{ heading: "AJN Consultoria e Engenharia: Qualidade e Segurança em Projetos Elétricos", paragraphs: [
			{ segments: ["A AJN Consultoria e Engenharia é uma empresa renomada no setor de serviços de consultoria e engenharia e", { bold: true, text: "projeto elétrico" }, ", com foco em Qualidade, Saúde, Segurança e Meio Ambiente (QSSMA)."] },
			"Com uma vasta experiência no mercado, a empresa oferece uma gama de serviços técnicos especializados que abrangem desde treinamentos até perícias em insalubridade e periculosidade.",
			{ segments: ["Um dos principais serviços oferecidos pela AJN é o", { bold: true, text: "projeto elétrico" }, ", um documento técnico essencial para qualquer obra residencial, comercial ou industrial."] },
			{ segments: ["Elaborado por engenheiros e técnicos habilitados, o", { bold: true, text: "projeto elétrico" }, "é fundamental para promover a segurança, eficiência e conformidade com normas técnicas, como a NBR 5410."] }
		]
		},
		{ heading: "Vantagens do projeto elétrico da AJN Consultoria e Engenharia", paragraphs: [
			{ segments: ["Ao optar pelos serviços de", { bold: true, text: "projeto elétrico" }, "da AJN, os clientes contam com uma série de benefícios exclusivos."] },
			"Desde a elaboração detalhada do projeto até a execução e acompanhamento da instalação elétrica, a empresa assegura um serviço personalizado e de alta qualidade."
		]
, lists: [
			{ items: [
				"Segurança: O projeto elétrico da AJN é elaborado seguindo todas as normas de segurança, assegurando a proteção das pessoas e do patrimônio;",
				"Eficiência: Com cálculos precisos e especificações detalhadas, o projeto elétrico visa promover o melhor desempenho e aproveitamento da instalação;",
				"Conformidade: Todos os projetos são desenvolvidos em conformidade com as normas técnicas vigentes, assegurando a legalidade e qualidade da instalação elétrica;",
				"Acompanhamento Técnico: Além da elaboração do projeto, a AJN oferece acompanhamento técnico durante todas as fases da obra, assegurando a correta implementação das soluções propostas."
			] }
		]
, subsections: [
			{ heading: "Soluções Personalizadas para suas Necessidades", paragraphs: [
				"A AJN Consultoria e Engenharia se destaca pela capacidade de oferecer soluções personalizadas, adaptadas às necessidades específicas de cada cliente.",
				"Com uma comunicação clara e transparente, a empresa busca sempre superar as expectativas e entregar resultados excepcionais.",
				{ segments: ["Além do", { bold: true, text: "projeto elétrico" }, ", a empresa também oferece uma variedade de serviços relacionados à gestão de equipamentos, conformidade com normas de segurança, meio ambiente e programas de saúde ocupacional, assegurando uma abordagem completa e integrada para seus clientes."] }
			]
			}
		]
		},
		{ heading: "Entre em Contato e Conheça Nossas Soluções em Projetos Elétricos", paragraphs: [
			{ segments: ["Se você está em busca de um", { bold: true, text: "projeto elétrico" }, "de qualidade, seguro e eficiente, entre em contato com a AJN Consultoria e Engenharia."] },
			"Nossa equipe de profissionais altamente qualificados está pronta para atender às suas demandas e oferecer as melhores soluções para o seu projeto.",
			"Promovemos um serviço de excelência e total comprometimento com a satisfação de nossos clientes.",
			"Não perca tempo, contate-nos agora mesmo e descubra como podemos contribuir para o sucesso do seu empreendimento."
		]
		},
		{ heading: "Para saber mais sobre Projeto elétrico", paragraphs: [
			{ segments: ["Ligue para ", { bold: true, text: "31 98473-4644" }, " ou ", { text: "clique aqui", href: "/contato" }, " e entre em contato por email."] }
		]
		}
	],
} as const satisfies MarketingContent;
