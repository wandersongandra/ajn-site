import { z } from 'zod';
import type { BlogImageMetadata } from './content/types';

const contentLinkSegmentSchema = z.object({
	text: z.string().min(1),
	href: z.string().min(1),
}).strict();

const contentBoldSegmentSchema = z.object({
	bold: z.literal(true),
	text: z.string().min(1),
}).strict();

const contentSegmentSchema = z.union([
	z.string().min(1),
	contentLinkSegmentSchema,
	contentBoldSegmentSchema,
]);

const contentParagraphSchema = z.object({
	segments: z.array(contentSegmentSchema).min(1),
}).strict();

const contentParagraphValueSchema = z.union([
	z.string().min(1),
	contentParagraphSchema,
]);

const contentListSchema = z.object({
	ordered: z.boolean().optional(),
	items: z.array(contentParagraphValueSchema).min(1),
}).strict();

const contentSubsectionSchema = z.object({
	heading: z.string(),
	paragraphs: z.array(contentParagraphValueSchema),
	lists: z.array(contentListSchema).optional(),
}).strict();

const contentSectionSchema = z.object({
	heading: z.string(),
	paragraphs: z.array(contentParagraphValueSchema),
	lists: z.array(contentListSchema).optional(),
	subsections: z.array(contentSubsectionSchema).optional(),
}).strict();

export const marketingContentSchema = z.object({
	slug: z.string().regex(/^[a-z0-9-]+$/),
	path: z.string().regex(/^\/[a-z0-9-]+$/),
	title: z.string().min(1),
	description: z.string().min(1),
	heading: z.string().min(1),
	images: z.array(z.object({
		src: z.string().regex(/^\/images\//),
		alt: z.string().min(1),
	}).strict()).min(1),
	sections: z.array(contentSectionSchema).min(1),
}).strict();

export type MarketingContentData = z.infer<typeof marketingContentSchema>;

export function validateMarketingContent(value: unknown): MarketingContentData {
	return marketingContentSchema.parse(value);
}

const blogImageMetadataSchema = z.custom<BlogImageMetadata>(
	(value): value is BlogImageMetadata => {
		if (typeof value !== 'object' || value === null) return false;
		const candidate = value as Record<string, unknown>;
		return typeof candidate.src === 'string'
			&& candidate.src.length > 0
			&& typeof candidate.width === 'number'
			&& candidate.width > 0
			&& typeof candidate.height === 'number'
			&& candidate.height > 0
			&& typeof candidate.format === 'string'
			&& candidate.format.length > 0;
	},
	{ message: 'A imagem do Blog precisa ser um metadata local válido do astro:assets.' },
);

const blogImageSchema = z.object({
	src: blogImageMetadataSchema,
	alt: z.string().min(1),
}).strict();

export const blogContentSchema = z.object({
	slug: z.string().regex(/^[a-z0-9-]+$/),
	path: z.string().regex(/^\/blog\/[a-z0-9-]+$/),
	title: z.string().min(1),
	description: z.string().min(1).max(180),
	heading: z.string().min(1),
	pubDate: z.coerce.date(),
	updatedAt: z.coerce.date().optional(),
	author: z.string().min(1),
	image: blogImageSchema,
	categories: z.array(z.string().min(1)).min(1),
	tags: z.array(z.string().min(1)),
	gallery: z.array(blogImageSchema),
	sections: z.array(contentSectionSchema).min(1),
}).strict();

export type BlogContentData = z.infer<typeof blogContentSchema>;

export function validateBlogContent(value: unknown): BlogContentData {
	return blogContentSchema.parse(value);
}

export const collections = {};
