import type { MarketingContent } from '../types';

export const elaboracaoPcmso = {
	slug: 'elaboracao-pcmso',
	path: '/elaboracao-pcmso',
	title: 'Elaboração de PCMSO (NR-07) para Empresas | AJN Engenharia',
	description: 'Elaboração de PCMSO conforme a NR-07 em Belo Horizonte e MG. Planejamento de exames ocupacionais (ASO) integrado ao inventário de riscos do PGR.',
	heading: 'Elaboração de PCMSO conforme a NR-07',
	images: [
		{ src: '/images/content/marketing/elaboracao-pgr-pcmso/elaboracao-pgr-pcmso-02.webp', alt: 'Elaboração de PCMSO e gestão de saúde ocupacional' },
		{ src: '/images/content/marketing/consultoria-da-qualidade/consultoria-da-qualidade-02.webp', alt: 'Análise técnica de riscos para o PCMSO' },
		{ src: '/images/content/marketing/consultoria-da-qualidade/consultoria-da-qualidade-01.webp', alt: 'Acompanhamento de exames e documentação ocupacional' },
	],
	sections: [
		{
			heading: 'Como é estruturada a elaboração do PCMSO pela NR-07',
			paragraphs: [
				'O Programa de Controle Médico de Saúde Ocupacional (PCMSO) estabelece as diretrizes clínicas e laboratoriais para monitorar a saúde dos trabalhadores em função dos riscos aos quais estão expostos. De acordo com a NR-07, o programa deve ser elaborado e conduzido sob responsabilidade de médico do trabalho e guardar coerência direta com o inventário de riscos do PGR (NR-01).',
				'A AJN Consultoria e Engenharia organiza a elaboração do PCMSO em Belo Horizonte e Minas Gerais a partir do reconhecimento real dos setores, cargos e agentes físicos, químicos, biológicos e ergonômicos presentes na empresa.',
			],
		},
		{
			heading: 'O que deve constar no documento-base do PCMSO',
			paragraphs: [
				'Um PCMSO tecnicamente bem construído vai além de uma tabela genérica de exames:',
			],
			lists: [
				{
					items: [
						'Identificação da empresa, grau de risco, setores operacionais e descrição das funções ativas;',
						'Correlação entre os riscos ocupacionais mapeados no PGR e o cronograma de exames clínicos e complementares (como audiometria, espirometria, acuidade visual, hemograma, raio-X padrão OIT ou exames toxicológicos conforme os Anexos da NR-07);',
						'Critérios e periodicidade para emissão do Atestado de Saúde Ocupacional (ASO) nos exames admissional, periódico, de retorno ao trabalho, de mudança de riscos ocupacionais e demissional;',
						'Diretrizes para elaboração do relatório analítico anual do PCMSO e acompanhamento epidemiológico dos resultados.',
					],
				},
			],
		},
		{
			heading: 'Integração com o PGR e o evento S-2220 do eSocial',
			paragraphs: [
				'A consistência entre a grade de exames do PCMSO e os fatores de risco declarados no PGR evita inconsistências no envio do evento S-2220 (Monitoramento da Saúde do Trabalhador) ao eSocial e reduz questionamentos em fiscalizações e auditorias de clientes.',
				{
					segments: [
						'Conheça também nossa página do serviço de ',
						{ text: 'PCMSO e ASOs', href: '/servicos/pcmso-e-asos' },
						' e a página de ',
						{ text: 'Elaboração do PGR e PCMSO', href: '/elaboracao-pgr-pcmso' },
						'.',
					],
				},
			],
		},
		{
			heading: 'Solicite uma proposta para elaboração do PCMSO',
			paragraphs: [
				'Informe o CNPJ, a cidade, o número de empregados, a lista de funções e se a sua empresa já possui o PGR atualizado para dimensionarmos o atendimento.',
				{
					segments: [
						'Ligue para ',
						{ bold: true, text: '31 98473-4644' },
						' ou ',
						{ text: 'solicite orçamento pelo site', href: '/contato' },
						'.',
					],
				},
			],
		},
	],
} as const satisfies MarketingContent;
