import { routeCatalog } from '../route-catalog';

export const informationPage = {
	slug: 'informacoes',
	title: 'Informações - AJN Consultoria e Engenharia',
	description: 'Informações sobre os serviços e conteúdos da AJN Consultoria e Engenharia.',
	heading: 'Informações',
	intro: 'Conheça todas as informações da AJN Consultoria e Engenharia:',
	links: routeCatalog.filter(({ path }) => !path.startsWith('/blog') && !path.startsWith('/servicos') && !['/', '/sobre-nos', '/contato', '/informacoes', '/mapa-site'].includes(path)),
} as const;
