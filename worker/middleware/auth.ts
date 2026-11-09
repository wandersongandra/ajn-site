import { createMiddleware } from 'hono/factory';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema';
import { sha256 } from '../lib/crypto';
import type { Env, HonoVariables, AuthUser } from '../types';

export const authMiddleware = (dbFactory: (env: Env) => any) =>
  createMiddleware<{ Bindings: Env; Variables: HonoVariables }>(async (c, next) => {
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

    if (!token) {
      return c.json({ error: 'Autenticação necessária.' }, 401);
    }

    const tokenHash = await sha256(token);
    const db = dbFactory(c.env);

    const session = await db
      .select({
        sessionId: schema.adminSessions.id,
        expiresAt: schema.adminSessions.expiresAt,
        userId: schema.adminUsers.id,
        name: schema.adminUsers.name,
        email: schema.adminUsers.email,
        role: schema.adminUsers.role,
        isActive: schema.adminUsers.isActive,
      })
      .from(schema.adminSessions)
      .innerJoin(schema.adminUsers, eq(schema.adminSessions.userId, schema.adminUsers.id))
      .where(eq(schema.adminSessions.sessionTokenHash, tokenHash))
      .get();

    if (!session) {
      return c.json({ error: 'Sessão inválida ou expirada.' }, 401);
    }

    if (new Date(session.expiresAt).getTime() < Date.now()) {
      await db.delete(schema.adminSessions).where(eq(schema.adminSessions.sessionTokenHash, tokenHash));
      return c.json({ error: 'Sessão expirada. Faça login novamente.' }, 401);
    }

    if (!session.isActive) {
      return c.json({ error: 'Usuário desativado.' }, 403);
    }

    // Busca permissões do perfil (role)
    const permissions = await db
      .select({ permission: schema.adminPermissions.permission })
      .from(schema.adminPermissions)
      .where(eq(schema.adminPermissions.role, session.role))
      .all();

    const authUser: AuthUser = {
      id: session.userId,
      name: session.name,
      email: session.email,
      role: session.role as any,
      permissions: permissions.map((p: any) => p.permission),
    };

    c.set('user', authUser);
    await next();
  });

export const requirePermission = (permission: string) =>
  createMiddleware<{ Bindings: Env; Variables: HonoVariables }>(async (c, next) => {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'Não autenticado.' }, 401);
    }

    if (user.role === 'super_admin' || user.permissions.includes(permission)) {
      await next();
      return;
    }

    return c.json({ error: `Acesso negado. Permissão necessária: ${permission}` }, 403);
  });
