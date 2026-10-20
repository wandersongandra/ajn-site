import type { MarketingContent } from '../types';

export const precoPcmso = {
  slug: 'preco-pcmso',
  path: '/preco-pcmso',
  title: 'Preço de PCMSO: o que influencia o orçamento | AJN',
  description: 'Entenda os fatores que influenciam o orçamento de PCMSO: funções, riscos do PGR, número de empregados, exames previstos e acompanhamento médico.',
  heading: 'Preço de PCMSO: como avaliar o custo para sua empresa',
  images: [
    { src: '/images/content/marketing/pcmso-preco/pcmso-preco-01.webp', alt: 'Referência visual de atendimento relacionado à saúde ocupacional' },
    { src: '/images/content/marketing/pcmso-preco/pcmso-preco-02.webp', alt: 'Referência visual de documentação de saúde ocupacional' },
    { src: '/images/content/marketing/seguranca-do-trabalho-pcmso/seguranca-do-trabalho-pcmso-03.webp', alt: 'Referência visual de gestão de saúde e segurança no trabalho' },
  ],
  sections: [
    {
      heading: 'Quanto custa elaborar e acompanhar o PCMSO?',
      paragraphs: [
        'O Programa de Controle Médico de Saúde Ocupacional (PCMSO) não tem um preço único aplicável a todas as empresas. Para avaliar um orçamento, é necessário conhecer as atividades, os riscos ocupacionais identificados e as características do quadro de empregados.',
        'Também é importante separar os itens incluídos na elaboração e no acompanhamento do programa daqueles referentes a exames, consultas e outros serviços eventualmente contratados. Uma proposta só pode ser comparada com outra quando os escopos estão claros.',
      ],
    },
    {
      heading: 'Principais fatores que influenciam o orçamento',
      paragraphs: [
        'O planejamento do PCMSO considera os riscos ocupacionais identificados e classificados no Programa de Gerenciamento de Riscos (PGR), conforme a NR-7. As necessidades de acompanhamento médico e exames devem ser definidas pelo profissional responsável com base nos requisitos aplicáveis.',
        'Quantidade de trabalhadores, distribuição por funções, locais de trabalho, exposições identificadas e mudanças operacionais podem alterar o esforço envolvido. Não é tecnicamente adequado definir exames apenas para alcançar determinado preço.',
      ],
      lists: [
        { items: [
          'Número de empregados, funções e unidades abrangidas.',
          'Riscos ocupacionais descritos no inventário do PGR.',
          'Exames clínicos e complementares indicados conforme avaliação médica e NR-7.',
          'Responsabilidades, entregas, acompanhamentos e periodicidade previstos no contrato.',
        ] },
      ],
    },
    {
      heading: 'O que pedir antes de contratar',
      paragraphs: [
        'Solicite uma proposta com discriminação das entregas: elaboração e gestão do programa, definição de responsável médico, exames incluídos ou cobrados separadamente, forma de atendimento e regras de atualização. O contratante deve verificar as responsabilidades e a conformidade do serviço.',
        'A implantação efetiva do PCMSO é responsabilidade da organização contratante, com o acompanhamento médico previsto na NR-7; o programa não se resume à emissão de ASOs.',
      ],
    },
    {
      heading: 'Como pedir orçamento à AJN',
      paragraphs: [
        'Para iniciar uma avaliação de escopo, informe o setor de atividade, a cidade, o número aproximado de empregados, as funções e se a empresa já possui PGR e PCMSO. Não envie dados médicos individuais pelo formulário de orçamento.',
        { segments: ['Veja a página do serviço de ', { text: 'PCMSO e ASOs', href: '/servicos/pcmso-e-asos/' }, ' ou encaminhe sua demanda em ', { text: 'Contato e orçamento', href: '/contato/' }, '.'] },
      ],
    },
  ],
} as const satisfies MarketingContent;
