import type { ServiceContent } from '../types';

export const servicePage = {
  slug: 'pcmso-e-asos',
  path: '/servicos/pcmso-e-asos',
  title: 'PCMSO e ASO: Saúde Ocupacional | AJN',
  description: 'Gestão de PCMSO e ASOs: organização de exames ocupacionais, acompanhamento de vencimentos e documentação de saúde do trabalho.',
  heading: 'PCMSO e ASOs',
  image: '/images/content/services/pcmso-e-asos.jpg',
  imageAlt: 'Documentação de PCMSO e saúde ocupacional',
  sections: [
    {
      heading: 'PCMSO e relação com os riscos da atividade',
      paragraphs: [
        'O Programa de Controle Médico de Saúde Ocupacional (PCMSO), previsto na NR-7, orienta o acompanhamento da saúde dos trabalhadores a partir dos riscos ocupacionais e dos critérios médicos aplicáveis.',
        'As informações sobre perigos e riscos identificados no PGR devem ser consideradas na organização das ações de saúde ocupacional. O planejamento médico e a definição dos exames cabem aos profissionais legalmente habilitados.',
      ],
    },
    {
      heading: 'Organização de exames e ASOs',
      paragraphs: [
        'O Atestado de Saúde Ocupacional (ASO) é emitido conforme a avaliação médica ocupacional aplicável. A gestão documental deve acompanhar os prazos e organizar o encaminhamento dos trabalhadores aos exames previstos.',
      ],
      lists: [{ items: [
        'Acompanhamento dos exames admissionais, periódicos, de retorno ao trabalho, de mudança de riscos ocupacionais e demissionais, conforme a NR-7.',
        'Controle documental de ASOs e identificação de pendências para programação dos atendimentos.',
        'Organização das informações necessárias à comunicação com a empresa contratante e à gestão do serviço.',
      ] }],
    },
    {
      heading: 'Sigilo e documentação',
      paragraphs: [
        'Dados de saúde ocupacional exigem tratamento cuidadoso. Os registros médicos devem permanecer sob a responsabilidade dos profissionais habilitados e com acesso restrito, conforme as obrigações aplicáveis.',
        'A gestão administrativa pode acompanhar a existência, a situação e os prazos dos documentos sem expor informações clínicas desnecessárias.',
      ],
    },
    {
      heading: 'Peça uma avaliação do serviço',
      paragraphs: [
        'Para solicitar atendimento à AJN, informe o ramo de atividade, a cidade, o número de trabalhadores e a situação atual do PCMSO e dos ASOs.',
        { segments: [
          'Acesse a ',
          { text: 'página de contato', href: '/contato' },
          ' para apresentar a demanda.',
        ] },
      ],
    },
  ],
} as const satisfies ServiceContent;
