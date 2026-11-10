import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema';
import { verifyPassword, hashPassword, generateRandomToken, sha256, verifyTotp, generateTotpSecret } from '../lib/crypto';
import { adminLoginSchema, forgotPasswordSchema, resetPasswordSchema, mfaActivateSchema } from '../lib/validation';
import { logAuditEvent } from '../lib/audit';
import { sendAdminPasswordResetEmail } from '../lib/email';
import { authMiddleware } from '../middleware/auth';
import type { Env, HonoVariables } from '../types';

export function createAdminAuthRoutes(dbFactory: (env: Env) => any) {
  const router = new Hono<{ Bindings: Env; Variables: HonoVariables }>();

  // Login de recrutador / administrador
  router.post('/login', async (c) => {
    const db = dbFactory(c.env);
    const ip =
      c.req.header('cf-connecting-ip') ||
      c.req.header('x-real-ip') ||
      c.req.header('x-forwarded-for')?.split(',')[0].trim() ||
      '127.0.0.1';
    const userAgent = c.req.header('user-agent') || 'Unknown';

    let body: any;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Corpo da requisição deve ser JSON válido.' }, 400);
    }

    const validation = adminLoginSchema.safeParse(body);
    if (!validation.success) {
      return c.json({ error: 'E-mail ou senha em formato inválido.' }, 400);
    }
    const { email, password, mfaCode } = validation.data;

    const user = await db
      .select()
      .from(schema.adminUsers)
      .where(eq(schema.adminUsers.email, email))
      .get();

    if (!user) {
      await logAuditEvent({
        db,
        actorType: 'anonymous',
        action: 'AUTH_LOGIN_FAILED',
        resource: 'auth',
        details: { email, reason: 'user_not_found' },
        ipAddress: ip,
        userAgent,
      });
      return c.json({ error: 'Credenciais inválidas.' }, 401);
    }

    // Verifica se a conta está bloqueada por excesso de tentativas
    if (user.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now()) {
      const waitMinutes = Math.ceil((new Date(user.lockedUntil).getTime() - Date.now()) / 60000);
      return c.json(
        { error: `Conta bloqueada temporariamente por segurança. Tente novamente em ${waitMinutes} minuto(s).` },
        423
      );
    }

    if (!user.isActive) {
      return c.json({ error: 'Usuário desativado pelo administrador.' }, 403);
    }

    // Validação da senha
    const isPasswordValid = await verifyPassword(password, user.passwordHash, user.passwordSalt);
    if (!isPasswordValid) {
      const newAttempts = user.failedAttempts + 1;
      const willLock = newAttempts >= 5;
      const lockedUntil = willLock ? new Date(Date.now() + 15 * 60 * 1000) : null;

      await db
        .update(schema.adminUsers)
        .set({
          failedAttempts: willLock ? 0 : newAttempts,
          lockedUntil,
          updatedAt: new Date(),
        })
        .where(eq(schema.adminUsers.id, user.id));

      await logAuditEvent({
        db,
        actorId: user.id,
        actorType: 'admin',
        action: 'AUTH_LOGIN_FAILED',
        resource: 'auth',
        details: { attempts: newAttempts, locked: willLock },
        ipAddress: ip,
        userAgent,
      });

      return c.json(
        { error: willLock ? 'Excesso de tentativas. Conta bloqueada por 15 minutos.' : 'Credenciais inválidas.' },
        401
      );
    }

    // Verificação de MFA se habilitado
    if (user.mfaEnabled && user.mfaSecret) {
      if (!mfaCode) {
        return c.json({ mfaRequired: true, message: 'Código de segundo fator (MFA) necessário.' }, 401);
      }
      const isMfaValid = await verifyTotp(user.mfaSecret, mfaCode);
      if (!isMfaValid) {
        await logAuditEvent({
          db,
          actorId: user.id,
          actorType: 'admin',
          action: 'AUTH_MFA_FAILED',
          resource: 'auth',
          ipAddress: ip,
          userAgent,
        });
        return c.json({ error: 'Código MFA inválido ou expirado.' }, 401);
      }
    }

    // Sucesso: reseta tentativas e cria sessão
    await db
      .update(schema.adminUsers)
      .set({ failedAttempts: 0, lockedUntil: null, updatedAt: new Date() })
      .where(eq(schema.adminUsers.id, user.id));

    const sessionToken = generateRandomToken(32);
    const sessionTokenHash = await sha256(sessionToken);
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 horas

    await db.insert(schema.adminSessions).values({
      id: 'sess-' + generateRandomToken(12),
      userId: user.id,
      sessionTokenHash,
      role: user.role,
      ipAddress: ip,
      userAgent,
      expiresAt,
      createdAt: new Date(),
    });

    await logAuditEvent({
      db,
      actorId: user.id,
      actorType: 'admin',
      action: 'AUTH_LOGIN_SUCCESS',
      resource: 'auth',
      ipAddress: ip,
      userAgent,
    });

    // Cookie seguro HTTP-only (política de autenticação sem expor token ao DOM por padrão)
    const hostHeader = c.req.header('host') || '';
    const cookieDomain = hostHeader.includes('ajnengenharia.com.br') ? '; Domain=.ajnengenharia.com.br' : '';
    c.header(
      'Set-Cookie',
      `ajn_admin_session=${sessionToken}; Path=/${cookieDomain}; HttpOnly; Secure; SameSite=Strict; Max-Age=${8 * 3600}`
    );

    const isProdOrStaging = c.env?.ENVIRONMENT === 'production' || c.env?.ENVIRONMENT === 'staging';
    const isApiOrTestClient = isProdOrStaging
      ? c.req.header('X-Auth-Mode') === 'api'
      : (c.req.header('X-Auth-Mode') === 'api' || c.env?.ENVIRONMENT === 'test' || process.env.NODE_ENV === 'test' || process.env.VITEST !== undefined);

    return c.json({
      success: true,
      token: isApiOrTestClient ? sessionToken : undefined,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        mfaEnabled: user.mfaEnabled,
      },
    });
  });

  // Configuração inicial de MFA para usuário administrativo (P1 Item 9)
  router.post('/mfa/setup', authMiddleware(dbFactory), async (c) => {
    const db = dbFactory(c.env);
    const user = c.get('user')!;

    const secret = generateTotpSecret();
    await db
      .update(schema.adminUsers)
      .set({ pendingMfaSecret: secret, updatedAt: new Date() })
      .where(eq(schema.adminUsers.id, user.id));

    const otpauthUri = `otpauth://totp/AJN%20Carreiras:${encodeURIComponent(user.email)}?secret=${secret}&issuer=AJN%20Engenharia`;

    return c.json({
      success: true,
      secret,
      otpauthUri,
      message: 'Segredo MFA gerado. Insira o código de 6 dígitos no endpoint /mfa/activate para concluir a ativação.',
    });
  });

  // Ativação e confirmação segura do MFA com código de 6 dígitos
  router.post('/mfa/activate', authMiddleware(dbFactory), async (c) => {
    const db = dbFactory(c.env);
    const user = c.get('user')!;

    let body: any;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'JSON inválido.' }, 400);
    }

    const validation = mfaActivateSchema.safeParse(body);
    if (!validation.success) {
      return c.json({ error: 'Código MFA de 6 dígitos inválido.' }, 400);
    }
    const { code } = validation.data;

    const dbUser = await db
      .select()
      .from(schema.adminUsers)
      .where(eq(schema.adminUsers.id, user.id))
      .get();

    if (!dbUser || !dbUser.pendingMfaSecret) {
      return c.json({ error: 'Nenhuma configuração de MFA pendente. Execute /mfa/setup primeiro.' }, 400);
    }

    const isValid = await verifyTotp(dbUser.pendingMfaSecret, code);
    if (!isValid) {
      return c.json({ error: 'Código MFA incorreto ou expirado. Tente novamente.' }, 400);
    }

    await db
      .update(schema.adminUsers)
      .set({
        mfaSecret: dbUser.pendingMfaSecret,
        pendingMfaSecret: null,
        mfaEnabled: true,
        updatedAt: new Date(),
      })
      .where(eq(schema.adminUsers.id, user.id));

    await logAuditEvent({
      db,
      actorId: user.id,
      actorType: 'admin',
      action: 'AUTH_MFA_ACTIVATED',
      resource: 'auth',
      ipAddress: c.req.header('cf-connecting-ip') || '127.0.0.1',
      userAgent: c.req.header('user-agent'),
    });

    return c.json({
      success: true,
      message: 'MFA ativado com sucesso para sua conta.',
    });
  });

  // Logout
  router.post('/logout', async (c) => {
    const authHeader = c.req.header('Authorization');
    const cookieHeader = c.req.header('Cookie');
    let token = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const candidate = authHeader.substring(7).trim();
      if (candidate && candidate !== 'undefined' && candidate !== 'null') {
        token = candidate;
      }
    }
    if (!token && cookieHeader) {
      const match = cookieHeader.match(/ajn_admin_session=([^;]+)/);
      if (match) {
        const candidateCookie = match[1].trim();
        if (candidateCookie && candidateCookie !== 'undefined' && candidateCookie !== 'null') {
          token = candidateCookie;
        }
      }
    }

    if (token) {
      const db = dbFactory(c.env);
      const tokenHash = await sha256(token);
      await db.delete(schema.adminSessions).where(eq(schema.adminSessions.sessionTokenHash, tokenHash));
    }

    const hostHeader = c.req.header('host') || '';
    const cookieDomain = hostHeader.includes('ajnengenharia.com.br') ? '; Domain=.ajnengenharia.com.br' : '';
    c.header('Set-Cookie', `ajn_admin_session=; Path=/${cookieDomain}; HttpOnly; Secure; SameSite=Strict; Max-Age=0`);
    return c.json({ success: true, message: 'Sessão encerrada com sucesso.' });
  });

  // Dados da sessão corrente
  router.get('/me', authMiddleware(dbFactory), async (c) => {
    const user = c.get('user');
    return c.json({ user });
  });

  // Solicitação de recuperação de senha administrativa
  router.post('/forgot-password', async (c) => {
    const db = dbFactory(c.env);
    const ip =
      c.req.header('cf-connecting-ip') ||
      c.req.header('x-real-ip') ||
      c.req.header('x-forwarded-for')?.split(',')[0].trim() ||
      '127.0.0.1';
    const userAgent = c.req.header('user-agent') || 'Unknown';

    let body: any;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Corpo da requisição deve ser JSON válido.' }, 400);
    }

    const validation = forgotPasswordSchema.safeParse(body);
    if (!validation.success) {
      return c.json({ error: 'E-mail institucional inválido.' }, 400);
    }
    const { email } = validation.data;

    const user = await db
      .select()
      .from(schema.adminUsers)
      .where(eq(schema.adminUsers.email, email))
      .get();

    // Resposta idempotente e segura para não permitir enumeração de e-mails
    if (!user || !user.isActive) {
      return c.json({
        success: true,
        message: 'Se o e-mail estiver cadastrado, as orientações de recuperação foram registradas.',
      });
    }

    const resetToken = generateRandomToken(32);
    const resetTokenHash = await sha256(resetToken);
    const resetExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora de validade

    // Despacho de e-mail transacional real
    const emailResult = await sendAdminPasswordResetEmail(c.env, {
      email: user.email,
      name: user.name,
      resetToken,
      resetUrl: `${c.env?.APP_URL?.trim() || new URL(c.req.url).origin}/admin/carreiras/?resetToken=${encodeURIComponent(resetToken)}`,
    });

    if (!emailResult.success) {
      await logAuditEvent({
        db,
        actorId: user.id,
        actorType: 'admin',
        action: 'AUTH_PASSWORD_RESET_EMAIL_FAILED',
        resource: 'auth',
        details: { email, error: emailResult.error },
        ipAddress: ip,
        userAgent,
      });

      return c.json(
        {
          error:
            'Não foi possível enviar o e-mail de recuperação no momento. O provedor transacional está indisponível.',
        },
        502
      );
    }

    await db
      .update(schema.adminUsers)
      .set({
        resetTokenHash,
        resetExpiresAt,
        resetAttempts: 0,
        updatedAt: new Date(),
      })
      .where(eq(schema.adminUsers.id, user.id));

    await logAuditEvent({
      db,
      actorId: user.id,
      actorType: 'admin',
      action: 'AUTH_PASSWORD_RESET_REQUESTED',
      resource: 'auth',
      details: { email },
      ipAddress: ip,
      userAgent,
    });

    const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST !== undefined || c.env?.ENVIRONMENT === 'test';
    return c.json({
      success: true,
      message: 'Se o e-mail estiver cadastrado, as orientações de recuperação foram registradas.',
      resetToken: isTest ? resetToken : undefined,
    });
  });

  // Redefinição de senha com token de uso único
  router.post('/reset-password', async (c) => {
    const db = dbFactory(c.env);
    const ip =
      c.req.header('cf-connecting-ip') ||
      c.req.header('x-real-ip') ||
      c.req.header('x-forwarded-for')?.split(',')[0].trim() ||
      '127.0.0.1';
    const userAgent = c.req.header('user-agent') || 'Unknown';

    let body: any;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Corpo da requisição deve ser JSON válido.' }, 400);
    }

    const validation = resetPasswordSchema.safeParse(body);
    if (!validation.success) {
      return c.json({ error: 'Dados inválidos.', details: validation.error.flatten().fieldErrors }, 400);
    }
    const { token, newPassword } = validation.data;

    const tokenHash = await sha256(token);
    const user = await db
      .select()
      .from(schema.adminUsers)
      .where(eq(schema.adminUsers.resetTokenHash, tokenHash))
      .get();

    if (!user || !user.resetExpiresAt || new Date(user.resetExpiresAt).getTime() < Date.now()) {
      return c.json({ error: 'Token de recuperação inválido ou expirado.' }, 400);
    }

    if ((user.resetAttempts ?? 0) >= 5) {
      await db
        .update(schema.adminUsers)
        .set({
          resetTokenHash: null,
          resetExpiresAt: null,
          resetAttempts: 0,
          updatedAt: new Date(),
        })
        .where(eq(schema.adminUsers.id, user.id));

      return c.json(
        { error: 'Limite de tentativas excedido para este token de recuperação. Solicite um novo link.' },
        429
      );
    }

    const { hash, salt } = await hashPassword(newPassword);

    await db
      .update(schema.adminUsers)
      .set({
        passwordHash: hash,
        passwordSalt: salt,
        resetTokenHash: null,
        resetExpiresAt: null,
        resetAttempts: 0,
        failedAttempts: 0,
        lockedUntil: null,
        updatedAt: new Date(),
      })
      .where(eq(schema.adminUsers.id, user.id));

    // Invalida todas as sessões ativas do usuário
    await db.delete(schema.adminSessions).where(eq(schema.adminSessions.userId, user.id));

    await logAuditEvent({
      db,
      actorId: user.id,
      actorType: 'admin',
      action: 'AUTH_PASSWORD_RESET_SUCCESS',
      resource: 'auth',
      ipAddress: ip,
      userAgent,
    });

    return c.json({
      success: true,
      message: 'Senha redefinida com sucesso. Faça login com suas novas credenciais.',
    });
  });

  return router;
}
