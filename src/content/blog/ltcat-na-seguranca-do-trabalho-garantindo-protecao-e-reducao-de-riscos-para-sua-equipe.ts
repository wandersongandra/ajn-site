import image2 from '../../assets/blog/blog-ltcat-na-seguranca-do-trabalho-garantindo-protecao-e-reducao-de-riscos-para-sua-equipe-f9aa2d6dc3.png';

import type { BlogContentData } from '../types';

export const blogLtcatNaSegurancaDoTrabalhoGarantindoProtecaoEReducaoDeRiscosParaSuaEquipe = {
	slug: "ltcat-na-seguranca-do-trabalho-garantindo-protecao-e-reducao-de-riscos-para-sua-equipe",
	path: "/blog/ltcat-na-seguranca-do-trabalho-garantindo-protecao-e-reducao-de-riscos-para-sua-equipe",
	title: "LTCAT, PGR e PPP: como manter informações consistentes",
	description: "Saiba como evitar divergências entre LTCAT, inventário do PGR e PPP, mantendo registros de atividades, agentes e mudanças de exposição.",
	heading: "LTCAT, PGR e PPP: como manter informações consistentes",
	pubDate: "2026-01-23",
	updatedAt: "2026-10-07",
	author: "AJN Consultoria e Engenharia",
	image: { src: image2, alt: "LTCAT na Segurança do Trabalho: Garantindo Proteção e Redução de Riscos para sua Equipe" },
	categories: ['Blog'],
	tags: ["LTCAT","PGR","PPP","consistência documental"],
	gallery: [{ src: image2, alt: "LTCAT na Segurança do Trabalho: Garantindo Proteção e Redução de Riscos para sua Equipe" }],
	sections: [
  {
    "heading": "Documentos diferentes podem usar os mesmos dados",
    "paragraphs": [
      "O LTCAT fundamenta avaliações previdenciárias de exposição a agentes nocivos. O PGR organiza a identificação, avaliação e prevenção dos riscos ocupacionais. O PPP registra informações do histórico laboral do trabalhador. Eles não são equivalentes, mas inconsistências entre as informações podem comprometer a gestão e os registros.",
      "Por exemplo, a descrição de uma função não deve indicar contato habitual com determinado agente em um documento e omitir a atividade correspondente de outro sem uma justificativa técnica e temporal."
    ]
  },
  {
    "heading": "Como revisar as informações",
    "paragraphs": [
      "Compare os ambientes, atividades, jornadas, agentes, grupos expostos e períodos de cada registro. Verifique se mudanças de processo aparecem nos documentos a partir das datas em que ocorreram, respeitando os critérios próprios de cada obrigação.",
      "A documentação de medidas de controle também merece atenção: instalar um equipamento novo pode modificar exposições, mas sua efetividade deve ser verificada antes de assumir que o risco foi eliminado."
    ]
  },
  {
    "heading": "O que fazer quando houver divergência",
    "paragraphs": [
      "Identifique qual informação está desatualizada, quem é o responsável técnico ou pela declaração e quais evidências sustentam a correção. Os registros do eSocial devem refletir a condição efetiva do trabalhador no período informado.",
      "Não resolva divergências copiando números ou conclusões de um documento para outro. A necessidade de nova avaliação deve ser decidida tecnicamente."
    ]
  },
  {
    "heading": "Referências oficiais",
    "paragraphs": [
      {
        "segments": [
          {
            "text": "Lei nº 8.213/1991 — art. 58",
            "href": "https://www.planalto.gov.br/ccivil_03/leis/l8213compilado.htm"
          }
        ]
      },
      {
        "segments": [
          {
            "text": "MTE — PGR",
            "href": "https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/pgr"
          }
        ]
      },
      {
        "segments": [
          {
            "text": "eSocial — Eventos de SST",
            "href": "https://www.gov.br/esocial/pt-br/empresas/manual-web-geral/manual-web-geral/"
          }
        ]
      }
    ]
  }
],
} as const satisfies BlogContentData;
