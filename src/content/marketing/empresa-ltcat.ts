import type { MarketingContent } from '../types';

export const empresaLtcat = {
  slug: 'empresa-ltcat',
  path: '/empresa-ltcat',
  title: 'Empresa para Elaborar LTCAT: Como Contratar | AJN',
  description: 'Vai contratar uma empresa para LTCAT? Veja quais informações pedir, como definir o escopo técnico e o que conferir na proposta.',
  heading: 'Empresa para elaboração de LTCAT',
  images: [
    { src: '/images/content/marketing/empresa-ltcat/empresa-ltcat-01.webp', alt: 'Consultoria e documentação de segurança do trabalho' },
    { src: '/images/content/marketing/empresa-ltcat/empresa-ltcat-02.webp', alt: 'Análise documental de condições de trabalho' },
    { src: '/images/content/marketing/empresa-ltcat/empresa-ltcat-03.webp', alt: 'Planejamento de avaliação de ambientes laborais' },
  ],
  sections: [
    {
      heading: 'O que observar ao contratar um LTCAT',
      paragraphs: [
        'Antes de contratar a elaboração do Laudo Técnico das Condições Ambientais do Trabalho, é importante identificar quais estabelecimentos, setores e atividades serão avaliados. Um documento genérico, sem relação com a rotina efetiva, pode não representar corretamente as condições de exposição.',
        'A proposta deve definir o levantamento técnico previsto, as informações necessárias, as possíveis avaliações ambientais, os produtos a entregar e a responsabilidade técnica.',
      ],
    },
    {
      heading: 'Dados que ajudam a preparar o orçamento',
      paragraphs: ['Reunir informações básicas evita orçamentos que não contemplam o serviço realmente necessário.'],
      lists: [{ items: [
        'Localização do estabelecimento e descrição das operações.',
        'Número aproximado de trabalhadores e relação de funções e setores.',
        'Agentes nocivos possíveis, equipamentos, produtos e medidas de proteção existentes.',
        'Documentação de SST e avaliações anteriores, se houver.',
        'Prazos e requisitos de auditoria ou de contrato, quando aplicáveis.',
      ] }],
    },
    {
      heading: 'Responsabilidade técnica e critérios previdenciários',
      paragraphs: [
        'A Lei nº 8.213/1991 prevê elaboração do LTCAT por médico do trabalho ou engenheiro de segurança do trabalho. A avaliação deve seguir critérios aplicáveis à caracterização da exposição a agentes nocivos, sem conclusões antecipadas sobre benefícios previdenciários.',
        { segments: ['Para conhecer o documento em detalhes, veja ', { text: 'emissão de LTCAT', href: '/emissao-ltcat' }, '.'] },
      ],
    },
    {
      heading: 'Solicite uma proposta à AJN',
      paragraphs: [
        'Compartilhe a localização, as atividades e os documentos disponíveis. A AJN poderá avaliar a demanda e definir o próximo passo para a elaboração do laudo.',
        { segments: ['Entre em contato com a ', { text: 'equipe da AJN', href: '/contato' }, '.'] },
      ],
    },
  ],
} as const satisfies MarketingContent;
