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
// O portal público exibe vagas publicadas em tempo real pela API PHP da Hostinger.
export const APPROVED_JOB_POSTINGS: CareerJob[] = [];

// Turnstile é apenas o serviço antispam externo; API e dados ficam na Hostinger.
// Nunca empacotar uma chave fictícia em produção.
export const TURNSTILE_SITE_KEY =
  (typeof process !== 'undefined' && process.env?.PUBLIC_TURNSTILE_SITE_KEY) ||
  (typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_TURNSTILE_SITE_KEY) ||
  '';
