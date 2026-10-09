import { blogPages } from './index';
import { BLOG_TOPICS, type BlogTopic } from './topics';

const legacyTopicsBySlug: Record<string, BlogTopic> = {
	'laudo-tecnico-das-condicoes-ambientais-de-trabalho-ltcat': 'Laudos e avaliações técnicas',
	'ltcat-papel-fundamental-na-seguranca-do-trabalho-e-no-bem-estar-dos-colaboradores': 'Laudos e avaliações técnicas',
	'orcamento-eficiente-para-ltcat-passos-essenciais-para-garantir-a-seguranca-no-trabalho': 'Laudos e avaliações técnicas',
	'ltcat-e-seguranca-do-trabalho-como-garantir-a-protecao-eficaz-da-sua-equipe': 'Laudos e avaliações técnicas',
	'ltcat-e-seguranca-do-trabalho-como-proteger-sua-empresa-com-eficiencia': 'Laudos e avaliações técnicas',
	'o-fim-do-ppra-e-a-chegada-do-pgr-o-que-mudou': 'Gestão de SST',
	'ltcat-guia-essencial-para-garantir-a-seguranca-no-ambiente-de-trabalho': 'Laudos e avaliações técnicas',
	'ppp-facil-o-ue-e-como-consultar-e-sua-importancia': 'eSocial e obrigações',
	'seguranca-do-trabalho-e-pcmso-gestao-da-saude-ocupacional': 'Saúde ocupacional',
	'laudo-de-gerenciamento-de-riscos-essencial-para-garantir-a-seguranca-no-ambiente-de-trabalho': 'Gestão de SST',
	'ltcat-na-seguranca-do-trabalho-fortaleca-a-protecao-dos-seus-funcionarios-eficazmente': 'Laudos e avaliações técnicas',
	'seguranca-do-trabalho-e-ltcat-conformidade-e-protecao-previdenciaria': 'Laudos e avaliações técnicas',
	'ltcat-guia-essencial-para-garantir-seguranca-do-trabalho-eficaz': 'Laudos e avaliações técnicas',
	'um-pouco-sobre-nos': 'Institucional',
	'perfil-profissiografico-previdenciario-ppp': 'eSocial e obrigações',
	'elaboracao-de-pgr-e-pcmso-conformidade-e-seguranca-no-trabalho': 'Gestão de SST',
	'ltcat-essencial-para-a-seguranca-do-trabalho-e-protecao-da-sua-equipe': 'Laudos e avaliações técnicas',
	'ltcat-na-seguranca-do-trabalho-garantindo-protecao-e-reducao-de-riscos-para-sua-equipe': 'Laudos e avaliações técnicas',
	'nr-35-trabalho-em-altura-e-seguranca': 'Normas regulamentadoras',
	'a-importancia-do-ltcat-para-a-seguranca-do-trabalho-e-a-protecao-do-ambiente-profissional': 'Laudos e avaliações técnicas',
};

const archivedPosts = blogPages.map((post) => ({
	title: post.heading,
	href: post.path,
	image: post.image.src,
	alt: post.image.alt,
	description: post.description,
	author: post.author,
	pubDate: post.pubDate,
	tags: post.tags,
	topic: post.topic ?? legacyTopicsBySlug[post.slug],
}));

if (archivedPosts.some((post) => !post.topic || !BLOG_TOPICS.includes(post.topic as BlogTopic))) {
	throw new Error('Todo artigo precisa declarar uma categoria editorial válida.');
}

export const blogPosts = archivedPosts
	.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

export const blogTopics = [...new Set(blogPosts.map((post) => post.topic))];


/** Related posts are chosen by overlapping editorial topics, never by recency alone. */
export function getRelatedBlogPosts(href: string, limit = 3) {
	const current = blogPosts.find((post) => post.href === href);
	if (!current) return [];

	const currentTags = new Set(current.tags.map((tag) => tag.toLocaleLowerCase('pt-BR')));
	return blogPosts
		.filter((post) => post.href !== href)
		.map((post) => ({
			post,
			score: (post.topic === current.topic ? 10 : 0)
				+ post.tags.filter((tag) => currentTags.has(tag.toLocaleLowerCase('pt-BR'))).length * 2,
		}))
		.filter((candidate) => candidate.score > 0)
		.sort((a, b) => b.score - a.score || b.post.pubDate.getTime() - a.post.pubDate.getTime())
		.slice(0, limit)
		.map(({ post }) => post);
}
