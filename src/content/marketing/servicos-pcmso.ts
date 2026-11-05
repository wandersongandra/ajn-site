import type { MarketingContent } from '../types';

export const servicosPcmso = {
  slug: 'servicos-pcmso',
  path: '/servicos-pcmso',
  title: 'Serviços de PCMSO: planejamento e gestão documental | AJN',
  description: 'Saiba o que avaliar ao contratar serviços de PCMSO: riscos da atividade, exames ocupacionais, ASOs, documentos e responsabilidades técnicas.',
  heading: 'Serviços de PCMSO: o que verificar antes de contratar',
  images: [
    { src: '/images/content/marketing/pcmso-preco/pcmso-preco-02.webp', alt: 'Serviços de PCMSO' },
    { src: '/images/content/marketing/pcmso-preco/pcmso-preco-03.webp', alt: 'Serviços de PCMSO' },
    { src: '/images/content/marketing/empresa-pcmso/empresa-pcmso-03.webp', alt: 'Serviços de PCMSO' },
  ],
  sections: [
    {
      heading: 'O que está incluído em um serviço de PCMSO?',
      paragraphs: [
        'O Programa de Controle Médico de Saúde Ocupacional (PCMSO) é previsto na NR-7 e deve considerar os riscos ocupacionais identificados e classificados pelo PGR. Seu escopo depende das funções exercidas, das exposições presentes e das necessidades de acompanhamento da saúde dos trabalhadores.',
        'Ao contratar um serviço, é importante separar a responsabilidade médica pelo PCMSO das atividades administrativas de agendamento, controle de prazos e organização documental. A proposta deve deixar claro o que será realizado e por quais profissionais.',
      ],
    },
    {
      heading: 'Informações necessárias para planejar o atendimento',
      paragraphs: [
        'Antes de solicitar um orçamento, reúna dados sobre os estabelecimentos e as atividades. Isso evita propostas baseadas apenas na quantidade de trabalhadores, sem considerar o contexto ocupacional.',
      ],
      lists: [{ items: [
        'Relação de funções, quantidade de trabalhadores e locais de prestação do serviço.',
        'PGR e informações de riscos ocupacionais disponíveis, com alterações recentes nos processos de trabalho.',
        'Situação atual do PCMSO, dos ASOs e dos exames ocupacionais previstos.',
        'Necessidade de acompanhamento de prazos, organização documental ou apoio à gestão do serviço.',
      ] }],
    },
    {
      heading: 'Exames ocupacionais, ASOs e sigilo médico',
      paragraphs: [
        'A NR-7 prevê exames admissionais, periódicos, de retorno ao trabalho, de mudança de riscos ocupacionais e demissionais, conforme as regras aplicáveis. Os exames complementares dependem de avaliação médica e dos riscos da atividade.',
        'O ASO registra o resultado da avaliação ocupacional prevista. Dados clínicos e prontuários devem permanecer sob acesso restrito dos profissionais autorizados; a gestão administrativa não precisa receber informações médicas além das necessárias ao processo.',
        { segments: [
          'Consulte o serviço de ',
          { text: 'PCMSO e ASOs da AJN', href: '/servicos/pcmso-e-asos/' },
          ' para conhecer a frente de atendimento.',
        ] },
      ],
    },
    {
      heading: 'Quando revisar as informações do programa',
      paragraphs: [
        'Mudanças nas atividades, nos processos, nas exposições ou nos resultados da vigilância de saúde podem exigir reavaliação. A organização deve manter a comunicação entre quem gerencia os riscos e o responsável médico pelo PCMSO.',
        { segments: [
          'Entenda também a ',
          { text: 'integração entre PGR e PCMSO', href: '/elaboracao-do-pgr-pcmso/' },
          '.',
        ] },
      ],
    },
    {
      heading: 'Peça uma avaliação para sua empresa',
      paragraphs: [
        'A AJN está sediada em Belo Horizonte, MG, e avalia a disponibilidade de atendimento conforme a cidade e o serviço necessário. Envie a atividade da empresa, o número de trabalhadores e a situação atual dos documentos para delimitar a proposta.',
        { segments: [
          'Para apresentar a demanda, ',
          { text: 'fale com a AJN', href: '/contato/' },
          '.',
        ] },
      ],
    },
  ],
} as const satisfies MarketingContent;
