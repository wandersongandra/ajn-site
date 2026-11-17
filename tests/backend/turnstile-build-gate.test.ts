import { describe, it, expect } from 'vitest';
import {
  TURNSTILE_TEST_SITE_KEY,
  assertTurnstileForIndexingBuild,
} from '../../src/data/carreiras';

describe('assertTurnstileForIndexingBuild — modo CI SEO smoke e gate de produção', () => {
  it('bloqueia AJN_CI_SEO_SMOKE=1 fora do GitHub Actions (GITHUB_ACTIONS ausente ou false)', () => {
    expect(() =>
      assertTurnstileForIndexingBuild({
        PUBLIC_ALLOW_INDEXING: 'true',
        AJN_CI_SEO_SMOKE: '1',
      })
    ).toThrow(/GITHUB_ACTIONS=true/);

    expect(() =>
      assertTurnstileForIndexingBuild({
        PUBLIC_ALLOW_INDEXING: 'false',
        AJN_CI_SEO_SMOKE: '1',
        GITHUB_ACTIONS: 'false',
      })
    ).toThrow(/GITHUB_ACTIONS=true/);
  });

  it('permite PUBLIC_ALLOW_INDEXING=true com sitekey de teste padrão apenas quando AJN_CI_SEO_SMOKE=1 e GITHUB_ACTIONS=true', () => {
    expect(
      assertTurnstileForIndexingBuild({
        PUBLIC_ALLOW_INDEXING: 'true',
        AJN_CI_SEO_SMOKE: '1',
        GITHUB_ACTIONS: 'true',
      })
    ).toBe(TURNSTILE_TEST_SITE_KEY);

    expect(
      assertTurnstileForIndexingBuild({
        PUBLIC_ALLOW_INDEXING: 'true',
        PUBLIC_TURNSTILE_SITE_KEY: TURNSTILE_TEST_SITE_KEY,
        AJN_CI_SEO_SMOKE: '1',
        GITHUB_ACTIONS: 'true',
      })
    ).toBe(TURNSTILE_TEST_SITE_KEY);

    expect(() =>
      assertTurnstileForIndexingBuild({
        PUBLIC_ALLOW_INDEXING: 'true',
        PUBLIC_TURNSTILE_SITE_KEY: '2x00000000000000000000AB',
        AJN_CI_SEO_SMOKE: '1',
        GITHUB_ACTIONS: 'true',
      })
    ).toThrow(/AJN_CI_SEO_SMOKE=1/);
  });

  it('mantém bloqueio estrito em build de produção fora do modo CI quando sem sitekey real', () => {
    expect(() =>
      assertTurnstileForIndexingBuild({
        PUBLIC_ALLOW_INDEXING: 'true',
        GITHUB_ACTIONS: 'true',
      })
    ).toThrow(/PUBLIC_TURNSTILE_SITE_KEY de produção real é obrigatório/);

    expect(() =>
      assertTurnstileForIndexingBuild({
        PUBLIC_ALLOW_INDEXING: 'true',
        PUBLIC_TURNSTILE_SITE_KEY: TURNSTILE_TEST_SITE_KEY,
        GITHUB_ACTIONS: 'true',
      })
    ).toThrow(/PUBLIC_TURNSTILE_SITE_KEY de produção real é obrigatório/);

    expect(
      assertTurnstileForIndexingBuild({
        PUBLIC_ALLOW_INDEXING: 'true',
        PUBLIC_TURNSTILE_SITE_KEY: '0x4AAAAAAABkMYinukE_real_prod_key',
      })
    ).toBe('0x4AAAAAAABkMYinukE_real_prod_key');
  });
});
