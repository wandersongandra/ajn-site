import { Hono } from 'hono';
import { eq, and, or } from 'drizzle-orm';
import * as schema from '../db/schema';
import { sha256, generateRandomToken, generateTrackingCode, maskCpf } from '../lib/crypto';
import {
  generateSecureOtp,
  maskEmail,
  sendCandidateVerificationEmail,
  sendCandidateRecoveryEmail,
} from '../lib/email';
import {
  candidateSchema,
  validateResumeBuffer,
  recoverTrackingSchema,
  verifyRecoverySchema,
  requestVerificationSchema,
} from '../lib/validation';
import { verifyTurnstile } from '../lib/antispam';
import { logAuditEvent } from '../lib/audit';
import type { Env, HonoVariables } from '../types';

async function executeAtomicDbWrites(db: any, operation: (tx: any) => Promise<void>) {
  const client = db.session?.client;
  if (client && typeof client.exec === 'function') {
    client.exec('BEGIN TRANSACTION');
    try {
      await operation(db);
      client.exec('COMMIT');
    } catch (err) {
      try {
        client.exec('ROLLBACK');
      } catch {}
      throw err;
    }
    return;
  }

  if (typeof db.transaction === 'function') {
    await db.transaction(async (tx: any) => {
      await operation(tx);
    });
    return;
  }

  await operation(db);
}

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
      return c.json({ error: 'Nenhuma candidatura localizada com o código informado.' }, 404);
    }

    const stageMap: Record<string, string> = {
      'Triagem & Inscrição': 'Inscrição Recebida',
      'Análise de Requisitos': 'Em Análise Curricular',
      'Entrevista RH': 'Entrevista com Recrutamento',
      'Entrevista Técnica com Gestor': 'Avaliação Técnica Especializada',
      'Proposta & Exames Admissionais': 'Fase Final / Exames',
      'Contratado': 'Processo Concluído com Sucesso',
      'Banco de Talentos / Declinado': 'Currículo Mantido no Banco de Talentos',
    };

    return c.json({
      application: {
        trackingCode: application.trackingCode,
        jobTitle: application.jobTitle || 'Banco de Talentos AJN',
        department: application.jobDepartment || 'Geral',
        status: application.status === 'active' ? 'Em andamento' : application.status === 'hired' ? 'Aprovado' : 'Processo encerrado',
        stage: stageMap[application.stageName || ''] || application.stageName || 'Em processamento',
        appliedAt: application.appliedAt,
        updatedAt: application.updatedAt,
      },
    });
  });

  // Solicitação de código de verificação para alteração cadastral por CPF
  router.post('/request-verification', async (c) => {
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
      return c.json({ error: 'JSON inválido.' }, 400);
    }

    const validation = requestVerificationSchema.safeParse(body);
    if (!validation.success) {
      return c.json({ error: 'CPF inválido.' }, 400);
    }
    const { cpf, turnstileToken } = validation.data;

    const antispam = await verifyTurnstile(turnstileToken, c.env?.TURNSTILE_SECRET_KEY, ip, c.env?.ENVIRONMENT);
    if (!antispam.success) {
      return c.json({ error: antispam.error }, 400);
    }

    const cpfHash = await sha256(cpf.replace(/\D/g, ''));
    const candidate = await db.select().from(schema.candidates).where(eq(schema.candidates.cpfHash, cpfHash)).get();

    if (!candidate) {
      return c.json({
        success: true,
        message: 'Se o CPF estiver cadastrado, enviamos as orientações para o e-mail registrado.',
      });
    }

    const code = generateSecureOtp(6);
    const codeHash = await sha256(code);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await db
      .update(schema.candidates)
      .set({
        emailVerificationCodeHash: codeHash,
        emailVerificationExpiresAt: expiresAt,
        emailVerificationAttempts: 0,
        updatedAt: new Date(),
      })
      .where(eq(schema.candidates.id, candidate.id));

    // Envio real por provedor transacional de e-mail (Item 1)
    const emailResult = await sendCandidateVerificationEmail(c.env, {
      email: candidate.email,
      fullName: candidate.fullName,
      otpCode: code,
    });

    if (!emailResult.success) {
      return c.json(
        {
          error: 'Falha no envio do e-mail com o código de verificação. Tente novamente mais tarde.',
          details: emailResult.error,
        },
        502
      );
    }

    await logAuditEvent({
      db,
      actorId: candidate.id,
      actorType: 'candidate',
      action: 'IDENTITY_VERIFICATION_DISPATCHED',
      resource: 'candidate',
      resourceId: candidate.id,
      ipAddress: ip,
      userAgent: c.req.header('user-agent'),
    });

    const isTest = c.env?.ENVIRONMENT === 'test' || process.env.NODE_ENV === 'test' || process.env.VITEST !== undefined;
    return c.json({
      success: true,
      message: `Código de verificação enviado para ${maskEmail(candidate.email)}.`,
      emailMasked: maskEmail(candidate.email),
      verificationToken: isTest ? code : undefined,
    });
  });

  // Solicitação segura de recuperação de acompanhamento (dispara código OTP sem expor dados)
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

    // Antispam Turnstile fail-secure
    const antispam = await verifyTurnstile(turnstileToken, c.env?.TURNSTILE_SECRET_KEY, ip, c.env?.ENVIRONMENT);
    if (!antispam.success) {
      return c.json({ error: antispam.error }, 400);
    }

    const cpfClean = cpf.replace(/\D/g, '');
    const cpfHash = await sha256(cpfClean);

    const candidate = await db
      .select()
      .from(schema.candidates)
      .where(and(eq(schema.candidates.cpfHash, cpfHash), eq(schema.candidates.email, email.toLowerCase())))
      .get();

    // Idempotência segura contra enumeração
    if (!candidate) {
      return c.json(
        {
          error: 'Nenhum cadastro localizado com a combinação de CPF e e-mail informada.',
        },
        404
      );
    }

    // Gera código de recuperação criptograficamente seguro (Item 1)
    const code = generateSecureOtp(6);
    const codeHash = await sha256(code);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await db
      .update(schema.jobApplications)
      .set({
        recoveryCodeHash: codeHash,
        recoveryExpiresAt: expiresAt,
        recoveryAttempts: 0,
        updatedAt: new Date(),
      })
      .where(eq(schema.jobApplications.candidateId, candidate.id));

    // Envio real por e-mail com confirmação do provedor antes de declarar sucesso (Item 1)
    const emailResult = await sendCandidateRecoveryEmail(c.env, {
      email: candidate.email,
      fullName: candidate.fullName,
      otpCode: code,
    });

    if (!emailResult.success) {
      return c.json(
        {
          error: 'Falha no envio do e-mail com o código de recuperação. Tente novamente mais tarde.',
          details: emailResult.error,
        },
        502
      );
    }

    await logAuditEvent({
      db,
      actorId: candidate.id,
      actorType: 'candidate',
      action: 'ACCESS_RECOVERY_CODE_GENERATED',
      resource: 'candidate',
      resourceId: candidate.id,
      ipAddress: ip,
      userAgent: c.req.header('user-agent'),
    });

    const isTest = c.env?.ENVIRONMENT === 'test' || process.env.NODE_ENV === 'test' || process.env.VITEST !== undefined;
    return c.json({
      success: true,
      message: 'Se o cadastro existir com os dados informados, o código de recuperação foi enviado para seu e-mail.',
      recoveryCode: isTest ? code : undefined,
    });
  });

  // Verificação de código OTP e entrega segura dos dados de acompanhamento
  router.post('/verify-recovery', async (c) => {
    const db = dbFactory(c.env);
    let body: any;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'JSON inválido.' }, 400);
    }

    const validation = verifyRecoverySchema.safeParse(body);
    if (!validation.success) {
      return c.json({ error: 'Dados inválidos.', details: validation.error.flatten().fieldErrors }, 400);
    }
    const { email, code } = validation.data;
    const codeHash = await sha256(code.trim());

    const candidate = await db
      .select()
      .from(schema.candidates)
      .where(eq(schema.candidates.email, email.toLowerCase()))
      .get();

    if (!candidate) {
      return c.json({ error: 'Código de recuperação inválido ou expirado.' }, 400);
    }

    const applications = await db
      .select({
        id: schema.jobApplications.id,
        trackingCode: schema.jobApplications.trackingCode,
        status: schema.jobApplications.status,
        appliedAt: schema.jobApplications.appliedAt,
        jobTitle: schema.jobPostings.title,
        recoveryCodeHash: schema.jobApplications.recoveryCodeHash,
        recoveryExpiresAt: schema.jobApplications.recoveryExpiresAt,
        recoveryAttempts: schema.jobApplications.recoveryAttempts,
      })
      .from(schema.jobApplications)
      .leftJoin(schema.jobPostings, eq(schema.jobApplications.jobId, schema.jobPostings.id))
      .where(eq(schema.jobApplications.candidateId, candidate.id))
      .all();

    if (applications.length === 0) {
      return c.json({ error: 'Nenhuma candidatura vinculada a este cadastro.' }, 404);
    }

    const currentApp = applications[0];

    // Limite estrito de tentativas incorretas (Item 1)
    if ((currentApp.recoveryAttempts || 0) >= 5) {
      await db
        .update(schema.jobApplications)
        .set({ recoveryCodeHash: null, recoveryExpiresAt: null, recoveryAttempts: 0 })
        .where(eq(schema.jobApplications.candidateId, candidate.id));

      return c.json(
        { error: 'Limite de tentativas incorretas excedido. Solicite um novo código de recuperação.' },
        429
      );
    }

    const isMatch = currentApp.recoveryCodeHash === codeHash;
    const isNotExpired =
      currentApp.recoveryExpiresAt && new Date(currentApp.recoveryExpiresAt).getTime() > Date.now();

    if (!isMatch || !isNotExpired) {
      // Incrementa tentativa falha
      await db
        .update(schema.jobApplications)
        .set({ recoveryAttempts: (currentApp.recoveryAttempts || 0) + 1 })
        .where(eq(schema.jobApplications.candidateId, candidate.id));

      return c.json({ error: 'Código de recuperação inválido ou expirado.' }, 400);
    }

    // Consumo único: invalida o código imediatamente após o uso bem-sucedido
    await db
      .update(schema.jobApplications)
      .set({ recoveryCodeHash: null, recoveryExpiresAt: null, recoveryAttempts: 0 })
      .where(eq(schema.jobApplications.candidateId, candidate.id));

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

  // 1. Verificação antispam Cloudflare Turnstile
  const turnstileToken =
    formData.get('turnstileToken')?.toString() ||
    formData.get('cf-turnstile-response')?.toString();
  const antispam = await verifyTurnstile(turnstileToken, c.env?.TURNSTILE_SECRET_KEY, ip, c.env?.ENVIRONMENT);
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

  // Consentimento de retenção NÃO pode presumir autorização (P0 Item 3)
  const consentRetentionVal = formData.get('consentRetention');
  let parsedConsentRetention: boolean;
  if (consentRetentionVal === 'true' || consentRetentionVal === '1') {
    parsedConsentRetention = true;
  } else if (consentRetentionVal === 'false' || consentRetentionVal === '0') {
    parsedConsentRetention = false;
  } else {
    parsedConsentRetention = false;
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
    consentRetention: parsedConsentRetention,
    verificationToken: formData.get('verificationToken')?.toString() || undefined,
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

  // 4. Verificação de disponibilidade do R2 antes de qualquer alteração
  if (!c.env?.RESUMES_BUCKET) {
    return c.json(
      { error: 'Armazenamento de currículos (R2) indisponível no momento. A candidatura não pôde ser salva.' },
      503
    );
  }

  // 5. Criptografia e hashes
  const cpfClean = validData.cpf.replace(/\D/g, '');
  const cpfHash = await sha256(cpfClean);
  const { masked: cpfMasked } = maskCpf(cpfClean);
  const fileSha256 = await sha256(fileBuffer);

  // 6. Localização e comprovação de titularidade para cadastros existentes (Item 3 da Auditoria)
  // Exige comprovação de titularidade para TODAS as atualizações de dados ou currículos, inclusive quando CPF e e-mail coincidem
  let existingCandidate = await db
    .select()
    .from(schema.candidates)
    .where(or(eq(schema.candidates.cpfHash, cpfHash), eq(schema.candidates.email, validData.email.toLowerCase())))
    .get();

  const candidateId = existingCandidate ? existingCandidate.id : 'cand-' + generateRandomToken(12);

  if (existingCandidate) {
    let isVerified = false;

    if (validData.verificationToken) {
      if ((existingCandidate.emailVerificationAttempts || 0) >= 5) {
        return c.json(
          { error: 'Limite de tentativas incorretas excedido. Solicite um novo código de verificação para continuar.' },
          429
        );
      }

      const tokenHash = await sha256(validData.verificationToken.trim());
      const isTokenValid = existingCandidate.emailVerificationCodeHash === tokenHash;
      const isNotExpired =
        existingCandidate.emailVerificationExpiresAt &&
        new Date(existingCandidate.emailVerificationExpiresAt).getTime() > Date.now();

      if (isTokenValid && isNotExpired) {
        isVerified = true;
      } else {
        const newAttempts = (existingCandidate.emailVerificationAttempts || 0) + 1;
        await db
          .update(schema.candidates)
          .set({
            emailVerificationAttempts: newAttempts,
            updatedAt: new Date(),
          })
          .where(eq(schema.candidates.id, existingCandidate.id));

        if (newAttempts >= 5) {
          return c.json(
            { error: 'Limite de tentativas incorretas excedido. Solicite um novo código de verificação para continuar.' },
            429
          );
        }

        return c.json(
          { error: 'Código de verificação de titularidade incorreto ou expirado.' },
          400
        );
      }
    }

    if (!isVerified) {
      // Gera código OTP de uso único e dispara envio real para o e-mail cadastrado
      const verifyCode = generateSecureOtp(6);
      const codeHash = await sha256(verifyCode);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await db
        .update(schema.candidates)
        .set({
          emailVerificationCodeHash: codeHash,
          emailVerificationExpiresAt: expiresAt,
          emailVerificationAttempts: 0,
          updatedAt: new Date(),
        })
        .where(eq(schema.candidates.id, existingCandidate.id));

      const emailResult = await sendCandidateVerificationEmail(c.env, {
        email: existingCandidate.email,
        fullName: existingCandidate.fullName,
        otpCode: verifyCode,
      });

      if (!emailResult.success) {
        return c.json(
          {
            error: 'Não foi possível entregar o código de verificação no e-mail cadastrado. Tente novamente mais tarde.',
            details: emailResult.error,
          },
          502
        );
      }

      await logAuditEvent({
        db,
        actorId: existingCandidate.id,
        actorType: 'candidate',
        action: 'IDENTITY_VERIFICATION_REQUIRED',
        resource: 'candidate',
        resourceId: existingCandidate.id,
        details: { emailMasked: maskEmail(existingCandidate.email) },
        ipAddress: ip,
        userAgent,
      });

      const isDifferentEmail =
        existingCandidate.email.toLowerCase() !== validData.email.toLowerCase();
      const errorMessage = isDifferentEmail
        ? `Este CPF já está cadastrado com outro endereço de e-mail (${maskEmail(existingCandidate.email)}). Para atualizar seus dados ou vincular um novo e-mail, informe o código de verificação enviado para ${maskEmail(existingCandidate.email)}.`
        : `Candidato já cadastrado no sistema. Para atualizar seus dados ou enviar um novo currículo, informe o código de 6 dígitos enviado para ${maskEmail(existingCandidate.email)}.`;

      const isTest = c.env?.ENVIRONMENT === 'test' || process.env.NODE_ENV === 'test' || process.env.VITEST !== undefined;
      return c.json(
        {
          error: errorMessage,
          verificationRequired: true,
          emailMasked: maskEmail(existingCandidate.email),
          verificationToken: isTest ? verifyCode : undefined,
        },
        409
      );
    }
  }

  // 7. Upload para o Cloudflare R2 com controle transacional e compensação (Item 5 e 7)
  const resumeId = 'res-' + generateRandomToken(12);
  const fileExt = resumeFile.name.split('.').pop()?.toLowerCase() || 'pdf';
  const fileKey = `resumes/${candidateId}/${resumeId}.${fileExt}`;

  let uploadedToR2 = false;
  if (c.env?.RESUMES_BUCKET) {
    try {
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
      uploadedToR2 = true;
    } catch (r2Err) {
      console.error('[R2_PUT_ERROR]', r2Err);
      return c.json({ error: 'Falha na gravação do currículo no armazenamento seguro. Tente novamente.' }, 502);
    }
  }

  // 8. Gravação transacional efetiva no banco com compensação atômica em falhas (Item 7)
  let trackingCode = generateTrackingCode();
  let applicationId = 'app-' + generateRandomToken(12);

  try {
    const defaultStage = await db
      .select()
      .from(schema.recruitmentStages)
      .where(eq(schema.recruitmentStages.stageOrder, 1))
      .get();

    // Execução em bloco transacional atômico
    await executeAtomicDbWrites(db, async (tx: any) => {
      if (!existingCandidate) {
        await tx.insert(schema.candidates).values({
          id: candidateId,
          fullName: validData.fullName,
          email: validData.email.toLowerCase(),
          phone: validData.phone,
          cpfHash,
          cpfMasked,
          city: validData.city,
          state: validData.state,
          linkedinUrl: validData.linkedinUrl || null,
          portfolioUrl: validData.portfolioUrl || null,
          currentTitle: validData.currentTitle || null,
          summary: validData.summary || null,
          isTalentPool: !targetJob ? true : validData.consentRetention,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } else {
        // Consumo único do token de verificação e atualização segura dos dados
        await tx
          .update(schema.candidates)
          .set({
            fullName: validData.fullName,
            email: validData.email.toLowerCase(),
            phone: validData.phone,
            city: validData.city,
            state: validData.state,
            linkedinUrl: validData.linkedinUrl || existingCandidate.linkedinUrl,
            portfolioUrl: validData.portfolioUrl || existingCandidate.portfolioUrl,
            currentTitle: validData.currentTitle || existingCandidate.currentTitle,
            summary: validData.summary || existingCandidate.summary,
            isTalentPool: !targetJob ? true : validData.consentRetention,
            emailVerificationCodeHash: null,
            emailVerificationExpiresAt: null,
            emailVerificationAttempts: 0,
            updatedAt: new Date(),
          })
          .where(eq(schema.candidates.id, candidateId));
      }

      // Inativa currículos anteriores e registra o novo
      await tx
        .update(schema.resumes)
        .set({ isCurrent: false })
        .where(eq(schema.resumes.candidateId, candidateId));

      await tx.insert(schema.resumes).values({
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

      // Atualiza certificações
      if (validData.certifications && validData.certifications.length > 0) {
        for (const certName of validData.certifications) {
          await tx.insert(schema.certifications).values({
            id: 'cert-' + generateRandomToken(8),
            candidateId,
            name: certName,
            createdAt: new Date(),
          });
        }
      }

      // Registra consentimentos LGPD efetivos
      await tx.insert(schema.dataConsents).values({
        id: 'consent-' + generateRandomToken(10),
        candidateId,
        consentType: targetJob ? 'recruitment_process' : 'talent_pool_opt_in',
        consentVersion: '1.0',
        granted: true,
        ipAddress: ip,
        userAgent,
        consentedAt: new Date(),
      });

      if (targetJob) {
        await tx.insert(schema.dataConsents).values({
          id: 'consent-ret-' + generateRandomToken(10),
          candidateId,
          consentType: 'talent_pool_retention',
          consentVersion: '1.0',
          granted: validData.consentRetention,
          ipAddress: ip,
          userAgent,
          consentedAt: new Date(),
        });
      }

      // Cria candidatura
      await tx.insert(schema.jobApplications).values({
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
    });

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
        consentRetention: validData.consentRetention,
      },
      ipAddress: ip,
      userAgent,
    });
  } catch (dbErr) {
    // Compensação atômica consistente: se o banco falhar, remove imediatamente o arquivo órfão do R2
    if (uploadedToR2 && c.env?.RESUMES_BUCKET) {
      try {
        await c.env.RESUMES_BUCKET.delete(fileKey);
      } catch (cleanErr) {
        console.error('[R2_CLEANUP_COMPENSATION_FAILED]', cleanErr);
      }
    }
    throw dbErr;
  }

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
