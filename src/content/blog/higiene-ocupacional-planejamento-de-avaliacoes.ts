import image from '../../assets/blog/medicoes/hero-medicoes-ocupacionais.webp';
import type { BlogContentData } from '../types';

export const blogHigieneOcupacionalPlanejamentoDeAvaliacoes = {
  slug: 'higiene-ocupacional-como-planejar-avaliacoes-de-exposicao',
  path: '/blog/higiene-ocupacional-como-planejar-avaliacoes-de-exposicao',
  title: 'Higiene ocupacional: como planejar avaliações de exposição | AJN',
  description: 'Entenda as etapas para planejar avaliações de agentes ocupacionais e relacionar resultados às tarefas e medidas de prevenção.',
  heading: 'Higiene ocupacional: como planejar avaliações de exposição',
  pubDate: '2026-10-09',
  author: 'AJN Consultoria e Engenharia',
  topic: 'Laudos e avaliações técnicas',
  image: { src: image, alt: 'Imagem ilustrativa digital de profissional junto a instrumentos de medição em área industrial' },
  categories: ['Laudos e avaliações técnicas'],
  tags: ['higiene ocupacional', 'avaliação de exposição', 'Fundacentro', 'agentes ocupacionais'],
  gallery: [],
  sections: [
    { heading: 'A pergunta vem antes do instrumento', paragraphs: [
      'Uma avaliação de exposição deve responder a uma questão técnica definida: qual agente está presente, em qual tarefa, para quais grupos, sob quais condições e para apoiar qual decisão? Sem essa definição, a medição pode gerar números sem representatividade para a situação de trabalho.',
      'O planejamento considera processo, produtos, equipamentos, duração, frequência, controles existentes, variações de tarefa e trabalhadores potencialmente expostos. Converse com quem executa o trabalho e observe a atividade antes de escolher método, amostragem e instrumento.'
    ] },
    { heading: 'Método, amostragem e qualidade', paragraphs: [
      'Selecione método reconhecido e compatível com o agente e o objetivo da avaliação. Para agentes físicos, químicos ou biológicos, protocolos e critérios não são intercambiáveis. Normas de Higiene Ocupacional da Fundacentro e referências normativas aplicáveis podem orientar o desenho do estudo; a escolha depende do caso.',
      'Registre estratégia de amostragem, equipamentos, calibração e verificações exigidas pelo método, condições observadas, limitações e desvios. Resultado de uma jornada ou tarefa não deve ser generalizado automaticamente para outros grupos, turnos ou situações sem justificativa.'
    ] },
    { heading: 'Interprete junto com a gestão de riscos', paragraphs: [
      'Apresente resultados com método, unidades, critérios usados e limites da conclusão. Relacione-os às tarefas e aos controles observados. Quando a avaliação indicar necessidade de ação, a empresa deve definir medidas, acompanhar sua implantação e verificar se o risco foi reduzido.',
      'Uma avaliação instrumental não substitui inventário de perigos, gestão de mudanças ou avaliação médica. O documento técnico e o PGR têm funções próprias e precisam trocar informações quando a exposição estiver relacionada.'
    ] },
    { heading: 'Perguntas frequentes', paragraphs: [
      'Toda avaliação exige medição quantitativa? Não. O método depende do agente, do objetivo e do requisito aplicável; algumas avaliações podem usar abordagem qualitativa ou combinar métodos.',
      'Um relatório antigo continua válido para sempre? Não há resposta universal. Verifique se processo, agente, controle, método e objetivo continuam representativos e se a norma aplicável exige revisão.'
    ] },
    { heading: 'Referências oficiais', paragraphs: [
      { segments: [{ text: 'Fundacentro — Normas de Higiene Ocupacional', href: 'https://www.gov.br/fundacentro/pt-br/centrais-de-conteudo/biblioteca/normas-de-higiene-ocupacional' }] },
      { segments: [{ text: 'MTE — NR-9, avaliação e controle das exposições ocupacionais', href: 'https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/norma-regulamentadora-no-9-nr-9' }] },
      { segments: [{ text: 'AJN — Medições ambientais ocupacionais', href: '/medicoes-ambientais-ocupacionais' }] },
      { segments: [{ text: 'AJN — perícias de insalubridade e periculosidade', href: '/servicos/pericias-em-periculosidade-e-insalubridade' }] }
    ] }
  ]
} as const satisfies BlogContentData;
