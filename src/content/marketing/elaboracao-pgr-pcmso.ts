import type { MarketingContent } from '../types';

export const elaboracaoPgrPcmso = {
  slug: 'elaboracao-pgr-pcmso',
  path: '/elaboracao-pgr-pcmso',
  title: 'Elaboração de PGR e PCMSO para empresas | AJN',
  description: 'Solicite avaliação para elaboração de PGR e PCMSO. Entenda os documentos, as responsabilidades técnicas e os dados necessários ao orçamento.',
  heading: 'Elaboração de PGR e PCMSO para empresas',
  images: [
    { src: '/images/content/marketing/elaboracao-pgr-pcmso/elaboracao-pgr-pcmso-01.webp', alt: 'Elaboração de PGR e PCMSO' },
    { src: '/images/content/marketing/elaboracao-pgr-pcmso/elaboracao-pgr-pcmso-02.webp', alt: 'Elaboração de PGR e PCMSO' },
    { src: '/images/content/marketing/elaboracao-pgr-pcmso/elaboracao-pgr-pcmso-03.webp', alt: 'Elaboração de PGR e PCMSO' },
  ],
  sections: [
    {
      heading: 'Do levantamento de riscos ao planejamento da saúde ocupacional',
      paragraphs: [
        'A elaboração de PGR e PCMSO envolve frentes técnicas diferentes, mas relacionadas. O PGR organiza a identificação de perigos, a avaliação dos riscos ocupacionais e as medidas de prevenção. O PCMSO utiliza essas informações para orientar o acompanhamento médico da saúde dos trabalhadores.',
        'A AJN avalia a demanda e delimita, na proposta, os levantamentos, documentos, visitas e atividades de acompanhamento necessários. A responsabilidade pelo conteúdo médico do PCMSO permanece com o profissional legalmente habilitado.',
      ],
    },
    {
      heading: 'Etapas consideradas na definição do escopo',
      paragraphs: [
        'O trabalho começa pelo conhecimento das atividades da empresa. O tipo de operação, os riscos presentes e a documentação disponível interferem nas etapas e no prazo da entrega.',
      ],
      lists: [{ items: [
        'Levantamento de estabelecimentos, setores, funções, processos e documentos existentes.',
        'Identificação e avaliação dos riscos, com organização do inventário e do plano de ação do PGR.',
        'Articulação entre as informações de riscos e o planejamento médico do PCMSO, respeitando as atribuições profissionais.',
        'Definição dos documentos a entregar, responsabilidades, revisões e eventual acompanhamento contratado.',
      ] }],
    },
    {
      heading: 'PGR, PCMSO e as normas aplicáveis',
      paragraphs: [
        'A NR-1 estabelece os requisitos de gerenciamento de riscos ocupacionais e do PGR. Desde 26 de maio de 2026, o capítulo 1.5 atualizado inclui expressamente os fatores de risco psicossociais relacionados ao trabalho entre os aspectos do gerenciamento de riscos. A avaliação deve observar as atividades e a organização do trabalho.',
        'A NR-7 orienta o PCMSO e os exames ocupacionais, considerados os riscos identificados e classificados pelo PGR. A indicação de exames e condutas clínicas não deve ser feita por um modelo genérico ou fora da responsabilidade médica.',
        { segments: [
          'Para entender a função de cada documento, leia ',
          { text: 'como PGR e PCMSO se relacionam', href: '/elaboracao-do-pgr-pcmso/' },
          '. Consulte também a ',
          { text: 'página oficial do PGR', href: 'https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/pgr/' },
          ' e a ',
          { text: 'NR-7 no Ministério do Trabalho e Emprego', href: 'https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/norma-regulamentadora-no-7-nr-7' },
          '.',
        ] },
      ],
    },
    {
      heading: 'O que enviar para receber uma proposta',
      paragraphs: [
        'Informe o CNPJ ou ramo de atividade, o endereço ou município dos estabelecimentos, o número de trabalhadores, as funções exercidas e os documentos de SST e saúde ocupacional já disponíveis. Descreva também a urgência da demanda e eventuais mudanças nas atividades.',
        'A partir dessas informações, a AJN poderá avaliar a necessidade de levantamentos adicionais e apresentar os serviços previstos, sem prometer uma entrega padronizada para operações diferentes.',
        { segments: [
          'Solicite a avaliação pela ',
          { text: 'página de contato', href: '/contato/' },
          ' ou veja os serviços específicos de ',
          { text: 'PGR', href: '/elaboracao-pgr/' },
          ' e ',
          { text: 'PCMSO e ASOs', href: '/servicos/pcmso-e-asos/' },
          '.',
        ] },
      ],
    },
  ],
} as const satisfies MarketingContent;
