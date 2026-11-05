import type { MarketingContent } from '../types';

export const consultoriaSegurancaDoTrabalho = {
  slug: 'consultoria-seguranca-do-trabalho',
  path: '/consultoria-seguranca-do-trabalho',
  title: 'Consultoria em segurança do trabalho em Belo Horizonte | AJN',
  description: 'Consultoria em segurança do trabalho em Belo Horizonte: inspeções, análise de riscos, plano de ação e apoio à gestão de SST conforme a atividade.',
  heading: 'Consultoria em segurança do trabalho em Belo Horizonte',
  images: [
    { src: '/images/content/marketing/consultoria-pcmso/consultoria-pcmso-02.webp', alt: 'Consultoria segurança do trabalho' },
    { src: '/images/content/marketing/consultoria-seguranca-do-trabalho/consultoria-seguranca-do-trabalho-02.webp', alt: 'Consultoria segurança do trabalho' },
    { src: '/images/content/marketing/elaboracao-pgr/elaboracao-pgr-01.webp', alt: 'Consultoria segurança do trabalho' },
  ],
  sections: [
    {
      heading: 'Consultoria de SST ligada à rotina da empresa',
      paragraphs: [
        'Uma consultoria em segurança do trabalho precisa começar pela operação: quais atividades são executadas, em que ambientes, por quais equipes e com quais perigos. O levantamento orienta as prioridades de prevenção, sem substituir a responsabilidade da empresa pela gestão de SST.',
        'A AJN, com sede em Belo Horizonte, avalia demandas de indústrias, obras, comércios, prestadores de serviços e contratos terceirizados. A necessidade de visitas, documentos e acompanhamento é definida conforme o escopo contratado.',
      ],
    },
    {
      heading: 'Como o atendimento é organizado',
      paragraphs: [
        'O trabalho pode combinar análise documental e verificação em campo. Antes de propor uma entrega, é necessário conhecer os riscos, os registros existentes e as atividades que precisam de avaliação.',
      ],
      lists: [{ items: [
        'Levantamento inicial: atividade econômica, setores, funções, número de trabalhadores e documentos de SST já disponíveis.',
        'Verificação técnica: inspeções, identificação de perigos e análise das condições de trabalho, quando previstas no escopo.',
        'Plano de encaminhamento: registro dos achados, medidas prioritárias, responsáveis e prazos a definir com a organização.',
        'Acompanhamento: avaliação das ações executadas e das necessidades de revisão, se contratado.',
      ] }],
    },
    {
      heading: 'Documentos e serviços que podem se relacionar à consultoria',
      paragraphs: [
        'Nem toda empresa precisa da mesma combinação de serviços. Um programa de riscos, um laudo previdenciário e uma capacitação atendem a finalidades diferentes e devem ser indicados conforme a necessidade real.',
        { segments: [
          'Para entender as entregas, consulte a página de ',
          { text: 'elaboração de PGR', href: '/elaboracao-pgr/' },
          ', o serviço de ',
          { text: 'PCMSO e ASOs', href: '/servicos/pcmso-e-asos/' },
          ' e a ',
          { text: 'gestão de SST no eSocial', href: '/servicos/gestao-do-e-social/' },
          '.',
        ] },
        'A atuação técnica também pode envolver LTCAT, inspeções e treinamentos, observadas as atribuições dos profissionais habilitados e a legislação aplicável.',
      ],
    },
    {
      heading: 'Atendimento em Belo Horizonte e avaliação de outras localidades',
      paragraphs: [
        'A AJN está localizada em Belo Horizonte, Minas Gerais. Para demandas em outras cidades, a disponibilidade de atendimento presencial, os deslocamentos e os prazos são avaliados antes da proposta.',
        'Informe a cidade, o ramo de atividade e se a empresa precisa de um documento específico, uma inspeção pontual ou acompanhamento de SST. Isso ajuda a delimitar o serviço desde o primeiro contato.',
      ],
    },
    {
      heading: 'Solicite uma avaliação de escopo',
      paragraphs: [
        'Ao entrar em contato, descreva a atividade, os locais de trabalho, o número aproximado de trabalhadores, os documentos existentes e o prazo desejado. A equipe verificará as informações necessárias para preparar a proposta.',
        { segments: [
          'Apresente sua demanda pela ',
          { text: 'página de contato da AJN', href: '/contato/' },
          ' ou consulte o ',
          { text: 'catálogo de serviços', href: '/servicos/' },
          '.',
        ] },
      ],
    },
  ],
} as const satisfies MarketingContent;
