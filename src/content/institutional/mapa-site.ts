import { routeCatalog } from '../route-catalog';

export const siteMapPage = {
	slug: 'mapa-site',
	title: 'Mapa do site - AJN Consultoria e Engenharia',
	description: 'Navegue pelo site da AJN Consultoria e Engenharia.',
	heading: 'Mapa do site',
	intro: 'Navegue pelo site da AJN Consultoria e Engenharia',
	links: routeCatalog,
} as const;
