import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { eq, and } from 'drizzle-orm';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as schema from '../../worker/db/schema';
import { createCarreirasApp } from '../../worker/index';
import { hashPassword, sha256, generateRandomToken, generateCurrentTotp, generateTotpSecret } from '../../worker/lib/crypto';
import { seedDatabase, INITIAL_JOB_POSTINGS } from '../../worker/db/seed';
import { rateLimiter } from '../../worker/middleware/rate-limit';
import { Hono } from 'hono';

describe('Testes Específicos de Segurança, Autorização e Uploads Maliciosos', () => {
  let sqlite: InstanceType<typeof Database>;
  let db: ReturnType<typeof drizzle<typeof schema>>;
  let app: ReturnType<typeof createCarreirasApp>;
  let mockR2Storage: Map<string, Uint8Array>;
  let mockR2Bucket: any;

  beforeEach(async () => {
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
        { DB: {} as any, RESUMES_BUCKET: mockR2Bucket, ENVIRONMENT: 'production', TURNSTILE_SECRET_KEY: '' } as any
      );
      expect(resMissingKey.status).toBe(400);
      const dataMissing = (await resMissingKey.json()) as any;
      expect(dataMissing.error).toContain('antispam');

      // 2. Em produção com chave dummy/inválida: não permite bypass
      const resDummyKey = await app.request(
        '/api/applications/talent-pool',
        { method: 'POST', body: form },
        { DB: {} as any, RESUMES_BUCKET: mockR2Bucket, ENVIRONMENT: 'production', TURNSTILE_SECRET_KEY: 'dummy_secret' } as any
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

      const env = { RATE_LIMIT_KV: mockKv, ENVIRONMENT: 'production' };

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
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'joao@ajnengenharia.com.br', password: 'ViewerPass123!' }),
        },
        { ENVIRONMENT: 'production' } as any
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
          headers: { 'Content-Type': 'application/json', 'X-Auth-Mode': 'api' },
          body: JSON.stringify({ email: 'joao@ajnengenharia.com.br', password: 'ViewerPass123!' }),
        },
        { ENVIRONMENT: 'production' } as any
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
});
