import type { MarketingContent } from '../types';

export const empresaCombateIncendioBh = {
	slug: 'empresa-combate-incendio-bh',
	path: '/empresa-combate-incendio-bh',
	title: 'Consultoria em segurança contra incêndio em BH | AJN',
	description: 'Precisa de orientação sobre PPCIP, AVCB ou CLCB em Belo Horizonte? A AJN analisa o cenário da edificação e o escopo de regularização.',
	heading: 'Empresa de combate a incêndio em bh',
	images: [
		{ src: '/images/content/marketing/empresa-combate-incendio-bh/empresa-combate-incendio-bh-01.webp', alt: 'Imagem de apoio sobre projetos e segurança contra incêndio' },
		{ src: '/images/content/marketing/empresa-combate-incendio-bh/empresa-combate-incendio-bh-02.webp', alt: 'Imagem de apoio à documentação de prevenção contra incêndio' },
		{ src: '/images/content/marketing/empresa-combate-incendio-bh/empresa-combate-incendio-bh-03.webp', alt: 'Imagem de apoio às medidas de proteção de edificações' },
	],
	sections: [
		{ heading: 'Projeto, prevenção e regularização de edificações', paragraphs: [
			'Uma empresa que precisa regularizar seu imóvel em Belo Horizonte deve começar pelo enquadramento da edificação. O uso do espaço, a área, as condições de ocupação e as medidas de segurança existentes influenciam a documentação necessária.',
			'A AJN atende demandas de consultoria e projetos relacionados à prevenção e ao combate a incêndio, incluindo a análise do escopo técnico e documental para processos junto ao Corpo de Bombeiros Militar de Minas Gerais.',
		] },
		{ heading: 'Quando buscar orientação para AVCB ou CLCB', paragraphs: [
			'Uma mudança de ocupação, uma reforma ou a necessidade de renovar a documentação são situações em que vale avaliar a condição do imóvel antes de iniciar o processo. A modalidade de licenciamento e os documentos exigidos variam de acordo com o enquadramento feito pelo Corpo de Bombeiros.',
			'AVCB e CLCB não devem ser tratados como documentos intercambiáveis para qualquer imóvel. A verificação inicial permite identificar quais informações reunir e se há necessidade de projeto, adequação ou acompanhamento documental.',
		] },
		{ heading: 'Quais informações ajudam na análise inicial', paragraphs: [
			'Na primeira conversa, informe o endereço do imóvel, sua atividade principal, a área aproximada, as condições de uso e a demanda: projeto novo, regularização, adequação ou renovação.',
			'Se houver planta, projeto anterior, documento de vistoria ou exigência formal do Corpo de Bombeiros, esses materiais ajudam a compreender o trabalho necessário. O escopo e os prazos devem ser avaliados a partir dessas informações.',
		] },
		{ heading: 'Serviços relacionados de segurança contra incêndio', paragraphs: [
			{ segments: ['Para entender o desenvolvimento do projeto e a documentação técnica, consulte a página de ', { text: 'projetos PPCIP', href: '/servicos/projetos-de-combate-a-incendio-e-panico-ppcip' }, '.'] },
			{ segments: ['Se a prioridade é verificar um processo existente ou a renovação de um documento, veja o serviço de ', { text: 'regularização de imóveis junto ao Corpo de Bombeiros', href: '/servicos/regularizacao-de-imoveis-junto-ao-corpo-de-bombeiros' }, '.'] },
		] },
		{ heading: 'Converse com a AJN sobre a sua edificação', paragraphs: [
			'A orientação inicial ajuda a separar o que já está documentado do que ainda precisa ser levantado. A aprovação e a emissão de licenças dependem dos procedimentos e exigências da autoridade competente, sem garantia automática de resultado.',
			{ segments: ['Para apresentar sua demanda e pedir uma avaliação de escopo, ', { text: 'entre em contato com a AJN', href: '/contato' }, '.'] },
		] },
	],
} as const satisfies MarketingContent;
