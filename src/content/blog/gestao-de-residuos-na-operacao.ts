import image from '../../assets/blog/ajn/gestao-de-residuos-na-operacao.webp';
import type { BlogContentData } from '../types';

export const blogGestaoDeResiduosNaOperacao = {
	slug: 'gestao-de-residuos-como-organizar-a-rotina-da-operacao',
	path: '/blog/gestao-de-residuos-como-organizar-a-rotina-da-operacao',
	title: 'Gestão de resíduos: como organizar a rotina da operação | AJN',
	description: 'Um roteiro prático para mapear resíduos, definir responsabilidades, organizar áreas de armazenamento e acompanhar a destinação na empresa.',
	heading: 'Gestão de resíduos: como organizar a rotina da operação',
	pubDate: '2026-10-09',
	author: 'AJN Consultoria e Engenharia',
	topic: 'Gestão ambiental e qualidade',
	image: { src: image, alt: 'Pontos de coleta de resíduos identificados em canteiro de obras' },
	categories: ['Gestão ambiental e qualidade'],
	tags: ['gestão de resíduos', 'meio ambiente', 'segregação', 'rotina operacional'],
	gallery: [],
	sections: [
		{ heading: 'Comece pelo que a operação realmente gera', paragraphs: [
			'Uma rotina de resíduos começa pelo mapeamento dos processos e dos materiais descartados em cada etapa. Registre onde o resíduo é gerado, quem o manuseia, como é separado e para onde segue. Esse levantamento ajuda a identificar misturas, pontos de acúmulo e responsabilidades sem presumir que todas as unidades tenham o mesmo perfil.',
			'A Política Nacional de Resíduos Sólidos estabelece princípios e instrumentos para a gestão integrada e o gerenciamento ambientalmente adequado. As obrigações específicas variam conforme a atividade, o resíduo, a localidade e as regras de licenciamento aplicáveis; a empresa deve verificar os requisitos que incidem sobre sua operação.'
		] },
		{ heading: 'Desenhe um fluxo simples e verificável', paragraphs: [], lists: [{ ordered: true, items: [
			'Identifique os pontos de geração e os tipos de resíduos observados nas atividades.',
			'Defina recipientes, identificação e locais de armazenamento compatíveis com cada resíduo e com os requisitos aplicáveis.',
			'Indique quem separa, inspeciona, registra movimentações e solicita a coleta.',
			'Confirme transportador e destinação previstos para o caso e mantenha os comprovantes exigidos pela regra ou pelo contrato.',
			'Revise o fluxo quando houver mudança de processo, fornecedor, volume ou condição de armazenamento.'
		] }] },
		{ heading: 'Treinamento e inspeções conectam o procedimento ao trabalho', paragraphs: [
			'Instruções curtas no ponto de geração tendem a ser mais úteis do que uma regra genérica distante da tarefa. Explique como reconhecer os fluxos definidos, o que fazer diante de dúvida ou mistura acidental e a quem comunicar uma condição insegura. Ajuste o conteúdo às funções e aos resíduos presentes no local.',
			'Inspeções podem verificar identificação, integridade dos recipientes, organização da área, registros e cumprimento do fluxo. Trate o resultado como informação para corrigir o processo e orientar as equipes. Uma campanha isolada não substitui controles operacionais e responsabilidades definidos.'
		] },
		{ heading: 'Perguntas frequentes', paragraphs: [
			'Toda empresa precisa do mesmo plano de gerenciamento? Não. O enquadramento depende da atividade e dos critérios legais aplicáveis. Confirme a exigência com base no empreendimento, nos resíduos e nas autoridades competentes.',
			'A separação para reciclagem resolve toda a gestão? Não. Segregação é uma etapa. Também é necessário organizar armazenamento, coleta, transporte e destinação conforme o tipo de resíduo e os requisitos aplicáveis.'
		] },
		{ heading: 'Referências e apoio', paragraphs: [
			{ segments: [{ text: 'Lei nº 12.305/2010 — Política Nacional de Resíduos Sólidos', href: 'https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2010/lei/l12305.htm' }] },
			{ segments: [{ text: 'AJN — gestão ambiental', href: '/servicos/gestao-ambiental' }] },
			'A AJN descreve apoio à organização de resíduos e a ações de orientação ambiental. Requisitos de monitoramento, licenciamento, estudos ou destinação devem ser avaliados por operação e confirmados no escopo contratado.'
		] },
	],
} as const satisfies BlogContentData;
