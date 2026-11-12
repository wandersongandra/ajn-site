import type { ContentParagraphValue, MarketingContent } from '../content/types';
import { keywordMap, type KeywordMapEntry, type SearchIntent } from '../content/seo/keyword-map';

const ACRONYM_REPLACEMENTS: readonly [RegExp, string][] = [
	[/\bltcat\b/gi, 'LTCAT'],
	[/\bpcmso\b/gi, 'PCMSO'],
	[/\bpgr\b/gi, 'PGR'],
	[/\bppcip\b/gi, 'PPCIP'],
	[/\bsst\b/gi, 'SST'],
	[/\bavcb\b/gi, 'AVCB'],
	[/\bclcb\b/gi, 'CLCB'],
	[/\basos\b/gi, 'ASOs'],
	[/\baso\b/gi, 'ASO'],
	[/\bppp\b/gi, 'PPP'],
	[/\bqssma\b/gi, 'QSSMA'],
	[/\bqsms\b/gi, 'QSMS'],
	[/\bajn\b/gi, 'AJN'],
	[/\be-?social\b/gi, 'eSocial'],
	[/\bbelo horizonte\b/gi, 'Belo Horizonte'],
	[/\bcorpo de bombeiros\b/gi, 'Corpo de Bombeiros'],
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
	{ pattern: /qualidade/i, href: '/servicos/gestao-da-qualidade', label: 'Veja a gestão da qualidade' },
	{ pattern: /ambiental|residu/i, href: '/servicos/gestao-ambiental', label: 'Veja a gestão ambiental' },
	{ pattern: /treinamento|nr-?\d+/i, href: '/servicos/treinamento-de-nrs', label: 'Veja os treinamentos de NRs' },
	{ pattern: /pgr|ltcat|laudo|inspec|pericia|seguranca|saude|consultoria/i, href: '/servicos/assessoria-e-consultoria-em-saude-ocupacional', label: 'Veja a assessoria em saúde ocupacional' },
];

const SEMANTIC_CLUSTERS: readonly (readonly { href: string; label: string }[])[] = [
	[
		{ href: '/elaboracao-pgr', label: 'Elaboração de PGR (NR-01)' },
		{ href: '/elaboracao-pgr-pcmso', label: 'Elaboração integrada de PGR e PCMSO' },
		{ href: '/elaboracao-do-pgr-pcmso', label: 'Integração entre PGR e PCMSO' },
		{ href: '/empresa-que-elabora-pgr', label: 'Empresa que elabora PGR' },
		{ href: '/empresa-que-faz-pgr', label: 'Consultoria para elaborar PGR' },
		{ href: '/laudo-pgr', label: 'Inventário de riscos do PGR' },
		{ href: '/orcamento-pgr', label: 'Orçamento de PGR' },
		{ href: '/valor-elaboracao-pgr', label: 'Valor para elaboração de PGR' },
	],
	[
		{ href: '/servicos/pcmso-e-asos', label: 'Gestão de PCMSO e ASOs' },
		{ href: '/pcmso-programa-controle-medico-saude-ocupacional', label: 'Programa de Controle Médico (PCMSO)' },
		{ href: '/elaboracao-pcmso', label: 'Elaboração de PCMSO' },
		{ href: '/consultoria-pcmso', label: 'Consultoria em PCMSO' },
		{ href: '/empresa-pcmso', label: 'Empresa especializada em PCMSO' },
		{ href: '/empresa-que-faz-pcmso', label: 'Empresa que elabora PCMSO' },
		{ href: '/servicos-pcmso', label: 'Serviços de gestão de PCMSO' },
		{ href: '/seguranca-do-trabalho-pcmso', label: 'PCMSO e segurança do trabalho' },
		{ href: '/orcamento-pcmso', label: 'Orçamento de PCMSO' },
		{ href: '/pcmso-preco', label: 'Preço do PCMSO' },
		{ href: '/preco-pcmso', label: 'Fatores de custo do PCMSO' },
	],
	[
		{ href: '/emissao-ltcat', label: 'Emissão de LTCAT' },
		{ href: '/empresa-ltcat', label: 'Empresa especializada em LTCAT' },
		{ href: '/empresa-que-faz-ltcat', label: 'Empresa que elabora LTCAT' },
		{ href: '/seguranca-do-trabalho-ltcat', label: 'LTCAT e segurança do trabalho' },
		{ href: '/laudo-ltcat-insalubridade', label: 'Diferença entre LTCAT e insalubridade' },
		{ href: '/ltcat-evento-esocial', label: 'LTCAT e evento S-2240 no eSocial' },
		{ href: '/ltcat-renovacao', label: 'Renovação e atualização de LTCAT' },
		{ href: '/ltcat-orcamento', label: 'Orçamento de LTCAT' },
		{ href: '/orcamento-ltcat', label: 'Proposta técnica para LTCAT' },
		{ href: '/ltcat-preco', label: 'Preço do LTCAT' },
		{ href: '/valor-fazer-ltcat', label: 'Valor para elaborar LTCAT' },
	],
	[
		{ href: '/servicos/projetos-de-combate-a-incendio-e-panico-ppcip', label: 'Projetos de Combate a Incêndio (PPCIP)' },
		{ href: '/servicos/regularizacao-de-imoveis-junto-ao-corpo-de-bombeiros', label: 'Regularização no Corpo de Bombeiros' },
		{ href: '/empresa-combate-incendio-bh', label: 'Empresa de combate a incêndio em BH' },
		{ href: '/combate-incendio-belo-horizonte', label: 'Combate a incêndio em Belo Horizonte' },
		{ href: '/sistemas-incendio-bh', label: 'Sistemas contra incêndio em BH' },
		{ href: '/empresa-combate-incendio', label: 'Engenharia de combate a incêndio' },
		{ href: '/elaboracao-projeto-combate-incendio', label: 'Elaboração de projeto contra incêndio' },
		{ href: '/projeto-prevencao-combate-incendio', label: 'Projeto de prevenção e combate a incêndio' },
		{ href: '/projeto-combate-incendio-panico', label: 'Projeto de combate a incêndio e pânico' },
		{ href: '/projeto-prevencao-incendio-panico', label: 'Prevenção contra incêndio e pânico' },
		{ href: '/projeto-protecao-incendio', label: 'Projeto de proteção contra incêndio' },
		{ href: '/projeto-protecao-incendio-panico', label: 'Proteção contra incêndio e pânico' },
		{ href: '/projeto-seguranca-incendio', label: 'Projeto de segurança contra incêndio' },
		{ href: '/projeto-seguranca-incendio-panico', label: 'Segurança contra incêndio e pânico' },
		{ href: '/projeto-sistema-combate-incendio', label: 'Sistema de combate a incêndio' },
		{ href: '/projeto-sistema-incendio', label: 'Projeto de sistema contra incêndio' },
		{ href: '/projeto-incendio', label: 'Projeto técnico contra incêndio' },
		{ href: '/projeto-deteccao-incendio', label: 'Projeto de detecção e alarme de incêndio' },
		{ href: '/orcamento-projeto-combate-incendio', label: 'Orçamento de projeto contra incêndio' },
		{ href: '/projeto-combate-incendio-preco', label: 'Preço de projeto contra incêndio' },
		{ href: '/valor-projeto-combate-incendio', label: 'Valor de projeto de combate a incêndio' },
		{ href: '/valor-projeto-incendio', label: 'Custo de projeto contra incêndio' },
	],
	[
		{ href: '/servicos/assessoria-e-consultoria-em-saude-ocupacional', label: 'Assessoria em saúde ocupacional' },
		{ href: '/servicos/pericias-em-periculosidade-e-insalubridade', label: 'Perícias de insalubridade e periculosidade' },
		{ href: '/servicos/gestao-do-e-social', label: 'Gestão de SST no eSocial' },
		{ href: '/servicos/gestao-da-qualidade', label: 'Gestão da qualidade em obras' },
		{ href: '/servicos/gestao-ambiental', label: 'Gestão ambiental' },
		{ href: '/servicos/treinamento-de-nrs', label: 'Treinamentos de NRs' },
		{ href: '/medicoes-ambientais-ocupacionais', label: 'Medições ambientais ocupacionais' },
		{ href: '/consultoria-seguranca-do-trabalho', label: 'Consultoria em segurança do trabalho' },
		{ href: '/consultoria-seguranca-saude-no-trabalho', label: 'Consultoria em SST' },
		{ href: '/consultoria-da-qualidade', label: 'Consultoria da qualidade' },
		{ href: '/laudos-sst', label: 'Laudos de SST' },
		{ href: '/laudos-seguranca-do-trabalho', label: 'Laudos de segurança do trabalho' },
		{ href: '/laudos-saude-seguranca-do-trabalho', label: 'Laudos de saúde e segurança' },
		{ href: '/laudos-seguranca-do-trabalho-esocial', label: 'Laudos de SST para o eSocial' },
		{ href: '/emissao-laudos', label: 'Emissão de laudos técnicos' },
		{ href: '/pericias-insalubridade-periculosidade', label: 'Avaliação de insalubridade e periculosidade' },
		{ href: '/inspecoes-seguranca-do-trabalho', label: 'Inspeções de segurança do trabalho' },
		{ href: '/inspecao-seguranca-saude-no-ambiente-trabalho', label: 'Inspeção de SST no ambiente de trabalho' },
		{ href: '/mobilizacao-pessoal-equipamentos', label: 'Mobilização de pessoal e equipamentos' },
	],
];

function capitalizeFirst(value: string): string {
	return value ? value.charAt(0).toLocaleUpperCase('pt-BR') + value.slice(1) : value;
}

function lowerFirst(value: string): string {
	if (!value) return value;
	if (/^(?:[A-ZÁÉÍÓÚÂÊÔÃÕÇ]{2,}|eSocial)\b/.test(value)) return value;
	return value.charAt(0).toLocaleLowerCase('pt-BR') + value.slice(1);
}

function trimMetaDescription(value: string): string {
	const compact = value.replace(/\s+/g, ' ').trim();
	if (compact.length <= 158) return /[.!?]$/.test(compact) ? compact : `${compact}.`;
	let shortened = compact.slice(0, 155).replace(/\s+\S*$/, '').replace(/[,:;\-]$/, '');
	while (/\s+(?:de|do|da|dos|das|em|no|na|nos|nas|ou|e|para|com|por|ao|aos|à|às|que|como|um|uma|o|a|os|as)$/i.test(shortened)) {
		shortened = shortened.replace(/\s+\S+$/, '').replace(/[,:;\-]$/, '');
	}
	return `${shortened}.`;
}

function ensureMetaDescription(value: string, heading: string): string {
	const cleaned = value.replace(/\s+/g, ' ').trim();
	if (cleaned.length >= 120) return trimMetaDescription(cleaned);

	const suffix = /preço|orçamento|valor/i.test(heading)
		? ' Consulte a AJN para definir o escopo técnico da sua empresa.'
		: ' Conheça o escopo e fale com a AJN para avaliar a sua demanda.';
	const sentence = /[.!?]$/.test(cleaned) ? cleaned : `${cleaned}.`;
	return trimMetaDescription(`${sentence}${suffix}`);
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
	if (/^Empresa (?!de |da |do |para |que |especializada)(.+)$/i.test(heading)) return heading.replace(/^Empresa /i, 'Empresa especializada em ');
	if (/^Laudo (?!de |da |do |técnico)(.+)$/i.test(heading)) return heading.replace(/^Laudo /i, 'Laudo de ');
	if (/^Emissão (?!de |da |do )(.+)$/i.test(heading)) return heading.replace(/^Emissão /i, 'Emissão de ');
	if (/^Elaboração (?!de |da |do )(.+)$/i.test(heading)) return heading.replace(/^Elaboração /i, 'Elaboração de ');
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
	const rawHeading = normalizeMarketingHeading(page.heading);
	const explicit = keywordMap[page.path as keyof typeof keywordMap] as KeywordMapEntry | undefined;
	const heading = explicit?.heading ?? rawHeading;
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
		heading,
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
	const metadata = explicit ? { title: explicit.title, description: explicit.description } : fallback;
	return { ...metadata, description: ensureMetaDescription(metadata.description, metadata.title) };
}

export function getRelatedService(path: string): { href: string; label: string } | undefined {
	return relatedServices.find(({ pattern }) => pattern.test(path));
}

export function getRelatedClusterLinks(path: string): readonly { href: string; label: string }[] {
	const normalized = path.replace(/\/+$/, '') || '/';
	const cluster = SEMANTIC_CLUSTERS.find((group) => group.some((item) => item.href === normalized));
	if (!cluster) return [];

	const currentIndex = cluster.findIndex((item) => item.href === normalized);
	const candidateIndices = [
		0,
		(currentIndex + 1) % cluster.length,
		(currentIndex + 2) % cluster.length,
		(currentIndex + 3) % cluster.length,
		(currentIndex + 4) % cluster.length,
	];

	const links: { href: string; label: string }[] = [];
	for (const idx of candidateIndices) {
		const item = cluster[idx];
		if (item && item.href !== normalized && !links.some((existing) => existing.href === item.href)) {
			links.push(item);
			if (links.length === 4) break;
		}
	}
	return links;
}
