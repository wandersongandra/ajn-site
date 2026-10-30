import type { MarketingContent } from '../types';

export const elaboracaoDoPgrPcmso = {
  slug: 'elaboracao-do-pgr-pcmso',
  path: '/elaboracao-do-pgr-pcmso',
  title: 'PGR e PCMSO: como os programas se relacionam | AJN',
  description: 'Entenda a relação entre PGR, PCMSO, riscos ocupacionais e exames médicos, com orientações para organizar a documentação da empresa.',
  heading: 'PGR e PCMSO: como os programas se relacionam',
  images: [
    { src: '/images/content/marketing/elaboracao-do-pgr-pcmso/elaboracao-do-pgr-pcmso-01.webp', alt: 'PGR e PCMSO' },
    { src: '/images/content/marketing/elaboracao-do-pgr-pcmso/elaboracao-do-pgr-pcmso-02.webp', alt: 'PGR e PCMSO' },
    { src: '/images/content/marketing/elaboracao-do-pgr-pcmso/elaboracao-do-pgr-pcmso-03.webp', alt: 'PGR e PCMSO' },
  ],
  sections: [
    {
      heading: 'A diferença entre PGR e PCMSO',
      paragraphs: [
        'O Programa de Gerenciamento de Riscos (PGR), previsto na NR-1, documenta o gerenciamento de riscos ocupacionais. Seus elementos mínimos são o inventário de riscos e o plano de ação, que orientam a prevenção nas atividades da organização.',
        'O Programa de Controle Médico de Saúde Ocupacional (PCMSO), previsto na NR-7, organiza o acompanhamento da saúde dos trabalhadores considerando os riscos ocupacionais identificados e classificados pelo PGR. O planejamento médico e a definição dos exames cabem ao profissional legalmente responsável pelo programa.',
      ],
      lists: [{ items: [
        'PGR: identifica perigos, avalia riscos e registra medidas de prevenção, prioridades e acompanhamento.',
        'PCMSO: orienta a vigilância da saúde ocupacional e os exames médicos aplicáveis aos riscos e às funções.',
        'ASO: registra a avaliação de aptidão ocupacional decorrente do exame médico, conforme os critérios da NR-7.',
      ] }],
    },
    {
      heading: 'Como as informações passam de um programa para o outro',
      paragraphs: [
        'A integração começa com uma descrição consistente de funções, ambientes e exposições. Informações incompletas no inventário de riscos dificultam o planejamento médico, enquanto achados da vigilância da saúde podem indicar a necessidade de reavaliar os riscos e as medidas de prevenção.',
        'Não basta produzir dois documentos sem conexão. A organização deve manter as informações coerentes e revisar os programas quando houver mudanças relevantes nas atividades e condições de trabalho.',
        { segments: [
          'Veja o escopo técnico da ',
          { text: 'elaboração de PGR', href: '/elaboracao-pgr/' },
          ' e como funciona a ',
          { text: 'gestão de PCMSO e ASOs', href: '/servicos/pcmso-e-asos/' },
          '.',
        ] },
      ],
    },
    {
      heading: 'O que mudou no gerenciamento de riscos em 2026',
      paragraphs: [
        'A redação atualizada do capítulo 1.5 da NR-1 entrou em vigor em 26 de maio de 2026 e passou a mencionar expressamente os fatores de risco psicossociais relacionados ao trabalho no gerenciamento de riscos ocupacionais. A avaliação deve considerar as condições e a organização do trabalho, com critérios técnicos adequados à realidade da empresa.',
        { segments: [
          'Para conferir o texto vigente e as orientações oficiais, consulte a ',
          { text: 'página da NR-1 no Ministério do Trabalho e Emprego', href: 'https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/nr-1' },
          '.',
        ] },
      ],
    },
    {
      heading: 'Quais dados reunir antes de solicitar os programas',
      paragraphs: [
        'A análise inicial costuma exigir a relação de atividades e funções, o número de trabalhadores, os locais de trabalho, os registros de SST existentes e as mudanças previstas na operação. Também é importante identificar quem responde pelo acompanhamento médico ocupacional.',
        'A necessidade de visita técnica, avaliações complementares e periodicidade de acompanhamento depende das características do estabelecimento e das exigências aplicáveis. Não há um modelo único que substitua a avaliação do caso.',
      ],
    },
    {
      heading: 'Contratação e próximos passos',
      paragraphs: [
        { segments: [
          'Se a empresa precisa contratar ou revisar os dois programas, conheça a página de ',
          { text: 'elaboração integrada de PGR e PCMSO', href: '/elaboracao-pgr-pcmso/' },
          '. Para informar a demanda, use o ',
          { text: 'contato da AJN', href: '/contato/' },
          '.',
        ] },
      ],
    },
  ],
} as const satisfies MarketingContent;
