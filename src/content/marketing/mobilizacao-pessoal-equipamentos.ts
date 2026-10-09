import type { MarketingContent } from '../types';

export const mobilizacaoPessoalEquipamentos = {
	slug: 'mobilizacao-pessoal-equipamentos', path: '/mobilizacao-pessoal-equipamentos',
	title: 'Mobilização e acompanhamento técnico em campo | AJN',
	description: 'Apoio técnico à mobilização de equipes e equipamentos, organização documental, inspeções e acompanhamento de atividades conforme o escopo contratado.',
	heading: 'Mobilização e acompanhamento técnico',
	images: [
		{ src: '/images/content/marketing/mobilizacao-pessoal-equipamentos/mobilizacao-pessoal-equipamentos-01.webp', alt: 'Atividade de mobilização e acompanhamento técnico' },
		{ src: '/images/content/marketing/mobilizacao-pessoal-equipamentos/mobilizacao-pessoal-equipamentos-02.webp', alt: 'Equipe em atividade de campo' },
		{ src: '/images/content/marketing/mobilizacao-pessoal-equipamentos/mobilizacao-pessoal-equipamentos-03.webp', alt: 'Acompanhamento de atividade operacional' },
	],
	sections: [
		{ heading: 'Organização antes do início das atividades', paragraphs: [
			'A mobilização reúne verificações necessárias para preparar equipes e equipamentos para uma atividade ou empreendimento. O escopo depende do contrato, do local, dos riscos e dos requisitos definidos pela empresa contratante.',
			'A AJN informa atuação com organização documental, apoio à mobilização de terceiros, inspeções, orientações em campo e acompanhamento técnico de obras e atividades. As responsabilidades de cada parte devem ser definidas antes do início do trabalho.'
		] },
		{ heading: 'Frentes de apoio que podem compor o escopo', paragraphs: [], lists: [{ items: [
			'Levantamento dos requisitos documentais e das etapas de mobilização aplicáveis ao contrato.',
			'Organização e conferência de documentos relacionados à segurança e saúde no trabalho, respeitando responsabilidades e acesso restrito a informações de saúde.',
			'Inspeções técnicas e registro de desvios observados em campo, com encaminhamento para os responsáveis definidos.',
			'Orientações às equipes e acompanhamento de atividades conforme o escopo, a qualificação exigida e a responsabilidade técnica aplicável.'
		] }] },
		{ heading: 'Informações para avaliar uma proposta', paragraphs: [
			'Para dimensionar o atendimento, a empresa pode informar o tipo de atividade ou obra, local, cronograma, quantidade aproximada de equipes e contratadas, equipamentos envolvidos, riscos conhecidos e requisitos documentais existentes.',
			'Entregáveis, frequência de visitas, profissionais envolvidos e limites de responsabilidade são definidos após análise da demanda e formalizados na proposta. A página não representa uma promessa de equipe alocada ou de cobertura contínua para todos os contratos.'
		] },
		{ heading: 'Perguntas frequentes', paragraphs: [
			'A mobilização substitui a gestão de SST da contratante? Não. Cada organização mantém suas responsabilidades legais e contratuais; o apoio da AJN deve ser delimitado no escopo acordado.',
			'A AJN acompanha qualquer obra em qualquer local? A disponibilidade, a região atendida e o formato de acompanhamento precisam ser confirmados para cada solicitação.'
		] },
		{ heading: 'Solicite uma avaliação do escopo', paragraphs: [
			'Compartilhe pelo canal de contato o tipo de atividade, local e etapa do projeto. A equipe poderá avaliar quais documentos, inspeções ou formas de acompanhamento fazem sentido para a necessidade apresentada.'
		] },
	],
} as const satisfies MarketingContent;
