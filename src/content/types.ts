export interface ContentLinkSegment {
	text: string;
	href: string;
}

export interface ContentBoldSegment {
	bold: true;
	text: string;
}

export type ContentSegment = string | ContentLinkSegment | ContentBoldSegment;

export interface ContentParagraph {
	segments: readonly ContentSegment[];
}

export type ContentParagraphValue = string | ContentParagraph;

export interface ContentList {
	ordered?: boolean;
	items: readonly ContentParagraphValue[];
}

export interface ContentSubsection {
	heading: string;
	paragraphs: readonly ContentParagraphValue[];
	lists?: readonly ContentList[];
}

export interface ContentSection {
	heading: string;
	paragraphs: readonly ContentParagraphValue[];
	lists?: readonly ContentList[];
	subsections?: readonly ContentSubsection[];
}

export interface MarketingImage {
	src: string;
	alt: string;
}

export interface MarketingContent {
	slug: string;
	path: string;
	title: string;
	description: string;
	heading: string;
	images: readonly MarketingImage[];
	sections: readonly ContentSection[];
}

export interface ServiceContent {
	slug: string;
	path: string;
	title: string;
	description: string;
	heading: string;
	image: string;
	imageAlt: string;
	sections: readonly ContentSection[];
}

export interface BlogImageMetadata {
	src: string;
	width: number;
	height: number;
	format: 'jpeg' | 'jpg' | 'png' | 'apng' | 'tiff' | 'webp' | 'gif' | 'svg' | 'avif';
	orientation?: number;
}

export interface BlogImage {
	src: BlogImageMetadata;
	alt: string;
}

export interface BlogContentData {
	slug: string;
	path: string;
	title: string;
	description: string;
	heading: string;
	pubDate: string;
	author: string;
	image: BlogImage;
	categories: readonly string[];
	tags: readonly string[];
	gallery: readonly BlogImage[];
	sections: readonly ContentSection[];
}
