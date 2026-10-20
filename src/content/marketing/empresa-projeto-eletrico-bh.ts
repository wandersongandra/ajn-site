import type { MarketingContent } from '../types';

export const empresaProjetoEletricoBh = {
  slug: 'empresa-projeto-eletrico-bh',
  path: '/empresa-projeto-eletrico-bh',
  title: 'Empresa de projetos elétricos em BH | AJN Engenharia',
  description: 'Precisa de projeto elétrico em Belo Horizonte? Veja como definir escopo, cargas, circuitos e documentação técnica antes de solicitar uma proposta à AJN.',
  heading: 'Projetos elétricos em Belo Horizonte para residências e empresas',
  images: [
    { src: '/images/content/marketing/empresa-projeto-eletrico-bh/empresa-projeto-eletrico-bh-01.webp', alt: 'Referência visual de projeto elétrico em Belo Horizonte' },
    { src: '/images/content/marketing/empresa-projeto-eletrico-bh/empresa-projeto-eletrico-bh-02.webp', alt: 'Planejamento técnico de instalações elétricas' },
    { src: '/images/content/marketing/empresa-projeto-eletrico-bh/empresa-projeto-eletrico-bh-03.webp', alt: 'Detalhamento de projeto de instalações elétricas' },
  ],
  sections: [
    {
      heading: 'Quando procurar uma empresa de projetos elétricos',
      paragraphs: [
        'Construções novas, reformas, ampliações e alterações na utilização de um imóvel podem exigir a revisão do projeto elétrico. Antes de dimensionar circuitos, é necessário entender a finalidade dos ambientes, as cargas previstas e as condições da instalação existente.',
        'A definição do escopo evita tratar demandas muito diferentes como se fossem o mesmo serviço: uma residência, um estabelecimento comercial e uma instalação predial possuem características próprias.',
      ],
    },
    {
      heading: 'O que considerar no escopo do projeto',
      paragraphs: [
        'Conforme a demanda, o planejamento pode envolver levantamento de cargas, distribuição de pontos elétricos, divisão de circuitos, dimensionamento de condutores e dispositivos de proteção, diagramas e documentação técnica.',
        'A análise considera as normas técnicas aplicáveis e as informações disponíveis sobre a obra. Vistorias, levantamentos complementares, aprovações e acompanhamento de execução devem constar expressamente da proposta quando necessários.',
      ],
      lists: [
        { items: [
          'Tipo de imóvel, localização e finalidade de uso.',
          'Plantas disponíveis, cargas e equipamentos previstos.',
          'Condições da instalação atual, quando houver reforma ou ampliação.',
          'Documentos técnicos e entregas esperadas para a etapa da obra.',
        ] },
      ],
    },
    {
      heading: 'Como solicitar uma proposta à AJN',
      paragraphs: [
        'Informe se o projeto é residencial, comercial ou predial, a cidade, a área aproximada e a etapa da obra. Se houver plantas ou documentação da instalação, indique sua disponibilidade para a avaliação inicial.',
        'A partir dessas informações, a equipe poderá avaliar o atendimento, esclarecer o escopo e orientar sobre os próximos passos, sem pressupor preço ou prazo antes de conhecer a demanda.',
        { segments: ['Conheça também a página de ', { text: 'projetos elétricos residenciais, comerciais e prediais', href: '/servicos/projetos-eletricos-residenciais-comerciais-e-prediais-com-foco-em-qualidade-prazo-e-economia' }, '.'] },
      ],
    },
    {
      heading: 'Atendimento em Belo Horizonte',
      paragraphs: [
        'Precisa conversar sobre um projeto elétrico em BH ou na região? Descreva o tipo de edificação e o objetivo da intervenção. O enquadramento técnico e a disponibilidade do atendimento são avaliados conforme o caso.',
        { segments: ['Use a ', { text: 'página de contato e orçamento', href: '/contato/' }, ' para encaminhar sua solicitação à AJN.'] },
      ],
    },
  ],
} as const satisfies MarketingContent;
