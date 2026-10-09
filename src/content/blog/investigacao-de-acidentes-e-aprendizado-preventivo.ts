import ajnEditorial from '../../assets/blog/ajn/investigacao-de-acidentes-e-aprendizado-preventivo.webp';
import image from '../../assets/blog/editorial-investigacao.webp';
import type { BlogContentData } from '../types';

export const blogInvestigacaoDeAcidentesEAprendizadoPreventivo = {
  slug: 'investigacao-de-acidentes-como-transformar-registros-em-prevencao',
  path: '/blog/investigacao-de-acidentes-como-transformar-registros-em-prevencao',
  title: 'Investigação de acidentes: como transformar registros em prevenção | AJN',
  description: 'Um roteiro de investigação que registra fatos, analisa condições de trabalho e transforma aprendizados em medidas preventivas.',
  heading: 'Investigação de acidentes: dos registros às medidas preventivas',
  pubDate: '2026-10-09',
  author: 'AJN Consultoria e Engenharia',
  topic: 'Segurança operacional',
  image: { src: ajnEditorial, alt: 'Profissionais equipados em área escavada durante atividade de campo' },
  categories: ['Segurança operacional'],
  tags: ['investigação de acidentes', 'análise de causas', 'prevenção', 'NR-1'],
  gallery: [],
  sections: [
    { heading: 'Investigar é compreender como o evento ocorreu', paragraphs: [
      'Uma investigação útil reconstrói a sequência de fatos e examina condições que contribuíram para o evento: tarefa, ambiente, equipamentos, organização do trabalho, comunicação, barreiras e decisões. O objetivo é orientar prevenção e aprendizado, não buscar um culpado como conclusão automática.',
      'Atenda primeiro à resposta imediata, ao cuidado com pessoas e à preservação de informações relevantes. Registre o que foi observado, horário, local, tarefa, equipamentos e mudanças recentes. Separe fatos confirmados de hipóteses e identifique quem precisa receber as comunicações previstas.'
    ] },
    { heading: 'Perguntas que ajudam a análise', paragraphs: [
      'O que deveria acontecer? O que aconteceu de fato? Quais condições aproximaram a atividade do evento? Que barreiras existiam, estavam disponíveis e funcionaram? O que mudou em relação ao planejamento? Ouvir trabalhadores e testemunhas ajuda a entender a tarefa real, evitando explicações baseadas apenas em procedimento escrito.',
      'A análise deve considerar fatores técnicos e organizacionais, como manutenção, adequação de ferramentas, pressão de produção, treinamento, supervisão, acesso a informações e compatibilidade entre equipes. Use método proporcional à complexidade do evento e documente as limitações.'
    ] },
    { heading: 'Ações e verificação de eficácia', paragraphs: [
      'Prefira ações que reduzam o risco na fonte e fortaleçam barreiras. Para cada ação, defina responsável, prioridade e forma de verificar a conclusão. Uma orientação verbal ou reciclagem pode ser insuficiente se a causa estiver em um projeto, proteção, manutenção ou organização inadequada do trabalho.',
      'Verifique se as medidas foram implantadas e se controlam o risco na situação real. Compartilhe aprendizados relevantes sem expor dados pessoais desnecessários. Atualize avaliação de riscos, procedimento e plano de ação quando a investigação revelar mudanças necessárias.'
    ] },
    { heading: 'Perguntas frequentes', paragraphs: [
      'Todo acidente tem uma única causa? Muitas vezes o evento resulta de combinações de condições e barreiras. Uma causa única pode simplificar demais o cenário e produzir medidas pouco eficazes.',
      'A investigação substitui a CAT ou outros registros? Não. Comunicação, investigação interna e registros previdenciários ou legais têm finalidades diferentes e podem coexistir.'
    ] },
    { heading: 'Referências oficiais', paragraphs: [
      { segments: [{ text: 'MTE — NR-1 vigente e gerenciamento de riscos', href: 'https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/nr-1' }] },
      { segments: [{ text: 'MTE — página da NR-1, publicações e orientações', href: 'https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/nr-1' }] },
      { segments: [{ text: 'AJN — inspeções de segurança do trabalho', href: '/inspecoes-seguranca-do-trabalho' }] }
    ] }
  ]
} as const satisfies BlogContentData;
