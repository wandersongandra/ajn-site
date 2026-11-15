export const TURNSTILE_TEST_SITE_KEY = '1x00000000000000000000AA';
export const TURNSTILE_TEST_SECRET_PASS = '1x0000000000000000000000000000000AA';
export const TURNSTILE_TEST_SECRET_FAIL = '2x0000000000000000000000000000000AA';
export const TURNSTILE_TEST_TOKEN = 'XXXX.DUMMY.TOKEN.XXXX';

export async function verifyTurnstile(
  token: string | undefined,
  secretKey: string | undefined,
  ipAddress?: string,
  environment?: string
): Promise<{ success: boolean; error?: string }> {
  const trimmedSecret = (secretKey ?? '').trim();
  const trimmedToken = (token ?? '').trim();
  const isProduction = environment === 'production';
  const isIsolatedTest =
    (environment === 'test' || process.env.NODE_ENV === 'test' || process.env.VITEST !== undefined) &&
    environment !== 'production' &&
    environment !== 'staging';

  if (isIsolatedTest) {
    if (trimmedSecret === TURNSTILE_TEST_SECRET_FAIL) {
      return { success: false, error: 'Falha na verificação antispam (invalid-input-response).' };
    }
    if (!trimmedSecret || trimmedSecret === 'test' || trimmedSecret === TURNSTILE_TEST_SECRET_PASS) {
      return { success: true };
    }
  }

  // Falha segura (Fail-Secure): Em staging ou produção, ausência de segredo ou chaves de teste 1x/2x/3x em produção são bloqueantes
  if (
    !trimmedSecret ||
    trimmedSecret === 'test' ||
    trimmedSecret === 'dummy_secret' ||
    (isProduction && /^(1x|2x|3x)/i.test(trimmedSecret))
  ) {
    return {
      success: false,
      error: 'Configuração antispam do servidor incompleta. O segredo obrigatório do Turnstile não foi configurado.',
    };
  }

  if (!trimmedToken || (isProduction && trimmedToken === TURNSTILE_TEST_TOKEN)) {
    return { success: false, error: 'Validação antispam obrigatória. Token do Turnstile ausente.' };
  }

  try {
    const formData = new FormData();
    formData.append('secret', trimmedSecret);
    formData.append('response', trimmedToken);
    if (ipAddress) {
      formData.append('remoteip', ipAddress);
    }

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });

    const outcome = (await response.json()) as { success: boolean; 'error-codes'?: string[] };
    if (!outcome.success) {
      return {
        success: false,
        error: `Falha na verificação antispam (${outcome['error-codes']?.join(', ') || 'rejeitado'}).`,
      };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: 'Serviço de verificação antispam indisponível temporariamente.' };
  }
}
