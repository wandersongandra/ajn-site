import ajnEditorial from '../../assets/blog/ajn/nr-12-analise-de-riscos-de-maquinas.webp';
import image from '../../assets/blog/editorial-maquinas.webp';
import type { BlogContentData } from '../types';

export const blogNr12AnaliseDeRiscosDeMaquinas = {
  slug: 'nr-12-como-organizar-a-analise-de-riscos-de-maquinas',
  path: '/blog/nr-12-como-organizar-a-analise-de-riscos-de-maquinas',
  title: 'NR-12: como organizar a análise de riscos de máquinas | AJN',
  description: 'Um roteiro para inventariar máquinas, observar tarefas e priorizar proteções conforme os requisitos aplicáveis da NR-12.',
  heading: 'NR-12: como organizar a análise de riscos de máquinas',
  pubDate: '2026-10-09',
  author: 'AJN Consultoria e Engenharia',
  topic: 'Normas regulamentadoras',
  image: { src: ajnEditorial, alt: 'Escavadeira em operação no canteiro de obras' },
  categories: ['Normas regulamentadoras'],
  tags: ['NR-12', 'máquinas', 'análise de risco', 'proteções'],
  gallery: [],
  sections: [
    { heading: 'Comece pelo inventário e pelas tarefas', paragraphs: [
      'A análise de segurança não começa escolhendo uma proteção padrão. Registre quais máquinas existem, onde operam, quais tarefas são realizadas e quem interage com elas em operação, ajuste, limpeza, manutenção e situações não rotineiras.',
      'Considere acesso a zonas perigosas, movimentos, energias, materiais processados, comandos, parada, estabilidade, circulação e interação entre equipamentos. A NR-12 contém requisitos para máquinas novas e usadas, com disposições que variam conforme a máquina, o uso e os anexos aplicáveis.'
    ] },
    { heading: 'Avalie riscos e selecione medidas', paragraphs: [
      'Identifique perigos e estime riscos segundo o método adotado pela organização, justificando critérios e limites. Priorize medidas que eliminem ou reduzam a exposição na origem. Proteções físicas, dispositivos de intertravamento, comandos, sinalização e procedimentos devem ser selecionados considerando a função de segurança e a forma real de uso.',
      'Não remova ou neutralize proteções para aumentar produtividade. Intervenções, alterações de comando e adequações devem ser projetadas e executadas por pessoas com atribuições compatíveis. Sempre confira instruções do fabricante, normas técnicas pertinentes e os requisitos oficiais aplicáveis.'
    ] },
    { heading: 'Transforme a análise em plano de ação', paragraphs: [
      'Organize cada medida com responsável, prioridade, prazo definido pela empresa e evidência de conclusão. Após implantar controles, valide seu funcionamento na situação de trabalho. Atualize a análise quando houver mudança, incidente, falha ou evidência de que a medida não controla o risco como previsto.',
      'Treinamento e procedimento complementam proteções técnicas, mas não corrigem por si sós uma condição perigosa que deveria ser eliminada ou controlada na máquina.'
    ] },
    { heading: 'Perguntas frequentes', paragraphs: [
      'Uma planilha de máquinas prova conformidade? Não. O inventário ajuda a organizar o trabalho; a avaliação precisa considerar riscos, medidas instaladas, funcionamento e requisitos pertinentes.',
      'A análise de risco pode ser copiada de outro equipamento? Não é adequado. Máquinas parecidas podem ter uso, acessórios, comandos, layout e perigos diferentes.'
    ] },
    { heading: 'Referências oficiais', paragraphs: [
      { segments: [{ text: 'MTE — NR-12 vigente e materiais de aplicação', href: 'https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/norma-regulamentadora-no-12-nr-12' }] },
      { segments: [{ text: 'MTE — NR-1 e gerenciamento de riscos ocupacionais', href: 'https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/nr-1' }] }
    ] }
  ]
} as const satisfies BlogContentData;
