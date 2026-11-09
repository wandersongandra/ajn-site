import { Hono } from 'hono';
import { eq, desc } from 'drizzle-orm';
import * as schema from '../db/schema';
import { logAuditEvent } from '../lib/audit';
import { authMiddleware, requirePermission } from '../middleware/auth';
import type { Env, HonoVariables } from '../types';

export function createAdminLgpdRoutes(dbFactory: (env: Env) => any) {
  const router = new Hono<{ Bindings: Env; Variables: HonoVariables }>();

  router.use('*', authMiddleware(dbFactory));

  // Listagem de solicitações LGPD de titulares
  router.get('/requests', requirePermission('lgpd:read'), async (c) => {
    const db = dbFactory(c.env);

    const requests = await db
      .select({
        id: schema.dataSubjectRequests.id,
        candidateId: schema.dataSubjectRequests.candidateId,
        requestType: schema.dataSubjectRequests.requestType,
        status: schema.dataSubjectRequests.status,
        reason: schema.dataSubjectRequests.reason,
        requestedAt: schema.dataSubjectRequests.requestedAt,
        completedAt: schema.dataSubjectRequests.completedAt,
        candidateName: schema.candidates.fullName,
        candidateEmail: schema.candidates.email,
        candidateCpfMasked: schema.candidates.cpfMasked,
      })
      .from(schema.dataSubjectRequests)
      .leftJoin(schema.candidates, eq(schema.dataSubjectRequests.candidateId, schema.candidates.id))
      .orderBy(desc(schema.dataSubjectRequests.requestedAt))
      .all();

    return c.json({ requests });
  });

  // Execução de solicitação LGPD (Exclusão definitiva ou Exportação)
  router.post('/requests/:id/execute', requirePermission('lgpd:delete'), async (c) => {
    const db = dbFactory(c.env);
    const user = c.get('user')!;
    const requestId = c.req.param('id');

    const request = await db
      .select()
      .from(schema.dataSubjectRequests)
      .where(eq(schema.dataSubjectRequests.id, requestId))
      .get();

    if (!request) {
      return c.json({ error: 'Solicitação não encontrada.' }, 404);
    }

    if (request.status === 'completed') {
      return c.json({ error: 'Esta solicitação já foi atendida anteriormente.' }, 400);
    }

    const candidateId = request.candidateId;

    if (request.requestType === 'deletion') {
      // 1. Remove arquivos do Cloudflare R2
      const candidateResumes = await db
        .select({ fileKey: schema.resumes.fileKey })
        .from(schema.resumes)
        .where(eq(schema.resumes.candidateId, candidateId))
        .all();

      if (c.env?.RESUMES_BUCKET) {
        for (const res of candidateResumes) {
          try {
            await c.env.RESUMES_BUCKET.delete(res.fileKey);
          } catch (r2Err) {
            console.error(`Falha ao remover arquivo ${res.fileKey} do R2:`, r2Err);
          }
        }
      }

      // 2. Atualiza status da solicitação antes de remover o candidato
      await db
        .update(schema.dataSubjectRequests)
        .set({
          status: 'completed',
          completedAt: new Date(),
          completedBy: user.id,
        })
        .where(eq(schema.dataSubjectRequests.id, requestId));

      // 3. Remove o registro do candidato (Cascade delete limpa resumes, certificações e candidaturas)
      await db.delete(schema.candidates).where(eq(schema.candidates.id, candidateId));

      await logAuditEvent({
        db,
        actorId: user.id,
        actorType: 'admin',
        action: 'LGPD_DELETION_EXECUTED',
        resource: 'lgpd',
        resourceId: requestId,
        details: { candidateId, filesRemoved: candidateResumes.length },
      });

      return c.json({
        success: true,
        message: 'Exclusão definitiva de dados pessoais do candidato executada com sucesso.',
      });
    } else if (request.requestType === 'export') {
      // Exportação dos dados cadastrais
      const candidate = await db
        .select()
        .from(schema.candidates)
        .where(eq(schema.candidates.id, candidateId))
        .get();

      const applications = await db
        .select()
        .from(schema.jobApplications)
        .where(eq(schema.jobApplications.candidateId, candidateId))
        .all();

      const consents = await db
        .select()
        .from(schema.dataConsents)
        .where(eq(schema.dataConsents.candidateId, candidateId))
        .all();

      await db
        .update(schema.dataSubjectRequests)
        .set({
          status: 'completed',
          completedAt: new Date(),
          completedBy: user.id,
        })
        .where(eq(schema.dataSubjectRequests.id, requestId));

      await logAuditEvent({
        db,
        actorId: user.id,
        actorType: 'admin',
        action: 'LGPD_EXPORT_EXECUTED',
        resource: 'lgpd',
        resourceId: requestId,
        details: { candidateId },
      });

      return c.json({
        success: true,
        exportData: {
          candidate,
          applications,
          consents,
        },
      });
    }

    return c.json({ error: 'Tipo de solicitação desconhecido.' }, 400);
  });

  return router;
}
