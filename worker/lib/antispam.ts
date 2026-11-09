export async function verifyTurnstile(
  token: string | undefined,
  secretKey: string | undefined,
  ipAddress?: string
): Promise<{ success: boolean; error?: string }> {
  // Se não houver secretKey configurada (ambiente local ou de testes), permite execução
  if (!secretKey || secretKey === 'test' || secretKey === 'dummy_secret') {
    return { success: true };
  }

  if (!token) {
    return { success: false, error: 'Validação antispam obrigatória.' };
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
