import { Hono } from 'hono';
import { eq, and, desc } from 'drizzle-orm';
import * as schema from '../db/schema';
import { authMiddleware, requirePermission } from '../middleware/auth';
import type { Env, HonoVariables } from '../types';

export function createAdminAuditRoutes(dbFactory: (env: Env) => any) {
  const router = new Hono<{ Bindings: Env; Variables: HonoVariables }>();

  router.use('*', authMiddleware(dbFactory));

  // Consulta da trilha de auditoria
  router.get('/', requirePermission('audit:read'), async (c) => {
    const db = dbFactory(c.env);
    const action = c.req.query('action');
    const resource = c.req.query('resource');
    const actorType = c.req.query('actorType');
    const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') || '50', 10)));
    const offset = Math.max(0, parseInt(c.req.query('offset') || '0', 10));

    const conditions: any[] = [];
    if (action) conditions.push(eq(schema.auditLogs.action, action));
    if (resource) conditions.push(eq(schema.auditLogs.resource, resource));
    if (actorType) conditions.push(eq(schema.auditLogs.actorType, actorType));

    const logs = await db
      .select()
      .from(schema.auditLogs)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(schema.auditLogs.timestamp))
      .limit(limit)
      .offset(offset)
      .all();

    return c.json({ logs, count: logs.length, limit, offset });
  });

  return router;
}
