import type { MarketingContent } from '../types';

export const empresaQueFazPgr = {
  slug: 'empresa-que-faz-pgr',
  path: '/empresa-que-faz-pgr',
  title: 'Empresa para Elaborar PGR: Como Contratar | AJN',
  description: 'Precisa contratar a elaboração de PGR? Saiba o que informar na solicitação, quais documentos considerar e como avaliar o escopo do serviço.',
  heading: 'Empresa para elaboração de PGR',
  images: [
    { src: '/images/content/marketing/empresa-que-faz-pgr/empresa-que-faz-pgr-01.webp', alt: 'Consultoria para elaboração de PGR' },
    { src: '/images/content/marketing/empresa-que-faz-pgr/empresa-que-faz-pgr-02.webp', alt: 'Levantamento de riscos ocupacionais' },
    { src: '/images/content/marketing/empresa-que-faz-pgr/empresa-que-faz-pgr-03.webp', alt: 'Análise técnica de documentação de SST' },
  ],
  sections: [
    {
      heading: 'O que avaliar antes de contratar',
      paragraphs: [
        'A contratação de um serviço de PGR começa pelo entendimento das atividades e dos riscos ocupacionais do estabelecimento. Uma proposta precisa deixar claros o levantamento previsto, os documentos a entregar e as responsabilidades das partes.',
        'O preço e o prazo dependem do porte da operação, dos ambientes e atividades a avaliar, dos documentos existentes e da necessidade de visitas técnicas. Por isso, não é adequado definir um orçamento sem conhecer a demanda.',
      ],
    },
    {
      heading: 'Informações úteis para pedir uma proposta',
      paragraphs: [
        'Ao entrar em contato com a AJN, separe as informações disponíveis para facilitar a definição do serviço.',
      ],
      lists: [{ items: [
        'Cidade do estabelecimento, segmento de atividade e número aproximado de trabalhadores.',
        'Principais funções, processos, máquinas e ambientes em que o trabalho é realizado.',
        'PGR anterior, inventário de riscos, plano de ação e documentos complementares, caso existam.',
        'Prazos, exigências contratuais e eventuais mudanças recentes nas atividades.',
      ] }],
    },
    {
      heading: 'Entregas e acompanhamento',
      paragraphs: [
        'O PGR previsto na NR-1 contém, no mínimo, inventário de riscos ocupacionais e plano de ação. Esses documentos devem representar as condições reais do estabelecimento e apoiar o acompanhamento das medidas de prevenção.',
        { segments: [
          'Para entender o conteúdo técnico, consulte nossa página sobre ',
          { text: 'elaboração de PGR', href: '/elaboracao-pgr' },
          '.',
        ] },
      ],
    },
    {
      heading: 'Solicite atendimento',
      paragraphs: [
        'A AJN Consultoria e Engenharia atende demandas de segurança do trabalho e documentação técnica. Descreva sua necessidade para verificarmos o escopo e as condições de atendimento.',
        { segments: [
          'Envie as informações pela nossa ',
          { text: 'página de contato', href: '/contato' },
          '.',
        ] },
      ],
    },
  ],
} as const satisfies MarketingContent;
