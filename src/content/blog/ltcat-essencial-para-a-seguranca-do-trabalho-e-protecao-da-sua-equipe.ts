import image1 from '../../assets/blog/blog-ltcat-essencial-para-a-seguranca-do-trabalho-e-protecao-da-sua-equipe-96b69c9003.png';

import type { BlogContentData } from '../types';

export const blogLtcatEssencialParaASegurancaDoTrabalhoEProtecaoDaSuaEquipe = {
	slug: "ltcat-essencial-para-a-seguranca-do-trabalho-e-protecao-da-sua-equipe",
	path: "/blog/ltcat-essencial-para-a-seguranca-do-trabalho-e-protecao-da-sua-equipe",
	title: "LTCAT e agentes nocivos: o que a avaliação precisa considerar",
	description: "Veja o que caracteriza a avaliação de agentes físicos, químicos e biológicos no LTCAT e a importância de registrar as condições de exposição.",
	heading: "LTCAT e agentes nocivos: o que a avaliação precisa considerar",
	pubDate: "2026-01-23",
	updatedAt: "2026-10-07",
	author: "AJN Consultoria e Engenharia",
	image: { src: image1, alt: "LTCAT: Essencial para a Segurança do Trabalho e Proteção da Sua Equipe" },
	categories: ['Blog'],
	tags: ["LTCAT","agentes nocivos","avaliação de exposição"],
	gallery: [{ src: image1, alt: "LTCAT: Essencial para a Segurança do Trabalho e Proteção da Sua Equipe" }],
	sections: [
  {
    "heading": "A exposição não se presume pelo nome do cargo",
    "paragraphs": [
      "O LTCAT precisa estar fundamentado nas condições de trabalho. Duas pessoas com a mesma função podem ter exposições diferentes conforme o ambiente, as tarefas, os produtos utilizados e as medidas de proteção existentes.",
      "O enquadramento para fins previdenciários depende dos agentes e critérios previstos na legislação aplicável. Não basta apresentar uma lista genérica de 'riscos ocupacionais'."
    ]
  },
  {
    "heading": "Agentes físicos, químicos e biológicos",
    "paragraphs": [
      "Ruído, vibração, temperaturas extremas e outras exposições físicas exigem análise segundo os critérios específicos pertinentes. Substâncias e misturas químicas devem ser identificadas, com atenção às vias, formas e circunstâncias de exposição. Agentes biológicos demandam análise das atividades e do contato relevante para o enquadramento.",
      "A avaliação pode exigir medições e documentação técnica. O método escolhido deve ser justificado pelo responsável habilitado e adequado à caracterização necessária, não aplicado indiscriminadamente."
    ]
  },
  {
    "heading": "Qual é a diferença para o inventário do PGR?",
    "paragraphs": [
      "O inventário do PGR contempla um conjunto amplo de perigos e riscos ocupacionais, incluindo acidentes, questões ergonômicas e outros fatores da organização do trabalho. O LTCAT tem finalidade previdenciária específica. Embora os dados possam ser compartilhados, os documentos não são intercambiáveis.",
      "Para que as informações façam sentido ao longo do tempo, registre condições de exposição, períodos, grupos de trabalhadores e mudanças relevantes nos ambientes."
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
            "text": "MTE — Gerenciamento de Riscos e PGR",
            "href": "https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/pgr"
          }
        ]
      }
    ]
  }
],
} as const satisfies BlogContentData;
