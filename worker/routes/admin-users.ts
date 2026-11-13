import { Hono } from 'hono';
import { eq, desc } from 'drizzle-orm';
import * as schema from '../db/schema';
import { hashPassword, generateRandomToken } from '../lib/crypto';
import { adminCreateUserSchema, adminUpdateUserStatusSchema } from '../lib/validation';
import { logAuditEvent } from '../lib/audit';
import { authMiddleware } from '../middleware/auth';
import type { Env, HonoVariables } from '../types';

export function createAdminUsersRoutes(dbFactory: (env: Env) => any) {
  const router = new Hono<{ Bindings: Env; Variables: HonoVariables }>();

  // Todas as rotas de usuários exigem autenticação de sessão
  router.use('*', authMiddleware(dbFactory));

  // Middleware auxiliar para verificar permissão admin:manage
  router.use('*', async (c, next) => {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'Não autenticado.' }, 401);
    }
    const hasPermission = user.role === 'super_admin' || user.permissions.includes('admin:manage');
    if (!hasPermission) {
      return c.json({ error: 'Permissão insuficiente. Apenas administradores podem gerenciar recrutadores.' }, 403);
    }
    await next();
  });

  // 1. Listagem de usuários administrativos e recrutadores
  router.get('/', async (c) => {
    const db = dbFactory(c.env);

    const users = await db
      .select({
        id: schema.adminUsers.id,
        name: schema.adminUsers.name,
        email: schema.adminUsers.email,
        role: schema.adminUsers.role,
        isActive: schema.adminUsers.isActive,
        mfaEnabled: schema.adminUsers.mfaEnabled,
        createdAt: schema.adminUsers.createdAt,
        updatedAt: schema.adminUsers.updatedAt,
      })
      .from(schema.adminUsers)
      .orderBy(desc(schema.adminUsers.createdAt))
      .all();

    return c.json({ users, count: users.length });
  });

  // 2. Cadastro de novo recrutador ou administrador
  router.post('/', async (c) => {
    const db = dbFactory(c.env);
    const currentUser = c.get('user')!;
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

    const validation = adminCreateUserSchema.safeParse(body);
    if (!validation.success) {
      return c.json({ error: 'Dados inválidos.', details: validation.error.flatten().fieldErrors }, 400);
    }
    const { name, email, role, password } = validation.data;

    // Verifica se o e-mail já existe
    const existing = await db
      .select()
      .from(schema.adminUsers)
      .where(eq(schema.adminUsers.email, email))
      .get();

    if (existing) {
      return c.json({ error: 'E-mail institucional já cadastrado.' }, 409);
    }

    const { hash, salt } = await hashPassword(password);
    const newUserId = 'usr-' + generateRandomToken(10);

    await db.insert(schema.adminUsers).values({
      id: newUserId,
      name,
      email,
      passwordHash: hash,
      passwordSalt: salt,
      role,
      isActive: true,
      mfaEnabled: false,
      failedAttempts: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await logAuditEvent({
      db,
      actorId: currentUser.id,
      actorType: 'admin',
      action: 'ADMIN_USER_CREATED',
      resource: 'auth',
      resourceId: newUserId,
      details: { name, email, role },
      ipAddress: ip,
      userAgent,
    });

    return c.json(
      {
        success: true,
        message: 'Conta de recrutador criada com sucesso.',
        user: {
          id: newUserId,
          name,
          email,
          role,
          isActive: true,
          mfaEnabled: false,
        },
      },
      201
    );
  });

  // 3. Atualização de status (Ativar / Desativar recrutador)
  router.put('/:id/status', async (c) => {
    const db = dbFactory(c.env);
    const currentUser = c.get('user')!;
    const targetUserId = c.req.param('id');
    const ip =
      c.req.header('cf-connecting-ip') ||
      c.req.header('x-real-ip') ||
      c.req.header('x-forwarded-for')?.split(',')[0].trim() ||
      '127.0.0.1';
    const userAgent = c.req.header('user-agent') || 'Unknown';

    if (targetUserId === currentUser.id) {
      return c.json({ error: 'Não é permitido desativar a própria conta de administrador.' }, 400);
    }

    let body: any;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Corpo da requisição deve ser JSON válido.' }, 400);
    }

    const validation = adminUpdateUserStatusSchema.safeParse(body);
    if (!validation.success) {
      return c.json({ error: 'Dados inválidos.', details: validation.error.flatten().fieldErrors }, 400);
    }
    const { isActive } = validation.data;

    const targetUser = await db
      .select()
      .from(schema.adminUsers)
      .where(eq(schema.adminUsers.id, targetUserId))
      .get();

    if (!targetUser) {
      return c.json({ error: 'Usuário não encontrado.' }, 404);
    }

    await db
      .update(schema.adminUsers)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(schema.adminUsers.id, targetUserId));

    // Se o usuário foi desativado, revoga imediatamente todas as sessões ativas
    if (!isActive) {
      await db
        .delete(schema.adminSessions)
        .where(eq(schema.adminSessions.userId, targetUserId));
    }

    await logAuditEvent({
      db,
      actorId: currentUser.id,
      actorType: 'admin',
      action: isActive ? 'ADMIN_USER_ACTIVATED' : 'ADMIN_USER_DEACTIVATED',
      resource: 'auth',
      resourceId: targetUserId,
      details: { email: targetUser.email, isActive },
      ipAddress: ip,
      userAgent,
    });

    return c.json({
      success: true,
      message: `Usuário ${isActive ? 'ativado' : 'desativado'} com sucesso.`,
      isActive,
    });
  });

  return router;
}
