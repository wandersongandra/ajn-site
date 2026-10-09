export const servicePage = {
  slug: 'projetos-eletricos-residenciais-comerciais-e-prediais-com-foco-em-qualidade-prazo-e-economia',
  path: '/servicos/projetos-eletricos-residenciais-comerciais-e-prediais-com-foco-em-qualidade-prazo-e-economia',
  title: 'Projetos elétricos residenciais, comerciais e prediais | AJN',
  description: 'Projetos elétricos para edificações residenciais, comerciais e prediais, com definição de cargas, circuitos, proteções e documentação conforme o escopo.',
  heading: 'Projetos elétricos residenciais, comerciais e prediais',
  image: '/images/featured/orcamento-projeto-eletrico-01.webp',
  imageAlt: 'Instalações elétricas em edificação',
  sections: [
    {
      heading: 'Projeto elétrico adequado à demanda da obra',
      paragraphs: [
        'A AJN Consultoria e Engenharia elabora projetos elétricos para residências de alto padrão, estabelecimentos comerciais e edificações prediais. O trabalho parte das características da construção, das cargas previstas e das necessidades de utilização dos ambientes.',
        'O planejamento técnico busca organizar a distribuição de energia, os circuitos, as proteções e a infraestrutura necessária. Para instalações de baixa tensão, considera-se a ABNT NBR 5410 e as demais exigências aplicáveis ao projeto.',
      ],
    },
    {
      heading: 'Elementos previstos conforme o escopo',
      paragraphs: ['Os documentos a produzir são definidos na contratação e podem incluir:'],
      lists: [{ items: [
        'Levantamento de cargas e pontos de utilização.',
        'Dimensionamento de circuitos, condutores e dispositivos de proteção.',
        'Quadros e diagramas elétricos.',
        'Encaminhamento de eletrodutos e demais elementos de infraestrutura.',
        'Plantas, detalhes e especificações para apoiar a execução.',
      ] }],
    },
    {
      heading: 'Compatibilização e planejamento',
      paragraphs: [
        'O projeto deve ser coordenado com as demais disciplinas da obra para reduzir interferências, retrabalho e decisões improvisadas na execução. Materiais, prazos, critérios de manutenção e custos são avaliados de acordo com as condições do empreendimento.',
        'Projetos complementares podem ser necessários. Conheça também as páginas de SPDA e cabeamento estruturado.',
        { segments: ['Consulte ', { text: 'a apresentação completa dos projetos elétricos', href: '/projetos-eletricos-prediais' }, ', ', { text: 'projetos de SPDA', href: '/projetos-spda' }, ' e ', { text: 'cabeamento estruturado', href: '/projetos-cabeamento-estruturado' }, '.'] },
      ],
    },
  ],
} as const;
