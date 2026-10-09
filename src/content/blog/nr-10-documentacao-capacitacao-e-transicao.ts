import image from '../../assets/blog/editorial-eletricidade.webp';
import type { BlogContentData } from '../types';

export const blogNr10DocumentacaoCapacitacaoETransicao = {
  slug: 'nr-10-documentacao-capacitacao-e-transicao-regulatoria',
  path: '/blog/nr-10-documentacao-capacitacao-e-transicao-regulatoria',
  title: 'NR-10: documentação, capacitação e transição regulatória | AJN',
  description: 'Organize os controles de segurança elétrica e entenda a transição prevista para a nova redação da NR-10 em 2027.',
  heading: 'NR-10: documentação, capacitação e preparação para a transição',
  pubDate: '2026-10-09',
  author: 'AJN Consultoria e Engenharia',
  topic: 'Normas regulamentadoras',
  image: { src: image, alt: 'Ilustração esquemática de circuito elétrico, documentação e bloqueio de energia' },
  categories: ['Normas regulamentadoras'],
  tags: ['NR-10', 'risco elétrico', 'capacitação', 'documentação'],
  gallery: [],
  sections: [
    { heading: 'O trabalho elétrico exige controles planejados', paragraphs: [
      'A NR-10 estabelece requisitos para proteger trabalhadores que interagem direta ou indiretamente com instalações e serviços com eletricidade. O planejamento deve considerar projeto, construção, operação, manutenção e trabalhos nas proximidades, além dos riscos adicionais do ambiente.',
      'Antes da intervenção, identifique a instalação e a tarefa, avalie o risco elétrico e os riscos associados, selecione medidas de controle e confirme quem está autorizado e capacitado para executar cada etapa. A documentação deve corresponder ao estado real da instalação e aos procedimentos efetivamente implantados.'
    ] },
    { heading: 'Documentos e verificações a organizar', paragraphs: [
      'Mantenha esquemas unifilares atualizados e registros pertinentes às medidas de controle. Para estabelecimentos abrangidos pelos critérios da NR-10, organize o Prontuário de Instalações Elétricas com os documentos previstos na norma. A necessidade e a composição dependem das características da instalação e dos requisitos vigentes.',
      'Procedimentos devem explicar sequência de trabalho, responsabilidades, riscos, bloqueio e sinalização quando aplicáveis, ferramentas, equipamentos e resposta a emergências. A capacitação precisa ser compatível com as atividades e com os requisitos específicos da NR-10; um certificado isolado não comprova autorização ou condição segura para qualquer tarefa.'
    ] },
    { heading: 'A nova redação tem vigência futura', paragraphs: [
      'Em agosto de 2026, o Ministério do Trabalho e Emprego publicou a Portaria MTE nº 737/2026 com nova redação para a NR-10. A página oficial informa entrada em vigor em 1º de junho de 2027 e prevê prazo específico para instalações existentes.',
      'Até essa data, consulte a redação vigente e acompanhe a transição. As organizações podem inventariar documentos, instalações, procedimentos e capacitações para identificar diferenças, mas não devem aplicar antecipadamente requisitos futuros como se já estivessem em vigor nem ignorar regras atuais.'
    ] },
    { heading: 'Perguntas frequentes', paragraphs: [
      'O prontuário se aplica a qualquer estabelecimento? A NR-10 define critérios específicos, incluindo carga instalada. Verifique o texto vigente e as características da instalação antes de concluir se é obrigatório.',
      'A publicação da nova NR-10 mudou as regras imediatamente? Não. A fonte oficial informa início de vigência em 1º de junho de 2027, sujeito aos prazos específicos descritos na Portaria.'
    ] },
    { heading: 'Referências oficiais', paragraphs: [
      { segments: [{ text: 'MTE — página da NR-10, vigência atual e transição de 2027', href: 'https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/norma-regulamentadora-no-10-nr-10' }] },
      { segments: [{ text: 'MTE — NR-10 atualizada em 2026 (Portaria nº 737/2026)', href: 'https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/nr-10-atualizada-2026-1.pdf/view' }] },
      { segments: [{ text: 'AJN — treinamentos de Normas Regulamentadoras', href: '/servicos/treinamento-de-nrs' }] }
    ] }
  ]
} as const satisfies BlogContentData;
