import { z } from 'zod';

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

export const collections = {};
