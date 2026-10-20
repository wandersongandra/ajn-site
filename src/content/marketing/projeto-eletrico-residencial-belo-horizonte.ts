import type { MarketingContent } from '../types';

export const projetoEletricoResidencialBeloHorizonte = {
  slug: 'projeto-eletrico-residencial-belo-horizonte',
  path: '/projeto-eletrico-residencial-belo-horizonte',
  title: 'Projeto elétrico residencial em BH | AJN Engenharia',
  description: 'Projeto elétrico residencial em Belo Horizonte para obras e reformas. Entenda o planejamento de pontos, circuitos, proteções e documentação antes do orçamento.',
  heading: 'Projeto elétrico residencial em Belo Horizonte',
  images: [
    { src: '/images/content/marketing/projeto-eletrico-residencial-belo-horizonte/projeto-eletrico-residencial-belo-horizonte-01.webp', alt: 'Referência visual de projeto elétrico residencial em Belo Horizonte' },
    { src: '/images/content/marketing/projeto-eletrico-residencial-belo-horizonte/projeto-eletrico-residencial-belo-horizonte-02.webp', alt: 'Planejamento de circuitos elétricos residenciais' },
    { src: '/images/content/marketing/projeto-eletrico-residencial-belo-horizonte/projeto-eletrico-residencial-belo-horizonte-03.webp', alt: 'Documentação técnica de instalações elétricas residenciais' },
  ],
  sections: [
    {
      heading: 'Projeto elétrico para construção, reforma ou ampliação',
      paragraphs: [
        'O planejamento elétrico de uma residência precisa considerar o uso dos ambientes, a quantidade e a localização dos pontos de energia, os equipamentos previstos e a organização dos circuitos.',
        'Em reformas, também é importante conhecer as condições da instalação existente antes de definir o que pode ser mantido, adaptado ou substituído. A avaliação do escopo deve ocorrer antes da execução das alterações.',
      ],
    },
    {
      heading: 'Quais definições fazem parte do planejamento',
      paragraphs: [
        'O projeto pode contemplar a distribuição dos pontos de tomadas e iluminação, a previsão de cargas, a divisão de circuitos, o dimensionamento de condutores e dispositivos de proteção e a documentação necessária à obra.',
        'Os critérios técnicos devem considerar a ABNT NBR 5410 e demais requisitos aplicáveis ao caso, sem dispensar levantamento de campo ou informações complementares quando necessários.',
      ],
      lists: [
        { items: [
          'Pontos de tomadas, iluminação e equipamentos de uso específico.',
          'Carga elétrica prevista e organização dos circuitos.',
          'Quadros, dispositivos de proteção e distribuição elétrica.',
          'Diagramas, plantas e demais entregas definidas no escopo contratado.',
        ] },
      ],
    },
    {
      heading: 'O que informar ao pedir orçamento em Belo Horizonte',
      paragraphs: [
        'Para avaliar a demanda, informe se o imóvel é novo ou existente, a localização, a área aproximada, a etapa da obra e se há planta baixa. Se a solicitação envolver reforma, descreva quais ambientes ou equipamentos serão alterados.',
        'Esses dados ajudam a definir a necessidade de visita técnica, o conjunto de documentos e as etapas de trabalho. O prazo e os valores dependem do escopo acordado.',
      ],
    },
    {
      heading: 'Solicite a análise do seu projeto residencial',
      paragraphs: [
        'A AJN recebe solicitações relacionadas a projetos elétricos em Belo Horizonte. O atendimento e as entregas técnicas devem ser confirmados conforme as condições da obra e a proposta.',
        { segments: ['Para apresentar sua necessidade, acesse ', { text: 'Contato e orçamento', href: '/contato/' }, '. Para outras modalidades, veja também ', { text: 'projetos elétricos em Belo Horizonte', href: '/empresa-projeto-eletrico-bh/' }, '.'] },
      ],
    },
  ],
} as const satisfies MarketingContent;
