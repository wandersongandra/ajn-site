export const STAGING_WORKER_NAME = 'ajn-carreiras-api-staging';

const requiredResources = [
  'conta Cloudflare de staging autorizada',
  'subdomínio de conta workers.dev confirmado ou Custom Domain de staging',
  'AJN_CARREIRAS_STAGING_ORIGIN ou CLOUDFLARE_ACCOUNT_SUBDOMAIN',
  'IDs reais de D1, R2 e KV, além dos secrets do Worker',
];

function normalizeOrigin(value) {
  const parsed = new URL(value);
  if (parsed.protocol !== 'https:') throw new Error('HTTPS obrigatório');
  if (parsed.username || parsed.password || parsed.pathname !== '/' || parsed.search || parsed.hash) {
    throw new Error('A origem deve conter somente esquema, host e porta HTTPS.');
  }
  return parsed.origin;
}
/** @param {Record<string, string | undefined>} [env=process.env] */
export function resolveStagingOrigin(env = process.env) {
  const explicitOrigin = (env.AJN_CARREIRAS_STAGING_ORIGIN || '').trim();
  const accountSubdomain = (env.CLOUDFLARE_ACCOUNT_SUBDOMAIN || '').trim().toLowerCase();

  if (!explicitOrigin && !accountSubdomain) {
    return {
      status: 'BLOCKED',
      origin: null,
      reason: 'A origem real de staging não foi fornecida; nenhum hostname fictício é inferido.',
      required: requiredResources,
    };
  }

  try {
    const origin = normalizeOrigin(explicitOrigin || `https://${STAGING_WORKER_NAME}.${accountSubdomain}.workers.dev`);
    const hostname = new URL(origin).hostname;
    if (hostname === 'ajnengenharia.com.br' || hostname === 'www.ajnengenharia.com.br' || hostname === 'carreiras.ajnengenharia.com.br') {
      throw new Error('A origem de staging não pode ser um domínio de produção.');
    }
    if (!explicitOrigin && (!hostname.startsWith(`${STAGING_WORKER_NAME}.`) || !hostname.endsWith('.workers.dev'))) {
      throw new Error('O subdomínio Cloudflare informado não gerou o hostname esperado do Worker de staging.');
    }
    return { status: 'PASS', origin, source: explicitOrigin ? 'AJN_CARREIRAS_STAGING_ORIGIN' : 'CLOUDFLARE_ACCOUNT_SUBDOMAIN' };
  } catch (error) {
    return {
      status: 'FAIL',
      origin: null,
      reason: `Origem de staging inválida: ${error instanceof Error ? error.message : String(error)}`,
      required: requiredResources,
    };
  }
}
