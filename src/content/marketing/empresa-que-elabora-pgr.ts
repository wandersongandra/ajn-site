import type { MarketingContent } from '../types';

export const empresaQueElaboraPgr = {
	slug: 'empresa-que-elabora-pgr',
	path: '/empresa-que-elabora-pgr',
	title: 'Consultoria em PGR em Belo Horizonte | AJN',
	description: 'Consultoria para PGR em Belo Horizonte: inventário de riscos, plano de ação e avaliação das atividades. Entenda o escopo antes de contratar.',
	heading: 'Consultoria em PGR e gerenciamento de riscos ocupacionais',
	images: [
		{ src: '/images/content/marketing/empresa-que-elabora-pgr/empresa-que-elabora-pgr-01.webp', alt: 'Imagem de apoio ao levantamento de riscos ocupacionais' },
		{ src: '/images/content/marketing/empresa-que-elabora-pgr/empresa-que-elabora-pgr-02.webp', alt: 'Imagem de apoio ao planejamento de medidas preventivas' },
		{ src: '/images/content/marketing/empresa-que-elabora-pgr/empresa-que-elabora-pgr-03.webp', alt: 'Imagem de apoio à documentação de segurança do trabalho' },
	],
	sections: [
		{
			heading: 'O que observar ao contratar a elaboração do PGR',
			paragraphs: [
				'O Programa de Gerenciamento de Riscos (PGR) precisa refletir as atividades e os riscos efetivos da empresa. Antes de elaborar ou revisar a documentação, é necessário conhecer os ambientes, funções, tarefas e controles já existentes.',
				'A AJN presta consultoria em segurança do trabalho em Belo Horizonte e região. A definição do escopo considera a situação da empresa e as exigências aplicáveis da NR-1, sem tratar o PGR como um documento padronizado para qualquer operação.',
			],
		},
		{
			heading: 'Inventário de riscos e plano de ação',
			paragraphs: [
				'Na estrutura do PGR, o inventário registra a identificação e a avaliação dos riscos ocupacionais. O plano de ação organiza as medidas de prevenção necessárias, com acompanhamento e responsabilidades definidos segundo a realidade da organização.',
				'Mudanças no processo, na exposição ou nas condições de trabalho podem demandar revisão das informações. Por isso, o levantamento e a participação das áreas operacionais fazem diferença.',
				{ segments: ['Veja também como a AJN apresenta o serviço de ', { text: 'elaboração de PGR', href: '/elaboracao-pgr' }, '.'] },
			],
		},
		{
			heading: 'Quando são necessárias avaliações ocupacionais',
			paragraphs: [
				'Alguns riscos exigem avaliações técnicas complementares para apoiar a caracterização das condições de exposição. O método, os instrumentos e os critérios devem ser definidos para o agente e a finalidade do levantamento.',
				{ segments: ['Conheça as modalidades de ', { text: 'medições ambientais ocupacionais', href: '/medicoes-ambientais-ocupacionais' }, ' disponibilizadas para avaliação de escopo.'] },
			],
		},
		{
			heading: 'O que informar para pedir uma proposta',
			paragraphs: [
				'Informe a atividade principal, localização das unidades, número de trabalhadores, funções, turnos e se a empresa já possui PGR ou inventário de riscos. Se houve alteração recente na operação, descreva o que mudou.',
				'A análise inicial permite verificar as etapas de levantamento, eventuais visitas e os documentos que devem integrar o escopo solicitado.',
				{ segments: ['Para conversar sobre a demanda, ', { text: 'entre em contato com a AJN', href: '/contato' }, '.'] },
			],
		},
	],
} as const satisfies MarketingContent;
