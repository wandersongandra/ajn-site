import type { MarketingContent } from '../types';

export const laudoLtcatInsalubridade = {
  slug: 'laudo-ltcat-insalubridade',
  path: '/laudo-ltcat-insalubridade',
  title: 'LTCAT e Insalubridade: Qual a Diferença? | AJN',
  description: 'LTCAT e laudo de insalubridade têm finalidades diferentes. Entenda a base previdenciária, os critérios da NR-15 e quando avaliar cada documento.',
  heading: 'LTCAT e laudo de insalubridade: diferenças',
  images: [
    { src: '/images/content/marketing/laudo-ltcat-insalubridade/laudo-ltcat-insalubridade-01.webp', alt: 'Avaliação técnica de condições ambientais de trabalho' },
    { src: '/images/content/marketing/laudo-ltcat-insalubridade/laudo-ltcat-insalubridade-02.webp', alt: 'Análise de riscos e exposição ocupacional' },
    { src: '/images/content/marketing/laudo-ltcat-insalubridade/laudo-ltcat-insalubridade-03.webp', alt: 'Documentação de segurança e saúde do trabalho' },
  ],
  sections: [
    {
      heading: 'LTCAT: finalidade previdenciária',
      paragraphs: [
        'O LTCAT reúne informações técnicas sobre condições ambientais de trabalho e exposição a agentes nocivos para fins previdenciários, nos termos do art. 58 da Lei nº 8.213/1991. É uma referência para informações sobre exposição registradas nos documentos previdenciários pertinentes.',
        'A existência de um LTCAT não define automaticamente se uma atividade é insalubre para fins trabalhistas nem assegura, por si só, o reconhecimento de aposentadoria especial.',
      ],
    },
    {
      heading: 'Insalubridade: critérios trabalhistas da NR-15',
      paragraphs: [
        'A análise de insalubridade tem finalidade trabalhista e considera os critérios previstos na NR-15 e em seus anexos. Dependendo do agente e da situação, a avaliação pode envolver medidas quantitativas, avaliação qualitativa e inspeção técnica.',
        'Não basta identificar a presença de um produto químico, ruído ou outro agente para concluir que existe direito a adicional: é necessária a caracterização segundo os critérios aplicáveis e as condições efetivamente observadas.',
      ],
    },
    {
      heading: 'Um laudo substitui o outro?',
      paragraphs: [
        'Não automaticamente. Embora possam utilizar levantamentos ambientais relacionados, LTCAT e laudo de insalubridade atendem a finalidades legais distintas. A empresa deve verificar quais documentos precisa manter segundo a situação concreta.',
        { segments: ['Entenda também o processo de ', { text: 'elaboração de LTCAT', href: '/emissao-ltcat' }, ' e o serviço de ', { text: 'perícias em insalubridade e periculosidade', href: '/servicos/pericias-em-periculosidade-e-insalubridade' }, '.'] },
      ],
    },
    {
      heading: 'Peça uma avaliação da documentação',
      paragraphs: [
        'Informe à AJN as atividades envolvidas, os setores, os agentes que precisam de avaliação e o objetivo do documento. Assim, o escopo pode ser definido sem confundir obrigações previdenciárias e trabalhistas.',
        { segments: ['Converse com a AJN pela ', { text: 'página de contato', href: '/contato' }, '.'] },
        { segments: ['Fontes oficiais: ', { text: 'NR-15 (MTE)', href: 'https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/norma-regulamentadora-no-15-nr-15' }, ' e ', { text: 'Lei nº 8.213/1991, art. 58', href: 'https://www.planalto.gov.br/ccivil_03/leis/l8213compilado.htm' }, '.'] },
      ],
    },
  ],
} as const satisfies MarketingContent;
