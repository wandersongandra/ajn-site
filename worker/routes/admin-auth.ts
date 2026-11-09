import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import * as schema from '../db/schema';
import { verifyPassword, generateRandomToken, sha256, verifyTotp } from '../lib/crypto';
import { adminLoginSchema } from '../lib/validation';
import { logAuditEvent } from '../lib/audit';
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

    // Cookie seguro HTTP-only
    c.header(
      'Set-Cookie',
      `ajn_admin_session=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${8 * 3600}`
    );

    return c.json({
      success: true,
      token: sessionToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  });

  // Logout
  router.post('/logout', async (c) => {
    const authHeader = c.req.header('Authorization');
    const cookieHeader = c.req.header('Cookie');
    let token = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (cookieHeader) {
      const match = cookieHeader.match(/ajn_admin_session=([^;]+)/);
      if (match) token = match[1].trim();
    }

    if (token) {
      const db = dbFactory(c.env);
      const tokenHash = await sha256(token);
      await db.delete(schema.adminSessions).where(eq(schema.adminSessions.sessionTokenHash, tokenHash));
    }

    c.header('Set-Cookie', 'ajn_admin_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0');
    return c.json({ success: true, message: 'Sessão encerrada com sucesso.' });
  });

  // Dados da sessão corrente
  router.get('/me', authMiddleware(dbFactory), async (c) => {
    const user = c.get('user');
    return c.json({ user });
  });

  return router;
}
