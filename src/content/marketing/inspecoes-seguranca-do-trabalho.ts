import type { MarketingContent } from '../types';

export const inspecoesSegurancaDoTrabalho = {
	slug: 'inspecoes-seguranca-do-trabalho',
	path: '/inspecoes-seguranca-do-trabalho',
	title: 'Inspeções de segurança do trabalho | AJN Consultoria e Engenharia',
	description: 'Inspeções de segurança do trabalho com registro de condições encontradas, prioridades e acompanhamento das ações corretivas. Conheça a atuação da AJN.',
	heading: 'Inspeções de segurança do trabalho',
	images: [
		{ src: '/images/content/marketing/inspecoes-seguranca-do-trabalho/inspecoes-seguranca-do-trabalho-01.webp', alt: 'Inspeções de segurança do trabalho' },
		{ src: '/images/content/marketing/inspecoes-seguranca-do-trabalho/inspecoes-seguranca-do-trabalho-02.webp', alt: 'Inspeções de segurança do trabalho' },
		{ src: '/images/content/marketing/inspecoes-seguranca-do-trabalho/inspecoes-seguranca-do-trabalho-03.webp', alt: 'Inspeções de segurança do trabalho' },
	],
	sections: [
		{
			heading: 'O que observar em uma inspeção de segurança do trabalho',
			paragraphs: [
				'Uma inspeção começa pela observação do trabalho real: circulação de pessoas, uso de máquinas e ferramentas, organização do local, proteção coletiva e condições de acesso às atividades.',
				'O levantamento deve registrar onde está o problema, quem pode ser exposto e quais medidas já existem. Fotografias, quando autorizadas, ajudam a documentar a situação encontrada.',
				'O resultado serve para orientar prioridades e responsáveis. A inspeção não substitui avaliações quantitativas, laudos específicos ou outras análises exigidas para cada exposição.',
			],
			subsections: [{
				heading: 'Registros que ajudam a acompanhar as correções',
				paragraphs: [
					'Um registro útil informa a localização, a condição observada, o risco associado, a medida recomendada, o responsável e o prazo acordado.',
					'Na verificação seguinte, é possível conferir o que foi resolvido, o que continua pendente e se a medida adotada funciona nas condições de trabalho.',
				],
			}, {
				heading: 'Participação de quem executa a atividade',
				paragraphs: [
					'Conversar com operadores, líderes e equipes de manutenção permite entender rotinas, improvisos e dificuldades que podem não aparecer apenas na observação visual.',
					'Essas informações precisam ser conferidas com os responsáveis e incorporadas ao plano de ação, sem expor indevidamente os trabalhadores.',
				],
			}],
		},
		{
			heading: 'Como organizar uma inspeção de segurança do trabalho',
			paragraphs: ['Antes da visita, defina quais áreas e atividades serão observadas e quais documentos, permissões e acompanhamentos serão necessários. A frequência depende dos riscos e da dinâmica da operação.'],
			subsections: [{
				heading: 'Etapas do levantamento',
				paragraphs: [],
				lists: [{ items: [
					'Preparação: delimitar áreas, atividades, horários e responsáveis pelo acompanhamento.',
					'Observação: verificar situações de risco, medidas de controle e condições reais de execução.',
					'Registro: descrever achados com localização, evidências e prioridade de tratamento.',
					'Plano de ação: definir medidas, responsáveis e prazos com a gestão da área.',
					'Retorno: confirmar a execução das medidas e avaliar pendências que ainda exigem acompanhamento.',
				]}],
			}, {
				heading: 'Como ouvir a equipe durante a visita',
				paragraphs: [
					'Pergunte como a tarefa costuma ser feita e quais dificuldades aparecem durante a jornada. Compare as respostas com os procedimentos existentes e com o que foi observado.',
					'Apresente os achados de forma objetiva aos responsáveis pela área e registre as decisões tomadas para que a equipe acompanhe as providências.',
				],
			}],
		},
		{
			heading: 'Acompanhamento após a inspeção',
			paragraphs: ['O relatório é o início do acompanhamento. Mudanças de processo, novos equipamentos, ocorrências e ações pendentes podem exigir uma nova verificação antes da próxima inspeção programada.'],
			subsections: [{
				heading: 'Periodicidade conforme a atividade',
				paragraphs: [
					'Não existe uma única frequência adequada para todos os ambientes. O cronograma deve considerar o perfil dos riscos, a operação, as exigências aplicáveis e o histórico de desvios.',
					'Atividades críticas ou alterações relevantes na rotina podem justificar verificações adicionais.',
				],
			}],
		},
		{
			heading: 'Como Utilizar os Resultados para Melhorar as Práticas de Segurança',
			paragraphs: [
				'Consolide os achados por área, tipo de risco, prioridade e situação das ações. Isso ajuda a reconhecer problemas recorrentes e a direcionar os próximos levantamentos.',
				'As medidas concluídas devem ser verificadas na prática. Quando uma solução não controla o risco, o plano precisa ser revisto.',
			],
		},
		{
			heading: 'Entre em contato',
			paragraphs: [
				'Para definir o escopo de uma inspeção, informe à AJN o tipo de atividade, as áreas envolvidas, o local de atendimento e a principal necessidade da empresa.',
				'A equipe poderá avaliar os documentos disponíveis e orientar os próximos passos para o levantamento e o acompanhamento das ações.',
			],
		},
		{
			heading: 'Para saber mais sobre Inspeções de segurança do trabalho',
			paragraphs: [{ segments: ['Ligue para ', { bold: true, text: '31 98473-4644' }, ' ou ', { text: 'clique aqui', href: '/contato/' }, ' e entre em contato por email.'] }],
		},
	],
} as const satisfies MarketingContent;
