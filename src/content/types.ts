export interface ContentLinkSegment {
	text: string;
	href: string;
}

export interface ContentParagraph {
	segments: readonly (string | ContentLinkSegment)[];
}

export type ContentParagraphValue = string | ContentParagraph;

export interface ContentSection {
	heading: string;
	paragraphs: readonly ContentParagraphValue[];
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
