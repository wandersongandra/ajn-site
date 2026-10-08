import type { ServiceContent } from '../types';

export const servicePage = {
  slug: 'pericias-em-periculosidade-e-insalubridade',
  path: '/servicos/pericias-em-periculosidade-e-insalubridade',
  title: 'Laudos de Insalubridade e Periculosidade | AJN',
  description: 'Avaliações de insalubridade e periculosidade: conheça os critérios técnicos, as diferenças entre NR-15 e NR-16 e como solicitar uma proposta.',
  heading: 'Perícias em insalubridade e periculosidade',
  image: '/images/content/services/pericias-em-periculosidade-e-insalubridade.webp',
  imageAlt: 'Avaliação técnica de condições de segurança e saúde no trabalho',
  sections: [
    {
      heading: 'Insalubridade e periculosidade não são a mesma coisa',
      paragraphs: [
        'A insalubridade é avaliada segundo as atividades, os agentes e os critérios previstos na NR-15 e em seus anexos. A análise pode exigir medição, avaliação qualitativa e inspeção, conforme o enquadramento aplicável.',
        'A periculosidade considera as atividades e operações previstas na NR-16 e nas demais disposições pertinentes. A simples existência de uma fonte de perigo no estabelecimento não dispensa a análise das circunstâncias e dos critérios normativos.',
      ],
    },
    {
      heading: 'Como funciona a avaliação técnica',
      paragraphs: [
        'O trabalho começa pela identificação das funções, atividades, setores e situações a analisar. Em seguida, define-se a documentação de referência e a necessidade de inspeção e avaliações técnicas. As conclusões devem ser fundamentadas nos fatos apurados e nas normas aplicáveis.',
        'A caracterização técnica e a eventual emissão de laudos exigem atuação de profissional legalmente habilitado, nos limites das atribuições pertinentes. Não é correto antecipar o resultado nem prometer pagamento ou afastamento de adicionais sem exame do caso.',
      ],
      lists: [{ items: [
        'Descrição das atividades, processos e ambientes efetivamente envolvidos.',
        'Identificação das fontes de exposição, frequência e condições de trabalho relevantes.',
        'Verificação de medidas de proteção coletiva e individual quando pertinentes.',
        'Registro de critérios normativos, metodologia, evidências e conclusões técnicas.',
      ] }],
    },
    {
      heading: 'Qual é a diferença para o LTCAT?',
      paragraphs: [
        'O LTCAT tem finalidade previdenciária, enquanto a avaliação de insalubridade ou periculosidade atende a critérios trabalhistas específicos. Mesmo que compartilhem levantamentos sobre o ambiente, os documentos não são automaticamente intercambiáveis.',
        { segments: ['Entenda a ', { text: 'diferença entre LTCAT e insalubridade', href: '/laudo-ltcat-insalubridade' }, '.'] },
      ],
    },
    {
      heading: 'Peça uma avaliação à AJN',
      paragraphs: [
        'Informe a cidade, as funções, os ambientes, o tipo de atividade e a finalidade da avaliação. Assim podemos analisar os requisitos para uma proposta de serviço técnico.',
        { segments: ['Entre em contato pela ', { text: 'página de atendimento', href: '/contato' }, '.'] },
        { segments: ['Fontes oficiais: ', { text: 'NR-15', href: 'https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/norma-regulamentadora-no-15-nr-15' }, ' e ', { text: 'lista de Normas Regulamentadoras do MTE (NR-16)', href: 'https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/' }, '.'] },
      ],
    },
  ],
} as const satisfies ServiceContent;
