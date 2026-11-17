import { NON_DEPLOYABLE_MARKER, isCiSeoSmokeModeEnabled } from '../utils/ci-seo-smoke.mjs';

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

export const TURNSTILE_TEST_SITE_KEY = '1x00000000000000000000AA';
export const NON_DEPLOYABLE_MARKER_FILENAME = NON_DEPLOYABLE_MARKER;
export { isCiSeoSmokeModeEnabled };

export function assertTurnstileForIndexingBuild(env: {
  PUBLIC_ALLOW_INDEXING?: string | undefined;
  PUBLIC_TURNSTILE_SITE_KEY?: string | undefined;
  PUBLIC_REQUIRE_TURNSTILE?: string | undefined;
  AJN_CI_SEO_SMOKE?: string | undefined;
  GITHUB_ACTIONS?: string | undefined;
  [key: string]: string | undefined;
}): string {
  const siteKey = (env.PUBLIC_TURNSTILE_SITE_KEY ?? '').trim();
  const allowIndexing = (env.PUBLIC_ALLOW_INDEXING ?? '').trim().toLowerCase() === 'true';
  const requireTurnstile = (env.PUBLIC_REQUIRE_TURNSTILE ?? 'true').trim().toLowerCase() !== 'false';
  const ciSeoSmokeMode = isCiSeoSmokeModeEnabled(env);

  if (ciSeoSmokeMode && allowIndexing) {
    if (siteKey && siteKey !== TURNSTILE_TEST_SITE_KEY) {
      throw new Error(
        '[SECURITY GATE] Build bloqueado: no modo AJN_CI_SEO_SMOKE=1 só é permitida a sitekey de teste 1x00000000000000000000AA.'
      );
    }
    return TURNSTILE_TEST_SITE_KEY;
  }

  if (allowIndexing && requireTurnstile) {
    if (!siteKey || /^(1x|2x|3x)/i.test(siteKey)) {
      throw new Error(
        '[SECURITY GATE] Build bloqueado: PUBLIC_TURNSTILE_SITE_KEY de produção real é obrigatório quando PUBLIC_ALLOW_INDEXING=true (chaves de teste 1x/2x/3x não são aceitas).'
      );
    }
  }
  if (!siteKey && !allowIndexing && requireTurnstile) {
    return TURNSTILE_TEST_SITE_KEY;
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

const rawCiSeoSmoke =
  (typeof process !== 'undefined' && process.env?.AJN_CI_SEO_SMOKE) || '';

const rawGithubActions =
  (typeof process !== 'undefined' && process.env?.GITHUB_ACTIONS) || '';

// Turnstile é apenas o serviço antispam externo; API e dados ficam na Hostinger.
// Nunca empacotar uma chave fictícia em produção. Falha fechada quando PUBLIC_ALLOW_INDEXING=true.
export const TURNSTILE_SITE_KEY = assertTurnstileForIndexingBuild({
  PUBLIC_ALLOW_INDEXING: rawAllowIndexing,
  PUBLIC_TURNSTILE_SITE_KEY: rawTurnstileSiteKey,
  PUBLIC_REQUIRE_TURNSTILE: rawRequireTurnstile,
  AJN_CI_SEO_SMOKE: rawCiSeoSmoke,
  GITHUB_ACTIONS: rawGithubActions,
});

export const PUBLIC_TURNSTILE_SITE_KEY = TURNSTILE_SITE_KEY;
