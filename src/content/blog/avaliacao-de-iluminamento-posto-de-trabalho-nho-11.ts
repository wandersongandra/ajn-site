import image from '../../assets/blog/medicoes/medicao-iluminamento.webp';
import type { BlogContentData } from '../types';

export const blogIluminamento = {
  slug: 'avaliacao-de-iluminamento-posto-de-trabalho-nho-11',
  path: '/blog/avaliacao-de-iluminamento-posto-de-trabalho-nho-11',
  title: 'Iluminamento no trabalho: avaliação do posto e NHO 11 | AJN',
  description: 'Avaliação do iluminamento nos postos de trabalho: atividades visuais, luxímetro, NHO 11, NR-17 e correções possíveis.',
  heading: 'Iluminamento no trabalho: avaliação do posto e NHO 11',
  pubDate: '2026-10-09',
  author: 'AJN Consultoria e Engenharia',
  topic: 'Laudos e avaliações técnicas',
  image: { src: image, alt: 'Imagem ilustrativa digital de profissional verificando iluminamento com luxímetro em bancada de trabalho' },
  categories: ['Laudos e avaliações técnicas'],
  tags: ["iluminamento","luxímetro","NHO 11","NR-17","ergonomia"],
  gallery: [],
  sections: [
    { heading: "A luz precisa atender à tarefa executada", paragraphs: ["Uma medição isolada no centro da sala pode não descrever a condição visual de uma bancada de inspeção, uma área de montagem ou uma estação de atendimento. A posição de trabalho, a tarefa e a superfície observada importam.","Além do nível de iluminamento, podem existir problemas de ofuscamento, reflexos, sombras e contrastes. O levantamento deve observar como a atividade realmente acontece e considerar condições naturais e artificiais de iluminação."] },
    { heading: "Como planejar as medições", paragraphs: ["O luxímetro precisa ter características adequadas ao método e às condições de utilização. Posição do sensor, interferências do operador, distribuição dos pontos, período do dia e estabilidade da iluminação devem ser considerados no procedimento.","A NHO 11 orienta a avaliação de níveis de iluminamento em ambientes internos de trabalho. Os requisitos da NR-17 relativos às condições ergonômicas e à iluminação são examinados conforme o posto e sua atividade."] },
    { heading: "O que fazer com os valores encontrados", paragraphs: ["Um bom relatório não entrega apenas uma tabela de lux. Ele identifica posto ou área, critérios utilizados, condições observadas, valores medidos, possíveis limitações e medidas propostas quando a situação exigir.","As soluções podem envolver redistribuição de luminárias, manutenção, limpeza, redução de ofuscamento ou ajustes no posto. A decisão depende das necessidades visuais, do ambiente e do contexto de trabalho."] },
    { heading: "Iluminamento e documentos de SST", paragraphs: ["A medição pode integrar um processo de avaliação ergonômica e apoiar a gestão de riscos, mas não representa, por si só, caracterização de insalubridade. Se a empresa precisa de AEP, AET ou outro documento, o escopo deve ser definido separadamente.","Para solicitar avaliação, informe tipo de atividade, horários de operação e áreas ou postos que precisam ser examinados."] },
    { heading: 'Referências e próximos passos', paragraphs: [
      { segments: [{ text: "Fundacentro — Normas de Higiene Ocupacional", href: "https://www.gov.br/fundacentro/pt-br/centrais-de-conteudo/biblioteca/normas-de-higiene-ocupacional" }] },
      { segments: [{ text: "MTE — Normas Regulamentadoras vigentes", href: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes" }] },
      { segments: [{ text: "AJN — Avaliações e Medições Ambientais Ocupacionais", href: "/medicoes-ambientais-ocupacionais" }] },
    ] }
  ],
} as const satisfies BlogContentData;
