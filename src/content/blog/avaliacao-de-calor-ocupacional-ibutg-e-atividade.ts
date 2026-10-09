import image from '../../assets/blog/medicoes/medicao-calor-ibutg.webp';
import type { BlogContentData } from '../types';

export const blogCalorOcupacional = {
  slug: 'avaliacao-de-calor-ocupacional-ibutg-e-atividade',
  path: '/blog/avaliacao-de-calor-ocupacional-ibutg-e-atividade',
  title: 'Avaliação de calor ocupacional: IBUTG, atividade e jornada | AJN',
  description: 'O que observar em avaliações de calor ocupacional: IBUTG, tarefa, ambiente, condições de operação e interpretação técnica.',
  heading: 'Avaliação de calor ocupacional: IBUTG, atividade e jornada',
  pubDate: '2026-10-09',
  author: 'AJN Consultoria e Engenharia',
  topic: 'Laudos e avaliações técnicas',
  image: { src: image, alt: 'Imagem ilustrativa digital de instrumento IBUTG com termômetro de globo negro em ambiente industrial' },
  categories: ['Laudos e avaliações técnicas'],
  tags: ["calor ocupacional","IBUTG","NHO 06","NR-15","higiene ocupacional"],
  gallery: [],
  sections: [
    { heading: "O calor precisa ser avaliado na atividade real", paragraphs: ["Temperatura do ar e sensação térmica não respondem sozinhas se existe sobrecarga térmica ocupacional. A exposição também depende de fontes de calor, radiação, ventilação, vestimenta, esforço físico, ritmo da tarefa e períodos de recuperação.","O levantamento começa pela observação do processo, dos ciclos de trabalho e das características do ambiente. Condições sazonais, paradas, alterações de produção ou variação entre turnos podem tornar inadequado generalizar uma única observação."] },
    { heading: "O que o IBUTG mede e como a avaliação é planejada", paragraphs: ["O Índice de Bulbo Úmido Termômetro de Globo (IBUTG) combina variáveis de forma apropriada à avaliação de calor. Sua medição exige instrumentação adequada, estabilização e posicionamento compatíveis com a metodologia, além de descrição do cenário operacional.","A NHO 06 da Fundacentro fornece diretrizes técnicas para avaliação de exposição ocupacional ao calor. A aplicação de critérios da NR-15 exige atenção às condições e exigências normativas específicas do caso. O relatório precisa indicar quais foram os critérios adotados."] },
    { heading: "Resultados e prevenção", paragraphs: ["A interpretação considera não apenas o número do índice, mas também a atividade e sua organização. Identificar condições críticas pode apoiar decisões sobre controles de engenharia, sombreamento, ventilação, barreiras, organização das tarefas e medidas de proteção.","A avaliação de calor não substitui o PGR, o PCMSO ou a análise médica de aptidão. Ela pode contribuir com esses processos, desde que o alcance e as limitações das medições estejam registrados."] },
    { heading: "Escopo antes da campanha", paragraphs: ["Ao solicitar a medição, descreva fontes de calor, setores envolvidos, turnos, tarefas, horários de pico e características da operação. A partir disso, a empresa e a equipe técnica definem o planejamento da avaliação."] },
    { heading: 'Referências e próximos passos', paragraphs: [
      { segments: [{ text: "Fundacentro — Normas de Higiene Ocupacional", href: "https://www.gov.br/fundacentro/pt-br/centrais-de-conteudo/biblioteca/normas-de-higiene-ocupacional" }] },
      { segments: [{ text: "MTE — Normas Regulamentadoras vigentes", href: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes" }] },
      { segments: [{ text: "AJN — Avaliações e Medições Ambientais Ocupacionais", href: "/medicoes-ambientais-ocupacionais" }] },
    ] }
  ],
} as const satisfies BlogContentData;
