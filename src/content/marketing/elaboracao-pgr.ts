import type { MarketingContent } from '../types';

export const elaboracaoPgr = {
  slug: 'elaboracao-pgr',
  path: '/elaboracao-pgr',
  title: 'Elaboração de PGR e Gestão de Riscos | AJN',
  description: 'Elaboração de PGR com inventário de riscos ocupacionais e plano de ação conforme a NR-1. Entenda o escopo e solicite uma avaliação da AJN.',
  heading: 'Elaboração de PGR',
  images: [
    { src: '/images/content/marketing/elaboracao-pgr/elaboracao-pgr-01.webp', alt: 'Elaboração de PGR' },
    { src: '/images/content/marketing/elaboracao-pgr/elaboracao-pgr-02.webp', alt: 'Documentação de gerenciamento de riscos ocupacionais' },
    { src: '/images/content/marketing/elaboracao-pgr/elaboracao-pgr-03.webp', alt: 'Avaliação de riscos no ambiente de trabalho' },
  ],
  sections: [
    {
      heading: 'O que deve constar no PGR?',
      paragraphs: [
        'O Programa de Gerenciamento de Riscos (PGR) faz parte do gerenciamento de riscos ocupacionais previsto na NR-1. Ele organiza os perigos identificados nas atividades, a avaliação dos riscos e as medidas de prevenção necessárias.',
        'O PGR contém, no mínimo, o inventário de riscos ocupacionais e o plano de ação. Seu conteúdo deve refletir as atividades e as condições reais de trabalho, e não apenas um modelo genérico de documento.',
      ],
      lists: [{ items: [
        'Inventário: caracterização das atividades, identificação dos perigos e avaliação dos riscos ocupacionais.',
        'Plano de ação: medidas de prevenção, prioridades, responsáveis, prazos e acompanhamento.',
        'Revisão: atualização do inventário e do plano sempre que as condições da atividade exigirem.',
      ] }],
    },
    {
      heading: 'Como definimos o escopo do serviço',
      paragraphs: [
        'Para avaliar a demanda, é importante conhecer o estabelecimento, as atividades executadas, os ambientes, as funções envolvidas e os documentos de SST já disponíveis.',
        'Com essas informações, a AJN pode discutir as etapas de levantamento, análise documental, visitas técnicas quando necessárias e entregáveis previstos na proposta. O escopo depende das particularidades da operação.',
      ],
    },
    {
      heading: 'Quando o PGR precisa ser revisto?',
      paragraphs: [
        'Mudanças em processos, equipamentos, ambientes ou organização do trabalho podem exigir revisão da avaliação de riscos e das medidas de prevenção. O acompanhamento das ações também faz parte da gestão contínua.',
        'A NR-1 prevê situações de dispensa da elaboração do PGR para determinados empregadores, conforme condições específicas. A aplicabilidade deve ser avaliada caso a caso.',
        { segments: [
          'Consulte também as ',
          { text: 'orientações oficiais do Ministério do Trabalho e Emprego sobre PGR', href: 'https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/pgr/' },
          '.',
        ] },
      ],
    },
    {
      heading: 'Converse com a AJN sobre o seu PGR',
      paragraphs: [
        'Informe a atividade da empresa, a cidade do estabelecimento e o tipo de documentação ou acompanhamento necessário. Com esses dados, poderemos avaliar o atendimento e encaminhar uma proposta adequada.',
        { segments: [
          'Para dar início, ',
          { text: 'entre em contato com a AJN', href: '/contato' },
          '.',
        ] },
      ],
    },
  ],
} as const satisfies MarketingContent;
