import type { Env } from '../types';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Armazenamento em memória para inspeção em testes automatizados
export const sentTestEmails: Array<EmailOptions & { sentAt: Date }> = [];

export function getSentTestEmails() {
  return sentTestEmails;
}

export function clearSentTestEmails() {
  sentTestEmails.length = 0;
}

// Geração criptograficamente segura de OTP numérico de 6 dígitos
export function generateSecureOtp(digits = 6): string {
  const max = Math.pow(10, digits);
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  const otp = buffer[0] % max;
  return otp.toString().padStart(digits, '0');
}

// Mascaramento seguro de e-mail (ex: j***o@empresa.com)
export function maskEmail(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) return '***@***.***';
  const name = parts[0];
  const domain = parts[1];
  if (name.length <= 2) {
    return `${name.charAt(0)}***@${domain}`;
  }
  return `${name.charAt(0)}${'*'.repeat(Math.min(name.length - 2, 5))}${name.charAt(name.length - 1)}@${domain}`;
}

export async function sendTransactionalEmail(env: Env | undefined, options: EmailOptions): Promise<EmailResult> {
  const from = env?.EMAIL_FROM || 'AJN Carreiras <carreiras@ajnengenharia.com.br>';
  const apiKey = env?.RESEND_API_KEY || env?.EMAIL_API_KEY;
  const isTest =
    env?.ENVIRONMENT === 'test' ||
    process.env.NODE_ENV === 'test' ||
    process.env.VITEST !== undefined;

  // Em ambiente de teste isolado: registra o envio e valida falha forçada se solicitado
  if (isTest && (!apiKey || apiKey === 'test' || env?.EMAIL_PROVIDER === 'mock')) {
    if (apiKey === 'force_fail' || (env as any)?.FORCE_EMAIL_ERROR) {
      return {
        success: false,
        error: 'Falha simulada no provedor de e-mail transacional para testes de resiliência.',
      };
    }

    sentTestEmails.push({
      ...options,
      sentAt: new Date(),
    });

    return {
      success: true,
      messageId: `test-msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };
  }

  // Falha segura: em produção ou staging, sem chave de API configurada, não declara envio bem-sucedido
  if (!apiKey || apiKey.trim() === '') {
    // Tenta MailChannels como fallback nativo do Cloudflare Workers se especificado
    if (env?.EMAIL_PROVIDER === 'mailchannels') {
      return await sendViaMailChannels(from, options);
    }

    return {
      success: false,
      error: 'Provedor de e-mail transacional não configurado no ambiente. Configure RESEND_API_KEY ou EMAIL_API_KEY.',
    };
  }

  // Envio via Resend API (padrão recomendado para Cloudflare Workers)
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return {
        success: false,
        error: `Provedor de e-mail recusou o envio (HTTP ${res.status}): ${errText}`,
      };
    }

    const data = (await res.json()) as { id?: string };
    return {
      success: true,
      messageId: data.id,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Erro de comunicação com o provedor de e-mail: ${err.message || String(err)}`,
    };
  }
}

async function sendViaMailChannels(from: string, options: EmailOptions): Promise<EmailResult> {
  try {
    const res = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: options.to }] }],
        from: { email: from.includes('<') ? from.match(/<([^>]+)>/)?.[1] || from : from, name: 'AJN Carreiras' },
        subject: options.subject,
        content: [
          { type: 'text/plain', value: options.text },
          { type: 'text/html', value: options.html },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: `MailChannels recusou envio: ${errText}` };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: `Erro de rede MailChannels: ${err.message}` };
  }
}

// Sanitização e escape seguro de HTML para evitar injeção em templates de e-mail (P1 Item 6)
export function escapeHtml(str: string): string {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// 1. Template: Comprovação de Titularidade para Atualização de Cadastro
export async function sendCandidateVerificationEmail(
  env: Env | undefined,
  params: { email: string; fullName: string; otpCode: string }
): Promise<EmailResult> {
  const safeFullName = escapeHtml(params.fullName);
  const safeOtp = escapeHtml(params.otpCode);
  const subject = `Código de Verificação de Cadastro: ${params.otpCode} — AJN Carreiras`;
  const text = `Olá, ${params.fullName}.\n\nRecebemos uma solicitação de atualização cadastral ou envio de novo currículo para seu CPF/e-mail no portal AJN Carreiras.\n\nSeu código de verificação é:\n\n${params.otpCode}\n\nEste código expira em 15 minutos e é de uso único.\nSe você não solicitou esta alteração, desconsidere esta mensagem. Seus dados continuam protegidos.\n\nAtenciosamente,\nEquipe de Recrutamento — AJN Consultoria e Engenharia`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h2 style="color: #0b1528; margin-top: 0;">AJN Consultoria e Engenharia</h2>
      <p style="color: #374151; font-size: 15px;">Olá, <strong>${safeFullName}</strong>.</p>
      <p style="color: #374151; font-size: 15px;">Identificamos uma solicitação para atualizar seus dados cadastrais ou anexar um novo currículo no portal <strong>AJN Carreiras</strong>.</p>
      <p style="color: #374151; font-size: 15px;">Para sua segurança e conformidade com a LGPD, informe o código de verificação abaixo no formulário:</p>
      <div style="background-color: #f3f4f6; border-radius: 6px; padding: 18px; text-align: center; margin: 24px 0;">
        <span style="font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #0b1528; font-family: monospace;">${safeOtp}</span>
      </div>
      <p style="color: #6b7280; font-size: 13px;">Este código é válido por <strong>15 minutos</strong> e expira após o uso.</p>
      <p style="color: #6b7280; font-size: 13px;">Se você não solicitou esta alteração, nenhuma ação é necessária. Seus dados permanecem inalterados e protegidos.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="color: #9ca3af; font-size: 12px; margin-bottom: 0;">AJN Consultoria e Engenharia — Belo Horizonte, MG | ajnengenharia.com.br</p>
    </div>
  `;

  return sendTransactionalEmail(env, { to: params.email, subject, html, text });
}

// 2. Template: Recuperação de Código de Acompanhamento
export async function sendCandidateRecoveryEmail(
  env: Env | undefined,
  params: { email: string; fullName: string; otpCode: string }
): Promise<EmailResult> {
  const safeFullName = escapeHtml(params.fullName);
  const safeOtp = escapeHtml(params.otpCode);
  const subject = `Código de Acesso às suas Candidaturas: ${params.otpCode} — AJN Carreiras`;
  const text = `Olá, ${params.fullName}.\n\nRecebemos uma solicitação para consultar seus códigos de acompanhamento no portal AJN Carreiras.\n\nSeu código de acesso temporário é:\n\n${params.otpCode}\n\nEste código expira em 15 minutos.\nSe você não fez esta solicitação, ignore este e-mail.\n\nAtenciosamente,\nAJN Consultoria e Engenharia`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h2 style="color: #0b1528; margin-top: 0;">AJN Consultoria e Engenharia</h2>
      <p style="color: #374151; font-size: 15px;">Olá, <strong>${safeFullName}</strong>.</p>
      <p style="color: #374151; font-size: 15px;">Você solicitou a recuperação dos seus códigos de acompanhamento de processos seletivos.</p>
      <p style="color: #374151; font-size: 15px;">Insira o código abaixo no portal para visualizar suas candidaturas ativas:</p>
      <div style="background-color: #f3f4f6; border-radius: 6px; padding: 18px; text-align: center; margin: 24px 0;">
        <span style="font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #0b1528; font-family: monospace;">${safeOtp}</span>
      </div>
      <p style="color: #6b7280; font-size: 13px;">Válido por 15 minutos para consulta segura.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="color: #9ca3af; font-size: 12px; margin-bottom: 0;">AJN Consultoria e Engenharia — ajnengenharia.com.br</p>
    </div>
  `;

  return sendTransactionalEmail(env, { to: params.email, subject, html, text });
}

// 3. Template: Redefinição de Senha Administrativa
export async function sendAdminPasswordResetEmail(
  env: Env | undefined,
  params: { email: string; name: string; resetToken: string; resetUrl?: string }
): Promise<EmailResult> {
  const rawUrl =
    params.resetUrl ||
    `${env?.APP_URL || 'https://carreiras.ajnengenharia.com.br'}/admin/carreiras/?resetToken=${params.resetToken}`;
  const safeName = escapeHtml(params.name);
  const safeUrl = escapeHtml(rawUrl);

  const subject = `Instruções de Redefinição de Senha Administrativa — AJN Carreiras`;
  const text = `Olá, ${params.name}.\n\nFoi solicitada a redefinição de senha para sua conta administrativa no AJN Carreiras.\n\nAcesse o link abaixo para criar uma nova senha (válido por 1 hora):\n${rawUrl}\n\nToken de uso único:\n${params.resetToken}\n\nSe você não solicitou a redefinição, avise imediatamente a equipe de segurança da AJN.\n\nAtenciosamente,\nSegurança da Informação — AJN Engenharia`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h2 style="color: #0b1528; margin-top: 0;">Segurança Administrativa AJN</h2>
      <p style="color: #374151; font-size: 15px;">Olá, <strong>${safeName}</strong>.</p>
      <p style="color: #374151; font-size: 15px;">Recebemos uma solicitação de redefinição de senha para seu acesso administrativo ao painel <strong>AJN Carreiras</strong>.</p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${safeUrl}" style="background-color: #0b1528; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; display: inline-block;">Redefinir Minha Senha</a>
      </div>
      <p style="color: #6b7280; font-size: 13px;">Se o botão não funcionar, copie e cole este link no navegador:</p>
      <p style="color: #4b5563; font-size: 12px; word-break: break-all;">${safeUrl}</p>
      <p style="color: #6b7280; font-size: 13px;">Este link expira em <strong>1 hora</strong> e é de uso estritamente único.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="color: #dc2626; font-size: 12px;">Se você não realizou esta solicitação, contate imediatamente o administrador de segurança.</p>
    </div>
  `;

  return sendTransactionalEmail(env, { to: params.email, subject, html, text });
}
