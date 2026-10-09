import image from '../../assets/blog/editorial-ergonomia.webp';
import type { BlogContentData } from '../types';

export const blogAepEAetDiferencasEAplicacoes = {
  slug: 'aep-e-aet-diferencas-e-quando-aplicar-cada-avaliacao',
  path: '/blog/aep-e-aet-diferencas-e-quando-aplicar-cada-avaliacao',
  title: 'AEP e AET: diferenças e quando aplicar cada avaliação | AJN',
  description: 'Veja como a Avaliação Ergonômica Preliminar e a Análise Ergonômica do Trabalho se relacionam com riscos e ações preventivas.',
  heading: 'AEP e AET: diferenças e aplicações da ergonomia no trabalho',
  pubDate: '2026-10-09',
  author: 'AJN Consultoria e Engenharia',
  topic: 'Laudos e avaliações técnicas',
  image: { src: image, alt: 'Ilustração esquemática de observação ergonômica de um posto e de uma atividade de trabalho' },
  categories: ['Laudos e avaliações técnicas'],
  tags: ['AEP', 'AET', 'NR-17', 'ergonomia'],
  gallery: [],
  sections: [
    { heading: 'AEP e AET respondem a necessidades diferentes', paragraphs: [
      'A Avaliação Ergonômica Preliminar (AEP) identifica perigos e necessidades de adaptação nas situações de trabalho e subsidia medidas preventivas. A NR-17 permite abordagens qualitativas, semiquantitativas, quantitativas ou combinadas, conforme o risco e os requisitos aplicáveis; a avaliação precisa ser registrada.',
      'A Análise Ergonômica do Trabalho (AET) aprofunda a análise da situação. A NR-17 prevê sua realização quando há necessidade de avaliação mais aprofundada, quando medidas se mostram inadequadas ou insuficientes, quando o acompanhamento de saúde indica relação com o trabalho ou quando a análise de acidente ou doença aponta causa ligada às condições de trabalho.'
    ] },
    { heading: 'O foco é a situação real de trabalho', paragraphs: [
      'Avalie atividade, organização, equipamentos, mobiliário, ambiente, exigências da tarefa e variações ao longo da jornada. A conversa com trabalhadores e a observação direta ajudam a compreender como o trabalho acontece, inclusive ajustes e estratégias usados para lidar com obstáculos.',
      'Na AET, a norma prevê análise da demanda, funcionamento da organização, processos e atividade, escolha justificada de métodos, diagnóstico, recomendações e restituição dos resultados, com participação dos trabalhadores na validação e revisão das intervenções quando necessária.'
    ] },
    { heading: 'Como registrar e acompanhar as melhorias', paragraphs: [
      'Relacione achados a ações concretas, responsáveis e critérios de acompanhamento. Priorize mudanças na organização, no processo e no posto conforme a situação e os princípios de prevenção. Registre o que foi implementado e confira se a intervenção melhorou a condição observada sem criar novos riscos.',
      'AEP e AET não são somente um formulário ou uma lista de mobiliário. Também não substituem o PGR ou o PCMSO; os programas podem compartilhar informações conforme suas finalidades.'
    ] },
    { heading: 'Perguntas frequentes', paragraphs: [
      'A AET é obrigatória em todo caso? A NR-17 estabelece situações para aprofundar a avaliação e também prevê dispensas específicas de elaboração para certas ME, EPP e MEI, mantendo demais requisitos aplicáveis. Confirme o enquadramento no texto vigente.',
      'A AEP pode ser feita sem observar a atividade? A abordagem deve ser adequada à situação de trabalho; dados documentais sem compreensão da tarefa podem deixar perigos e exigências importantes de fora.'
    ] },
    { heading: 'Referências oficiais', paragraphs: [
      { segments: [{ text: 'MTE — NR-17 vigente', href: 'https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/norma-regulamentadora-no-17-nr-17' }] },
      { segments: [{ text: 'MTE — texto atualizado da NR-17', href: 'https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/arquivos/normas-regulamentadoras/nr-17-atualizada-2022.pdf' }] }
    ] }
  ]
} as const satisfies BlogContentData;
