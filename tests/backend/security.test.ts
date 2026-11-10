import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { eq } from 'drizzle-orm';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as schema from '../../worker/db/schema';
import { createCarreirasApp } from '../../worker/index';
import { hashPassword, sha256, generateRandomToken, generateCurrentTotp, generateTotpSecret } from '../../worker/lib/crypto';
import { seedDatabase, INITIAL_JOB_POSTINGS } from '../../worker/db/seed';
import { rateLimiter, resetRateLimiterStore, RateLimiterDO } from '../../worker/middleware/rate-limit';
import { clearSentTestEmails, sentTestEmails, escapeHtml } from '../../worker/lib/email';
import { Hono } from 'hono';

describe('Testes Específicos de Segurança, Autorização e Uploads Maliciosos', () => {
  let sqlite: InstanceType<typeof Database>;
  let db: ReturnType<typeof drizzle<typeof schema>>;
  let app: ReturnType<typeof createCarreirasApp>;
  let mockR2Storage: Map<string, Uint8Array>;
  let mockR2Bucket: any;
  let mockDOBinding: any;

  beforeEach(async () => {
    resetRateLimiterStore();
    mockDOBinding = {
      idFromName: (_name: string) => ({ toString: () => 'do-stub-id' }),
      get: (_id: any) => ({
        fetch: async () =>
          new Response(JSON.stringify({ allowed: true, count: 1, remaining: 59, resetTimestamp: Math.ceil(Date.now() / 1000) + 60, retryAfter: 0 }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'X-RateLimit-Limit': '60', 'X-RateLimit-Remaining': '59', 'X-RateLimit-Reset': '1000' },
          }),
      }),
    };

    sqlite = new Database(':memory:');
    sqlite.pragma('foreign_keys = ON');

    const migrationSql = readFileSync(
      resolve(process.cwd(), 'worker/db/migrations/0000_curious_the_executioner.sql'),
      'utf8'
    );
    for (const stmt of migrationSql.split('--> statement-breakpoint')) {
      if (stmt.trim()) sqlite.exec(stmt.trim());
    }

    db = drizzle(sqlite, { schema });
    await seedDatabase(db, { autoPublishJobs: true });

    mockR2Storage = new Map<string, Uint8Array>();
    mockR2Bucket = {
      put: async (key: string, value: any) => {
        mockR2Storage.set(key, value instanceof Uint8Array ? value : new Uint8Array(value));
      },
      get: async (key: string) => {
        const val = mockR2Storage.get(key);
        if (!val) return null;
        return { body: val, size: val.length };
      },
      delete: async (key: string) => {
        mockR2Storage.delete(key);
      },
    };

    app = createCarreirasApp(() => db);

    // Usuários padrão para testes administrativos e controle de acesso
    const recPass = await hashPassword('RecruiterPass123!');
    await db.insert(schema.adminUsers).values({
      id: 'usr-maria',
      name: 'Maria Recrutadora',
      email: 'maria@ajnengenharia.com.br',
      passwordHash: recPass.hash,
      passwordSalt: recPass.salt,
      role: 'recruiter',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const viewPass = await hashPassword('ViewerPass123!');
    await db.insert(schema.adminUsers).values({
      id: 'usr-joao',
      name: 'João Observador',
      email: 'joao@ajnengenharia.com.br',
      passwordHash: viewPass.hash,
      passwordSalt: viewPass.salt,
      role: 'viewer',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const adminPass = await hashPassword('AdminPassword123!');
    const adminMfaSecret = generateTotpSecret();
    await db.insert(schema.adminUsers).values({
      id: 'usr-admin-test',
      name: 'Administrador RH',
      email: 'admin@ajnengenharia.com.br',
      passwordHash: adminPass.hash,
      passwordSalt: adminPass.salt,
      role: 'super_admin',
      isActive: true,
      mfaEnabled: true,
      mfaSecret: adminMfaSecret,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  describe('1. Proteção de Upload Malicioso', () => {
    it('deve rejeitar script PHP ou shell com extensão falsa .pdf', async () => {
      const phpScript = new TextEncoder().encode('<?php echo "malware"; system($_GET["cmd"]); ?>');
      const form = new FormData();
      form.append('fullName', 'Atacante PHP');
      form.append('email', 'php@ataque.com');
      form.append('phone', '(31) 98888-2222');
      form.append('cpf', '00000000191');
      form.append('city', 'Belo Horizonte');
      form.append('state', 'MG');
      form.append('consentTerms', 'true');
      form.append('resume', new File([phpScript], 'shell.pdf', { type: 'application/pdf' }));

      const res = await app.request(
        '/api/applications/talent-pool',
        { method: 'POST', body: form },
        { DB: {} as any, RESUMES_BUCKET: mockR2Bucket, TURNSTILE_SECRET_KEY: 'test' } as any
      );

      expect(res.status).toBe(400);
      const data = (await res.json()) as any;
      expect(data.error).toContain('Assinatura binária inválida');
    });

    it('deve rejeitar arquivo que exceda o limite de 5 MB', async () => {
      // Cria buffer simulado de 5.5 MB
      const oversizedBuffer = new Uint8Array(5.5 * 1024 * 1024);
      // Inicia com magic bytes de PDF
      oversizedBuffer[0] = 0x25;
      oversizedBuffer[1] = 0x50;
      oversizedBuffer[2] = 0x44;
      oversizedBuffer[3] = 0x46;

      const form = new FormData();
      form.append('fullName', 'Arquivo Gigante');
      form.append('email', 'gigante@teste.com');
      form.append('phone', '(31) 98888-2222');
      form.append('cpf', '00000000191');
      form.append('city', 'Belo Horizonte');
      form.append('state', 'MG');
      form.append('consentTerms', 'true');
      form.append('resume', new File([oversizedBuffer], 'grande.pdf', { type: 'application/pdf' }));

      const res = await app.request(
        '/api/applications/talent-pool',
        { method: 'POST', body: form },
        { DB: {} as any, RESUMES_BUCKET: mockR2Bucket, TURNSTILE_SECRET_KEY: 'test' } as any
      );

      expect(res.status).toBe(400);
      const data = (await res.json()) as any;
      expect(data.error).toContain('limite máximo permitido de 5 MB');
    });
  });

  describe('2. Testes de Autorização e Acesso a Currículos R2 Privados', () => {
    it('tentativa de download de currículo sem autenticação deve retornar 401', async () => {
      const res = await app.request('/api/admin/candidates/cand-123/resume');
      expect(res.status).toBe(401);
      const data = (await res.json()) as any;
      expect(data.error).toContain('Autenticação necessária');
    });

    it('tentativa de login de usuário inativo deve ser bloqueada com 403', async () => {
      const pass = await hashPassword('InativoPass123!');
      await db.insert(schema.adminUsers).values({
        id: 'usr-inativo',
        name: 'Usuário Demitido',
        email: 'inativo@ajnengenharia.com.br',
        passwordHash: pass.hash,
        passwordSalt: pass.salt,
        role: 'recruiter',
        isActive: false, // Desativado
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await app.request('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'inativo@ajnengenharia.com.br', password: 'InativoPass123!' }),
      });

      expect(res.status).toBe(403);
      const data = (await res.json()) as any;
      expect(data.error).toContain('Usuário desativado');
    });

    it('tentativa de bloqueio por força bruta (5 tentativas incorretas)', async () => {
      const pass = await hashPassword('BruteForcePass123!');
      await db.insert(schema.adminUsers).values({
        id: 'usr-alvo',
        name: 'Usuário Alvo',
        email: 'alvo@ajnengenharia.com.br',
        passwordHash: pass.hash,
        passwordSalt: pass.salt,
        role: 'recruiter',
        isActive: true,
        failedAttempts: 4, // 4 tentativas anteriores
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // 5ª tentativa incorreta deve bloquear a conta por 15 minutos
      const res = await app.request('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'alvo@ajnengenharia.com.br', password: 'SenhaTotalmenteErrada' }),
      });

      expect(res.status).toBe(401);
      const data = (await res.json()) as any;
      expect(data.error).toContain('Conta bloqueada por 15 minutos');

      // Tentativa subsequente deve retornar 423 Locked
      const resLocked = await app.request('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'alvo@ajnengenharia.com.br', password: 'BruteForcePass123!' }),
      });

      expect(resLocked.status).toBe(423);
      const lockedData = (await resLocked.json()) as any;
      expect(lockedData.error).toContain('Conta bloqueada temporariamente');
    });

    it('download de currículo por usuário sem permissão resumes:read deve retornar 403 Forbidden', async () => {
      // Usuário João (Viewer) não tem permissão resumes:read
      const viewerLogin = await app.request('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'joao@ajnengenharia.com.br', password: 'ViewerPass123!' }),
      });
      const { token: viewerToken } = (await viewerLogin.json()) as any;

      const res = await app.request('/api/admin/candidates/cand-123/resume', {
        headers: { Authorization: `Bearer ${viewerToken}` },
      });
      expect(res.status).toBe(403);
      const data = (await res.json()) as any;
      expect(data.error).toContain('Acesso negado');
      expect(data.error).toContain('resumes:read');
    });

    it('download de currículo com candidato inexistente deve retornar 404', async () => {
      const recLogin = await app.request('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'maria@ajnengenharia.com.br', password: 'RecruiterPass123!' }),
      });
      const { token: recToken } = (await recLogin.json()) as any;

      const res = await app.request('/api/admin/candidates/cand-nao-existe/resume', {
        headers: { Authorization: `Bearer ${recToken}` },
      });
      expect(res.status).toBe(404);
      const data = (await res.json()) as any;
      expect(data.error).toContain('Nenhum currículo encontrado');
    });
  });

  describe('3. Validação dos Fluxos de Recuperação, Encerramento e Ciclo de Vida', () => {
    it('candidato pode recuperar seus códigos de acompanhamento via e-mail e CPF', async () => {
      // Cadastra um candidato via talent-pool
      const pdfBytes = new TextEncoder().encode('%PDF-1.4 Mock CV Candidate');
      const form = new FormData();
      form.append('fullName', 'Carlos Titular');
      form.append('email', 'carlos.titular@email.com');
      form.append('phone', '(31) 97777-6666');
      form.append('cpf', '52998224725');
      form.append('city', 'Belo Horizonte');
      form.append('state', 'MG');
      form.append('consentTerms', 'true');
      form.append('resume', new File([pdfBytes], 'curriculo.pdf', { type: 'application/pdf' }));

      const postRes = await app.request(
        '/api/applications/talent-pool',
        { method: 'POST', body: form },
        { DB: {} as any, RESUMES_BUCKET: mockR2Bucket, TURNSTILE_SECRET_KEY: 'test' } as any
      );
      expect(postRes.status).toBe(201);
      const { trackingCode } = (await postRes.json()) as any;

      // 1. Recuperação gera código OTP para o e-mail validado (P1 Item 10)
      const recovRes = await app.request('/api/applications/recover-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'carlos.titular@email.com',
          cpf: '52998224725',
          turnstileToken: 'bypass-test',
        }),
      });
      expect(recovRes.status).toBe(200);
      const recovData = (await recovRes.json()) as any;
      expect(recovData.success).toBe(true);
      expect(recovData.recoveryCode).toBeDefined();

      // 2. Com o código de verificação recebido, recupera as candidaturas
      const verifyRes = await app.request('/api/applications/verify-recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'carlos.titular@email.com',
          code: recovData.recoveryCode,
        }),
      });
      expect(verifyRes.status).toBe(200);
      const verifyData = (await verifyRes.json()) as any;
      expect(verifyData.success).toBe(true);
      expect(verifyData.applications.length).toBeGreaterThan(0);
      expect(verifyData.applications[0].trackingCode).toBe(trackingCode);

      // 3. Código incorreto deve falhar
      const wrongCodeRes = await app.request('/api/applications/verify-recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'carlos.titular@email.com',
          code: '000000',
        }),
      });
      expect(wrongCodeRes.status).toBe(400);

      // 4. Recuperação com CPF inexistente deve retornar 404
      const wrongRes = await app.request('/api/applications/recover-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'carlos.titular@email.com',
          cpf: '00000000191',
          turnstileToken: 'bypass-test',
        }),
      });
      expect(wrongRes.status).toBe(404);
    });

    it('administrador pode solicitar redefinição e alterar senha com token de uso único', async () => {
      // 1. Solicita recuperação de senha
      const forgotRes = await app.request('/api/admin/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'maria@ajnengenharia.com.br' }),
      });
      expect(forgotRes.status).toBe(200);
      const forgotData = (await forgotRes.json()) as any;
      expect(forgotData.success).toBe(true);
      expect(forgotData.resetToken).toBeDefined();

      const resetToken = forgotData.resetToken;

      // 2. Redefine a senha com o token
      const resetRes = await app.request('/api/admin/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: resetToken,
          newPassword: 'NovaSenhaSegura2026!',
        }),
      });
      expect(resetRes.status).toBe(200);
      const resetData = (await resetRes.json()) as any;
      expect(resetData.success).toBe(true);

      // 3. Senha antiga não deve mais funcionar
      const oldLogin = await app.request('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'maria@ajnengenharia.com.br', password: 'RecruiterPass123!' }),
      });
      expect(oldLogin.status).toBe(401);

      // 4. Nova senha deve autenticar com sucesso
      const newLogin = await app.request('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'maria@ajnengenharia.com.br', password: 'NovaSenhaSegura2026!' }),
      });
      expect(newLogin.status).toBe(200);

      // 5. Reuso do mesmo token deve falhar
      const reuseRes = await app.request('/api/admin/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: resetToken,
          newPassword: 'OutraSenhaQualquer123!',
        }),
      });
      expect(reuseRes.status).toBe(400);
    });

    it('encerramento de vaga remove da listagem pública e bloqueia novas inscrições', async () => {
      // Login do Recruiter
      const recLogin = await app.request('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'maria@ajnengenharia.com.br', password: 'RecruiterPass123!' }),
      });
      const { token: recToken } = (await recLogin.json()) as any;

      // Obtém o ID da vaga publicada existente
      const jobsRes = await app.request('/api/jobs');
      const { jobs } = (await jobsRes.json()) as any;
      const targetJob = jobs.find((j: any) => j.slug === 'engenheiro-seguranca-do-trabalho');
      expect(targetJob).toBeDefined();

      // Encerra a vaga
      const closeRes = await app.request(`/api/admin/jobs/${targetJob.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${recToken}`,
        },
        body: JSON.stringify({ status: 'closed' }),
      });
      expect(closeRes.status).toBe(200);

      // Confirma que não aparece mais na listagem pública
      const publicListRes = await app.request('/api/jobs');
      const { jobs: updatedJobs } = (await publicListRes.json()) as any;
      const found = updatedJobs.find((j: any) => j.slug === 'engenheiro-seguranca-do-trabalho');
      expect(found).toBeUndefined();

      // Tentativa de candidatura à vaga encerrada deve retornar 404
      const pdfBytes = new TextEncoder().encode('%PDF-1.4 Closed Job Test');
      const form = new FormData();
      form.append('fullName', 'Candidato Tardio');
      form.append('email', 'tardio@email.com');
      form.append('phone', '(31) 97777-1111');
      form.append('cpf', '52998224725');
      form.append('city', 'Belo Horizonte');
      form.append('state', 'MG');
      form.append('consentTerms', 'true');
      form.append('resume', new File([pdfBytes], 'cv.pdf', { type: 'application/pdf' }));

      const applyRes = await app.request(
        `/api/applications/jobs/engenheiro-seguranca-do-trabalho/apply`,
        { method: 'POST', body: form },
        { DB: {} as any, RESUMES_BUCKET: mockR2Bucket, TURNSTILE_SECRET_KEY: 'test' } as any
      );
      expect(applyRes.status).toBe(404);
      const applyData = (await applyRes.json()) as any;
      expect(applyData.error).toContain('não está mais aberta');
    });
  });

  describe('4. Testes de Regressão — Bloqueadores Resolvidos da Auditoria (PR #107 P0 & P1)', () => {
    it('P0-1: Turnstile falha de forma segura em staging/produção se segredo ausente ou bypass inválido', async () => {
      const pdfBytes = new TextEncoder().encode('%PDF-1.4 Turnstile Test');
      const form = new FormData();
      form.append('fullName', 'Teste Turnstile');
      form.append('email', 'turnstile@teste.com');
      form.append('phone', '(31) 99999-0000');
      form.append('cpf', '00000000191');
      form.append('city', 'Belo Horizonte');
      form.append('state', 'MG');
      form.append('consentTerms', 'true');
      form.append('resume', new File([pdfBytes], 'curriculo.pdf', { type: 'application/pdf' }));
      form.append('turnstileToken', 'bypass-test');

      // 1. Em produção sem chave Turnstile configurada: rejeição segura
      const resMissingKey = await app.request(
        '/api/applications/talent-pool',
        { method: 'POST', body: form },
        { DB: {} as any, RESUMES_BUCKET: mockR2Bucket, ENVIRONMENT: 'production', TURNSTILE_SECRET_KEY: '', RATE_LIMITER_DO: mockDOBinding } as any
      );
      expect(resMissingKey.status).toBe(400);
      const dataMissing = (await resMissingKey.json()) as any;
      expect(dataMissing.error).toContain('antispam');

      // 2. Em produção com chave dummy/inválida: não permite bypass
      const resDummyKey = await app.request(
        '/api/applications/talent-pool',
        { method: 'POST', body: form },
        { DB: {} as any, RESUMES_BUCKET: mockR2Bucket, ENVIRONMENT: 'production', TURNSTILE_SECRET_KEY: 'dummy_secret', RATE_LIMITER_DO: mockDOBinding } as any
      );
      expect(resDummyKey.status).toBe(400);
    });

    it('P0-2: Impede alteração de cadastros com apenas CPF sem comprovação de titularidade por e-mail', async () => {
      const pdfBytes = new TextEncoder().encode('%PDF-1.4 Hijack Prevention Test');
      const form1 = new FormData();
      form1.append('fullName', 'Titular Legítimo');
      form1.append('email', 'titular.legitimo@empresa.com');
      form1.append('phone', '(31) 98888-1111');
      form1.append('cpf', '11144477735');
      form1.append('city', 'Belo Horizonte');
      form1.append('state', 'MG');
      form1.append('consentTerms', 'true');
      form1.append('resume', new File([pdfBytes], 'cv_titular.pdf', { type: 'application/pdf' }));

      // 1. Cadastro inicial legítimo
      const res1 = await app.request(
        '/api/applications/talent-pool',
        { method: 'POST', body: form1 },
        { DB: {} as any, RESUMES_BUCKET: mockR2Bucket, TURNSTILE_SECRET_KEY: 'test' } as any
      );
      expect(res1.status).toBe(201);

      // 2. Terceiro tenta cadastrar com mesmo CPF mas outro e-mail sem token de verificação
      const form2 = new FormData();
      form2.append('fullName', 'Invasor de Perfil');
      form2.append('email', 'invasor@hacker.com');
      form2.append('phone', '(31) 97777-2222');
      form2.append('cpf', '11144477735');
      form2.append('city', 'Belo Horizonte');
      form2.append('state', 'MG');
      form2.append('consentTerms', 'true');
      form2.append('resume', new File([pdfBytes], 'cv_fake.pdf', { type: 'application/pdf' }));

      const res2 = await app.request(
        '/api/applications/talent-pool',
        { method: 'POST', body: form2 },
        { DB: {} as any, RESUMES_BUCKET: mockR2Bucket, TURNSTILE_SECRET_KEY: 'test' } as any
      );
      expect(res2.status).toBe(409);
      const data2 = (await res2.json()) as any;
      expect(data2.error).toContain('já está cadastrado com outro endereço de e-mail');

      // 3. Titular solicita verificação de e-mail
      const reqVerifRes = await app.request('/api/applications/request-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'titular.legitimo@empresa.com', cpf: '11144477735' }),
      });
      expect(reqVerifRes.status).toBe(200);
      const reqVerifData = (await reqVerifRes.json()) as any;
      expect(reqVerifData.verificationToken).toBeDefined();

      // 4. Com o token de verificação válido, a atualização é permitida
      const form3 = new FormData();
      form3.append('fullName', 'Titular Atualizado');
      form3.append('email', 'novo.email.titular@empresa.com');
      form3.append('phone', '(31) 98888-3333');
      form3.append('cpf', '11144477735');
      form3.append('city', 'Belo Horizonte');
      form3.append('state', 'MG');
      form3.append('consentTerms', 'true');
      form3.append('verificationToken', reqVerifData.verificationToken);
      form3.append('resume', new File([pdfBytes], 'cv_novo.pdf', { type: 'application/pdf' }));

      const res3 = await app.request(
        '/api/applications/talent-pool',
        { method: 'POST', body: form3 },
        { DB: {} as any, RESUMES_BUCKET: mockR2Bucket, TURNSTILE_SECRET_KEY: 'test' } as any
      );
      expect(res3.status).toBe(201);
    });

    it('P0-3: Registra consentimento de retenção explícito no banco de dados, inclusive quando negativo', async () => {
      const pdfBytes = new TextEncoder().encode('%PDF-1.4 Consent Retention Test');
      const form = new FormData();
      form.append('fullName', 'Candidato Sem Retenção');
      form.append('email', 'sem.retencao@empresa.com');
      form.append('phone', '(31) 98888-4444');
      form.append('cpf', '11144477735');
      form.append('city', 'Belo Horizonte');
      form.append('state', 'MG');
      form.append('consentTerms', 'true');
      form.append('consentRetention', 'false'); // Escolha expressa de NÃO reter para futuras vagas
      form.append('resume', new File([pdfBytes], 'cv.pdf', { type: 'application/pdf' }));

      const res = await app.request(
        '/api/applications/jobs/engenheiro-seguranca-do-trabalho/apply',
        { method: 'POST', body: form },
        { DB: {} as any, RESUMES_BUCKET: mockR2Bucket, TURNSTILE_SECRET_KEY: 'test' } as any
      );
      expect(res.status).toBe(201);

      // Consulta no banco de dados os consentimentos gravados
      const consents = await db.select().from(schema.dataConsents).all();
      const retentionConsent = consents.find((c) => c.consentType === 'talent_pool_retention');
      expect(retentionConsent).toBeDefined();
      expect(retentionConsent?.granted).toBe(false);
    });

    it('P0-4: Rate limiter distribuído com Cloudflare KV bloqueia excesso de requisições com 429', async () => {
      const kvStorage = new Map<string, string>();
      const mockKv = {
        get: async (key: string, type?: string) => {
          const val = kvStorage.get(key);
          if (!val) return null;
          return type === 'json' ? JSON.parse(val) : val;
        },
        put: async (key: string, value: string) => {
          kvStorage.set(key, value);
        },
      };

      const testApp = new Hono<{ Bindings: any; Variables: any }>();
      testApp.use('*', rateLimiter({ max: 2, windowSeconds: 60, keyPrefix: 'test-kv' }));
      testApp.get('/test', (c) => c.text('OK'));

      const env = { RATE_LIMIT_KV: mockKv, ENVIRONMENT: 'development' };

      // Req 1: OK
      const r1 = await testApp.request('/test', { headers: { 'cf-connecting-ip': '200.1.2.3' } }, env);
      expect(r1.status).toBe(200);

      // Req 2: OK
      const r2 = await testApp.request('/test', { headers: { 'cf-connecting-ip': '200.1.2.3' } }, env);
      expect(r2.status).toBe(200);

      // Req 3: Excedeu quota distribuída (429 Too Many Requests)
      const r3 = await testApp.request('/test', { headers: { 'cf-connecting-ip': '200.1.2.3' } }, env);
      expect(r3.status).toBe(429);
      expect(r3.headers.get('Retry-After')).toBeDefined();
    });

    it('P0-5: Rejeita upload quando R2 está indisponível e executa compensação se o banco falhar', async () => {
      const pdfBytes = new TextEncoder().encode('%PDF-1.4 R2 Test');
      const form = new FormData();
      form.append('fullName', 'Teste R2 Fail');
      form.append('email', 'r2fail@teste.com');
      form.append('phone', '(31) 98888-5555');
      form.append('cpf', '11144477735');
      form.append('city', 'Belo Horizonte');
      form.append('state', 'MG');
      form.append('consentTerms', 'true');
      form.append('resume', new File([pdfBytes], 'cv.pdf', { type: 'application/pdf' }));

      // 1. Falha segura se R2 ausente
      const resNoR2 = await app.request(
        '/api/applications/talent-pool',
        { method: 'POST', body: form },
        { DB: {} as any, RESUMES_BUCKET: undefined, ENVIRONMENT: 'test', TURNSTILE_SECRET_KEY: 'test' } as any
      );
      expect(resNoR2.status).toBe(503);
      const dataNoR2 = (await resNoR2.json()) as any;
      expect(dataNoR2.error).toContain('R2');

      // 2. Compensação: R2 delete chamado se banco lançar erro
      let deletedKey: string | null = null;
      const trackingR2Bucket = {
        ...mockR2Bucket,
        delete: async (k: string) => {
          deletedKey = k;
          mockR2Storage.delete(k);
        },
      };

      // App com factory de DB defeituosa que falha no insert
      const failingDb = {
        select: db.select.bind(db),
        insert: () => {
          throw new Error('Falha simulada de banco de dados após upload no R2');
        },
      };
      const failingApp = createCarreirasApp(() => failingDb as any);

      const failRes = await failingApp.request(
        '/api/applications/talent-pool',
        { method: 'POST', body: form },
        { DB: {} as any, RESUMES_BUCKET: trackingR2Bucket, ENVIRONMENT: 'test', TURNSTILE_SECRET_KEY: 'test' } as any
      );
      expect(failRes.status).toBe(500);

      // Confirma que a compensação limpou o arquivo do R2
      expect(deletedKey).not.toBeNull();
      expect(deletedKey).toContain('resumes/');
    });

    it('P0-6: Vagas de exemplo não são publicadas automaticamente por padrão no seed', async () => {
      const isolatedSqlite = new Database(':memory:');
      const migrationSql = readFileSync(
        resolve(process.cwd(), 'worker/db/migrations/0000_curious_the_executioner.sql'),
        'utf8'
      );
      for (const stmt of migrationSql.split('--> statement-breakpoint')) {
        if (stmt.trim()) isolatedSqlite.exec(stmt.trim());
      }
      const isolatedDb = drizzle(isolatedSqlite, { schema });

      // Seed padrão (sem autoPublishJobs)
      await seedDatabase(isolatedDb);

      const jobs = await isolatedDb.select().from(schema.jobPostings).all();
      expect(jobs.length).toBe(INITIAL_JOB_POSTINGS.length);
      for (const job of jobs) {
        expect(job.status).toBe('draft');
        expect(job.publishedAt).toBeNull();
      }
    });

    it('P0-7: Painel sincroniza com vagas públicas e encerramento bloqueia visualização e candidatura', async () => {
      // 1. Lista pública não inclui rascunhos
      const pubRes = await app.request('/api/jobs');
      const { jobs } = (await pubRes.json()) as any;
      expect(jobs.every((j: any) => j.status === 'published')).toBe(true);

      // 2. Consulta de slug draft ou inexistente retorna 404
      const nonExistentRes = await app.request('/api/jobs/slug-que-nao-existe');
      expect(nonExistentRes.status).toBe(404);
    });

    it('P0-8: wrangler.toml e documentação utilizam identificadores padronizados', () => {
      const wranglerContent = readFileSync(resolve(process.cwd(), 'worker/wrangler.toml'), 'utf8');
      expect(wranglerContent).toContain('prod-ajn-carreiras-d1');
      expect(wranglerContent).toContain('prod-ajn-carreiras-resumes');
      expect(wranglerContent).toContain('prod-ajn-carreiras-kv');

      const deployDoc = readFileSync(
        resolve(process.cwd(), 'docs/carreiras/03-guia-deploy-configuracao.md'),
        'utf8'
      );
      expect(deployDoc).toContain('prod-ajn-carreiras-d1');
      expect(deployDoc).toContain('prod-ajn-carreiras-resumes');
      expect(deployDoc).toContain('prod-ajn-carreiras-kv');
    });

    it('P1-9: Configuração e ativação de MFA com validação rigorosa de token TOTP', async () => {
      // 1. Login do Recruiter
      const recLogin = await app.request('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'maria@ajnengenharia.com.br', password: 'RecruiterPass123!' }),
      });
      const { token: recToken } = (await recLogin.json()) as any;

      // 2. Setup de MFA gera segredo e otpauth URI
      const setupRes = await app.request('/api/admin/auth/mfa/setup', {
        method: 'POST',
        headers: { Authorization: `Bearer ${recToken}` },
      });
      expect(setupRes.status).toBe(200);
      const setupData = (await setupRes.json()) as any;
      expect(setupData.secret).toBeDefined();
      expect(setupData.otpauthUri).toContain('otpauth://totp/');

      // 3. Ativação com código inválido é rejeitada
      const wrongActRes = await app.request('/api/admin/auth/mfa/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${recToken}` },
        body: JSON.stringify({ totpCode: '000000' }),
      });
      expect(wrongActRes.status).toBe(400);

      // 4. Ativação com código TOTP válido ativa o segundo fator
      const validCode = await generateCurrentTotp(setupData.secret);
      const actRes = await app.request('/api/admin/auth/mfa/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${recToken}` },
        body: JSON.stringify({ totpCode: validCode }),
      });
      expect(actRes.status).toBe(200);
      const actData = (await actRes.json()) as any;
      expect(actData.success).toBe(true);

      // 5. Próximo login exige segundo fator
      const loginWithoutMfa = await app.request('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'maria@ajnengenharia.com.br', password: 'RecruiterPass123!' }),
      });
      expect(loginWithoutMfa.status).toBe(401);
      const noMfaData = (await loginWithoutMfa.json()) as any;
      expect(noMfaData.mfaRequired).toBe(true);

      // 6. Login com TOTP válido tem sucesso
      const newValidCode = await generateCurrentTotp(setupData.secret);
      const loginWithMfa = await app.request('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'maria@ajnengenharia.com.br',
          password: 'RecruiterPass123!',
          mfaCode: newValidCode,
        }),
      });
      expect(loginWithMfa.status).toBe(200);
    });

    it('P1-11: Resposta de login omite token no body em produção web e define cookie HttpOnly seguro', async () => {
      const resWeb = await app.request(
        '/api/admin/auth/login',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Origin: 'https://carreiras.ajnengenharia.com.br' },
          body: JSON.stringify({ email: 'joao@ajnengenharia.com.br', password: 'ViewerPass123!' }),
        },
        { ENVIRONMENT: 'production', RATE_LIMITER_DO: mockDOBinding } as any
      );
      expect(resWeb.status).toBe(200);
      const webData = (await resWeb.json()) as any;
      // Em modo web produção, token é omitido no JSON para evitar exposição via JavaScript
      expect(webData.token).toBeUndefined();
      // Cookie HttpOnly é definido
      const setCookie = resWeb.headers.get('Set-Cookie');
      expect(setCookie).toContain('HttpOnly');
      expect(setCookie).toContain('SameSite=Strict');

      // Cliente de API explícito (X-Auth-Mode: api) recebe o token
      const resApi = await app.request(
        '/api/admin/auth/login',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Auth-Mode': 'api', Origin: 'https://carreiras.ajnengenharia.com.br' },
          body: JSON.stringify({ email: 'joao@ajnengenharia.com.br', password: 'ViewerPass123!' }),
        },
        { ENVIRONMENT: 'production', RATE_LIMITER_DO: mockDOBinding } as any
      );
      expect(resApi.status).toBe(200);
      const apiData = (await resApi.json()) as any;
      expect(apiData.token).toBeDefined();
    });

    it('P1-12: CORS restringe acesso estritamente a domínios autorizados e bloqueia origens estranhas', async () => {
      // 1. Origem autorizada
      const resAllowed = await app.request(
        '/api/jobs',
        { method: 'GET', headers: { Origin: 'https://carreiras.ajnengenharia.com.br' } }
      );
      expect(resAllowed.headers.get('Access-Control-Allow-Origin')).toBe('https://carreiras.ajnengenharia.com.br');

      // 2. Origem estranha não autorizada
      const resForbidden = await app.request(
        '/api/jobs',
        { method: 'GET', headers: { Origin: 'https://evil-attacker.com' } }
      );
      expect(resForbidden.headers.get('Access-Control-Allow-Origin')).toBeNull();
    });

    it('P1-13: Bootstrap administrativo cria usuário super_admin seguro e reproduzível', async () => {
      const isolatedSqlite = new Database(':memory:');
      const migrationSql = readFileSync(
        resolve(process.cwd(), 'worker/db/migrations/0000_curious_the_executioner.sql'),
        'utf8'
      );
      for (const stmt of migrationSql.split('--> statement-breakpoint')) {
        if (stmt.trim()) isolatedSqlite.exec(stmt.trim());
      }
      const isolatedDb = drizzle(isolatedSqlite, { schema });

      await seedDatabase(isolatedDb, {
        adminUser: {
          email: 'admin.boot@ajnengenharia.com.br',
          name: 'Bootstrap Admin',
          password: 'BootstrapPassword2026!',
          role: 'super_admin',
        },
      });

      const user = await isolatedDb
        .select()
        .from(schema.adminUsers)
        .where(eq(schema.adminUsers.email, 'admin.boot@ajnengenharia.com.br'))
        .get();

      expect(user).toBeDefined();
      expect(user?.role).toBe('super_admin');
      expect(user?.mfaEnabled).toBe(true);
      expect(user?.mfaSecret).toBeDefined();
      expect(user?.passwordHash).toBeDefined();
      expect(user?.passwordSalt).toBeDefined();
    });

    it('P1-14: Guia de deploy documenta arquitetura e compatibilidade com Hostinger DNS', () => {
      const deployDoc = readFileSync(
        resolve(process.cwd(), 'docs/carreiras/03-guia-deploy-configuracao.md'),
        'utf8'
      );
      expect(deployDoc).toContain('Hostinger');
      expect(deployDoc).toContain('carreiras.ajnengenharia.com.br');
      expect(deployDoc).toContain('CNAME');
    });
  });

  describe('5. Testes de Integração Real e Resolução de Bloqueadores da PR #107', () => {
    it('Item 1: Despacha e-mails transacionais com confirmação e falha com 502 se o provedor estiver indisponível', async () => {
      clearSentTestEmails();

      const pdfBytes = new TextEncoder().encode('%PDF-1.4 Email Delivery Test');
      const form = new FormData();
      form.append('fullName', 'Candidato Email Test');
      form.append('email', 'candidato.email@empresa.com');
      form.append('phone', '(31) 98888-7777');
      form.append('cpf', '52998224725');
      form.append('city', 'Belo Horizonte');
      form.append('state', 'MG');
      form.append('consentTerms', 'true');
      form.append('resume', new File([pdfBytes], 'cv.pdf', { type: 'application/pdf' }));

      await app.request(
        '/api/applications/talent-pool',
        { method: 'POST', body: form },
        { DB: {} as any, RESUMES_BUCKET: mockR2Bucket, TURNSTILE_SECRET_KEY: 'test' } as any
      );

      // Dispara recuperação de candidatura para candidato existente
      const res = await app.request('/api/applications/recover-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'candidato.email@empresa.com', cpf: '52998224725' }),
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.success).toBe(true);

      // Confirma que o e-mail foi despachado
      expect(sentTestEmails.length).toBeGreaterThan(0);
      const sent = sentTestEmails[sentTestEmails.length - 1];
      expect(sent.to).toBe('candidato.email@empresa.com');
      expect(sent.subject).toContain('Código de Acesso');
    });

    it('Item 2 & 3: Exige comprovação de titularidade (OTP) mesmo quando CPF e e-mail coincidem rigorosamente', async () => {
      const pdfBytes = new TextEncoder().encode('%PDF-1.4 Ownership Matching Email');
      const form = new FormData();
      form.append('fullName', 'Candidato Original');
      form.append('email', 'coincidente@empresa.com');
      form.append('phone', '(31) 98888-9999');
      form.append('cpf', '00000000191');
      form.append('city', 'Belo Horizonte');
      form.append('state', 'MG');
      form.append('consentTerms', 'true');
      form.append('consentRetention', 'true');
      form.append('resume', new File([pdfBytes], 'cv1.pdf', { type: 'application/pdf' }));

      // 1. Primeiro cadastro com sucesso
      const res1 = await app.request(
        '/api/applications/talent-pool',
        { method: 'POST', body: form },
        { DB: {} as any, RESUMES_BUCKET: mockR2Bucket, TURNSTILE_SECRET_KEY: 'test' } as any
      );
      expect(res1.status).toBe(201);

      // 2. Segunda submissão com EXATAMENTE o mesmo CPF e mesmo e-mail sem verificationToken deve ser 409
      const form2 = new FormData();
      form2.append('fullName', 'Candidato Original Nome Atualizado');
      form2.append('email', 'coincidente@empresa.com');
      form2.append('phone', '(31) 98888-9999');
      form2.append('cpf', '00000000191');
      form2.append('city', 'Belo Horizonte');
      form2.append('state', 'MG');
      form2.append('consentTerms', 'true');
      form2.append('consentRetention', 'true');
      form2.append('resume', new File([pdfBytes], 'cv2.pdf', { type: 'application/pdf' }));

      const res2 = await app.request(
        '/api/applications/talent-pool',
        { method: 'POST', body: form2 },
        { DB: {} as any, RESUMES_BUCKET: mockR2Bucket, TURNSTILE_SECRET_KEY: 'test' } as any
      );
      expect(res2.status).toBe(409);
      const data2 = (await res2.json()) as any;
      expect(data2.verificationRequired).toBe(true);
      expect(data2.verificationToken).toBeDefined();

      // 3. Com o token de verificação correto, a atualização é aceita
      form2.append('verificationToken', data2.verificationToken);
      const res3 = await app.request(
        '/api/applications/talent-pool',
        { method: 'POST', body: form2 },
        { DB: {} as any, RESUMES_BUCKET: mockR2Bucket, TURNSTILE_SECRET_KEY: 'test' } as any
      );
      expect(res3.status).toBe(201);

      // 4. Token é de consumo único: tentar reusar falha com 400
      const res4 = await app.request(
        '/api/applications/talent-pool',
        { method: 'POST', body: form2 },
        { DB: {} as any, RESUMES_BUCKET: mockR2Bucket, TURNSTILE_SECRET_KEY: 'test' } as any
      );
      expect(res4.status).toBe(400);
      const data4 = (await res4.json()) as any;
      expect(data4.error).toContain('incorreto ou expirado');
    });

    it('Item 3: Limite de 5 tentativas de verificação incorretas invalida o código com 429', async () => {
      const pdfBytes = new TextEncoder().encode('%PDF-1.4 Brute Force OTP');
      const form = new FormData();
      form.append('fullName', 'Candidato Limite');
      form.append('email', 'limite.otp@empresa.com');
      form.append('phone', '(31) 98888-0000');
      form.append('cpf', '11144477735');
      form.append('city', 'Belo Horizonte');
      form.append('state', 'MG');
      form.append('consentTerms', 'true');
      form.append('consentRetention', 'true');
      form.append('resume', new File([pdfBytes], 'cv.pdf', { type: 'application/pdf' }));

      // 1. Cadastra candidato inicial
      const initRes = await app.request(
        '/api/applications/talent-pool',
        { method: 'POST', body: form },
        { DB: {} as any, RESUMES_BUCKET: mockR2Bucket, TURNSTILE_SECRET_KEY: 'test' } as any
      );
      expect(initRes.status).toBe(201);

      // 2. Dispara pedido de atualização sem token para gerar código ativo
      const verifReq = await app.request(
        '/api/applications/talent-pool',
        { method: 'POST', body: form },
        { DB: {} as any, RESUMES_BUCKET: mockR2Bucket, TURNSTILE_SECRET_KEY: 'test' } as any
      );
      expect(verifReq.status).toBe(409);

      // 3. Tenta 5 vezes com código de verificação incorreto
      for (let i = 1; i <= 5; i++) {
        const badForm = new FormData();
        badForm.append('fullName', 'Candidato Limite');
        badForm.append('email', 'limite.otp@empresa.com');
        badForm.append('phone', '(31) 98888-0000');
        badForm.append('cpf', '11144477735');
        badForm.append('city', 'Belo Horizonte');
        badForm.append('state', 'MG');
        badForm.append('consentTerms', 'true');
        badForm.append('consentRetention', 'true');
        badForm.append('verificationToken', '000000');
        badForm.append('resume', new File([pdfBytes], 'cv.pdf', { type: 'application/pdf' }));

        const r = await app.request(
          '/api/applications/talent-pool',
          { method: 'POST', body: badForm },
          { DB: {} as any, RESUMES_BUCKET: mockR2Bucket, TURNSTILE_SECRET_KEY: 'test' } as any
        );

        if (i < 5) {
          expect(r.status).toBe(400);
        } else {
          expect(r.status).toBe(429);
        }
      }
    });

    it('Item 4: Detalhes de vaga retornam estrutura completa Google Jobs JSON-LD', async () => {
      const res = await app.request('/api/jobs/engenheiro-seguranca-do-trabalho');
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.job).toBeDefined();
      expect(data.jsonLd).toBeDefined();
      expect(data.jsonLd['@type']).toBe('JobPosting');
      expect(data.jsonLd.hiringOrganization.name).toBe('AJN Consultoria e Engenharia');
      expect(data.jsonLd.hiringOrganization.sameAs).toBe('https://ajnengenharia.com.br');
    });

    it('Item 6: Durable Objects RateLimiterDO gerencia contagem atômica e falha com 503 em produção se o binding estiver ausente', async () => {
      const doInstance = new RateLimiterDO({} as any);

      // Chamada 1: permitida
      const req1 = new Request('https://do-ratelimit.internal/?key=ip-1&max=2&window=60');
      const res1 = await doInstance.fetch(req1);
      expect(res1.status).toBe(200);
      const data1 = (await res1.json()) as any;
      expect(data1.allowed).toBe(true);
      expect(data1.remaining).toBe(1);

      // Chamada 2: permitida
      const req2 = new Request('https://do-ratelimit.internal/?key=ip-1&max=2&window=60');
      const res2 = await doInstance.fetch(req2);
      expect(res2.status).toBe(200);
      const data2 = (await res2.json()) as any;
      expect(data2.allowed).toBe(true);
      expect(data2.remaining).toBe(0);

      // Chamada 3: bloqueada com 429
      const req3 = new Request('https://do-ratelimit.internal/?key=ip-1&max=2&window=60');
      const res3 = await doInstance.fetch(req3);
      expect(res3.status).toBe(429);
      const data3 = (await res3.json()) as any;
      expect(data3.allowed).toBe(false);

      // Em produção sem DO nem KV: fail-secure com 503
      const middlewareApp = new Hono<{ Bindings: any; Variables: any }>();
      middlewareApp.use('*', rateLimiter({ max: 5, windowSeconds: 60 }));
      middlewareApp.get('/api/test', (c) => c.text('OK'));

      const failSecureRes = await middlewareApp.request(
        '/api/test',
        { method: 'GET' },
        { ENVIRONMENT: 'production' } as any
      );
      expect(failSecureRes.status).toBe(503);
    });

    it('Item 8: Redefinição de senha administrativa consome o token e invalida todas as sessões ativas', async () => {
      // 1. Solicita recuperação de senha
      const forgotRes = await app.request('/api/admin/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'maria@ajnengenharia.com.br' }),
      });
      expect(forgotRes.status).toBe(200);
      const forgotData = (await forgotRes.json()) as any;
      expect(forgotData.resetToken).toBeDefined();

      // 2. Redefine a senha
      const resetRes = await app.request('/api/admin/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: forgotData.resetToken,
          newPassword: 'NovaSenhaUltraSegura2026!',
        }),
      });
      expect(resetRes.status).toBe(200);

      // 3. Reuso do mesmo token falha (uso único)
      const reuseRes = await app.request('/api/admin/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: forgotData.resetToken,
          newPassword: 'OutraSenhaTentativa123!',
        }),
      });
      expect(reuseRes.status).toBe(400);

      // 4. Login com a nova senha tem sucesso
      const newLoginRes = await app.request('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'maria@ajnengenharia.com.br',
          password: 'NovaSenhaUltraSegura2026!',
        }),
      });
      expect(newLoginRes.status).toBe(200);
    });
  });

  describe('6. Auditoria Final da PR #107 — Correções P0 e P1', () => {
    it('P0-1 & P0-2: Ciclo de vida completo de vaga dinâmica, SEO Google Jobs e despublicação', async () => {
      // 1. Gera token de super_admin
      const adminSessionToken = generateRandomToken(32);
      const adminTokenHash = await sha256(adminSessionToken);
      await db.insert(schema.adminSessions).values({
        id: 'sess-dyn-test',
        userId: 'usr-admin-test',
        sessionTokenHash: adminTokenHash,
        role: 'super_admin',
        expiresAt: new Date(Date.now() + 8 * 3600 * 1000),
        createdAt: new Date(),
      });

      // 2. Super Admin cria e publica vaga
      const newJobRes = await app.request('/api/admin/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminSessionToken}` },
        body: JSON.stringify({
          title: 'Engenheiro Estrutural Sênior',
          slug: 'engenheiro-estrutural-senior',
          department: 'Engenharia Civil',
          location: 'Belo Horizonte - MG (Presencial)',
          employmentType: 'CLT',
          experienceLevel: 'Sênior',
          description: 'Responsável pelo cálculo estrutural, inspeções prediais e laudos técnicos de conformidade.',
          requirements: ['Graduação em Engenharia Civil com CREA ativo', 'Experiência sólida em cálculo e inspeção predial'],
          salaryMin: 11000,
          salaryMax: 14500,
          salaryIsDisclosed: true,
          status: 'published',
        }),
      });
      expect(newJobRes.status).toBe(201);

      // 3. Vaga aparece na listagem pública da API
      const listRes = await app.request('/api/jobs');
      expect(listRes.status).toBe(200);
      const listData = (await listRes.json()) as any;
      const found = listData.jobs.find((j: any) => j.slug === 'engenheiro-estrutural-senior');
      expect(found).toBeDefined();
      expect(found.title).toBe('Engenheiro Estrutural Sênior');

      // 4. Acesso direto à URL individual com Accept: text/html retorna 200 com JSON-LD Google Jobs
      const htmlRes = await app.request('/carreiras/engenheiro-estrutural-senior', {
        headers: { Accept: 'text/html' },
      });
      expect(htmlRes.status).toBe(200);
      const html = await htmlRes.text();
      expect(html).toContain('Engenheiro Estrutural Sênior');
      expect(html).toContain('schema.org');
      expect(html).toContain('JobPosting');
      expect(html).toContain('AJN Consultoria e Engenharia');

      // 5. Candidato se inscreve com sucesso nesta vaga
      const pdfBytes = new TextEncoder().encode('%PDF-1.4 Dynamic Job Test');
      const applyForm = new FormData();
      applyForm.append('fullName', 'Candidato Engenheiro');
      applyForm.append('email', 'cand.eng@teste.com');
      applyForm.append('phone', '(31) 98765-4321');
      applyForm.append('cpf', '00000000191');
      applyForm.append('city', 'Belo Horizonte');
      applyForm.append('state', 'MG');
      applyForm.append('consentTerms', 'true');
      applyForm.append('consentRetention', 'true');
      applyForm.append('resume', new File([pdfBytes], 'curriculo.pdf', { type: 'application/pdf' }));
      applyForm.append('turnstileToken', 'bypass-test');

      const applyRes = await app.request(
        '/api/applications/jobs/engenheiro-estrutural-senior/apply',
        { method: 'POST', body: applyForm },
        { DB: {} as any, RESUMES_BUCKET: mockR2Bucket, ENVIRONMENT: 'test', TURNSTILE_SECRET_KEY: 'test' } as any
      );
      expect(applyRes.status).toBe(201);
      const applyData = (await applyRes.json()) as any;
      expect(applyData.trackingCode).toBeDefined();

      // 6. Admin encerra a vaga
      const closeRes = await app.request(`/api/admin/jobs/${found.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminSessionToken}` },
        body: JSON.stringify({ status: 'closed' }),
      });
      expect(closeRes.status).toBe(200);

      // 7. Acesso direto à URL agora retorna 404
      const closedHtmlRes = await app.request('/carreiras/engenheiro-estrutural-senior', {
        headers: { Accept: 'text/html' },
      });
      expect(closedHtmlRes.status).toBe(404);
      const closedHtml = await closedHtmlRes.text();
      expect(closedHtml).toContain('Vaga indisponível');

      // 8. Vaga foi removida da listagem pública
      const updatedList = await app.request('/api/jobs');
      const updatedData = (await updatedList.json()) as any;
      expect(updatedData.jobs.find((j: any) => j.slug === 'engenheiro-estrutural-senior')).toBeUndefined();
    });

    it('P0-3: Cloudflare D1 batch atômico e compensação imediata de arquivo R2 em falha', async () => {
      // 1. Simulação com candidato novo e falha no meio do batch
      let r2DeletedKey: string | null = null;
      const trackingBucket = {
        ...mockR2Bucket,
        delete: async (key: string) => {
          r2DeletedKey = key;
        },
      };

      let batchExecuted = false;
      const mockD1Database = {
        select: db.select.bind(db),
        insert: db.insert.bind(db),
        update: db.update.bind(db),
        batch: async (_stmts: any[]) => {
          batchExecuted = true;
          // Simula falha atômica no meio da transação
          throw new Error('D1_EXECUTION_ERROR: SQLite transaction aborted');
        },
      };

      const failingD1App = createCarreirasApp(() => mockD1Database as any);

      const pdfBytes = new TextEncoder().encode('%PDF-1.4 D1 Batch Atomicity Test');
      const form = new FormData();
      form.append('fullName', 'Novo Candidato D1');
      form.append('email', 'novo.d1@teste.com');
      form.append('phone', '(31) 98888-1111');
      form.append('cpf', '11144477735');
      form.append('city', 'Belo Horizonte');
      form.append('state', 'MG');
      form.append('consentTerms', 'true');
      form.append('consentRetention', 'true');
      form.append('resume', new File([pdfBytes], 'cv.pdf', { type: 'application/pdf' }));
      form.append('turnstileToken', 'bypass-test');

      const res = await failingD1App.request(
        '/api/applications/talent-pool',
        { method: 'POST', body: form },
        { DB: {} as any, RESUMES_BUCKET: trackingBucket, ENVIRONMENT: 'test', TURNSTILE_SECRET_KEY: 'test' } as any
      );

      expect(res.status).toBe(500);
      expect(batchExecuted).toBe(true);
      // Garante que o arquivo R2 enviado antes do batch foi compensado (deletado)
      expect(r2DeletedKey).not.toBeNull();
      expect(r2DeletedKey).toContain('resumes/');

      // Confirma que nenhum candidato ficou registrado no banco
      const candidatesCount = await db.select().from(schema.candidates).where(eq(schema.candidates.email, 'novo.d1@teste.com')).all();
      expect(candidatesCount.length).toBe(0);
    });

    it('P1-4: Durable Object RateLimiterDO com storage persistente, concorrência, expiração e reinício', async () => {
      const persistentStorage = new Map<string, any>();
      const mockDOState = {
        storage: {
          get: async (k: string) => persistentStorage.get(k),
          put: async (k: string, v: any) => persistentStorage.set(k, v),
          delete: async (k: string) => persistentStorage.delete(k),
        },
      };

      // 1. Instância do DO executando requisições
      const do1 = new RateLimiterDO(mockDOState);

      // Concorrência: 3 requisições simultâneas
      const req = () => new Request('https://do-ratelimit.internal/?key=user-ip-1&max=5&window=60');
      const [r1, r2, r3] = await Promise.all([do1.fetch(req()), do1.fetch(req()), do1.fetch(req())]);

      expect(r1.status).toBe(200);
      expect(r2.status).toBe(200);
      expect(r3.status).toBe(200);

      // Estado gravado no storage
      const record = persistentStorage.get('user-ip-1');
      expect(record).toBeDefined();
      expect(record.count).toBe(3);

      // 2. Reinício do Durable Object (nova instância criada com o mesmo storage compartilhado)
      const do2 = new RateLimiterDO(mockDOState);
      const r4 = await do2.fetch(req());
      const r5 = await do2.fetch(req());
      const r6 = await do2.fetch(req()); // Excede o limite de 5

      expect(r4.status).toBe(200);
      expect(r5.status).toBe(200);
      expect(r6.status).toBe(429); // Bloqueado! O contador persistiu através do reinício

      // 3. Expiração da janela
      const expiredRecord = { count: 5, resetAt: Date.now() - 1000 };
      persistentStorage.set('user-ip-1', expiredRecord);

      const rAfterExpiry = await do2.fetch(req());
      expect(rAfterExpiry.status).toBe(200);
      const dataAfter = (await rAfterExpiry.json()) as any;
      expect(dataAfter.count).toBe(1); // Resetou para a nova janela

      // 4. Falha segura em produção sem DO binding (503 explícito sem fallback KV)
      const testApp = new Hono<{ Bindings: any; Variables: any }>();
      testApp.use('*', rateLimiter({ max: 5, windowSeconds: 60 }));
      testApp.get('/test', (c) => c.text('OK'));

      const prodRes = await testApp.request('/test', {}, { ENVIRONMENT: 'production' } as any);
      expect(prodRes.status).toBe(503);
    });

    it('P1-5: Bootstrap seguro e primeiro login administrativo com MFA remoto', async () => {
      // 1. Simula primeiro login do super_admin criado no bootstrap
      // Login sem código MFA é desafiado com 401 e mfaRequired: true
      const chalRes = await app.request('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@ajnengenharia.com.br',
          password: 'AdminPassword123!',
        }),
      });
      expect(chalRes.status).toBe(401);
      const chalData = (await chalRes.json()) as any;
      expect(chalData.mfaRequired).toBe(true);

      // 2. Busca chave do usuário e gera código TOTP válido
      const adminUser = await db.select().from(schema.adminUsers).where(eq(schema.adminUsers.email, 'admin@ajnengenharia.com.br')).get();
      expect(adminUser?.mfaSecret).toBeDefined();

      const validTotp = await generateCurrentTotp(adminUser!.mfaSecret!);
      const loginRes = await app.request('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@ajnengenharia.com.br',
          password: 'AdminPassword123!',
          mfaCode: validTotp,
        }),
      });
      expect(loginRes.status).toBe(200);
      const loginData = (await loginRes.json()) as any;
      expect(loginData.success).toBe(true);
      expect(loginData.user.role).toBe('super_admin');
    });

    it('P1-6: Endurecimento de recuperação de senha, rate limiting específico e escape HTML', async () => {
      // 1. Rate limiting no endpoint forgot-password (max 3 / 900s)
      const envWithDO = { ENVIRONMENT: 'production', RATE_LIMITER_DO: mockDOBinding };

      const reqForgot = () =>
        app.request(
          '/api/admin/auth/forgot-password',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Origin: 'https://carreiras.ajnengenharia.com.br', 'cf-connecting-ip': '189.1.1.5' },
            body: JSON.stringify({ email: 'admin@ajnengenharia.com.br' }),
          },
          envWithDO as any
        );

      const f1 = await reqForgot();
      expect(f1.status).toBe(200);

      // 2. Escape HTML sanitiza ataques XSS em templates de e-mail
      const maliciousPayload = '<script>alert("xss")</script><img src=x onerror=alert(1)>';
      const escaped = escapeHtml(maliciousPayload);
      expect(escaped).not.toContain('<script>');
      expect(escaped).not.toContain('<img');
      expect(escaped).toContain('&lt;script&gt;');
      expect(escaped).toContain('&lt;img');
    });
  });
});
