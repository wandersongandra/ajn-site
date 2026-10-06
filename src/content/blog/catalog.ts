export interface BlogPostCard {
	title: string;
	href: string;
	image: string;
	alt: string;
}

const blogImage = (filename: string) => `/images/blog/${filename}`;

export const blogPosts: readonly BlogPostCard[] = [
	{ title: 'Projeto elétrico comercial: Transforme sua empresa com eficiência energética', href: '/blog/projeto-eletrico-comercial-transforme-sua-empresa-com-eficiencia-energetica', image: blogImage('blog-projeto-eletrico-comercial-transforme-sua-empresa-com-eficiencia-energetica-6f691e5751.jpg'), alt: 'Projeto elétrico comercial: Transforme sua empresa com eficiência energética' },
	{ title: 'Laudos de saúde e segurança do trabalho: Transforme sua Empresa Hoje', href: '/blog/laudos-de-saude-e-seguranca-do-trabalho-transforme-sua-empresa-hoje', image: blogImage('blog-laudos-de-saude-e-seguranca-do-trabalho-transforme-sua-empresa-hoje-1fe0979fe0.jpg'), alt: 'Laudos de saúde e segurança do trabalho: Transforme sua Empresa Hoje' },
	{ title: 'Projeto de proteção contra incêndio: Transforme sua Segurança Agora', href: '/blog/projeto-de-protecao-contra-incendio-transforme-sua-seguranca-agora', image: blogImage('blog-projeto-de-protecao-contra-incendio-transforme-sua-seguranca-agora-dff415154d.jpg'), alt: 'Projeto de proteção contra incêndio: Transforme sua Segurança Agora' },
	{ title: 'Manutenção de elevadores bh: Evite Erros Comuns e Garanta Segurança', href: '/blog/manutencao-de-elevadores-bh-evite-erros-comuns-e-garanta-seguranca', image: blogImage('blog-manutencao-de-elevadores-bh-evite-erros-comuns-e-garanta-seguranca-ee64004a5d.jpg'), alt: 'Manutenção de elevadores bh: Evite Erros Comuns e Garanta Segurança' },
	{ title: 'Ltcat Renovação: Guia Completo para Facilitar o Processo', href: '/blog/ltcat-renovacao-guia-completo-para-facilitar-o-processo', image: blogImage('blog-ltcat-renovacao-guia-completo-para-facilitar-o-processo-bdce90d49f.jpg'), alt: 'Ltcat Renovação: Guia Completo para Facilitar o Processo' },
	{ title: 'Laudo PGR: O Guia Completo para Entender e Aplicar', href: '/blog/laudo-pgr-o-guia-completo-para-entender-e-aplicar', image: blogImage('blog-laudo-pgr-o-guia-completo-para-entender-e-aplicar-3c1346a079.jpg'), alt: 'Laudo PGR: O Guia Completo para Entender e Aplicar' },
	{ title: 'Ltcat Evento eSocial: O Que Você Precisa Saber Para Estar Atualizado', href: '/blog/ltcat-evento-esocial-o-que-voce-precisa-saber-para-estar-atualizado', image: blogImage('blog-ltcat-evento-esocial-o-que-voce-precisa-saber-para-estar-atualizado-06e894056a.jpg'), alt: 'Ltcat Evento eSocial: O Que Você Precisa Saber Para Estar Atualizado' },
	{ title: 'PCMSO: Entenda como garantir a saúde ocupacional e a segurança no ambiente de trabalho', href: '/blog/pcmso-entenda-como-garantir-a-saude-ocupacional-e-a-seguranca-no-ambiente-de-trabalho', image: blogImage('blog-pcmso-entenda-como-garantir-a-saude-ocupacional-e-a-seguranca-no-ambiente-de-trabalho-2dd24c3df0.png'), alt: 'PCMSO: Entenda como garantir a saúde ocupacional e a segurança no ambiente de trabalho' },
	{ title: 'LTCAT: Guia Completo para Entender a Emissão e Sua Importância na Segurança do Trabalho', href: '/blog/ltcat-guia-completo-para-entender-a-emissao-e-sua-importancia-na-seguranca-do-trabalho', image: blogImage('blog-ltcat-guia-completo-para-entender-a-emissao-e-sua-importancia-na-seguranca-do-trabalho-1b7534d366.png'), alt: 'LTCAT: Guia Completo para Entender a Emissão e Sua Importância na Segurança do Trabalho' },
	{ title: 'Guia Completo para Entender e Implementar o Programa de Controle Médico de Saúde Ocupacional com Eficiência', href: '/blog/guia-completo-para-entender-e-implementar-o-programa-de-controle-medico-de-saude-ocupacional-com-eficiencia', image: blogImage('blog-guia-completo-para-entender-e-implementar-o-programa-de-controle-medico-de-saude-ocupacional-com-eficiencia-3e3b637efd.png'), alt: 'Guia Completo para Entender e Implementar o Programa de Controle Médico de Saúde Ocupacional com Eficiência' },
	{ title: 'Tudo o que Você Precisa Saber Sobre Consultoria PCMSO para Segurança no Trabalho', href: '/blog/tudo-o-que-voce-precisa-saber-sobre-consultoria-pcmso-para-seguranca-no-trabalho', image: blogImage('blog-tudo-o-que-voce-precisa-saber-sobre-consultoria-pcmso-para-seguranca-no-trabalho-4d5707564e.png'), alt: 'Tudo o que Você Precisa Saber Sobre Consultoria PCMSO para Segurança no Trabalho' },
] as const;
