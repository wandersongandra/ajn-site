import image from '../../assets/blog/ajn/apr-e-permissao-de-trabalho.webp';
import type { BlogContentData } from '../types';

export const blogAprEPermissaoDeTrabalho = {
  slug: 'apr-e-permissao-de-trabalho-como-planejar-atividades-de-risco',
  path: '/blog/apr-e-permissao-de-trabalho-como-planejar-atividades-de-risco',
  title: 'APR e Permissão de Trabalho: como planejar atividades de risco | AJN',
  description: 'Veja como relacionar análise preliminar de risco e Permissão de Trabalho ao escopo, às condições reais e aos controles da atividade.',
  heading: 'APR e Permissão de Trabalho: como organizar o planejamento da atividade',
  pubDate: '2026-10-09',
  author: 'AJN Consultoria e Engenharia',
  topic: 'Segurança operacional',
  image: { src: image, alt: 'Equipe reunida em campo para orientações de segurança' },
  categories: ['Segurança operacional'],
  tags: ['APR', 'Permissão de Trabalho', 'análise de risco', 'planejamento'],
  gallery: [],
  sections: [
    { heading: 'A análise e a autorização cumprem papéis diferentes', paragraphs: [
      'A Análise Preliminar de Risco (APR) é uma forma de dividir a tarefa em etapas, reconhecer perigos, avaliar consequências e definir medidas antes do início. A Permissão de Trabalho (PT) formaliza uma autorização controlada quando a atividade, a norma aplicável ou o procedimento da organização exige esse tipo de liberação.',
      'APR e PT podem ser usadas em conjunto, mas uma não substitui automaticamente a outra. Também não existe uma obrigação universal de emitir PT para todo serviço: é necessário conferir a NR específica, os procedimentos internos, o contrato e as condições do trabalho.'
    ] },
    { heading: 'Roteiro para preparar a atividade', paragraphs: [
      'Descreva a tarefa e seus limites: local, equipe, ferramentas, energia envolvida, interferências e duração planejada. Separe as etapas para identificar perigos associados a cada uma e verifique se trabalhadores de outras equipes podem ser afetados.',
      'Defina controles pela hierarquia de prevenção e confira se são aplicáveis no local. Considere isolamento, bloqueio, sinalização, proteção coletiva, equipamentos, competência dos trabalhadores, supervisão e resposta a emergências. A análise deve resultar em ações verificáveis, com responsáveis claros.',
      'Se a PT for aplicável, registre escopo, local, pessoas autorizadas, verificações prévias, validade operacional, condições de suspensão e encerramento. A autorização perde sentido quando o cenário muda e ninguém reavalia os controles.'
    ] },
    { heading: 'Durante a execução e no encerramento', paragraphs: [
      'Faça uma conversa de alinhamento antes do trabalho, confirme que todos entendem os riscos e os critérios para interromper a tarefa. Interrompa e reavalie diante de mudança de escopo, clima, equipamento, equipe, condição do local ou falha de uma barreira crítica.',
      'Ao concluir, confirme desmobilização, retirada de ferramentas, recomposição de proteções e comunicação ao responsável pela instalação ou área. Use desvios observados para atualizar procedimentos e análises futuras.'
    ] },
    { heading: 'Perguntas frequentes', paragraphs: [
      'A APR pode ser um formulário genérico? Um modelo pode ajudar, mas precisa ser preenchido para a atividade e o cenário reais. Copiar riscos de outra tarefa não demonstra avaliação.',
      'Uma PT garante que o trabalho é seguro? Não. Ela documenta a autorização e as condições acordadas; as medidas ainda precisam ser implantadas, verificadas e mantidas.'
    ] },
    { heading: 'Referências oficiais', paragraphs: [
      { segments: [{ text: 'MTE — NR-1 vigente, gerenciamento de riscos ocupacionais', href: 'https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/nr-1' }] },
      { segments: [{ text: 'MTE — NR-10 e medidas preventivas de controle do risco elétrico', href: 'https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/norma-regulamentadora-no-10-nr-10' }] }
    ] }
  ]
} as const satisfies BlogContentData;
