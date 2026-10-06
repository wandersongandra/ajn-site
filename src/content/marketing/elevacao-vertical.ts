import type { MarketingContent } from '../types';

export const elevacaoVertical = {
	slug: 'elevacao-vertical', path: '/elevacao-vertical',
	title: 'Elevação vertical - AJN Consultoria e Engenharia',
	description: 'Elevação vertical refere-se ao deslocamento de materiais, equipamentos e pessoas para cima ou para baixo, sendo fundamental para a execução de obras em altura.',
	heading: 'Elevação vertical',
	images: [
		{ src: '/images/content/marketing/elevacao-vertical/elevacao-vertical-01.webp', alt: 'Elevação vertical' },
		{ src: '/images/content/marketing/elevacao-vertical/elevacao-vertical-02.webp', alt: 'Elevação vertical' },
		{ src: '/images/content/marketing/elevacao-vertical/elevacao-vertical-03.webp', alt: 'Elevação vertical' },
	],
	sections: [
		{ heading: 'A importância da elevação vertical na engenharia', paragraphs: [
			'A elevação vertical é um conceito essencial em diversas áreas, com destaque para a engenharia.',
			'Em projetos de construção civil, por exemplo, a elevação vertical refere-se ao deslocamento de materiais, equipamentos e pessoas para cima ou para baixo, sendo fundamental para a execução de obras em altura e a montagem de estruturas complexas.',
		] },
		{ heading: 'Vantagens da elevação vertical em projetos de engenharia', paragraphs: ['A utilização de técnicas adequadas de elevação vertical traz uma série de benefícios para os projetos de engenharia.', 'Entre as vantagens estão:'], lists: [{ items: ['a otimização do tempo de execução;', 'o aumento da segurança no canteiro de obras;', 'a redução de custos operacionais;', 'a melhoria da produtividade da equipe.'] }], subsections: [{ heading: 'Soluções especializadas em elevação vertical', paragraphs: [
			'Para promover o sucesso de um projeto que envolva elevação vertical, é fundamental contar com o suporte de uma empresa especializada em consultoria e engenharia, como a AJN Consultoria e Engenharia.',
			'Com expertise na área de QSSMA, a empresa oferece serviços técnicos personalizados que abrangem desde a gestão de contratos até a emissão de laudos e projetos de combate a incêndio.',
		] }] },
		{ heading: 'Segurança e conformidade na elevação vertical', paragraphs: [
			'A segurança é um aspecto primordial em qualquer operação que envolva elevação vertical.',
			'A AJN Consultoria e Engenharia atua de forma a promover a conformidade com as normas de segurança vigentes, oferecendo treinamentos especializados, emissão de laudos e responsabilidade técnica para a manutenção e instalação de equipamentos de movimento vertical.',
		] },
		{ heading: 'Benefícios adicionais dos serviços da AJN', paragraphs: [
			'Além da expertise em elevação vertical, a AJN Consultoria e Engenharia também oferece soluções relacionadas ao eSocial, meio ambiente, qualidade e saúde ocupacional.',
			'Com um portfólio abrangente, a empresa se destaca pela excelência na gestão de equipamentos, contribuindo para a eficiência e segurança das operações de seus clientes.',
			'Se você busca soluções especializadas em elevação vertical, segurança e conformidade para seus projetos de engenharia, entre em contato com a AJN Consultoria e Engenharia.',
			'Nossa equipe está preparada para oferecer suporte técnico de alta qualidade e contribuir para o sucesso e eficiência de suas operações.',
		] },
		{ heading: 'Para saber mais sobre Elevação vertical', paragraphs: [{ segments: ['Ligue para ', { bold: true, text: '31 98473-4644' }, ' ou ', { text: 'clique aqui', href: '/contato' }, ' e entre em contato por email.'] }] },
	],
} as const satisfies MarketingContent;
