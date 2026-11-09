export interface CareerJob {
  id: string;
  title: string;
  slug: string;
  department: string;
  location: string;
  employmentType: string;
  experienceLevel: string;
  description: string;
  requirements: string;
  differentials?: string;
  benefits?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryIsDisclosed?: boolean;
  status: string;
  openingsCount: number;
  publishedAt: Date | null;
}

// Em conformidade estrita com o requisito P0 Item 2:
// Nenhuma vaga fictícia ou em rascunho (draft) é pré-renderizada no HTML estático.
// O portal público exibe exclusivamente vagas aprovadas e publicadas em tempo real via Cloudflare D1.
export const APPROVED_JOB_POSTINGS: CareerJob[] = [];

// Chave pública do Cloudflare Turnstile parametrizável por ambiente (Staging vs Produção)
export const TURNSTILE_SITE_KEY =
  (typeof process !== 'undefined' && process.env?.PUBLIC_TURNSTILE_SITE_KEY) ||
  (typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_TURNSTILE_SITE_KEY) ||
  ((typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') || (typeof import.meta !== 'undefined' && import.meta.env?.PROD)
    ? '0x4AAAAAAAx_PROD_SITE_KEY_x'
    : '1x00000000000000000000AA');
