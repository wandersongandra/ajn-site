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

export function assertTurnstileForIndexingBuild(env: {
  PUBLIC_ALLOW_INDEXING?: string | undefined;
  PUBLIC_TURNSTILE_SITE_KEY?: string | undefined;
  PUBLIC_REQUIRE_TURNSTILE?: string | undefined;
}): string {
  const siteKey = (env.PUBLIC_TURNSTILE_SITE_KEY ?? '').trim();
  const allowIndexing = (env.PUBLIC_ALLOW_INDEXING ?? '').trim().toLowerCase() === 'true';
  const requireTurnstile = (env.PUBLIC_REQUIRE_TURNSTILE ?? 'true').trim().toLowerCase() !== 'false';
  if (allowIndexing && requireTurnstile && !siteKey) {
    throw new Error(
      '[SECURITY GATE] Build bloqueado: PUBLIC_TURNSTILE_SITE_KEY é obrigatório quando PUBLIC_ALLOW_INDEXING=true.'
    );
  }
  return siteKey;
}

// Em conformidade estrita com o requisito P0 Item 2:
// Nenhuma vaga fictícia ou em rascunho (draft) é pré-renderizada no HTML estático.
// O portal público exibe vagas publicadas em tempo real pela API PHP da Hostinger.
export const APPROVED_JOB_POSTINGS: CareerJob[] = [];

const rawAllowIndexing =
  (typeof process !== 'undefined' && process.env?.PUBLIC_ALLOW_INDEXING) ||
  (typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_ALLOW_INDEXING) ||
  '';

const rawTurnstileSiteKey =
  (typeof process !== 'undefined' && process.env?.PUBLIC_TURNSTILE_SITE_KEY) ||
  (typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_TURNSTILE_SITE_KEY) ||
  '';

const rawRequireTurnstile =
  (typeof process !== 'undefined' && process.env?.PUBLIC_REQUIRE_TURNSTILE) ||
  (typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_REQUIRE_TURNSTILE) ||
  'true';

// Turnstile é apenas o serviço antispam externo; API e dados ficam na Hostinger.
// Nunca empacotar uma chave fictícia em produção. Falha fechada quando PUBLIC_ALLOW_INDEXING=true.
export const TURNSTILE_SITE_KEY = assertTurnstileForIndexingBuild({
  PUBLIC_ALLOW_INDEXING: rawAllowIndexing,
  PUBLIC_TURNSTILE_SITE_KEY: rawTurnstileSiteKey,
  PUBLIC_REQUIRE_TURNSTILE: rawRequireTurnstile,
});

export const PUBLIC_TURNSTILE_SITE_KEY = TURNSTILE_SITE_KEY;
