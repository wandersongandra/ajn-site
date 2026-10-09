import type { MarketingContent } from '../types';

export const projetosEletricosPrediais = {
  slug: 'projetos-eletricos-prediais',
  path: '/projetos-eletricos-prediais',
  title: 'Projetos elétricos residenciais, comerciais e prediais | AJN',
  description: 'Projetos elétricos para residências, edifícios e espaços comerciais: dimensionamento de circuitos, quadros, proteção e documentação técnica conforme o escopo.',
  heading: 'Projetos elétricos residenciais, comerciais e prediais',
  images: [
    { src: '/images/content/marketing/projetos-eletricos-prediais/projetos-eletricos-prediais-01.webp', alt: 'Planejamento de instalações elétricas prediais' },
    { src: '/images/content/marketing/projetos-eletricos-prediais/projetos-eletricos-prediais-02.webp', alt: 'Infraestrutura elétrica para edificações' },
    { src: '/images/content/marketing/projetos-eletricos-prediais/projetos-eletricos-prediais-03.webp', alt: 'Instalações elétricas em empreendimento predial' },
  ],
  sections: [
    {
      heading: 'Planejamento elétrico conforme a edificação',
      paragraphs: [
        'A AJN Consultoria e Engenharia desenvolve projetos elétricos para residências de alto padrão, espaços comerciais e edificações prediais. O dimensionamento considera as cargas previstas, a distribuição dos ambientes, as necessidades de operação e as condições de instalação.',
        'Um projeto bem definido orienta a execução, facilita a compatibilização com outras disciplinas e reduz dúvidas em obra. A seleção das medidas de proteção e dos componentes deve observar as normas técnicas aplicáveis, incluindo a ABNT NBR 5410 quando se tratar de instalações elétricas de baixa tensão.',
      ],
    },
    {
      heading: 'O que pode fazer parte do projeto',
      paragraphs: ['O conjunto de documentos é definido conforme o porte da edificação e o escopo contratado. Entre os itens normalmente avaliados estão:'],
      lists: [{ items: [
        'Levantamento de cargas, pontos de utilização e critérios de distribuição elétrica.',
        'Dimensionamento de circuitos, condutores, eletrodutos e dispositivos de proteção.',
        'Definição e organização de quadros elétricos, circuitos e diagramas.',
        'Traçado da infraestrutura elétrica e compatibilização com os demais projetos da edificação.',
        'Plantas, detalhes e especificações técnicas necessárias à execução, conforme a contratação.',
      ] }],
    },
    {
      heading: 'Segurança, prazo e custo sob análise técnica',
      paragraphs: [
        'As decisões de projeto procuram equilibrar requisitos de segurança, facilidade de manutenção, desempenho e viabilidade econômica. A escolha adequada de materiais e a coordenação entre disciplinas ajudam a evitar improvisações e retrabalho durante a instalação.',
        'O prazo, os documentos entregues e eventuais estudos complementares são definidos na proposta, após a análise das características do empreendimento. Nenhum projeto, isoladamente, garante fornecimento ininterrupto de energia ou elimina todos os riscos de uma instalação.',
      ],
    },
    {
      heading: 'Soluções de engenharia relacionadas',
      paragraphs: [
        { segments: ['Além das instalações elétricas, conheça os serviços de ', { text: 'projetos de SPDA', href: '/projetos-spda' }, ' e ', { text: 'projetos de cabeamento estruturado', href: '/projetos-cabeamento-estruturado' }, '. Essas disciplinas podem exigir compatibilização de infraestrutura, espaços técnicos e interfaces com a edificação.'] },
      ],
    },
    {
      heading: 'Solicite uma avaliação de escopo',
      paragraphs: ['Para conversar sobre seu empreendimento, informe à AJN o tipo de edificação, a localidade, a fase do projeto e os documentos disponíveis. A equipe poderá avaliar os serviços necessários e preparar uma proposta adequada à demanda.'],
    },
  ],
} as const satisfies MarketingContent;
