const DEFAULT_CAREERS_ORIGIN = 'https://carreiras.ajnengenharia.com.br';

const careersEnvironment = (import.meta.env.PUBLIC_CAREERS_ENVIRONMENT ?? 'production').trim().toLowerCase();
const configuredCareersOrigin = (import.meta.env.PUBLIC_CAREERS_ORIGIN ?? '').trim();

function normalizeCareersOrigin(value: string): string {
	const parsed = new URL(value);
	if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.pathname !== '/' || parsed.search || parsed.hash) {
		throw new Error('PUBLIC_CAREERS_ORIGIN deve ser uma origem HTTPS sem caminho, query ou credenciais.');
	}
	return parsed.origin;
}

if (!['production', 'staging'].includes(careersEnvironment)) {
	throw new Error('PUBLIC_CAREERS_ENVIRONMENT deve ser production ou staging.');
}

if (careersEnvironment === 'staging' && !configuredCareersOrigin) {
	throw new Error('PUBLIC_CAREERS_ORIGIN é obrigatório para builds de staging.');
}

export const careersOrigin = normalizeCareersOrigin(configuredCareersOrigin || DEFAULT_CAREERS_ORIGIN);

if (careersEnvironment === 'staging' && careersOrigin === DEFAULT_CAREERS_ORIGIN) {
	throw new Error('Staging não pode usar a origem canônica de produção.');
}

if (careersEnvironment === 'production' && configuredCareersOrigin && careersOrigin !== DEFAULT_CAREERS_ORIGIN) {
	throw new Error('Builds de produção devem usar https://carreiras.ajnengenharia.com.br.');
}

export function absoluteCareersUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${careersOrigin}/${path.replace(/^\/+/, '')}`;
}
