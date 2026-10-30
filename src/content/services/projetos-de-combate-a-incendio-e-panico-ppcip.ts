import type { ServiceContent } from '../types';

export const servicePage = {
  slug: 'projetos-de-combate-a-incendio-e-panico-ppcip',
  path: '/servicos/projetos-de-combate-a-incendio-e-panico-ppcip',
  title: 'Projetos de Combate a Incêndio e Pânico - PPCIP - AJN Consultoria e Engenharia',
  description: 'Projetos PPCIP e documentação de segurança contra incêndio e pânico, incluindo regularização e renovação de AVCB/CLCB conforme a edificação.',
  heading: 'Projetos de combate a incêndio e pânico (PPCIP)',
  image: '/images/content/services/projetos-de-combate-a-incendio-e-panico-ppcip.webp',
  imageAlt: 'Projetos de Combate a Incêndio e Pânico - PPCIP',
  imageWidth: 356,
  imageHeight: 500,
  sections: [
    {
      heading: 'O que é um projeto de prevenção e combate a incêndio e pânico?',
      paragraphs: [
        'O projeto reúne as medidas de segurança contra incêndio e pânico aplicáveis a uma edificação ou área de risco. Seu conteúdo depende da ocupação, área, altura, características construtivas e exigências do Corpo de Bombeiros competente.',
        'Em Minas Gerais, o Corpo de Bombeiros Militar utiliza procedimentos próprios para análise e regularização. O enquadramento da edificação determina a documentação e as etapas cabíveis; nem todo imóvel exige o mesmo tipo de processo.',
      ],
    },
    {
      heading: 'Como a AJN pode apoiar a regularização',
      paragraphs: [
        'O atendimento começa pela análise da situação atual do imóvel e pela definição das entregas técnicas necessárias. A elaboração de projeto, o acompanhamento do processo e o apoio à renovação de documentos são atividades com escopos diferentes, que precisam estar claros na proposta.',
      ],
      lists: [{ items: [
        'Levantamento de uso, área, pavimentos, ocupação, plantas e documentação existente.',
        'Análise das medidas de segurança contra incêndio aplicáveis e das instruções técnicas pertinentes.',
        'Elaboração ou revisão de peças técnicas e documentos, quando previstos no escopo contratado.',
        'Orientação sobre os encaminhamentos para análise, vistoria ou regularização perante o órgão competente.',
      ] }],
    },
    {
      heading: 'AVCB, CLCB e a situação documental do imóvel',
      paragraphs: [
        'O Auto de Vistoria do Corpo de Bombeiros (AVCB) e o Certificado de Licenciamento do Corpo de Bombeiros (CLCB) são documentos distintos. A modalidade aplicável e o procedimento de emissão dependem do enquadramento da edificação e das regras vigentes.',
        'A aprovação de projeto ou a emissão de licença não é automática: envolve documentos, eventuais adequações e atos do Corpo de Bombeiros. A AJN pode orientar sobre a documentação necessária conforme o serviço contratado, sem substituir a decisão do órgão público.',
        { segments: [
          'Para aprofundar o assunto, veja o artigo sobre ',
          { text: 'PPCIP, AVCB e CLCB', href: '/blog/ppcip-avcb-clcb-como-organizar-a-regularizacao-do-imovel/' },
          ' e o serviço de ',
          { text: 'regularização de imóveis', href: '/servicos/regularizacao-de-imoveis-junto-ao-corpo-de-bombeiros/' },
          '.',
        ] },
      ],
    },
    {
      heading: 'O que informar para solicitar um orçamento',
      paragraphs: [
        'Envie a cidade do imóvel, sua finalidade de uso, área construída aproximada, número de pavimentos, plantas disponíveis e situação atual do AVCB, CLCB ou projeto. Informe também se houve reforma, ampliação, mudança de ocupação ou notificação do Corpo de Bombeiros.',
        'Com esses dados, a AJN poderá avaliar o atendimento e indicar quais verificações complementares serão necessárias para delimitar a proposta.',
      ],
    },
    {
      heading: 'Referência técnica e contato',
      paragraphs: [
        { segments: [
          'Em Minas Gerais, consulte os procedimentos e instruções vigentes do ',
          { text: 'Corpo de Bombeiros Militar de Minas Gerais', href: 'https://bombeiros.mg.gov.br/' },
          '. Para apresentar a demanda à AJN, ',
          { text: 'acesse a página de contato', href: '/contato/' },
          '.',
        ] },
      ],
    },
  ],
} as const satisfies ServiceContent;
