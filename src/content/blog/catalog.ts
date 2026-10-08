import { blogPages } from './index';
import { blogArticle } from './a-importancia-do-ltcat-para-a-seguranca-do-trabalho-e-a-protecao-do-ambiente-profissional';

export const blogTopics = ['LTCAT', 'PGR e riscos', 'PCMSO', 'PPP e eSocial', 'Normas regulamentadoras', 'Institucional'] as const;

function topicFromTitle(title: string): (typeof blogTopics)[number] {
	const normalized = title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
	if (/\bnr.?35\b|trabalho em altura/.test(normalized)) return 'Normas regulamentadoras';
	if (/\bppp\b|perfil profissiografico|e-?social/.test(normalized)) return 'PPP e eSocial';
	if (/\bpgr\b|\bppra\b|gerenciamento de riscos/.test(normalized)) return 'PGR e riscos';
	if (/\bpcmso\b|saude ocupacional/.test(normalized)) return 'PCMSO';
	if (/\bltcat\b/.test(normalized)) return 'LTCAT';
	return 'Institucional';
}

const archivedPosts = blogPages.map((post) => ({
	title: post.heading,
	href: post.path,
	image: post.image.src,
	alt: post.image.alt,
	description: post.description,
	author: post.author,
	pubDate: post.pubDate,
	tags: post.tags,
	topic: topicFromTitle(post.heading),
}));

// Artigo com página própria preservada: incluí-lo no arquivo não altera sua URL.
const standalonePost = {
	title: blogArticle.heading,
	href: '/blog/a-importancia-do-ltcat-para-a-seguranca-do-trabalho-e-a-protecao-do-ambiente-profissional',
	image: blogArticle.image,
	alt: blogArticle.imageAlt,
	description: blogArticle.description,
	author: blogArticle.author,
	pubDate: new Date('2026-01-23T12:00:00.000Z'),
	tags: [] as string[],
	topic: topicFromTitle(blogArticle.heading),
};

export const blogPosts = [standalonePost, ...archivedPosts]
	.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());
