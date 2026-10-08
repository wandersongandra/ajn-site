import type { ContentParagraphValue, MarketingContent } from '../content/types';
import { keywordMap, type KeywordMapEntry, type SearchIntent } from '../content/seo/keyword-map';

const ACRONYM_REPLACEMENTS: readonly [RegExp, string][] = [
	[/\bltcat\b/gi, 'LTCAT'],
	[/\bpcmso\b/gi, 'PCMSO'],
	[/\bpgr\b/gi, 'PGR'],
	[/\bppcip\b/gi, 'PPCIP'],
	[/\be-?social\b/gi, 'eSocial'],
	[/\bbh\b/gi, 'Belo Horizonte'],
	[/\bnrs\b/gi, 'NRs'],
	[/\bsaude\b/gi, 'saúde'],
	[/\bpericias\b/gi, 'perícias'],
	[/\binspecoes\b/gi, 'inspeções'],
	[/\beletricos\b/gi, 'elétricos'],
	[/\beletricas\b/gi, 'elétricas'],
	[/\beletrico\b/gi, 'elétrico'],
	[/\beletrica\b/gi, 'elétrica'],
];

const relatedServices: readonly {
	pattern: RegExp;
	href: string;
	label: string;
}[] = [
	{ pattern: /e-?social/i, href: '/servicos/gestao-do-e-social', label: 'Conheça a gestão do eSocial' },
	{ pattern: /pcmso|aso/i, href: '/servicos/pcmso-e-asos', label: 'Veja o serviço de PCMSO e ASOs' },
	{ pattern: /incendio|bombeiro|avcb|clcb/i, href: '/servicos/projetos-de-combate-a-incendio-e-panico-ppcip', label: 'Veja os projetos contra incêndio' },
	{ pattern: /eletric|instalac/i, href: '/servicos/projetos-eletricos-residenciais-comerciais-e-prediais-com-foco-em-qualidade-prazo-e-economia', label: 'Veja os projetos elétricos' },
	{ pattern: /qualidade/i, href: '/servicos/gestao-da-qualidade', label: 'Veja a gestão da qualidade' },
	{ pattern: /ambiental|residu/i, href: '/servicos/gestao-ambiental', label: 'Veja a gestão ambiental' },
	{ pattern: /treinamento|nr-?\d+/i, href: '/servicos/treinamento-de-nrs', label: 'Veja os treinamentos de NRs' },
	{ pattern: /pgr|ltcat|laudo|inspec|pericia|seguranca|saude|consultoria/i, href: '/servicos/assessoria-e-consultoria-em-saude-ocupacional', label: 'Veja a assessoria em saúde ocupacional' },
];

function capitalizeFirst(value: string): string {
	return value ? value.charAt(0).toLocaleUpperCase('pt-BR') + value.slice(1) : value;
}

function lowerFirst(value: string): string {
	return value ? value.charAt(0).toLocaleLowerCase('pt-BR') + value.slice(1) : value;
}

function trimMetaDescription(value: string): string {
	const compact = value.replace(/\s+/g, ' ').trim();
	if (compact.length <= 158) return /[.!?]$/.test(compact) ? compact : `${compact}.`;
	const shortened = compact.slice(0, 155).replace(/\s+\S*$/, '').replace(/[,:;\-]$/, '');
	return `${shortened}.`;
}

function paragraphText(value: ContentParagraphValue): string {
	if (typeof value === 'string') return value;
	return value.segments.map((segment) => typeof segment === 'string' ? segment : segment.text).join(' ');
}

function firstContentSentence(page: MarketingContent): string {
	const text = page.sections.flatMap((section) => section.paragraphs).map(paragraphText).find((paragraph) => paragraph.trim().length > 0) ?? '';
	const sentence = text.match(/^.*?[.!?](?:\s|$)/)?.[0] ?? text;
	return normalizeKeywordTerms(sentence.replace(/\s+/g, ' ').trim());
}

export function normalizeKeywordTerms(value: string): string {
	return ACRONYM_REPLACEMENTS.reduce((result, [pattern, replacement]) => result.replace(pattern, replacement), value);
}

export function normalizeMarketingHeading(value: string): string {
	let heading = normalizeKeywordTerms(value).trim();

	if (/^LTCAT preço$/i.test(heading)) return 'Preço do LTCAT';
	if (/^PCMSO preço$/i.test(heading)) return 'Preço do PCMSO';
	if (/^Preço de PCMSO$/i.test(heading)) return 'Preço do PCMSO';
	if (/^Consultoria PCMSO$/i.test(heading)) return 'Consultoria em PCMSO';
	if (/^Empresa que faz (.+)$/i.test(heading)) return heading.replace(/^Empresa que faz /i, 'Empresa que elabora ');
	if (/^Empresa (?!de |que |especializada)(.+)$/i.test(heading)) return heading.replace(/^Empresa /i, 'Empresa especializada em ');
	if (/^Laudo (.+)$/i.test(heading)) return heading.replace(/^Laudo /i, 'Laudo de ');
	if (/^Emissão (?!de )(.+)$/i.test(heading)) return heading.replace(/^Emissão /i, 'Emissão de ');
	if (/^Elaboração (?!de )(.+)$/i.test(heading)) return heading.replace(/^Elaboração /i, 'Elaboração de ');
	if (/^(.+)\s+orçamento$/i.test(heading)) return heading.replace(/\s+orçamento$/i, '').replace(/^Projeto /i, 'Orçamento de projeto ').replace(/^Projetos /i, 'Orçamento de projetos ');
	if (/^(.+)\s+preço$/i.test(heading)) return heading.replace(/\s+preço$/i, '').replace(/^Projeto /i, 'Preço de projeto ').replace(/^Projetos /i, 'Preço de projetos ');
	if (/^Instalações elétricas projeto$/i.test(heading)) return 'Projeto de instalações elétricas';
	if (/^Segurança do trabalho (LTCAT|PCMSO)$/i.test(heading)) return heading.replace(/^Segurança do trabalho /i, '') + ' e segurança do trabalho';
	if (/^Valor para fazer (.+)$/i.test(heading)) return heading.replace(/^Valor para fazer /i, 'Valor para elaborar ');

	return capitalizeFirst(heading);
}

function cleanLegacyDescription(description: string): string {
	return normalizeKeywordTerms(description)
		.replace(/(?:\.\.\.|…)[\s\S]*$/u, '')
		.replace(/\s*[-–—]?\s*saiba mais\.?\s*$/i, '')
		.replace(/\s+/g, ' ')
		.trim();
}

export function getMarketingSeo(page: MarketingContent): { title: string; description: string; heading: string; primaryKeyword: string; intent: SearchIntent } {
	const heading = normalizeMarketingHeading(page.heading);
	const explicit = keywordMap[page.path as keyof typeof keywordMap] as KeywordMapEntry | undefined;
	const cleaned = cleanLegacyDescription(page.description);
	const needsEditorialRewrite = /(?:\.\.\.|…|saiba mais)/i.test(page.description) || cleaned.length < 90;
	const lead = firstContentSentence(page);
	const topic = lowerFirst(heading).replace(/^(preço|orçamento|valor)/i, 'o $1');
	const contextual = `${heading}. ${lead}`;
	const generic = /preço|orçamento|valor/i.test(heading)
		? `Entenda os fatores que influenciam ${topic} e solicite uma avaliação técnica para sua empresa.`
		: `Saiba como funciona ${topic} e quais aspectos devem ser avaliados para definir um escopo técnico.`;
	const fallback = lead.length > 0 && lead.length <= 135 && contextual.length >= 90 ? contextual : generic;
	const description = needsEditorialRewrite ? trimMetaDescription(fallback) : trimMetaDescription(cleaned);

	return {
		title: explicit?.title ?? `${heading} | AJN`,
		description: explicit?.description ?? description,
		heading: explicit?.heading ?? heading,
		primaryKeyword: explicit?.primaryKeyword ?? lowerFirst(heading),
		intent: explicit?.intent ?? inferIntent(page.path),
	};
}

function inferIntent(path: string): SearchIntent {
	if (/orcamento|preco|preço|valor/i.test(path)) return 'transacional';
	if (/blog/i.test(path)) return 'informacional';
	return 'comercial';
}

export function getSeoMetadata(path: string, fallback: { title: string; description: string }): { title: string; description: string } {
	const explicit = keywordMap[path as keyof typeof keywordMap];
	return explicit ? { title: explicit.title, description: explicit.description } : fallback;
}

export function getRelatedService(path: string): { href: string; label: string } | undefined {
	return relatedServices.find(({ pattern }) => pattern.test(path));
}
