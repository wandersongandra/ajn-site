import ajnEditorial from '../../assets/blog/ajn/ppcip-avcb-clcb-como-organizar-regularizacao.webp';
import image from '../../assets/blog/editorial-incendio-regularizacao.webp';
import type { BlogContentData } from '../types';

export const blogPpcipAvcbClcbComoOrganizarRegularizacao = {
	slug: 'ppcip-avcb-clcb-como-organizar-a-regularizacao-do-imovel',
	path: '/blog/ppcip-avcb-clcb-como-organizar-a-regularizacao-do-imovel',
	title: 'PPCIP, AVCB e CLCB: como organizar a regularização | AJN',
	description: 'Entenda a relação entre projeto de incêndio, características do imóvel e etapas de licenciamento, com atenção às regras da autoridade local.',
	heading: 'PPCIP, AVCB e CLCB: organize a regularização do imóvel',
	pubDate: '2026-10-09',
	author: 'AJN Consultoria e Engenharia',
	topic: 'Engenharia e prevenção contra incêndio',
	image: { src: ajnEditorial, alt: 'Instalação de hidrante e componentes de combate a incêndio em galpão' },
	categories: ['Engenharia e prevenção contra incêndio'],
	tags: ['PPCIP', 'AVCB', 'CLCB', 'prevenção contra incêndio', 'regularização de imóveis'],
	gallery: [],
	sections: [
		{ heading: 'O caminho depende da edificação e da autoridade competente', paragraphs: [
			'Projeto de prevenção contra incêndio e licença não são nomes intercambiáveis para um único documento. O projeto apresenta soluções de segurança aplicáveis ao imóvel; o processo de regularização verifica documentos, medidas implantadas e requisitos definidos pela autoridade responsável. A nomenclatura, o procedimento e a documentação variam conforme a unidade federativa e a classificação da edificação.',
			'Em Minas Gerais, o Corpo de Bombeiros Militar de Minas Gerais publica legislação e Instruções Técnicas para os procedimentos de Segurança Contra Incêndio e Pânico. A versão vigente deve ser consultada no portal oficial antes de definir o caminho para um imóvel.'
		] },
		{ heading: 'Informações para iniciar a análise', paragraphs: [], lists: [{ items: [
			'Endereço e município do imóvel, uso atual e atividades desenvolvidas.',
			'Área, pavimentos, características construtivas e alterações realizadas, conforme documentação disponível.',
			'Projeto ou licença anterior, validade, notificações e exigências recebidas, se houver.',
			'Plantas, documentos técnicos e informações de sistemas instalados, quando disponíveis.',
			'Prazo pretendido e responsável pelo acesso ao imóvel para levantamento técnico.'
		] }] },
		{ heading: 'Etapas de trabalho que podem ser necessárias', paragraphs: [
			'Uma avaliação pode começar pela conferência do material existente e pelo levantamento das condições do imóvel. Em seguida, o responsável técnico define quais requisitos, desenhos, medidas e documentos são aplicáveis ao caso e quais informações ainda precisam ser coletadas.',
			'Após a elaboração e análise do projeto, a regularização pode exigir execução ou adequação de medidas, apresentação de documentos, vistoria ou outras etapas previstas pela autoridade local. Aprovação, prazo e resultado dependem da conformidade do imóvel e do processo administrativo; não devem ser prometidos antes da análise.'
		] },
		{ heading: 'Responsabilidades e perguntas frequentes', paragraphs: [
			'O projeto substitui a implantação das medidas? Não. A documentação precisa corresponder às condições reais e às medidas exigidas para a edificação. A execução e manutenção dos sistemas devem ser tratadas com os responsáveis competentes.',
			'AVCB e CLCB seguem o mesmo procedimento? As modalidades e critérios dependem das regras vigentes na jurisdição e do enquadramento do imóvel. Consulte a autoridade competente para o caso concreto.',
			'AJ pode avaliar um imóvel já licenciado? Sim, a AJN divulga serviços de análise de conformidade e renovação. O escopo e a possibilidade de atendimento devem ser confirmados após conhecer o imóvel e seus documentos.'
		] },
		{ heading: 'Fontes oficiais e serviços', paragraphs: [
			{ segments: [{ text: 'CBMMG — normas técnicas de Segurança Contra Incêndio e Pânico', href: 'https://www.bombeiros.mg.gov.br/normastecnicas' }] },
			{ segments: [{ text: 'CBMMG — serviços de Segurança Contra Incêndio e Pânico', href: 'https://www.bombeiros.mg.gov.br/servicos-sscip' }] },
			{ segments: [{ text: 'AJN — projetos de combate a incêndio e pânico (PPCIP)', href: '/servicos/projetos-de-combate-a-incendio-e-panico-ppcip' }] },
			{ segments: [{ text: 'AJN — regularização de imóveis junto ao Corpo de Bombeiros', href: '/servicos/regularizacao-de-imoveis-junto-ao-corpo-de-bombeiros' }] }
		] },
	],
} as const satisfies BlogContentData;
