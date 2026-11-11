import type { MarketingContent } from '../types';

export const pcmsoProgramaControleMedicoSaudeOcupacional = {
	slug: 'pcmso-programa-controle-medico-saude-ocupacional',
	path: '/pcmso-programa-controle-medico-saude-ocupacional',
	title: 'PCMSO: Programa de Controle Médico de Saúde Ocupacional (NR-07) | AJN',
	description: 'Entenda o que é o PCMSO (Programa de Controle Médico de Saúde Ocupacional), quais exames compõem a NR-07 e como integrá-lo ao PGR da sua empresa.',
	heading: 'PCMSO: Programa de Controle Médico de Saúde Ocupacional (NR-07)',
	images: [
		{ src: '/images/content/marketing/pcmso-preco/pcmso-preco-01.webp', alt: 'PCMSO Programa de Controle Médico de Saúde Ocupacional' },
		{ src: '/images/content/marketing/pcmso-preco/pcmso-preco-02.webp', alt: 'Planejamento médico e exames ocupacionais da NR-07' },
		{ src: '/images/content/marketing/pcmso-preco/pcmso-preco-03.webp', alt: 'Acompanhamento de saúde ocupacional integrado ao PGR' },
	],
	sections: [
		{
			heading: 'Qual é a finalidade técnica do PCMSO na NR-07',
			paragraphs: [
				'O Programa de Controle Médico de Saúde Ocupacional (PCMSO), regulamentado pela Norma Regulamentadora nº 07 (NR-07), tem por objetivo rastrear e detectar precocemente agravos à saúde relacionados ao trabalho, além de definir a aptidão médica dos empregados para cada função.',
				'O programa é parte integrante do conjunto mais amplo de iniciativas da empresa no campo da saúde e segurança, devendo ser planejado em consonância direta com os riscos identificados e classificados no Programa de Gerenciamento de Riscos (PGR).',
			],
		},
		{
			heading: 'Exames médicos obrigatórios previstos no PCMSO',
			paragraphs: [
				'De acordo com a NR-07, o PCMSO deve incluir a realização obrigatória dos exames médicos ocupacionais nas seguintes situações:',
			],
			lists: [
				{
					items: [
						'Admissional: realizado antes que o empregado assuma suas atividades;',
						'Periódico: executado em intervalos definidos conforme a exposição a riscos ocupacionais, idade do trabalhador ou indicação dos Anexos da NR-07;',
						'De retorno ao trabalho: realizado antes da volta ao serviço de empregado ausente por período igual ou superior a 30 dias por motivo de doença ou acidente, de natureza ocupacional ou não;',
						'De mudança de riscos ocupacionais: realizado obrigatoriamente antes da data da mudança, adequando o controle médico aos novos riscos da função ou setor;',
						'Demissional: realizado em até 10 dias contados do término do contrato, podendo ser dispensado caso o exame médico mais recente tenha sido realizado há menos de 135 dias (graus de risco 1 e 2) ou 90 dias (graus de risco 3 e 4).',
					],
				},
			],
		},
		{
			heading: 'Relatório analítico e prontuário médico',
			paragraphs: [
				'Para cada exame realizado, o médico emite o Atestado de Saúde Ocupacional (ASO), e os registros clínicos individuais permanecem sob sigilo em prontuário médico. Anualmente, o médico responsável elabora o relatório analítico do PCMSO, avaliando a incidência de alterações nos exames por setor e função.',
				{
					segments: [
						'Saiba como contratar o programa em nossa página do serviço de ',
						{ text: 'PCMSO e ASOs', href: '/servicos/pcmso-e-asos' },
						' ou peça um ',
						{ text: 'Orçamento de PCMSO', href: '/orcamento-pcmso' },
						'.',
					],
				},
			],
		},
		{
			heading: 'Estruture o PCMSO da sua empresa com a AJN',
			paragraphs: [
				'A AJN Consultoria e Engenharia apoia empresas em Belo Horizonte e Minas Gerais na elaboração integrada do PGR e do PCMSO.',
				{
					segments: [
						'Ligue para ',
						{ bold: true, text: '31 98473-4644' },
						' ou ',
						{ text: 'fale com nossa equipe', href: '/contato' },
						'.',
					],
				},
			],
		},
	],
} as const satisfies MarketingContent;
