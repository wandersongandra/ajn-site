const DEFAULT_CAREERS_ORIGIN = 'https://carreiras.ajnengenharia.com.br';

export const careersOrigin = (import.meta.env.PUBLIC_CAREERS_ORIGIN ?? DEFAULT_CAREERS_ORIGIN).replace(/\/+$/, '');

export function absoluteCareersUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${careersOrigin}/${path.replace(/^\/+/, '')}`;
}
