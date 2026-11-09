import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import * as schema from '../db/schema';
import { sha256, generateRandomToken, generateTrackingCode, maskCpf } from '../lib/crypto';
import { candidateSchema, validateResumeBuffer, recoverTrackingSchema } from '../lib/validation';
import { verifyTurnstile } from '../lib/antispam';
import { logAuditEvent } from '../lib/audit';
import type { Env, HonoVariables } from '../types';

export function createPublicApplicationsRoutes(dbFactory: (env: Env) => any) {
  const router = new Hono<{ Bindings: Env; Variables: HonoVariables }>();

  // Inscrição para vaga específica via multipart/form-data
  router.post('/jobs/:slug/apply', async (c) => {
    return handleApplication(c, dbFactory, c.req.param('slug'));
  });

  // Cadastro geral no Banco de Talentos via multipart/form-data
  router.post('/talent-pool', async (c) => {
    return handleApplication(c, dbFactory, null);
  });

  // Consulta do status da candidatura pelo código do candidato (Tracking)
  router.get('/track/:code', async (c) => {
    const db = dbFactory(c.env);
    const code = c.req.param('code').trim().toUpperCase();

    const application = await db
      .select({
        trackingCode: schema.jobApplications.trackingCode,
        status: schema.jobApplications.status,
        appliedAt: schema.jobApplications.appliedAt,
        updatedAt: schema.jobApplications.updatedAt,
        jobTitle: schema.jobPostings.title,
        jobDepartment: schema.jobPostings.department,
        stageName: schema.recruitmentStages.name,
      })
      .from(schema.jobApplications)
      .leftJoin(schema.jobPostings, eq(schema.jobApplications.jobId, schema.jobPostings.id))
      .leftJoin(schema.recruitmentStages, eq(schema.jobApplications.currentStageId, schema.recruitmentStages.id))
      .where(eq(schema.jobApplications.trackingCode, code))
      .get();

    if (!application) {
      return c.json({ error: 'Candidatura não encontrada. Verifique o código informado.' }, 404);
    }

    return c.json({
      application: {
        trackingCode: application.trackingCode,
        appliedAt: application.appliedAt,
        updatedAt: application.updatedAt,
        jobTitle: application.jobTitle || 'Banco de Talentos AJN',
        department: application.jobDepartment || 'Geral',
        currentStage: application.stageName || 'Triagem & Inscrição',
        status: application.status === 'active' ? 'Em andamento' : application.status === 'hired' ? 'Aprovado' : 'Processo encerrado',
      },
    });
  });

  // Recuperação de acesso / código de acompanhamento pelo titular (e-mail + CPF)
  router.post('/recover-tracking', async (c) => {
    const db = dbFactory(c.env);
    const ip =
      c.req.header('cf-connecting-ip') ||
      c.req.header('x-real-ip') ||
      c.req.header('x-forwarded-for')?.split(',')[0].trim() ||
      '127.0.0.1';

    let body: any;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Corpo da requisição deve ser JSON válido.' }, 400);
    }

    const validation = recoverTrackingSchema.safeParse(body);
    if (!validation.success) {
      return c.json({ error: 'Dados informados inválidos.', details: validation.error.flatten().fieldErrors }, 400);
    }
    const { email, cpf, turnstileToken } = validation.data;

    // Antispam Turnstile
    const antispam = await verifyTurnstile(turnstileToken, c.env?.TURNSTILE_SECRET_KEY, ip);
    if (!antispam.success) {
      return c.json({ error: antispam.error }, 400);
    }

    const cpfClean = cpf.replace(/\D/g, '');
    const cpfHash = await sha256(cpfClean);

    const candidate = await db
      .select()
      .from(schema.candidates)
      .where(and(eq(schema.candidates.cpfHash, cpfHash), eq(schema.candidates.email, email)))
      .get();

    if (!candidate) {
      return c.json({ error: 'Nenhum cadastro localizado com a combinação de CPF e e-mail informada.' }, 404);
    }

    const applications = await db
      .select({
        trackingCode: schema.jobApplications.trackingCode,
        status: schema.jobApplications.status,
        appliedAt: schema.jobApplications.appliedAt,
        jobTitle: schema.jobPostings.title,
      })
      .from(schema.jobApplications)
      .leftJoin(schema.jobPostings, eq(schema.jobApplications.jobId, schema.jobPostings.id))
      .where(eq(schema.jobApplications.candidateId, candidate.id))
      .all();

    await logAuditEvent({
      db,
      actorId: candidate.id,
      actorType: 'candidate',
      action: 'ACCESS_RECOVERY_REQUESTED',
      resource: 'candidate',
      resourceId: candidate.id,
      ipAddress: ip,
      userAgent: c.req.header('user-agent'),
    });

    return c.json({
      success: true,
      applications: applications.map((app: any) => ({
        trackingCode: app.trackingCode,
        jobTitle: app.jobTitle || 'Banco de Talentos AJN',
        status: app.status === 'active' ? 'Em andamento' : app.status === 'hired' ? 'Aprovado' : 'Processo encerrado',
        appliedAt: app.appliedAt,
      })),
    });
  });

  return router;
}

async function handleApplication(c: any, dbFactory: (env: Env) => any, jobSlug: string | null) {
  const db = dbFactory(c.env);
  const ip =
    c.req.header('cf-connecting-ip') ||
    c.req.header('x-real-ip') ||
    c.req.header('x-forwarded-for')?.split(',')[0].trim() ||
    '127.0.0.1';
  const userAgent = c.req.header('user-agent') || 'Unknown';

  let formData: FormData;
  try {
    formData = await c.req.formData();
  } catch (err) {
    return c.json({ error: 'Formato de envio inválido. Utilize multipart/form-data.' }, 400);
  }

  // Se for candidatura a uma vaga específica, verifica existência da vaga
  let targetJob: any = null;
  if (jobSlug) {
    targetJob = await db
      .select()
      .from(schema.jobPostings)
      .where(and(eq(schema.jobPostings.slug, jobSlug), eq(schema.jobPostings.status, 'published')))
      .get();

    if (!targetJob) {
      return c.json({ error: 'A vaga solicitada não existe ou não está mais aberta.' }, 404);
    }
  }

  // 1. Antispam Turnstile
  const turnstileToken = formData.get('turnstileToken')?.toString();
  const antispam = await verifyTurnstile(turnstileToken, c.env?.TURNSTILE_SECRET_KEY, ip);
  if (!antispam.success) {
    return c.json({ error: antispam.error }, 400);
  }

  // 2. Extração e validação do formulário via Zod
  const certificationsRaw = formData.get('certifications')?.toString();
  let parsedCertifications: string[] = [];
  if (certificationsRaw) {
    try {
      parsedCertifications = JSON.parse(certificationsRaw);
    } catch {
      parsedCertifications = certificationsRaw.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }

  const rawData = {
    fullName: formData.get('fullName')?.toString(),
    email: formData.get('email')?.toString(),
    phone: formData.get('phone')?.toString(),
    cpf: formData.get('cpf')?.toString(),
    city: formData.get('city')?.toString(),
    state: formData.get('state')?.toString(),
    linkedinUrl: formData.get('linkedinUrl')?.toString() || undefined,
    portfolioUrl: formData.get('portfolioUrl')?.toString() || undefined,
    currentTitle: formData.get('currentTitle')?.toString() || undefined,
    summary: formData.get('summary')?.toString() || undefined,
    certifications: parsedCertifications,
    consentTerms: formData.get('consentTerms') === 'true' || formData.get('consentTerms') === '1',
    consentRetention: formData.get('consentRetention') !== 'false',
    turnstileToken,
  };

  const validation = candidateSchema.safeParse(rawData);
  if (!validation.success) {
    const errorDetails = validation.error.flatten().fieldErrors;
    return c.json({ error: 'Dados cadastrais inválidos.', details: errorDetails }, 400);
  }
  const validData = validation.data;

  // 3. Validação do arquivo de currículo
  const resumeFile = formData.get('resume');
  if (!resumeFile || !(resumeFile instanceof File)) {
    return c.json({ error: 'O anexo do currículo é obrigatório.' }, 400);
  }

  const fileBuffer = new Uint8Array(await resumeFile.arrayBuffer());
  const fileValidation = validateResumeBuffer(resumeFile.name, resumeFile.type, fileBuffer);
  if (!fileValidation.valid) {
    return c.json({ error: fileValidation.error }, 400);
  }

  // 4. Criptografia e hashes
  const cpfClean = validData.cpf.replace(/\D/g, '');
  const cpfHash = await sha256(cpfClean);
  const { masked: cpfMasked } = maskCpf(cpfClean);
  const fileSha256 = await sha256(fileBuffer);

  // 5. Localiza ou cadastra candidato
  let candidate = await db
    .select()
    .from(schema.candidates)
    .where(eq(schema.candidates.cpfHash, cpfHash))
    .get();

  const candidateId = candidate ? candidate.id : 'cand-' + generateRandomToken(12);

  if (!candidate) {
    await db.insert(schema.candidates).values({
      id: candidateId,
      fullName: validData.fullName,
      email: validData.email,
      phone: validData.phone,
      cpfHash,
      cpfMasked,
      city: validData.city,
      state: validData.state,
      linkedinUrl: validData.linkedinUrl || null,
      portfolioUrl: validData.portfolioUrl || null,
      currentTitle: validData.currentTitle || null,
      summary: validData.summary || null,
      isTalentPool: !targetJob || validData.consentRetention,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  } else {
    // Atualiza dados de contato
    await db
      .update(schema.candidates)
      .set({
        fullName: validData.fullName,
        email: validData.email,
        phone: validData.phone,
        city: validData.city,
        state: validData.state,
        linkedinUrl: validData.linkedinUrl || candidate.linkedinUrl,
        portfolioUrl: validData.portfolioUrl || candidate.portfolioUrl,
        currentTitle: validData.currentTitle || candidate.currentTitle,
        summary: validData.summary || candidate.summary,
        updatedAt: new Date(),
      })
      .where(eq(schema.candidates.id, candidateId));
  }

  // 6. Upload do currículo para o Cloudflare R2 Privado
  const resumeId = 'res-' + generateRandomToken(12);
  const fileExt = resumeFile.name.split('.').pop()?.toLowerCase() || 'pdf';
  const fileKey = `resumes/${candidateId}/${resumeId}.${fileExt}`;

  // Se o R2 estiver disponível no ambiente, armazena no bucket
  if (c.env?.RESUMES_BUCKET) {
    await c.env.RESUMES_BUCKET.put(fileKey, fileBuffer, {
      httpMetadata: {
        contentType: resumeFile.type || 'application/pdf',
      },
      customMetadata: {
        candidateId,
        originalFilename: resumeFile.name,
        fileSha256,
        uploadedAt: new Date().toISOString(),
      },
    });
  }

  // Marca currículos anteriores como isCurrent = false e insere novo
  await db
    .update(schema.resumes)
    .set({ isCurrent: false })
    .where(eq(schema.resumes.candidateId, candidateId));

  await db.insert(schema.resumes).values({
    id: resumeId,
    candidateId,
    fileKey,
    originalFilename: resumeFile.name,
    mimeType: resumeFile.type || 'application/pdf',
    fileSizeBytes: fileBuffer.length,
    fileSha256,
    isCurrent: true,
    uploadedAt: new Date(),
  });

  // 7. Atualiza certificações
  if (validData.certifications && validData.certifications.length > 0) {
    for (const certName of validData.certifications) {
      await db.insert(schema.certifications).values({
        id: 'cert-' + generateRandomToken(8),
        candidateId,
        name: certName,
        createdAt: new Date(),
      });
    }
  }

  // 8. Registra consentimento LGPD
  await db.insert(schema.dataConsents).values({
    id: 'consent-' + generateRandomToken(10),
    candidateId,
    consentType: targetJob ? 'recruitment_process' : 'talent_pool_retention',
    consentVersion: '1.0',
    ipAddress: ip,
    userAgent,
    consentedAt: new Date(),
  });

  // 9. Cria candidatura e código de rastreamento
  const defaultStage = await db
    .select()
    .from(schema.recruitmentStages)
    .where(eq(schema.recruitmentStages.stageOrder, 1))
    .get();

  const trackingCode = generateTrackingCode();
  const applicationId = 'app-' + generateRandomToken(12);

  await db.insert(schema.jobApplications).values({
    id: applicationId,
    jobId: targetJob ? targetJob.id : null,
    candidateId,
    resumeId,
    currentStageId: defaultStage ? defaultStage.id : null,
    trackingCode,
    status: 'active',
    source: targetJob ? 'portal' : 'talentos',
    appliedAt: new Date(),
    updatedAt: new Date(),
  });

  // 10. Trilha de auditoria
  await logAuditEvent({
    db,
    actorId: candidateId,
    actorType: 'candidate',
    action: targetJob ? 'APPLICATION_SUBMITTED' : 'TALENT_POOL_REGISTERED',
    resource: 'application',
    resourceId: applicationId,
    details: {
      jobSlug: targetJob?.slug || null,
      trackingCode,
      resumeId,
      fileSha256,
    },
    ipAddress: ip,
    userAgent,
  });

  return c.json(
    {
      success: true,
      trackingCode,
      candidateId,
      message: targetJob
        ? 'Candidatura enviada com sucesso! Guarde seu código de acompanhamento.'
        : 'Cadastro no Banco de Talentos realizado com sucesso! Guarde seu código de acompanhamento.',
    },
    201
  );
}
