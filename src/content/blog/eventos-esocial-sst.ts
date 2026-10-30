import image from '../../assets/blog/ajn/eventos-esocial-sst.webp';
import type { BlogContentData } from '../types';

export const blogEventosEsocialSst = {
  slug: 'esocial-sst-diferencas-entre-s2210-s2220-e-s2240',
  path: '/blog/esocial-sst-diferencas-entre-s2210-s2220-e-s2240',
  title: 'S-2210, S-2220 e S-2240: diferenças e exemplos | AJN',
  description: 'Entenda o que informar nos eventos S-2210, S-2220 e S-2240 do eSocial SST, quais registros sustentam os dados e como evitar inconsistências.',
  heading: 'S-2210, S-2220 e S-2240: quando usar cada evento de SST',
  pubDate: '2026-10-09',
  updatedAt: '2026-10-30',
  author: 'AJN Consultoria e Engenharia',
  topic: 'eSocial e obrigações',
  image: { src: image, alt: 'Profissional da AJN conferindo documentação de trabalho' },
  categories: ['eSocial e obrigações'],
  tags: ['eSocial SST', 'S-2210', 'S-2220', 'S-2240'],
  gallery: [],
  sections: [
    {
      heading: 'Diferença entre S-2210, S-2220 e S-2240',
      paragraphs: [
        'Os três eventos de Segurança e Saúde no Trabalho do eSocial registram fatos diferentes. A CAT, o acompanhamento médico e as condições de exposição não devem ser tratados como uma única obrigação ou como substitutos dos documentos técnicos da empresa.',
      ],
      lists: [{ items: [
        'S-2210 — Comunicação de Acidente de Trabalho (CAT): informa o acidente de trabalho nas situações previstas nas regras do eSocial.',
        'S-2220 — Monitoramento da Saúde do Trabalhador: reúne dados de ASOs e exames complementares conforme o leiaute aplicável.',
        'S-2240 — Condições Ambientais do Trabalho: informa as exposições a agentes nocivos e outros dados exigidos pelo leiaute, ligados ao histórico laboral.',
      ] }],
    },
    {
      heading: 'Exemplos práticos de quando cada registro entra em cena',
      paragraphs: [
        'Se ocorre um acidente de trabalho que exige CAT, o S-2210 é o evento relacionado à comunicação. Um exame ocupacional realizado conforme o programa médico pode gerar informações para o S-2220. A caracterização das condições de exposição do trabalhador, por sua vez, é tratada no S-2240.',
        'Esses exemplos ajudam a diferenciar a finalidade dos eventos, mas não estabelecem prazos, obrigatoriedade ou exceções para todo empregador. Para cada envio ou retificação, é necessário verificar o Manual de Orientação e o leiaute vigente, a categoria do declarante e o fato ocorrido.',
      ],
    },
    {
      heading: 'Quais documentos sustentam as informações',
      paragraphs: [
        'O S-2210 exige dados consistentes sobre o acidente e sua comunicação. Para o S-2220, os registros de saúde ocupacional e o ASO têm papel central. Para o S-2240, informações sobre atividades, ambientes e exposições precisam estar coerentes com as avaliações e documentos técnicos aplicáveis, como o LTCAT quando pertinente.',
        'O PGR organiza a gestão de riscos ocupacionais e o PCMSO orienta o acompanhamento médico; nenhum dos dois é substituído pela transmissão de um evento eletrônico.',
        { segments: [
          'Veja também a ',
          { text: 'gestão do eSocial SST pela AJN', href: '/servicos/gestao-do-e-social/' },
          ', a ',
          { text: 'emissão de LTCAT', href: '/emissao-ltcat/' },
          ' e o serviço de ',
          { text: 'PCMSO e ASOs', href: '/servicos/pcmso-e-asos/' },
          '.',
        ] },
      ],
    },
    {
      heading: 'Conferência antes do envio ou da retificação',
      paragraphs: [
        'Uma checagem documental simples ajuda a encontrar divergências antes de transmitir as informações. Os campos e regras que precisam ser validados variam conforme o evento.',
      ],
      lists: [{ items: [
        'Confirme identificação do trabalhador, vínculo, datas e situação que gerou o registro.',
        'Compare função, setor, ambiente e exposições com os documentos técnicos de origem.',
        'Confira a consistência dos dados de ASO e exames quando houver S-2220.',
        'Registre quem forneceu, revisou e autorizou as informações transmitidas.',
        'Consulte as regras de envio e retificação da versão vigente do eSocial antes de concluir.',
      ] }],
    },
    {
      heading: 'Perguntas frequentes',
      paragraphs: [
        'O S-2240 substitui o LTCAT? Não. O evento contém informações estruturadas para o eSocial, enquanto o LTCAT atende a finalidade previdenciária e requisitos técnicos próprios.',
        'O S-2220 substitui o PCMSO? Não. O evento comunica informações do monitoramento da saúde; o programa médico permanece regido pela NR-7.',
        'É possível definir um prazo único para os três eventos? Não. Os prazos e condições dependem das regras do evento e da situação do declarante. Consulte o manual vigente.',
      ],
    },
    {
      heading: 'Fontes oficiais para conferir as regras atuais',
      paragraphs: [
        { segments: [{ text: 'eSocial — documentação técnica e leiautes vigentes', href: 'https://www.gov.br/esocial/pt-br/documentacao-tecnica/' }] },
        { segments: [{ text: 'eSocial — Manual Web Geral e SST', href: 'https://www.gov.br/esocial/pt-br/empresas/manual-web-geral' }] },
        { segments: [{ text: 'AJN — entre em contato sobre a organização dos eventos SST', href: '/contato/' }] },
      ],
    },
  ],
} as const satisfies BlogContentData;
