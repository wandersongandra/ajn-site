import type { MarketingContent } from '../types';

export const laudosSegurancaDoTrabalhoEsocial = {
	slug: 'laudos-seguranca-do-trabalho-esocial',
	path: '/laudos-seguranca-do-trabalho-esocial',
	title: 'Laudos de Segurança do Trabalho para o eSocial (SST) | AJN',
	description: 'Saiba quais laudos e programas de segurança do trabalho alimentam os eventos S-2210, S-2220 e S-2240 do eSocial e como regularizar sua empresa em BH e MG.',
	heading: 'Laudos de Segurança do Trabalho para os Eventos do eSocial',
	images: [
		{ src: '/images/content/marketing/ltcat-evento-esocial/ltcat-evento-esocial-01.webp', alt: 'Laudos de segurança do trabalho para envio ao eSocial' },
		{ src: '/images/content/marketing/laudos-seguranca-do-trabalho-esocial/laudos-seguranca-do-trabalho-esocial-02.webp', alt: 'Levantamento de agentes nocivos e condições ambientais para o eSocial' },
		{ src: '/images/content/marketing/ltcat-evento-esocial/ltcat-evento-esocial-01.webp', alt: 'Gestão técnica dos eventos S-2210, S-2220 e S-2240' },
		{ src: '/images/content/marketing/laudos-seguranca-do-trabalho-esocial/laudos-seguranca-do-trabalho-esocial-04.webp', alt: 'Conformidade documental em SST e eSocial' },
	],
	sections: [
		{
			heading: 'Como os laudos de SST se conectam aos eventos do eSocial',
			paragraphs: [
				'O eSocial não criou novas Normas Regulamentadoras nem novos laudos, mas tornou digital e cruzável a fiscalização das obrigações trabalhistas e previdenciárias que já existiam. Para transmitir os eventos de Segurança e Saúde no Trabalho sem inconsistências, a empresa precisa de lastro técnico em documentos assinados por profissionais habilitados.',
				'A AJN Consultoria e Engenharia elabora toda a base técnica de engenharia e saúde ocupacional em Belo Horizonte e Minas Gerais para que os envios ao eSocial reflitam a realidade da operação.',
			],
		},
		{
			heading: 'Relação entre cada evento de SST e seu documento-base',
			paragraphs: [
				'Os três eventos de SST do eSocial dependem diretamente das seguintes entregas:',
			],
			lists: [
				{
					items: [
						'Evento S-2240 (Condições Ambientais do Trabalho - Agentes Nocivos): fundamentado pelo LTCAT, que identifica os agentes físicos, químicos e biológicos da Tabela 24, as medições quantitativas e os dados de EPC e EPI para compor o PPP eletrônico;',
						'Evento S-2220 (Monitoramento da Saúde do Trabalhador): fundamentado pelo PCMSO (NR-07) e pelos Atestados de Saúde Ocupacional (ASOs), registrando os exames clínicos e complementares realizados por cada empregado;',
						'Evento S-2210 (Comunicação de Acidente de Trabalho - CAT): apoiado pela investigação técnica de acidentes e pelo mapeamento de riscos do PGR (NR-01).',
					],
				},
			],
		},
		{
			heading: 'Riscos de enviar eventos sem laudos atualizados',
			paragraphs: [
				'Transmitir o evento S-2240 com informações copiadas de anos anteriores ou divergentes do PGR e do PCMSO expõe a empresa a malha fiscal previdenciária e a questionamentos em reclamatórias trabalhistas.',
				{
					segments: [
						'Veja mais detalhes em nossas páginas sobre ',
						{ text: 'LTCAT e Evento eSocial', href: '/ltcat-evento-esocial/' },
						' e ',
						{ text: 'Assessoria em Saúde Ocupacional', href: '/servicos/assessoria-e-consultoria-em-saude-ocupacional/' },
						'.',
					],
				},
			],
		},
		{
			heading: 'Solicite orçamento para regularizar seus laudos e eSocial',
			paragraphs: [
				'Informe o CNPJ, o número de funcionários e a situação atual dos seus documentos de SST para avaliarmos o escopo de atendimento.',
				{
					segments: [
						'Ligue para ',
						{ bold: true, text: '31 98473-4644' },
						' ou ',
						{ text: 'fale com a AJN pelo site', href: '/contato/' },
						'.',
					],
				},
			],
		},
	],
} as const satisfies MarketingContent;
