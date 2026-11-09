import { Hono } from 'hono';
import { eq, sql } from 'drizzle-orm';
import * as schema from '../db/schema';
import { jobPostingSchema } from '../lib/validation';
import { generateRandomToken } from '../lib/crypto';
import { logAuditEvent } from '../lib/audit';
import { authMiddleware, requirePermission } from '../middleware/auth';
import type { Env, HonoVariables } from '../types';

export function createAdminJobsRoutes(dbFactory: (env: Env) => any) {
  const router = new Hono<{ Bindings: Env; Variables: HonoVariables }>();

  router.use('*', authMiddleware(dbFactory));

  // Listagem administrativa de todas as vagas com métricas de candidaturas
  router.get('/', requirePermission('jobs:read'), async (c) => {
    const db = dbFactory(c.env);

    const jobs = await db
      .select({
        id: schema.jobPostings.id,
        title: schema.jobPostings.title,
        slug: schema.jobPostings.slug,
        department: schema.jobPostings.department,
        location: schema.jobPostings.location,
        employmentType: schema.jobPostings.employmentType,
        experienceLevel: schema.jobPostings.experienceLevel,
        status: schema.jobPostings.status,
        openingsCount: schema.jobPostings.openingsCount,
        publishedAt: schema.jobPostings.publishedAt,
        createdAt: schema.jobPostings.createdAt,
      })
      .from(schema.jobPostings)
      .all();

    // Contagem de candidaturas por vaga
    const applicationsCount = await db
      .select({
        jobId: schema.jobApplications.jobId,
        count: sql<number>`count(*)`.as('count'),
      })
      .from(schema.jobApplications)
      .groupBy(schema.jobApplications.jobId)
      .all();

    const countMap = new Map<string, number>();
    for (const app of applicationsCount) {
      if (app.jobId) countMap.set(app.jobId, Number(app.count));
    }

    const result = jobs.map((j: any) => ({
      ...j,
      applicationsCount: countMap.get(j.id) || 0,
    }));

    return c.json({ jobs: result });
  });

  // Criação de nova vaga
  router.post('/', requirePermission('jobs:write'), async (c) => {
    const db = dbFactory(c.env);
    const user = c.get('user')!;

    let body: any;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Corpo da requisição deve ser JSON válido.' }, 400);
    }

    const validation = jobPostingSchema.safeParse(body);
    if (!validation.success) {
      return c.json({ error: 'Dados da vaga inválidos.', details: validation.error.flatten().fieldErrors }, 400);
    }
    const data = validation.data;

    // Verifica se slug já existe
    const existing = await db
      .select()
      .from(schema.jobPostings)
      .where(eq(schema.jobPostings.slug, data.slug))
      .get();

    if (existing) {
      return c.json({ error: 'Já existe uma vaga cadastrada com este slug.' }, 409);
    }

    const jobId = 'job-' + generateRandomToken(10);
    const reqString = Array.isArray(data.requirements) ? JSON.stringify(data.requirements) : data.requirements;

    await db.insert(schema.jobPostings).values({
      id: jobId,
      title: data.title,
      slug: data.slug,
      department: data.department,
      location: data.location,
      employmentType: data.employmentType,
      experienceLevel: data.experienceLevel,
      description: data.description,
      requirements: reqString,
      differentials: data.differentials || null,
      benefits: data.benefits || null,
      salaryMin: data.salaryMin || null,
      salaryMax: data.salaryMax || null,
      salaryIsDisclosed: data.salaryIsDisclosed,
      status: data.status,
      openingsCount: data.openingsCount,
      publishedAt: data.status === 'published' ? new Date() : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await logAuditEvent({
      db,
      actorId: user.id,
      actorType: 'admin',
      action: 'JOB_CREATED',
      resource: 'job',
      resourceId: jobId,
      details: { title: data.title, slug: data.slug },
    });

    return c.json({ success: true, jobId, message: 'Vaga cadastrada com sucesso.' }, 201);
  });

  // Atualização de vaga existente
  router.put('/:id', requirePermission('jobs:write'), async (c) => {
    const db = dbFactory(c.env);
    const user = c.get('user')!;
    const jobId = c.req.param('id');

    const job = await db
      .select()
      .from(schema.jobPostings)
      .where(eq(schema.jobPostings.id, jobId))
      .get();

    if (!job) {
      return c.json({ error: 'Vaga não encontrada.' }, 404);
    }

    let body: any;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'JSON inválido.' }, 400);
    }

    const validation = jobPostingSchema.partial().safeParse(body);
    if (!validation.success) {
      return c.json({ error: 'Dados inválidos.', details: validation.error.flatten().fieldErrors }, 400);
    }
    const data = validation.data;

    const updates: Record<string, any> = { updatedAt: new Date() };
    if (data.title) updates.title = data.title;
    if (data.department) updates.department = data.department;
    if (data.location) updates.location = data.location;
    if (data.employmentType) updates.employmentType = data.employmentType;
    if (data.experienceLevel) updates.experienceLevel = data.experienceLevel;
    if (data.description) updates.description = data.description;
    if (data.requirements) {
      updates.requirements = Array.isArray(data.requirements) ? JSON.stringify(data.requirements) : data.requirements;
    }
    if (data.differentials !== undefined) updates.differentials = data.differentials;
    if (data.benefits !== undefined) updates.benefits = data.benefits;
    if (data.salaryMin !== undefined) updates.salaryMin = data.salaryMin;
    if (data.salaryMax !== undefined) updates.salaryMax = data.salaryMax;
    if (data.salaryIsDisclosed !== undefined) updates.salaryIsDisclosed = data.salaryIsDisclosed;
    if (data.status) {
      updates.status = data.status;
      if (data.status === 'published' && !job.publishedAt) updates.publishedAt = new Date();
      if (data.status === 'closed') updates.closedAt = new Date();
    }
    if (data.openingsCount !== undefined) updates.openingsCount = data.openingsCount;

    await db.update(schema.jobPostings).set(updates).where(eq(schema.jobPostings.id, jobId));

    await logAuditEvent({
      db,
      actorId: user.id,
      actorType: 'admin',
      action: 'JOB_UPDATED',
      resource: 'job',
      resourceId: jobId,
      details: updates,
    });

    return c.json({ success: true, message: 'Vaga atualizada com sucesso.' });
  });

  return router;
}
