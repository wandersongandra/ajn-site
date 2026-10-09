import { routeCatalog, type RouteCatalogEntry } from '../route-catalog';

export const siteMapPage = {
	slug: 'mapa-site',
	title: 'Mapa do site | AJN Consultoria e Engenharia',
	description: 'Encontre páginas institucionais, serviços, conteúdos técnicos e artigos da AJN Consultoria e Engenharia.',
	heading: 'Mapa do site',
	intro: 'Encontre as páginas da AJN por assunto. Para conhecer um serviço, consulte a seção correspondente ou navegue pelos conteúdos técnicos.',
} as const;

type GroupId = 'institucional' | 'servicos' | 'sst' | 'incendio' | 'eletrica' | 'elevacao' | 'artigos' | 'outros';

const primaryPages = new Set(['/', '/sobre-nos', '/servicos', '/blog', '/contato', '/mapa-site']);
const groups: readonly { id: GroupId; title: string; description: string }[] = [
	{ id: 'institucional', title: 'Páginas institucionais', description: 'Conheça a AJN, os serviços e os canais de atendimento.' },
	{ id: 'servicos', title: 'Serviços', description: 'Serviços e especialidades apresentados no catálogo.' },
	{ id: 'sst', title: 'Segurança e saúde do trabalho', description: 'PGR, PCMSO, LTCAT, laudos, inspeções e gestão de SST.' },
	{ id: 'incendio', title: 'Prevenção e combate a incêndio', description: 'Projetos e orientações sobre segurança contra incêndio.' },
	{ id: 'eletrica', title: 'Projetos e instalações elétricas', description: 'Projetos, instalações e orçamentos relacionados à engenharia elétrica.' },
	{ id: 'elevacao', title: 'Elevadores e acessibilidade', description: 'Elevadores, escadas rolantes e plataformas de acessibilidade.' },
	{ id: 'artigos', title: 'Artigos e orientações', description: 'Publicações do blog para aprofundar cada assunto.' },
	{ id: 'outros', title: 'Outros temas', description: 'Páginas técnicas e temas complementares.' },
];

function category(path: string): GroupId {
	if (primaryPages.has(path)) return 'institucional';
	if (path.startsWith('/servicos/')) return 'servicos';
	if (path.startsWith('/blog/')) return 'artigos';
	if (/incendio|bombeiro|avcb|clcb/.test(path)) return 'incendio';
	if (/elevador|escada-rolante|plataforma|elevacao-vertical|acessibilidade/.test(path)) return 'elevacao';
	if (/eletric|instalac|spda|cabeamento/.test(path)) return 'eletrica';
	if (/medic|ruido|calor|iluminamento|dosimetria|pgr|pcmso|ltcat|e-?social|sst|seguranca|saude|inspec|pericia|laudo|consultoria|qualidade|mobiliz|ppp/.test(path)) return 'sst';
	return 'outros';
}

const collator = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true });

export const siteMapSections: readonly {
	id: GroupId;
	title: string;
	description: string;
	links: readonly RouteCatalogEntry[];
}[] = groups.map((group) => ({
	...group,
	links: routeCatalog
		.filter((entry) => category(entry.path) === group.id)
		.sort((a, b) => collator.compare(a.title, b.title)),
})).filter((group) => group.links.length > 0);

export const siteMapLinkCount = siteMapSections.reduce((sum, group) => sum + group.links.length, 0);
