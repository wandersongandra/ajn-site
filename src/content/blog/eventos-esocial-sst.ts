import ajnEditorial from '../../assets/blog/ajn/eventos-esocial-sst.webp';
import image from '../../assets/blog/editorial-esocial.webp';
import type { BlogContentData } from '../types';

export const blogEventosEsocialSst = {
  slug: 'esocial-sst-diferencas-entre-s2210-s2220-e-s2240',
  path: '/blog/esocial-sst-diferencas-entre-s2210-s2220-e-s2240',
  title: 'eSocial SST: diferenças entre S-2210, S-2220 e S-2240 | AJN',
  description: 'Entenda a finalidade dos eventos S-2210, S-2220 e S-2240 e como manter coerência entre registros de SST e documentos técnicos.',
  heading: 'eSocial SST: o que muda entre S-2210, S-2220 e S-2240',
  pubDate: '2026-10-09',
  author: 'AJN Consultoria e Engenharia',
  topic: 'eSocial e obrigações',
  image: { src: ajnEditorial, alt: 'Profissional da AJN conferindo documentos técnicos em ambiente administrativo' },
  categories: ['eSocial e obrigações'],
  tags: ['eSocial SST', 'S-2210', 'S-2220', 'S-2240'],
  gallery: [],
  sections: [
    { heading: 'Uma visão prática dos três eventos', paragraphs: [
      'Os eventos de SST do eSocial têm finalidades diferentes. O S-2210 comunica acidente de trabalho por meio da CAT; o S-2220 registra o monitoramento da saúde do trabalhador, incluindo informações de exames ocupacionais; e o S-2240 informa condições ambientais de trabalho e exposição a fatores de risco, conforme o leiaute vigente.',
      'Essa separação ajuda a localizar a informação correta, mas não transforma cada evento em um documento técnico independente. O envio precisa refletir os registros e as avaliações que sustentam os dados informados.'
    ] },
    { heading: 'O que cada registro representa', paragraphs: [
      'S-2210: trata da Comunicação de Acidente de Trabalho. A organização deve seguir as regras aplicáveis ao caso e conferir o manual e o leiaute vigentes antes do envio ou retificação.',
      'S-2220: reúne informações do acompanhamento de saúde durante o vínculo, inclusive dados relacionados ao ASO e exames complementares quando exigidos pelo leiaute. O evento não substitui o PCMSO nem o atendimento médico.',
      'S-2240: descreve condições ambientais e fatores de risco associados ao histórico do trabalhador. Os dados precisam ser coerentes com atividades, ambientes, avaliações e documentos usados pela empresa.'
    ] },
    { heading: 'Como organizar a consistência dos dados', paragraphs: [
      'Mantenha responsáveis definidos para coletar, revisar e transmitir cada informação. Antes de enviar, confronte identificação do trabalhador, vínculo, datas, função, ambiente e registros de origem. Ao mudar processo, equipamento, exposição ou condição de saúde ocupacional, avalie quais documentos e eventos precisam ser revistos.',
      'O leiaute, as regras de validação, os grupos obrigatórios e os prazos podem mudar e variar conforme a categoria do declarante e a situação. Este guia explica a finalidade dos eventos; não substitui a consulta ao Manual de Orientação do eSocial e às orientações oficiais atuais.'
    ] },
    { heading: 'Perguntas frequentes', paragraphs: [
      'O S-2240 é o próprio LTCAT? Não. O evento transmite informações estruturadas ao eSocial; o LTCAT é um documento técnico com finalidade previdenciária e requisitos próprios.',
      'O S-2220 substitui o PCMSO? Não. O evento comunica dados segundo o leiaute, enquanto o PCMSO organiza o programa de acompanhamento médico previsto na NR-7.',
      'Um único evento cobre toda a gestão de SST? Não. Os três registros tratam de assuntos distintos e dependem de dados confiáveis, documentos de origem e processos internos.'
    ] },
    { heading: 'Referências oficiais', paragraphs: [
      { segments: [{ text: 'eSocial — documentação técnica e Manual de Orientação vigente', href: 'https://www.gov.br/esocial/pt-br/documentacao-tecnica' }] },
      { segments: [{ text: 'eSocial — manual web de SST', href: 'https://www.gov.br/esocial/pt-br/empresas/manual-web-geral' }] },
      { segments: [{ text: 'AJN — gestão de SST no eSocial', href: '/servicos/gestao-do-e-social' }] }
    ] }
  ]
} as const satisfies BlogContentData;
