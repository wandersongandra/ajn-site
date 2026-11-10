export async function verifyTurnstile(
  token: string | undefined,
  secretKey: string | undefined,
  ipAddress?: string,
  environment?: string
): Promise<{ success: boolean; error?: string }> {
  const isIsolatedTest =
    (environment === 'test' || process.env.NODE_ENV === 'test' || process.env.VITEST !== undefined) &&
    environment !== 'production' &&
    environment !== 'staging';

  // Bypass permitido EXCLUSIVAMENTE em ambiente de teste isolado com segredo de teste
  if (isIsolatedTest && (secretKey === 'test' || !secretKey)) {
    return { success: true };
  }

  // Falha segura (Fail-Secure): Em staging ou produção, a ausência de segredo é bloqueante
  if (!secretKey || secretKey.trim() === '' || secretKey === 'test' || secretKey === 'dummy_secret') {
    return {
      success: false,
      error: 'Configuração antispam do servidor incompleta. O segredo obrigatório do Turnstile não foi configurado.',
    };
  }

  if (!token || token.trim() === '') {
    return { success: false, error: 'Validação antispam obrigatória. Token do Turnstile ausente.' };
  }

  try {
    const formData = new FormData();
    formData.append('secret', secretKey);
    formData.append('response', token);
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
