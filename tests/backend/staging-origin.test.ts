import { describe, expect, it } from 'vitest';
import { resolveStagingOrigin } from '../../scripts/staging-origin.mjs';

describe('origem de staging', () => {
  it('bloqueia quando a conta não fornece uma origem real', () => {
    expect(resolveStagingOrigin({})).toMatchObject({ status: 'BLOCKED', origin: null });
  });

  it('deriva somente o hostname esperado do Worker', () => {
    expect(resolveStagingOrigin({ CLOUDFLARE_ACCOUNT_SUBDOMAIN: 'qa-aj' })).toMatchObject({
      status: 'PASS',
      origin: 'https://ajn-carreiras-api-staging.qa-aj.workers.dev',
    });
  });

  it('rejeita origem HTTP e domínio de produção', () => {
    expect(resolveStagingOrigin({ AJN_CARREIRAS_STAGING_ORIGIN: 'http://staging.example.test' }).status).toBe('FAIL');
    expect(resolveStagingOrigin({ AJN_CARREIRAS_STAGING_ORIGIN: 'https://carreiras.ajnengenharia.com.br' }).status).toBe('FAIL');
  });
});
