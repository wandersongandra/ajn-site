import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { eq } from 'drizzle-orm';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as schema from '../../worker/db/schema';
import { createCarreirasApp } from '../../worker/index';
import { hashPassword, sha256, generateRandomToken } from '../../worker/lib/crypto';
import { seedDatabase } from '../../worker/db/seed';

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
    await seedDatabase(db);

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

      // Recuperação com dados corretos
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
      expect(recovData.applications.length).toBeGreaterThan(0);
      expect(recovData.applications[0].trackingCode).toBe(trackingCode);

      // Recuperação com CPF errado deve retornar 404
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
});
