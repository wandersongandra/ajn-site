import ajnPhoto from '../../assets/blog/ajn/nr-35-trabalho-em-altura-e-seguranca.webp';
import image3 from '../../assets/blog/blog-nr-35-trabalho-em-altura-e-seguranca-617cbcb850.jpg';
import image4 from '../../assets/blog/blog-nr-35-trabalho-em-altura-e-seguranca-fc3004f67a.jpg';
import image5 from '../../assets/blog/blog-nr-35-trabalho-em-altura-e-seguranca-c4468ddb3e.jpg';

import type { BlogContentData } from '../types';

export const blogNr35TrabalhoEmAlturaESeguranca = {
	slug: "nr-35-trabalho-em-altura-e-seguranca",
	path: "/blog/nr-35-trabalho-em-altura-e-seguranca",
	title: "NR-35: Trabalho em Altura e Segurança",
	description: "Veja cuidados abordados na NR-35, como capacitação, uso de equipamentos, acesso por escadas e preparação para emergências em altura.",
	heading: "NR-35: Trabalho em Altura e Segurança",
	pubDate: "2025-01-24",
	updatedAt: "2026-10-07",
	author: "Admin",
	image: { src: ajnPhoto, alt: 'Trabalhador em plataforma elevatória durante serviço industrial' },
	categories: ['Blog'],
	tags: ["NR-35","trabalho em altura","treinamento presencial","escadas"],
	gallery: [{ src: image3, alt: "NR-35: Trabalho em Altura e Segurança" }, { src: image4, alt: "NR-35: Trabalho em Altura e Segurança" }, { src: image5, alt: "NR-35: Trabalho em Altura e Segurança" }],
	sections: [
  {
    "heading": "",
    "paragraphs": [
      "A NR-35 se aplica ao trabalho realizado acima de dois metros do nível inferior, quando houver risco de queda. Isso não significa que atividades em alturas menores estejam livres de medidas de prevenção: os perigos devem ser avaliados em qualquer situação. A primeira decisão de planejamento é verificar se a tarefa pode ser feita sem expor alguém à queda.",
      "A norma trata de planejamento, organização, análise de risco, capacitação, autorização e sistemas de proteção. Não basta entregar um cinto: o acesso, os pontos de ancoragem, o resgate e as condições de execução precisam ser compatíveis com a tarefa."
    ]
  },
  {
    "heading": "Quem pode executar trabalho em altura?",
    "paragraphs": [
      "A atividade deve ser realizada por trabalhador autorizado, com capacitação compatível, aptidão de saúde avaliada conforme a NR-35 e ciência dos riscos e procedimentos. A organização precisa prever supervisão, análise de risco e medidas de prevenção; a Permissão de Trabalho é utilizada nas hipóteses previstas na norma.",
      "Na seleção dos equipamentos, deve-se avaliar a hierarquia de prevenção, a proteção coletiva e, quando necessário, o sistema de proteção individual contra quedas. Inspeção, compatibilidade dos componentes e plano de emergência precisam estar definidos antes da execução."
    ]
  },
  {
    "heading": "O que mudou nos treinamentos em 2026?",
    "paragraphs": [
      "A Portaria MTE nº 1.259/2026 atualizou requisitos da NR-35. Conforme orientação publicada pelo Ministério do Trabalho e Emprego em setembro de 2026, os treinamentos inicial, periódico e eventual previstos na norma devem ocorrer presencialmente. Há regra de transição para treinamentos híbridos já em andamento; não se deve anunciar um curso integralmente remoto como substituto automático da capacitação exigida.",
      "A capacitação inicial prevista na NR-35 envolve conteúdo teórico e prático e carga horária mínima de oito horas. A necessidade de treinamento periódico e eventual deve ser verificada pela organização conforme o texto vigente e as condições da atividade."
    ]
  },
  {
    "heading": "Escadas e resgate também exigem atenção",
    "paragraphs": [
      "Antes de usar escadas, verifique a análise de risco, as instruções do fabricante, a estabilidade, o acesso, as inspeções e as regras aplicáveis ao tipo de escada. Em 2026, a NR-35 também recebeu alterações e prazos de adequação referentes a escadas fixas verticais.",
      "O plano de emergência deve tratar do resgate e do atendimento, com pessoal, recursos e procedimentos compatíveis. Improvisar o resgate durante uma ocorrência pode ampliar o número de vítimas."
    ]
  },
  {
    "heading": "Fontes oficiais",
    "paragraphs": [
      {
        "segments": [
          {
            "text": "Ministério do Trabalho e Emprego — NR-35 vigente",
            "href": "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/norma-regulamentadora-no-35-nr-35"
          }
        ]
      },
      {
        "segments": [
          {
            "text": "MTE — Alterações da NR-35 em 2026",
            "href": "https://www.gov.br/trabalho-e-emprego/pt-br/noticias-e-conteudo/2026/setembro/trabalho-em-altura-veja-o-que-muda-nos-treinamentos-e-nas-escadas-fixas-verticais"
          }
        ]
      }
    ]
  }
],
} as const satisfies BlogContentData;
