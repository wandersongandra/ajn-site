import type { MarketingContent } from '../types';

export const empresaLtcat = {
	slug: "empresa-ltcat", path: "/empresa-ltcat",
	title: "Empresa ltcat - AJN Consultoria e Engenharia",
	description: "Empresa ltcat oferece uma variedade de serviços, incluindo prevenção e combate a incêndios, consultoria em segurança ocupacional, qualidade, saúde e meio...",
	heading: "Empresa ltcat",
	images: [
		{ src: "/images/content/marketing/empresa-ltcat/empresa-ltcat-01.webp", alt: "Empresa ltcat" },
		{ src: "/images/content/marketing/empresa-ltcat/empresa-ltcat-02.webp", alt: "Empresa ltcat" },
		{ src: "/images/content/marketing/empresa-ltcat/empresa-ltcat-03.webp", alt: "Empresa ltcat" },
	],
	sections: [
		{ heading: "empresa ltcat: Soluções em Segurança do Trabalho", paragraphs: [
			"A AJN Consultoria e Engenharia, do engenheiro Antônio Jorlei, é uma empresa especializada em Segurança do Trabalho, oferecendo uma ampla gama de serviços para garantir a saúde e a segurança dos colaboradores no ambiente laboral.",
			{ segments: ["Localizada em Belo Horizonte, MG, a", { bold: true, text: "empresa ltcat" }, "se destaca por seu comprometimento com a qualidade, segurança, meio ambiente e saúde."] }
		]
		},
		{ heading: "Serviços Oferecidos pela empresa ltcat", paragraphs: [
			{ segments: ["A", { bold: true, text: "empresa ltcat" }, "oferece uma variedade de serviços, incluindo prevenção e combate a incêndios, consultoria em segurança ocupacional, qualidade, saúde e meio ambiente, elaboração de laudos técnicos, certificações e treinamentos em Normas Regulamentadoras (NRs)."] },
			"Um dos serviços essenciais oferecidos pela empresa é a elaboração do Laudo Técnico das Condições Ambientais do Trabalho (LTcat)."
		]
		},
		{ heading: "A Importância da empresa ltcat", paragraphs: [
			"O Laudo Técnico das Condições Ambientais do Trabalho (LTcat) é crucial para avaliar os agentes nocivos presentes no ambiente de trabalho.",
			"Ele garante o direito dos trabalhadores à aposentadoria especial, além de assegurar a conformidade legal das empresas e a proteção da saúde ocupacional dos colaboradores.",
			"Com a elaboração precisa e detalhada do LTcat pela AJN Consultoria e Engenharia, os clientes têm a segurança jurídica necessária para atuar dentro das normativas vigentes, proporcionando um ambiente de trabalho mais seguro e saudável."
		]
		},
		{ heading: "Projetos de Segurança contra Incêndio e LTCAT Personalizado", paragraphs: [
			{ segments: ["A", { bold: true, text: "empresa ltcat" }, "não só oferece serviços de consultoria e projetos de segurança contra incêndio, como também realiza o LTCAT de forma personalizada, atendendo às necessidades específicas de cada cliente."] },
			"Com uma equipe altamente qualificada e experiente, a AJN Consultoria e Engenharia garante análises precisas e relatórios detalhados que atendem plenamente às exigências legais, proporcionando segurança e saúde para os colaboradores."
		]
, subsections: [
			{ heading: "Conte com a Experiência da empresa ltcat", paragraphs: [
				"A AJN Consultoria e Engenharia se destaca no mercado por sua excelência e comprometimento com a segurança do trabalho.",
				{ segments: ["Com mais de 08 anos de experiência e uma equipe altamente qualificada, a", { bold: true, text: "empresa ltcat" }, "oferece soluções completas para garantir a saúde e a segurança no ambiente laboral."] },
				"Entre em contato conosco e saiba como podemos ajudar a sua empresa a estar conforme as normas de segurança e a proteger a saúde dos seus colaboradores."
			]
			}
		]
		},
		{ heading: "Para saber mais sobre Empresa ltcat", paragraphs: [
			{ segments: ["Ligue para ", { bold: true, text: "31 98473-4644" }, " ou ", { text: "clique aqui", href: "/contato" }, " e entre em contato por email."] }
		]
		}
	],
} as const satisfies MarketingContent;
