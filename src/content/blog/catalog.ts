import { blogPages } from './index';

export const blogPosts = blogPages.map((post) => ({
	title: post.heading,
	href: post.path,
	image: post.image.src,
	alt: post.image.alt,
}));
