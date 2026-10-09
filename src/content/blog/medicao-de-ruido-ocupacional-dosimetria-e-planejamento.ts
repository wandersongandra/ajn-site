import image from '../../assets/blog/medicoes/medicao-ruido-dosimetria.webp';
import type { BlogContentData } from '../types';

export const blogRuidoOcupacional = {
  slug: 'medicao-de-ruido-ocupacional-dosimetria-e-planejamento',
  path: '/blog/medicao-de-ruido-ocupacional-dosimetria-e-planejamento',
  title: 'Medição de ruído ocupacional: como planejar a dosimetria | AJN',
  description: 'Como planejar medições de ruído ocupacional, escolher a estratégia de dosimetria e interpretar resultados com contexto de exposição.',
  heading: 'Medição de ruído ocupacional: como planejar a dosimetria',
  pubDate: '2026-10-09',
  author: 'AJN Consultoria e Engenharia',
  topic: 'Laudos e avaliações técnicas',
  image: { src: image, alt: 'Imagem ilustrativa digital de dosímetro de ruído sendo posicionado em trabalhador de instalação industrial' },
  categories: ['Laudos e avaliações técnicas'],
  tags: ["ruído ocupacional","dosimetria","NHO 01","NR-15","higiene ocupacional"],
  gallery: [],
  sections: [
    { heading: "O que precisa ser caracterizado antes de ligar o dosímetro", paragraphs: ["A presença de uma máquina barulhenta não descreve, sozinha, a exposição de quem trabalha ao lado dela. A avaliação começa com a identificação das funções, tarefas, ciclos, deslocamentos, turnos, mudanças de ritmo e fontes de ruído. Duas pessoas no mesmo setor podem receber doses distintas.","O objetivo do levantamento orienta a escolha do instrumento e da estratégia de amostragem. Um registro pontual em decibéis não deve ser apresentado como dose da jornada inteira, assim como uma medição realizada em dia atípico exige cuidado antes de representar condições habituais."] },
    { heading: "Dosimetria, registro e condições de campo", paragraphs: ["A dosimetria pessoal acompanha a exposição de um trabalhador ao longo de um período definido. Na execução, posição do microfone, fixação, duração do monitoramento, parâmetros instrumentais, calibração e verificação em campo importam tanto quanto o valor registrado.","A NHO 01 da Fundacentro orienta procedimentos técnicos de avaliação ocupacional ao ruído. Critérios legais da NR-15 podem ter parâmetros próprios, conforme o objetivo da caracterização. Aplicar um resultado sem explicitar o método e o critério gera interpretações frágeis."] },
    { heading: "Como interpretar os resultados sem extrapolar", paragraphs: ["O relatório deve situar o resultado nas tarefas medidas, duração de exposição, variações de jornada, possíveis interferências e limitações observadas. Na gestão de SST, essa informação pode subsidiar revisões de controle coletivo, organização do trabalho e proteção auditiva, sem substituir o gerenciamento do risco.","Uma medição quantitativa isolada não é, automaticamente, LTCAT ou laudo de insalubridade. Esses documentos exigem finalidade, avaliação e responsabilidade técnica próprias. Caso a empresa precise de ambos, vale definir entregáveis no início da contratação."] },
    { heading: "Para solicitar uma avaliação", paragraphs: ["Informe setor, principais máquinas, funções expostas, turnos e alterações recentes no processo. Essas informações ajudam a dimensionar a campanha e a verificar sua representatividade.","Após entender a demanda, a AJN pode definir o escopo e os critérios pertinentes à avaliação solicitada."] },
    { heading: 'Referências e próximos passos', paragraphs: [
      { segments: [{ text: "Fundacentro — Normas de Higiene Ocupacional", href: "https://www.gov.br/fundacentro/pt-br/centrais-de-conteudo/biblioteca/normas-de-higiene-ocupacional" }] },
      { segments: [{ text: "MTE — Normas Regulamentadoras vigentes", href: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes" }] },
      { segments: [{ text: "AJN — Avaliações e Medições Ambientais Ocupacionais", href: "/medicoes-ambientais-ocupacionais" }] },
    ] }
  ],
} as const satisfies BlogContentData;
