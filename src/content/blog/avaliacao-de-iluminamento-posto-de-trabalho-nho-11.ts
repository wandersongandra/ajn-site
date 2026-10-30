import image from '../../assets/blog/medicoes/medicao-iluminamento.webp';
import type { BlogContentData } from '../types';

export const blogIluminamento = {
  slug: 'avaliacao-de-iluminamento-posto-de-trabalho-nho-11',
  path: '/blog/avaliacao-de-iluminamento-posto-de-trabalho-nho-11',
  title: 'NHO 11: como medir iluminamento no trabalho | AJN',
  description: 'Saiba como a NHO 11 orienta a avaliação de iluminamento: luxímetro, pontos de medição, critérios por tarefa, NR-17 e registro dos resultados.',
  heading: 'NHO 11: avaliação de iluminamento nos postos de trabalho',
  pubDate: '2026-10-09',
  updatedAt: '2026-10-30',
  author: 'AJN Consultoria e Engenharia',
  topic: 'Laudos e avaliações técnicas',
  image: { src: image, alt: 'Imagem ilustrativa digital de profissional verificando iluminamento com luxímetro em bancada de trabalho' },
  categories: ['Laudos e avaliações técnicas'],
  tags: ['iluminamento', 'luxímetro', 'NHO 11', 'NR-17', 'ergonomia'],
  gallery: [],
  sections: [
    {
      heading: 'O que é a NHO 11 da Fundacentro?',
      paragraphs: [
        'A Norma de Higiene Ocupacional nº 11 (NHO 11) da Fundacentro estabelece critérios e procedimentos para avaliar níveis de iluminamento em ambientes internos de trabalho. Ela considera aspectos quantitativos e qualitativos da iluminação, relacionados à segurança e à execução da tarefa.',
        'O método não se resume a posicionar um luxímetro no centro de uma sala. A avaliação depende da atividade, do posto, da superfície de trabalho e das condições reais de iluminação.',
      ],
    },
    {
      heading: 'Como planejar a medição com luxímetro',
      paragraphs: [
        'Antes de medir, identifique as tarefas e os postos, a distribuição das luminárias, a presença de luz natural e o horário em que o trabalho ocorre. A escolha dos pontos de medição e o posicionamento do sensor devem seguir o método aplicável.',
      ],
      lists: [{ items: [
        'Definir quais postos e tarefas serão avaliados, inclusive situações com exigência visual específica.',
        'Selecionar instrumento adequado e verificar suas condições de utilização.',
        'Registrar horário, condições de iluminação, posicionamento dos pontos e possíveis interferências.',
        'Observar ofuscamento, reflexos, sombras, contrastes e uniformidade, além dos valores de iluminamento.',
        'Relacionar os resultados aos critérios aplicáveis à tarefa e descrever limitações do levantamento.',
      ] }],
    },
    {
      heading: 'Qual é o nível mínimo de lux exigido?',
      paragraphs: [
        'Não existe um único valor de lux válido para qualquer ambiente de trabalho. Os critérios dependem da atividade e das condições previstas na NHO 11. Comparar uma medição isolada com um número genérico pode levar a uma conclusão inadequada.',
        'A NR-17 trata das condições de iluminação nos postos de trabalho e remete aos critérios técnicos pertinentes. Para um parecer confiável, é necessário identificar a tarefa avaliada e os parâmetros aplicáveis à situação.',
      ],
    },
    {
      heading: 'O que deve constar no relatório de iluminamento?',
      paragraphs: [
        'Um relatório útil identifica os postos avaliados, o método e o instrumento utilizados, as condições encontradas, os resultados, os critérios de comparação e as medidas propostas quando necessárias.',
        'As recomendações podem envolver manutenção e limpeza de luminárias, redistribuição dos pontos de luz, controle de ofuscamento ou ajustes no posto. A solução deve responder às condições observadas, e não apenas a uma tabela de resultados.',
      ],
    },
    {
      heading: 'Relação com ergonomia e outros documentos',
      paragraphs: [
        'A avaliação de iluminamento pode apoiar a análise ergonômica e a gestão de riscos, mas não caracteriza automaticamente insalubridade. Caso a empresa precise de AEP, AET ou outro documento, as finalidades e os critérios devem ser avaliados separadamente.',
        { segments: [
          'Para solicitar avaliação, informe o tipo de atividade, os horários de operação e os locais de trabalho. Conheça as ',
          { text: 'medições ambientais ocupacionais da AJN', href: '/medicoes-ambientais-ocupacionais/' },
          '.',
        ] },
      ],
    },
    {
      heading: 'Referências técnicas',
      paragraphs: [
        { segments: [{ text: 'Fundacentro — Normas de Higiene Ocupacional, incluindo a NHO 11', href: 'https://www.gov.br/fundacentro/pt-br/centrais-de-conteudo/biblioteca/nhos' }] },
        { segments: [{ text: 'Ministério do Trabalho e Emprego — NR-17', href: 'https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/norma-regulamentadora-no-17-nr-17' }] },
        { segments: [{ text: 'AJN — contato para solicitar avaliação de iluminamento', href: '/contato/' }] },
      ],
    },
  ],
} as const satisfies BlogContentData;
