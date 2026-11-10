import { Hono } from 'hono';
import { eq, asc } from 'drizzle-orm';
import * as schema from '../db/schema';
import { moveStageSchema } from '../lib/validation';
import { logAuditEvent } from '../lib/audit';
import { authMiddleware, requirePermission } from '../middleware/auth';
import type { Env, HonoVariables } from '../types';

export function createAdminPipelineRoutes(dbFactory: (env: Env) => any) {
  const router = new Hono<{ Bindings: Env; Variables: HonoVariables }>();

  router.use('*', authMiddleware(dbFactory));

  // Visualização do pipeline (estágios e candidatos) para uma vaga específica
  router.get('/:jobId', requirePermission('applications:read'), async (c) => {
    const db = dbFactory(c.env);
    const jobId = c.req.param('jobId');

    const stages = await db
      .select()
      .from(schema.recruitmentStages)
      .orderBy(asc(schema.recruitmentStages.stageOrder))
      .all();

    const applications = await db
      .select({
        id: schema.jobApplications.id,
        candidateId: schema.jobApplications.candidateId,
        trackingCode: schema.jobApplications.trackingCode,
        currentStageId: schema.jobApplications.currentStageId,
        status: schema.jobApplications.status,
        rating: schema.jobApplications.recruiterRating,
        notes: schema.jobApplications.recruiterNotes,
        appliedAt: schema.jobApplications.appliedAt,
        fullName: schema.candidates.fullName,
        email: schema.candidates.email,
        phone: schema.candidates.phone,
        city: schema.candidates.city,
        state: schema.candidates.state,
        currentTitle: schema.candidates.currentTitle,
      })
      .from(schema.jobApplications)
      .innerJoin(schema.candidates, eq(schema.jobApplications.candidateId, schema.candidates.id))
      .where(eq(schema.jobApplications.jobId, jobId))
      .all();

    // Agrupa candidatos por estágio para visualização em Kanban
    const stagesWithCandidates = stages.map((stage: any) => ({
      ...stage,
      candidates: applications.filter((app: any) => app.currentStageId === stage.id),
    }));

    return c.json({ stages: stagesWithCandidates });
  });

  // Movimentação de candidato entre etapas do processo seletivo
  router.post('/move-stage', requirePermission('applications:stage_move'), async (c) => {
    const db = dbFactory(c.env);
    const user = c.get('user')!;

    let body: any;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'JSON inválido.' }, 400);
    }

    const validation = moveStageSchema.safeParse(body);
    if (!validation.success) {
      return c.json({ error: 'Dados inválidos.', details: validation.error.flatten().fieldErrors }, 400);
    }
    const { applicationId, targetStageId, rating, notes, rejectionReason } = validation.data;

    const application = await db
      .select()
      .from(schema.jobApplications)
      .where(eq(schema.jobApplications.id, applicationId))
      .get();

    if (!application) {
      return c.json({ error: 'Candidatura não encontrada.' }, 404);
    }

    const targetStage = await db
      .select()
      .from(schema.recruitmentStages)
      .where(eq(schema.recruitmentStages.id, targetStageId))
      .get();

    if (!targetStage) {
      return c.json({ error: 'Etapa de destino não encontrada.' }, 404);
    }

    let newStatus = application.status;
    if (targetStage.isTerminalHired) {
      newStatus = 'hired';
    } else if (targetStage.isTerminalRejected) {
      newStatus = 'rejected';
    } else {
      newStatus = 'active';
    }

    const updates: Record<string, any> = {
      currentStageId: targetStageId,
      status: newStatus,
      updatedAt: new Date(),
    };
    if (rating !== undefined) updates.recruiterRating = rating;
    if (notes !== undefined) updates.recruiterNotes = notes;
    if (rejectionReason !== undefined) updates.rejectionReason = rejectionReason;

    await db
      .update(schema.jobApplications)
      .set(updates)
      .where(eq(schema.jobApplications.id, applicationId));

    await logAuditEvent({
      db,
      actorId: user.id,
      actorType: 'admin',
      action: 'STAGE_MOVED',
      resource: 'application',
      resourceId: applicationId,
      details: {
        fromStageId: application.currentStageId,
        toStageId: targetStageId,
        newStatus,
        rating,
      },
    });

    return c.json({ success: true, message: 'Candidato movimentado com sucesso no pipeline.' });
  });

  return router;
}
