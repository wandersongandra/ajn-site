import type { ServiceContent } from '../types';

export const servicePage = {
  slug: 'gestao-do-e-social',
  path: '/servicos/gestao-do-e-social',
  title: 'Gestão do eSocial SST para Empresas | AJN',
  description: 'Apoio à organização e ao envio das informações de SST no eSocial: eventos S-2220, S-2240, conferência documental e acompanhamento de pendências.',
  heading: 'Gestão do eSocial SST',
  image: '/images/content/services/gestao-do-e-social.webp',
  imageAlt: 'Organização de registros e documentos de SST para o eSocial',
  sections: [
    {
      heading: 'Quais informações de SST entram no eSocial?',
      paragraphs: [
        'O eSocial recebe eventos de Segurança e Saúde no Trabalho (SST) relacionados a acidentes, acompanhamento da saúde ocupacional e exposição a agentes nocivos. Os dados precisam estar coerentes com a situação do trabalhador e com os documentos técnicos de origem.',
        'Para organizar a rotina, é essencial definir quem fornece e valida cada informação e quem está autorizado a transmiti-la. O envio de um evento não substitui a elaboração dos documentos e avaliações exigidos pela legislação.',
      ],
      lists: [{ items: [
        'S-2210 — Comunicação de Acidente de Trabalho (CAT), quando aplicável.',
        'S-2220 — Monitoramento da Saúde do Trabalhador, com informações pertinentes ao ASO e exames.',
        'S-2240 — Condições Ambientais do Trabalho — Agentes Nocivos, conforme as regras previdenciárias e o leiaute vigente.',
      ] }],
    },
    {
      heading: 'Organização e conferência de documentos',
      paragraphs: [
        'A AJN apresenta o serviço de apoio à gestão das informações de SST, incluindo organização dos dados, conferência documental e acompanhamento dos eventos S-2220 e S-2240 conforme o escopo contratado.',
        'Antes de definir a responsabilidade pelo envio, é necessário conferir acessos, procurações, histórico de eventos, documentos ocupacionais disponíveis e eventuais rejeições registradas pelo sistema.',
      ],
      lists: [{ items: [
        'Levantamento dos estabelecimentos e trabalhadores abrangidos.',
        'Conferência dos registros de saúde ocupacional e dos documentos de exposição existentes.',
        'Identificação de inconsistências, pendências e necessidade de atualização das informações.',
        'Acompanhamento da situação dos eventos e dos retornos do eSocial, quando incluído no contrato.',
      ] }],
    },
    {
      heading: 'O que informar para solicitar o serviço',
      paragraphs: [
        'Conte quantos estabelecimentos serão atendidos, o volume aproximado de trabalhadores, a situação dos eventos de SST e se há pendências de transmissão. Esses dados ajudam a definir o escopo de implantação ou acompanhamento.',
        'Datas, obrigatoriedade e campos dos eventos devem ser conferidos no Manual de Orientação do eSocial e nos leiautes oficiais vigentes para o tipo de declarante. Não utilizamos prazos genéricos aplicáveis indiscriminadamente a todas as empresas.',
      ],
    },
    {
      heading: 'Atendimento e referências',
      paragraphs: [
        { segments: ['Solicite uma avaliação pela ', { text: 'página de contato da AJN', href: '/contato' }, '.'] },
        { segments: ['Fonte oficial: ', { text: 'documentação técnica do eSocial', href: 'https://www.gov.br/esocial/pt-br/documentacao-tecnica/documentacao-tecnica' }, ' e ', { text: 'manual do módulo SST', href: 'https://www.gov.br/esocial/pt-br/empresas/manual-web-geral' }, '.'] },
      ],
    },
  ],
} as const satisfies ServiceContent;
