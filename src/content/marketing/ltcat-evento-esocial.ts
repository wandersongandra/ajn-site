import type { MarketingContent } from '../types';

export const ltcatEventoEsocial = {
	slug: 'ltcat-evento-esocial',
	path: '/ltcat-evento-esocial',
	title: 'LTCAT e o Evento S-2240 do eSocial: Guia Técnico | AJN Engenharia',
	description: 'Entenda a relação entre o LTCAT, a Tabela 24 e o evento S-2240 do eSocial (Condições Ambientais do Trabalho) para o PPP eletrônico da sua empresa.',
	heading: 'LTCAT e o Evento S-2240 do eSocial',
	images: [
		{ src: '/images/content/marketing/ltcat-evento-esocial/ltcat-evento-esocial-01.webp', alt: 'LTCAT para envio do evento S-2240 no eSocial' },
		{ src: '/images/content/marketing/ltcat-evento-esocial/ltcat-evento-esocial-02.webp', alt: 'Análise de agentes nocivos da Tabela 24 do eSocial' },
		{ src: '/images/content/marketing/ltcat-evento-esocial/ltcat-evento-esocial-03.webp', alt: 'Levantamento ambiental para PPP eletrônico' },
	],
	sections: [
		{
			heading: 'Qual evento do eSocial exige as informações do LTCAT',
			paragraphs: [
				'No eSocial, as informações do Laudo Técnico das Condições Ambientais do Trabalho (LTCAT) são a base técnica para o preenchimento e envio do evento S-2240 (Condições Ambientais do Trabalho - Agentes Nocivos). É por meio desse evento que o Governo Federal alimenta o Perfil Profissiográfico Previdenciário (PPP) em meio eletrônico.',
				'Transmitir o evento S-2240 sem um LTCAT válido ou informar códigos da Tabela 24 em desacordo com a exposição real pode gerar cobrança retroativa de alíquota adicional do RAT (6%, 9% ou 12%) ou multas por omissão/inexatidão de dados previdenciários.',
			],
		},
		{
			heading: 'Dados que o LTCAT fornece para o evento S-2240',
			paragraphs: [
				'A AJN Consultoria e Engenharia estrutura o LTCAT para que o sistema de folha/SST disponha de todos os campos exigidos pelo leiaute do eSocial:',
			],
			lists: [
				{
					items: [
						'Descrição do setor, ambiente de trabalho e atividades desempenhadas pelo trabalhador;',
						'Enquadramento preciso dos agentes nocivos físicos, químicos e biológicos segundo os códigos da Tabela 24 do eSocial (ou código 09.01.001 para ausência de exposição a agentes nocivos);',
						'Tipo de avaliação (qualitativa ou quantitativa), intensidade/concentração medida, limite de tolerância e técnica de medição utilizada;',
						'Informações sobre implementação de EPCs e fornecimento de EPIs, incluindo números de Certificado de Aprovação (CA) e atendimento aos requisitos de validade, periodicidade e higienização;',
						'Identificação completa do responsável técnico pelos registros ambientais (CPF e registro no CREA ou CRM).',
					],
				},
			],
		},
		{
			heading: 'Quando enviar nova carga no S-2240 e atualizar o LTCAT',
			paragraphs: [
				'Qualquer alteração no ambiente de trabalho, introdução de novas máquinas, mudança de função do colaborador ou modificação na eficácia das proteções coletivas exige revisão do LTCAT e transmissão de novo evento S-2240 até o dia 15 do mês subsequente à alteração.',
				{
					segments: [
						'Consulte também nossas páginas sobre ',
						{ text: 'Emissão de LTCAT', href: '/emissao-ltcat/' },
						' e ',
						{ text: 'Assessoria em Saúde Ocupacional e eSocial', href: '/servicos/assessoria-e-consultoria-em-saude-ocupacional/' },
						'.',
					],
				},
			],
		},
		{
			heading: 'Regularize seu LTCAT para o eSocial com a AJN',
			paragraphs: [
				'Atendemos empresas em Belo Horizonte e Minas Gerais na elaboração do LTCAT e na parametrização técnica para os eventos de SST do eSocial.',
				{
					segments: [
						'Ligue para ',
						{ bold: true, text: '31 98473-4644' },
						' ou ',
						{ text: 'solicite uma proposta técnica', href: '/contato/' },
						'.',
					],
				},
			],
		},
	],
} as const satisfies MarketingContent;
