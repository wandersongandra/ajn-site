import ajnEditorial from '../../assets/blog/ajn/controle-de-qualidade-em-obras-e-servicos.webp';
import image from '../../assets/blog/editorial-qualidade-obras.webp';
import type { BlogContentData } from '../types';

export const blogControleDeQualidadeEmObrasEServicos = {
	slug: 'controle-de-qualidade-em-obras-registros-inspecoes-e-desvios',
	path: '/blog/controle-de-qualidade-em-obras-registros-inspecoes-e-desvios',
	title: 'Qualidade em obras: registros, inspeções e desvios | AJN',
	description: 'Veja como organizar verificações de serviços, materiais e não conformidades para dar rastreabilidade à qualidade de obras e contratos.',
	heading: 'Qualidade em obras: como organizar verificações e desvios',
	pubDate: '2026-10-09',
	author: 'AJN Consultoria e Engenharia',
	topic: 'Gestão ambiental e qualidade',
	image: { src: ajnEditorial, alt: 'Estruturas e formas em etapa de execução em obra civil' },
	categories: ['Gestão ambiental e qualidade'],
	tags: ['qualidade em obras', 'FVS', 'materiais', 'não conformidade', 'contratos'],
	gallery: [],
	sections: [
		{ heading: 'Converta requisitos em pontos de verificação', paragraphs: [
			'Em uma obra ou serviço contratado, o controle da qualidade começa pela leitura dos requisitos do contrato, projetos, especificações e procedimentos aplicáveis. Transforme cada requisito em uma etapa verificável, indicando responsável, critério de aceitação e registro esperado.',
			'O Plano da Qualidade da Obra, quando previsto no escopo, pode organizar responsabilidades, documentos, inspeções e tratamento de desvios. A Ficha de Verificação de Serviços (FVS) registra a conferência de uma etapa específica segundo critérios definidos para aquele contrato. Os nomes e formatos variam entre organizações; o conteúdo deve acompanhar o sistema adotado pelo cliente.'
		] },
		{ heading: 'Materiais, execução e rastreabilidade', paragraphs: [
			'Antes da aplicação, confirme os requisitos de recebimento e armazenamento previstos nos documentos do projeto e do contrato. Registre identificação e evidências necessárias para relacionar o material ao lote, fornecedor, local de uso ou etapa executada, quando esses dados forem relevantes.',
			'As inspeções devem ocorrer em momentos que permitam verificar o serviço e corrigir falhas antes que fiquem ocultas por uma etapa posterior. Defina quem verifica, como registra o resultado e quem pode liberar a continuidade conforme o procedimento do empreendimento.'
		] },
		{ heading: 'Como tratar um desvio sem perder o histórico', paragraphs: [
			'Quando o resultado não atende ao critério acordado, registre o requisito, a evidência observada, o local, a data e o responsável pela avaliação. Encaminhe o desvio a quem tem autoridade para definir correção e prazo. Depois, verifique a execução e registre o encerramento ou a pendência.',
			'Uma lista de pendências é útil quando permite priorizar impacto, responsável e situação. Repetições podem indicar necessidade de revisar método, projeto, material, treinamento ou planejamento, em vez de apenas refazer o serviço.'
		] },
		{ heading: 'Limites e perguntas frequentes', paragraphs: [
			'Esse acompanhamento equivale a uma certificação ISO? Não. A AJN informa que sua gestão da qualidade não é atividade de certificação. Certificação depende de organismo competente e de escopo próprio.',
			'FVS e permissão de trabalho são a mesma coisa? Não necessariamente. A FVS registra verificação de serviço segundo critérios de qualidade; uma Permissão de Trabalho pode integrar controles de autorização e segurança de uma atividade conforme o procedimento aplicável.'
		] },
		{ heading: 'Referência de serviço', paragraphs: [
			{ segments: [{ text: 'MTE — NR-18 vigente, para consultar requisitos de segurança e saúde na indústria da construção', href: 'https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/norma-regulamentadora-no-18-nr-18' }] },
			{ segments: [{ text: 'AJN — gestão da qualidade em obras e serviços contratados', href: '/servicos/gestao-da-qualidade' }] },
			'Escopo, critérios, documentos e entregáveis são definidos para cada contrato. A proposta deve identificar interfaces com contratante, executores e responsáveis técnicos.'
		] },
	],
} as const satisfies BlogContentData;
