import ajnEditorial from '../../assets/blog/ajn/gestao-de-terceiros-em-sst.webp';
import image from '../../assets/blog/editorial-terceiros.webp';
import type { BlogContentData } from '../types';

export const blogGestaoDeTerceirosEmSst = {
  slug: 'gestao-de-terceiros-em-sst-documentos-mobilizacao-e-controles',
  path: '/blog/gestao-de-terceiros-em-sst-documentos-mobilizacao-e-controles',
  title: 'Gestão de terceiros em SST: documentos, mobilização e controles | AJN',
  description: 'Como organizar informações de riscos, documentos e controles de SST na contratação e mobilização de empresas terceirizadas.',
  heading: 'Gestão de terceiros em SST: documentos, mobilização e controles',
  pubDate: '2026-10-09',
  author: 'AJN Consultoria e Engenharia',
  topic: 'Gestão de SST',
  image: { src: ajnEditorial, alt: 'Profissionais com equipamentos de proteção reunidos durante atividade de campo' },
  categories: ['Gestão de SST'],
  tags: ['terceirização', 'mobilização', 'NR-1', 'documentação'],
  gallery: [],
  sections: [
    { heading: 'O que a gestão precisa coordenar', paragraphs: [
      'A mobilização de uma contratada começa antes da entrada da equipe no local. A empresa contratante precisa planejar como as atividades se conectam à operação, quais riscos do ambiente devem ser informados e como serão acompanhadas as medidas de prevenção durante o serviço.',
      'A NR-1 prevê integração entre organizações que atuam no mesmo local e troca de informações sobre riscos e medidas de prevenção. As responsabilidades de cada parte dependem da relação contratual, das atividades e dos requisitos legais aplicáveis; um checklist documental não transfere a responsabilidade de uma organização para a outra.'
    ] },
    { heading: 'Como estruturar a mobilização', paragraphs: [
      'Comece descrevendo o serviço, os locais, as etapas, os equipamentos e as interfaces com a operação. Em seguida, identifique os documentos necessários para aquela atividade, as pessoas responsáveis por analisá-los, os critérios de liberação e a forma de registrar pendências.',
      'Compartilhe com a contratada as informações relevantes sobre perigos e regras do local. Solicite que ela informe os riscos próprios da atividade e as medidas que aplicará. Reuniões de alinhamento, integração, inspeções e permissões podem ser necessárias conforme a tarefa e os procedimentos aplicáveis; não existe um pacote único que sirva para todo contrato.'
    ] },
    { heading: 'Pontos de controle durante a execução', paragraphs: [
      'Confirme se o escopo real continua igual ao planejado. Mudanças de equipe, local, equipamento, turno ou método podem alterar os riscos e exigir nova análise. Registre orientações, inspeções, desvios e ações corretivas com responsáveis e prazo definido pela gestão do contrato.',
      'Um painel útil mostra situação de documentos, integração realizada, liberações pendentes, riscos críticos, inspeções e ações em aberto. A validade de um arquivo, isoladamente, não comprova que a medida está implantada nem que corresponde às condições encontradas no campo.'
    ] },
    { heading: 'Perguntas frequentes', paragraphs: [
      'A contratante pode apenas conferir documentos? Não. A conferência pode fazer parte do processo, mas não substitui a coordenação dos riscos compartilhados, a informação sobre as condições do local e o acompanhamento das medidas previstas.',
      'A mesma lista de documentos vale para qualquer prestador? Não. O conjunto depende do serviço, dos riscos, das NRs aplicáveis e dos requisitos contratuais. Evite pedir documentos sem relação com a atividade ou liberar o início apenas porque uma pasta foi preenchida.'
    ] },
    { heading: 'Referências oficiais', paragraphs: [
      { segments: [{ text: 'MTE — NR-1 vigente, incluindo gerenciamento de riscos e organizações contratadas', href: 'https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/nr-1' }] },
      { segments: [{ text: 'MTE — Programa de Gerenciamento de Riscos', href: 'https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/pgr' }] }
    ] }
  ]
} as const satisfies BlogContentData;
