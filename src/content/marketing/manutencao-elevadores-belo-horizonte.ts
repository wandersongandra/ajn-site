import type { MarketingContent } from '../types';

export const manutencaoElevadoresBeloHorizonte = {
  slug: 'manutencao-elevadores-belo-horizonte',
  path: '/manutencao-elevadores-belo-horizonte',
  title: 'Manutenção de elevadores em Belo Horizonte | AJN Engenharia',
  description: 'Precisa de manutenção ou avaliação técnica de elevador em BH? Saiba quais informações do equipamento ajudam a definir o escopo e pedir orçamento à AJN.',
  heading: 'Manutenção de elevadores em Belo Horizonte',
  images: [
    { src: '/images/content/marketing/elevacao-vertical/elevacao-vertical-01.webp', alt: 'Referência visual de equipamento de transporte vertical' },
    { src: '/images/content/marketing/elevacao-vertical/elevacao-vertical-02.webp', alt: 'Referência visual de elevador em edificação' },
    { src: '/images/content/marketing/manutencao-elevadores-belo-horizonte/manutencao-elevadores-belo-horizonte-03.webp', alt: 'Referência visual relacionada à manutenção de elevadores' },
  ],
  sections: [
    {
      heading: 'Quando avaliar a manutenção do elevador',
      paragraphs: [
        'Condomínios, edifícios comerciais e outros imóveis com elevadores precisam organizar inspeções e intervenções conforme as características do equipamento, as orientações do fabricante e os requisitos aplicáveis.',
        'Falhas recorrentes, ruídos incomuns, paradas inesperadas e mudanças no desempenho merecem avaliação por profissional habilitado. Em situação de risco, a prioridade é interromper o uso quando necessário e acionar o atendimento responsável pelo equipamento; não improvisar reparos.',
      ],
    },
    {
      heading: 'Diferença entre manutenção preventiva e corretiva',
      paragraphs: [
        'A manutenção preventiva envolve verificações e cuidados planejados para acompanhar o estado do equipamento e reduzir a ocorrência de falhas. A corretiva trata de problemas identificados e depende de diagnóstico para definir a intervenção adequada.',
        'Escopo, procedimentos de segurança, peças, periodicidade, registros e responsabilidades técnicas devem ser esclarecidos antes da contratação. A existência de um plano de manutenção não dispensa inspeções nem garante ausência de falhas.',
      ],
    },
    {
      heading: 'Quais dados ajudam a solicitar orçamento em BH?',
      paragraphs: [
        'Ao entrar em contato, informe a localização do imóvel, a quantidade de equipamentos, a marca e o modelo quando conhecidos, a utilização aproximada e o histórico de manutenção disponível.',
        'Também é útil explicar se a necessidade envolve avaliação, manutenção programada, falha específica ou documentação técnica. O atendimento disponível, a necessidade de visita e a composição da proposta devem ser confirmados pela equipe após analisar a solicitação.',
      ],
      lists: [
        { items: [
          'Localização, tipo de edificação e quantidade de elevadores.',
          'Marca, modelo, características de uso e idade aproximada, se conhecidas.',
          'Descrição objetiva do problema ou do serviço pretendido.',
          'Relatórios, registros de manutenção e documentação disponíveis.',
        ] },
      ],
    },
    {
      heading: 'Segurança e responsabilidade técnica',
      paragraphs: [
        'Intervenções em elevadores exigem procedimentos adequados, controles contra movimentação inesperada e observância das regras aplicáveis. A definição de responsáveis e as condições de liberação do equipamento precisam estar claras.',
        'A AJN recebe demandas relacionadas à engenharia e à manutenção de sistemas de transporte vertical; as entregas efetivas dependem do escopo técnico acordado para cada caso.',
        { segments: ['Conheça também as informações sobre ', { text: 'elevadores em Belo Horizonte', href: '/elevador-bh/' }, ' ou ', { text: 'solicite avaliação de escopo e orçamento', href: '/contato/' }, '.'] },
      ],
    },
  ],
} as const satisfies MarketingContent;
