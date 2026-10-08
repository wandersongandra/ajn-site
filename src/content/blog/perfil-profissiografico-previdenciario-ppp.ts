import type { BlogContentData } from '../types';
import image0 from '../../assets/blog/blog-perfil-profissiografico-previdenciario-ppp-932d893365.jpg';
import image1 from '../../assets/blog/blog-perfil-profissiografico-previdenciario-ppp-2b3a81c4b1.jpg';
import image2 from '../../assets/blog/blog-perfil-profissiografico-previdenciario-ppp-bd4e6344e7.jpg';
import image3 from '../../assets/blog/blog-perfil-profissiografico-previdenciario-ppp-18d58a1c60.jpg';
import image4 from '../../assets/blog/blog-perfil-profissiografico-previdenciario-ppp-fa700ef85f.jpg';

export const blogPerfilProfissiograficoPrevidenciarioPpp = {
	 slug: "perfil-profissiografico-previdenciario-ppp", path: "/blog/perfil-profissiografico-previdenciario-ppp",
	 title: "Perfil Profissiográfico Previdenciário (PPP)",
	 description: "Entenda o que é o Perfil Profissiográfico Previdenciário e como ele registra atividades e condições de exposição do trabalhador.",
	 heading: "Perfil Profissiográfico Previdenciário (PPP)",
	 pubDate: "2025-04-09",
	updatedAt: "2026-10-07",
	 author: "Admin",
	 image: { src: image0, alt: "Perfil Profissiográfico Previdenciário (PPP)" },
	 categories: ['Blog'],
	 tags: ["PPP","eSocial","aposentadoria especial"],
	 gallery: [{ src: image1, alt: "Perfil Profissiográfico Previdenciário (PPP)" }, { src: image2, alt: "Perfil Profissiográfico Previdenciário (PPP)" }, { src: image3, alt: "Perfil Profissiográfico Previdenciário (PPP)" }, { src: image4, alt: "Perfil Profissiográfico Previdenciário (PPP)" }, { src: image0, alt: "Perfil Profissiográfico Previdenciário (PPP)" }],
	 sections: [
  {
    "heading": "O que registra o PPP?",
    "paragraphs": [
      "O Perfil Profissiográfico Previdenciário reúne o histórico laboral do trabalhador e informações das condições ambientais pertinentes à Previdência Social. É um registro que deve corresponder às atividades e exposições efetivamente documentadas; não equivale a um certificado automático de direito à aposentadoria especial.",
      "O fundamento técnico das exposições deve ser coerente com os documentos ambientais, incluindo o LTCAT quando aplicável. Registros incorretos podem dificultar a análise previdenciária e precisam ser corrigidos na origem."
    ]
  },
  {
    "heading": "PPP eletrônico desde 2023",
    "paragraphs": [
      "Para períodos trabalhados a partir de 1º de janeiro de 2023, o PPP eletrônico substitui o documento físico para fins de comprovação perante o INSS. O trabalhador pode consultar o documento pelo Meu INSS. Períodos anteriores devem ser analisados conforme as regras e os registros aplicáveis à época.",
      "O PPP eletrônico é formado a partir das informações prestadas ao eSocial; o evento S-2240 trata das condições ambientais e da exposição a agentes nocivos. O S-2220, por sua vez, transmite dados de monitoramento da saúde e de ASO, e não é o mesmo evento do PPP ambiental."
    ]
  },
  {
    "heading": "O PPP concede aposentadoria especial?",
    "paragraphs": [
      "Não automaticamente. A concessão é analisada pelo INSS conforme período, agente nocivo, intensidade ou forma de exposição e demais requisitos da legislação previdenciária. Receber um PPP não garante reconhecimento de tempo especial, assim como um laudo não substitui a decisão administrativa ou judicial.",
      "Em caso de divergência, o trabalhador deve solicitar esclarecimento e correção ao empregador responsável pelos registros, guardando evidências e documentos pertinentes."
    ]
  },
  {
    "heading": "Fontes oficiais",
    "paragraphs": [
      {
        "segments": [
          {
            "text": "eSocial — Implantação do PPP eletrônico",
            "href": "https://www.gov.br/esocial/pt-br/noticias/disponibilizacao-do-perfil-profissiografico-previdenciario-ppp-eletronico/"
          }
        ]
      },
      {
        "segments": [
          {
            "text": "eSocial — Eventos SST e S-2240",
            "href": "https://www.gov.br/esocial/pt-br/empresas/manual-web-geral/manual-web-geral/"
          }
        ]
      },
      {
        "segments": [
          {
            "text": "Lei nº 8.213/1991 — art. 58",
            "href": "https://www.planalto.gov.br/ccivil_03/leis/l8213compilado.htm"
          }
        ]
      }
    ]
  }
],
} as const satisfies BlogContentData;
