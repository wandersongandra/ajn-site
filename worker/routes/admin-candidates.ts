import { Hono } from 'hono';
import { eq, and, like, or } from 'drizzle-orm';
import * as schema from '../db/schema';
import { logAuditEvent } from '../lib/audit';
import { authMiddleware, requirePermission } from '../middleware/auth';
import type { Env, HonoVariables } from '../types';

export function createAdminCandidatesRoutes(dbFactory: (env: Env) => any) {
  const router = new Hono<{ Bindings: Env; Variables: HonoVariables }>();

  router.use('*', authMiddleware(dbFactory));

  // Listagem de candidatos com busca e filtros (banco de talentos, localização, etc.)
  router.get('/', requirePermission('candidates:read'), async (c) => {
    const db = dbFactory(c.env);
    const q = c.req.query('q')?.trim();
    const city = c.req.query('city');
    const state = c.req.query('state');
    const isTalentPool = c.req.query('talentPool');

    const conditions: any[] = [];
    if (city) conditions.push(like(schema.candidates.city, `%${city}%`));
    if (state) conditions.push(eq(schema.candidates.state, state.toUpperCase()));
    if (isTalentPool === 'true') conditions.push(eq(schema.candidates.isTalentPool, true));
    if (q) {
      conditions.push(
        or(
          like(schema.candidates.fullName, `%${q}%`),
          like(schema.candidates.email, `%${q}%`),
          like(schema.candidates.currentTitle, `%${q}%`)
        )!
      );
    }

    const candidates = await db
      .select({
        id: schema.candidates.id,
        fullName: schema.candidates.fullName,
        email: schema.candidates.email,
        phone: schema.candidates.phone,
        cpfMasked: schema.candidates.cpfMasked,
        city: schema.candidates.city,
        state: schema.candidates.state,
        currentTitle: schema.candidates.currentTitle,
        isTalentPool: schema.candidates.isTalentPool,
        createdAt: schema.candidates.createdAt,
      })
      .from(schema.candidates)
      .where(conditions.length ? and(...conditions) : undefined)
      .all();

    return c.json({ candidates, count: candidates.length });
  });

  // Detalhes completos do candidato (currículo, histórico de candidaturas, certificações)
  router.get('/:id', requirePermission('candidates:read'), async (c) => {
    const db = dbFactory(c.env);
    const candidateId = c.req.param('id');

    const candidate = await db
      .select()
      .from(schema.candidates)
      .where(eq(schema.candidates.id, candidateId))
      .get();

    if (!candidate) {
      return c.json({ error: 'Candidato não encontrado.' }, 404);
    }

    const resumes = await db
      .select({
        id: schema.resumes.id,
        originalFilename: schema.resumes.originalFilename,
        mimeType: schema.resumes.mimeType,
        fileSizeBytes: schema.resumes.fileSizeBytes,
        isCurrent: schema.resumes.isCurrent,
        uploadedAt: schema.resumes.uploadedAt,
      })
      .from(schema.resumes)
      .where(eq(schema.resumes.candidateId, candidateId))
      .all();

    const certifications = await db
      .select()
      .from(schema.certifications)
      .where(eq(schema.certifications.candidateId, candidateId))
      .all();

    const experiences = await db
      .select()
      .from(schema.workExperiences)
      .where(eq(schema.workExperiences.candidateId, candidateId))
      .all();

    const applications = await db
      .select({
        id: schema.jobApplications.id,
        trackingCode: schema.jobApplications.trackingCode,
        status: schema.jobApplications.status,
        source: schema.jobApplications.source,
        rating: schema.jobApplications.recruiterRating,
        notes: schema.jobApplications.recruiterNotes,
        appliedAt: schema.jobApplications.appliedAt,
        jobTitle: schema.jobPostings.title,
        jobDepartment: schema.jobPostings.department,
        stageName: schema.recruitmentStages.name,
      })
      .from(schema.jobApplications)
      .leftJoin(schema.jobPostings, eq(schema.jobApplications.jobId, schema.jobPostings.id))
      .leftJoin(schema.recruitmentStages, eq(schema.jobApplications.currentStageId, schema.recruitmentStages.id))
      .where(eq(schema.jobApplications.candidateId, candidateId))
      .all();

    return c.json({
      candidate: {
        id: candidate.id,
        fullName: candidate.fullName,
        email: candidate.email,
        phone: candidate.phone,
        cpfMasked: candidate.cpfMasked,
        city: candidate.city,
        state: candidate.state,
        linkedinUrl: candidate.linkedinUrl,
        portfolioUrl: candidate.portfolioUrl,
        currentTitle: candidate.currentTitle,
        summary: candidate.summary,
        isTalentPool: candidate.isTalentPool,
        createdAt: candidate.createdAt,
      },
      resumes,
      certifications,
      experiences,
      applications,
    });
  });

  // Download seguro de currículo privado do Cloudflare R2
  router.get('/:id/resume', requirePermission('resumes:read'), async (c) => {
    const db = dbFactory(c.env);
    const user = c.get('user')!;
    const candidateId = c.req.param('id');
    const resumeIdParam = c.req.query('resumeId');

    const resumeCondition = resumeIdParam
      ? and(eq(schema.resumes.candidateId, candidateId), eq(schema.resumes.id, resumeIdParam))
      : and(eq(schema.resumes.candidateId, candidateId), eq(schema.resumes.isCurrent, true));

    const resume = await db.select().from(schema.resumes).where(resumeCondition).get();

    if (!resume) {
      return c.json({ error: 'Nenhum currículo encontrado para este candidato.' }, 404);
    }

    // Busca o arquivo no Cloudflare R2 Privado
    if (!c.env?.RESUMES_BUCKET) {
      return c.json({ error: 'Armazenamento de currículos R2 não configurado neste ambiente.' }, 503);
    }

    const r2Object = await c.env.RESUMES_BUCKET.get(resume.fileKey);
    if (!r2Object) {
      return c.json({ error: 'Arquivo do currículo não foi localizado no bucket de armazenamento.' }, 404);
    }

    // Trilha de auditoria obrigatória ao visualizar/baixar dados sensíveis de candidato
    await logAuditEvent({
      db,
      actorId: user.id,
      actorType: 'admin',
      action: 'RESUME_DOWNLOADED',
      resource: 'resume',
      resourceId: resume.id,
      details: {
        candidateId,
        originalFilename: resume.originalFilename,
        fileKey: resume.fileKey,
      },
      ipAddress: c.req.header('cf-connecting-ip') || '127.0.0.1',
      userAgent: c.req.header('user-agent'),
    });

    c.header('Content-Type', resume.mimeType || 'application/pdf');
    c.header('Content-Disposition', `attachment; filename="${encodeURIComponent(resume.originalFilename)}"`);
    c.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');

    return c.body(r2Object.body);
  });

  return router;
}
