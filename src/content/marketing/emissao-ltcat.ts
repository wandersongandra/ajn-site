import type { MarketingContent } from '../types';

export const emissaoLtcat = {
  slug: 'emissao-ltcat',
  path: '/emissao-ltcat',
  title: 'Elaboração e Emissão de LTCAT | AJN Engenharia',
  description: 'Entenda o que o LTCAT avalia, quem pode assiná-lo e quais informações sua empresa deve reunir. Solicite uma avaliação de escopo à AJN.',
  heading: 'Emissão de LTCAT',
  images: [
    { src: '/images/content/emissao-laudos/emissao-laudos-02.webp', alt: 'Documentação técnica para avaliações de condições de trabalho' },
  ],
  sections: [
    {
      heading: 'Para que serve o LTCAT?',
      paragraphs: [
        'O Laudo Técnico das Condições Ambientais do Trabalho (LTCAT) é um documento de finalidade previdenciária. Ele fundamenta as informações sobre a exposição a agentes nocivos relevantes à análise das condições de trabalho.',
        'O laudo deve descrever as condições efetivamente avaliadas, os agentes identificados, as metodologias empregadas e os resultados pertinentes. A emissão do LTCAT, por si só, não garante aposentadoria especial: a análise de direitos depende dos requisitos legais e previdenciários aplicáveis.',
      ],
    },
    {
      heading: 'Quem pode elaborar e assinar o LTCAT?',
      paragraphs: [
        'Conforme o art. 58 da Lei nº 8.213/1991, o laudo técnico de condições ambientais do trabalho deve ser expedido por médico do trabalho ou engenheiro de segurança do trabalho. O levantamento de dados pode envolver apoio de outros profissionais, respeitadas as atribuições de cada um.',
        'Na contratação, confirme a responsabilidade técnica, o escopo da avaliação e a identificação dos ambientes e atividades contemplados.',
      ],
    },
    {
      heading: 'O que precisamos conhecer antes da proposta',
      paragraphs: [
        'Para avaliar o serviço, a AJN precisa entender as características do estabelecimento e a situação da documentação existente.',
      ],
      lists: [{ items: [
        'Cidade e endereço da unidade, ramo de atividade e setores a avaliar.',
        'Funções, atividades, jornadas, processos e possíveis agentes de exposição.',
        'PGR, avaliações ambientais e LTCAT anteriores, quando disponíveis.',
        'Mudanças de processo, equipamentos ou medidas de proteção que possam interferir na avaliação.',
      ] }],
    },
    {
      heading: 'LTCAT, PGR e laudo de insalubridade são documentos diferentes',
      paragraphs: [
        'O LTCAT atende a finalidade previdenciária. O PGR organiza o gerenciamento de riscos ocupacionais na NR-1. A caracterização trabalhista de insalubridade segue critérios próprios, incluindo a NR-15. Não se deve presumir que um desses documentos substitui os demais.',
        { segments: ['Leia também sobre a ', { text: 'diferença entre LTCAT e laudo de insalubridade', href: '/laudo-ltcat-insalubridade' }, '.'] },
      ],
    },
    {
      heading: 'Avalie a emissão do LTCAT com a AJN',
      paragraphs: [
        'Descreva o estabelecimento, as atividades e a documentação disponível. Com essas informações, verificamos as condições de atendimento e os levantamentos previstos na proposta.',
        { segments: ['Para solicitar uma avaliação, ', { text: 'fale com a AJN', href: '/contato' }, '.'] },
        { segments: ['Referência legal: ', { text: 'Lei nº 8.213/1991, art. 58', href: 'https://www.planalto.gov.br/ccivil_03/leis/l8213compilado.htm' }, '.'] },
      ],
    },
  ],
} as const satisfies MarketingContent;
