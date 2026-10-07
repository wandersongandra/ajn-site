import { blogPages } from './index';

export const blogPosts = blogPages.map((post) => ({
	title: post.heading,
	href: post.path,
	image: post.image.src,
	alt: post.image.alt,
	description: post.description,
	author: post.author,
	pubDate: post.pubDate,
	tags: post.tags,
}));
