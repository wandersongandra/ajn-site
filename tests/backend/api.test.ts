import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { eq } from 'drizzle-orm';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as schema from '../../worker/db/schema';
import { createCarreirasApp } from '../../worker/index';
import { hashPassword, sha256 } from '../../worker/lib/crypto';
import { seedDatabase } from '../../worker/db/seed';
import { resetRateLimiterStore } from '../../worker/middleware/rate-limit';

describe('Carreiras Backend API Tests (Cloudflare Workers + Hono)', () => {
  let sqlite: InstanceType<typeof Database>;
  let db: ReturnType<typeof drizzle<typeof schema>>;
  let app: ReturnType<typeof createCarreirasApp>;
  let mockR2Storage: Map<string, Uint8Array>;
  let mockR2Bucket: any;

  beforeEach(async () => {
    resetRateLimiterStore();
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

    // Mock do Cloudflare R2 Bucket em memória
    mockR2Storage = new Map<string, Uint8Array>();
    mockR2Bucket = {
      put: async (key: string, value: Uint8Array | ArrayBuffer) => {
        const buf = value instanceof Uint8Array ? value : new Uint8Array(value);
        mockR2Storage.set(key, buf);
        return { key, size: buf.length };
      },
      get: async (key: string) => {
        const data = mockR2Storage.get(key);
        if (!data) return null;
        return {
          body: data,
          size: data.length,
        };
      },
      delete: async (key: string) => {
        mockR2Storage.delete(key);
      },
    };

    const mockEnv = {
      DB: {} as any,
      RESUMES_BUCKET: mockR2Bucket,
      ENVIRONMENT: 'test',
      TURNSTILE_SECRET_KEY: 'test',
    };

    app = createCarreirasApp(() => db);
  });

  describe('1. Vagas Públicas', () => {
    it('GET /api/jobs deve listar vagas publicadas', async () => {
      const res = await app.request('/api/jobs');
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.jobs.length).toBeGreaterThanOrEqual(3);
      expect(data.jobs[0]).toHaveProperty('title');
      expect(data.jobs[0]).toHaveProperty('slug');
      expect(data.jobs[0]).toHaveProperty('department');
    });

    it('GET /api/jobs?department=... deve filtrar por departamento', async () => {
      const res = await app.request('/api/jobs?department=Higiene%20Ocupacional');
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.jobs.length).toBe(1);
      expect(data.jobs[0].title).toContain('Higiene Ocupacional');
    });

    it('GET /api/jobs/:slug deve retornar detalhes da vaga', async () => {
      const res = await app.request('/api/jobs/engenheiro-seguranca-do-trabalho');
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.job.title).toBe('Engenheiro(a) de Segurança do Trabalho');
      expect(Array.isArray(data.job.requirements)).toBe(true);
    });

    it('GET /api/jobs/inexistente deve retornar 404', async () => {
      const res = await app.request('/api/jobs/vaga-fantasma-inexistente');
      expect(res.status).toBe(404);
    });
  });

  describe('2. Candidatura e Upload Seguro de Currículos', () => {
    // PDF válido com assinatura mágica %PDF-
    const validPdfBuffer = new Uint8Array([
      0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a, 0x25, 0xd0, 0xd4, 0xc5, 0xd8, 0x0a, 0x31, 0x20, 0x30,
      0x20, 0x6f, 0x62, 0x6a, 0x0a,
    ]);

    it('POST /api/applications/jobs/:slug/apply deve cadastrar candidato e fazer upload seguro no R2', async () => {
      const form = new FormData();
      form.append('fullName', 'Carlos Eduardo Ferreira');
      form.append('email', 'carlos.ferreira@teste.com');
      form.append('phone', '(31) 98765-4321');
      form.append('cpf', '00000000191'); // CPF válido padrão algoritmo
      form.append('city', 'Belo Horizonte');
      form.append('state', 'MG');
      form.append('currentTitle', 'Engenheiro Civil');
      form.append('consentTerms', 'true');
      form.append('certifications', JSON.stringify(['NR-10', 'NR-35']));

      const file = new File([validPdfBuffer], 'curriculo_carlos.pdf', { type: 'application/pdf' });
      form.append('resume', file);

      const res = await app.request(
        '/api/applications/jobs/engenheiro-seguranca-do-trabalho/apply',
        { method: 'POST', body: form },
        { DB: {} as any, RESUMES_BUCKET: mockR2Bucket, TURNSTILE_SECRET_KEY: 'test' } as any
      );

      expect(res.status).toBe(201);
      const data = (await res.json()) as any;
      expect(data.success).toBe(true);
      expect(data.trackingCode).toMatch(/^AJN-\d{4}-[A-Z0-9]+$/);

      // Verifica se o arquivo foi armazenado no mock R2
      expect(mockR2Storage.size).toBe(1);
      const storedKey = Array.from(mockR2Storage.keys())[0];
      expect(storedKey).toContain('resumes/');

      // Consulta status da candidatura pelo código de rastreamento (Candidate Tracking)
      const trackRes = await app.request(`/api/applications/track/${data.trackingCode}`);
      expect(trackRes.status).toBe(200);
      const trackData = (await trackRes.json()) as any;
      expect(trackData.application.trackingCode).toBe(data.trackingCode);
      expect(trackData.application.jobTitle).toBe('Engenheiro(a) de Segurança do Trabalho');
      expect(trackData.application.status).toBe('Em andamento');
    });

    it('deve rejeitar upload com assinatura maliciosa/inválida', async () => {
      const form = new FormData();
      form.append('fullName', 'Atacante Hacker');
      form.append('email', 'hacker@teste.com');
      form.append('phone', '(31) 98765-4321');
      form.append('cpf', '00000000191');
      form.append('city', 'Belo Horizonte');
      form.append('state', 'MG');
      form.append('consentTerms', 'true');

      // Executável falso renomeado para .pdf (inicia com MZ executável Windows)
      const fakePdf = new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00, 0xff, 0xff, 0x00, 0x00]);
      form.append('resume', new File([fakePdf], 'malware.pdf', { type: 'application/pdf' }));

      const res = await app.request(
        '/api/applications/jobs/engenheiro-seguranca-do-trabalho/apply',
        { method: 'POST', body: form },
        { DB: {} as any, RESUMES_BUCKET: mockR2Bucket, TURNSTILE_SECRET_KEY: 'test' } as any
      );

      expect(res.status).toBe(400);
      const data = (await res.json()) as any;
      expect(data.error).toContain('Assinatura binária inválida');
    });
  });

  describe('3. Autenticação Administrativa e RBAC', () => {
    let recruiterToken = '';
    let viewerToken = '';

    beforeEach(async () => {
      // Cria usuário Recruiter
      const recPass = await hashPassword('RecruiterPass123!');
      await db.insert(schema.adminUsers).values({
        id: 'admin-recruiter',
        name: 'Maria Recrutadora',
        email: 'maria@ajnengenharia.com.br',
        passwordHash: recPass.hash,
        passwordSalt: recPass.salt,
        role: 'recruiter',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Cria usuário Viewer (apenas visualização)
      const viewPass = await hashPassword('ViewerPass123!');
      await db.insert(schema.adminUsers).values({
        id: 'admin-viewer',
        name: 'João Observador',
        email: 'joao@ajnengenharia.com.br',
        passwordHash: viewPass.hash,
        passwordSalt: viewPass.salt,
        role: 'viewer',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Login Recruiter
      const resRec = await app.request('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'maria@ajnengenharia.com.br', password: 'RecruiterPass123!' }),
      });
      const dataRec = (await resRec.json()) as any;
      recruiterToken = dataRec.token;

      // Login Viewer
      const resView = await app.request('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'joao@ajnengenharia.com.br', password: 'ViewerPass123!' }),
      });
      const dataView = (await resView.json()) as any;
      viewerToken = dataView.token;
    });

    it('deve realizar login e emitir token de sessão para credenciais válidas', () => {
      expect(recruiterToken).toBeDefined();
      expect(recruiterToken.length).toBeGreaterThan(20);
    });

    it('deve rejeitar login com senha incorreta', async () => {
      const res = await app.request('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'maria@ajnengenharia.com.br', password: 'SenhaErrada123!' }),
      });
      expect(res.status).toBe(401);
    });

    it('GET /api/admin/auth/me deve retornar dados da sessão autenticada', async () => {
      const res = await app.request('/api/admin/auth/me', {
        headers: { Authorization: `Bearer ${recruiterToken}` },
      });
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.user.email).toBe('maria@ajnengenharia.com.br');
      expect(data.user.role).toBe('recruiter');
      expect(data.user.permissions).toContain('applications:stage_move');
    });

    it('Recruiter pode criar nova vaga mas Viewer é bloqueado com 403', async () => {
      const newJob = {
        title: 'Analista de SST Júnior',
        slug: 'analista-sst-junior',
        department: 'Segurança do Trabalho',
        location: 'Belo Horizonte - MG',
        employmentType: 'CLT',
        experienceLevel: 'Júnior',
        description: 'Vaga para apoio em documentação técnica e integração de colaboradores.',
        requirements: ['Curso Técnico em Segurança do Trabalho'],
        status: 'published',
      };

      // Tentativa do Viewer (sem permissão jobs:write)
      const viewRes = await app.request('/api/admin/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${viewerToken}`,
        },
        body: JSON.stringify(newJob),
      });
      expect(viewRes.status).toBe(403);

      // Tentativa do Recruiter (com permissão jobs:write)
      const recRes = await app.request('/api/admin/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${recruiterToken}`,
        },
        body: JSON.stringify(newJob),
      });
      expect(recRes.status).toBe(201);
    });
  });

  describe('4. Gestão do Pipeline de Recrutamento', () => {
    it('deve permitir movimentar candidato entre etapas e registrar avaliação', async () => {
      // 1. Cria usuário super_admin
      const pass = await hashPassword('AdminMaster123!');
      await db.insert(schema.adminUsers).values({
        id: 'adm-1',
        name: 'Diretor RH',
        email: 'rh@ajnengenharia.com.br',
        passwordHash: pass.hash,
        passwordSalt: pass.salt,
        role: 'super_admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const loginRes = await app.request('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'rh@ajnengenharia.com.br', password: 'AdminMaster123!' }),
      });
      const { token } = (await loginRes.json()) as any;

      // 2. Cria candidato e candidatura
      await db.insert(schema.candidates).values({
        id: 'cand-pipe-1',
        fullName: 'Fernanda Lima',
        email: 'fernanda@teste.com',
        phone: '(31) 98888-1111',
        city: 'Belo Horizonte',
        state: 'MG',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await db.insert(schema.jobApplications).values({
        id: 'app-pipe-1',
        jobId: 'job-eng-seguranca',
        candidateId: 'cand-pipe-1',
        currentStageId: 'stage-1-triagem',
        trackingCode: 'AJN-2026-TESTP1',
        status: 'active',
        appliedAt: new Date(),
        updatedAt: new Date(),
      });

      // 3. Movimenta para Entrevista RH (stage-3-entrevista-rh) com rating 5 e notas humanas
      const moveRes = await app.request('/api/admin/pipeline/move-stage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          applicationId: 'app-pipe-1',
          targetStageId: 'stage-3-entrevista-rh',
          rating: 5,
          notes: 'Excelente perfil com CREA ativo e sólida vivência em eSocial.',
        }),
      });

      expect(moveRes.status).toBe(200);

      // 4. Verifica no pipeline
      const pipeRes = await app.request('/api/admin/pipeline/job-eng-seguranca', {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(pipeRes.status).toBe(200);
      const pipeData = (await pipeRes.json()) as any;

      const stage3 = pipeData.stages.find((s: any) => s.id === 'stage-3-entrevista-rh');
      expect(stage3.candidates.length).toBe(1);
      expect(stage3.candidates[0].fullName).toBe('Fernanda Lima');
      expect(stage3.candidates[0].rating).toBe(5);
    });
  });

  describe('5. Conformidade e Exclusão LGPD (Art. 18)', () => {
    it('deve registrar solicitação pública e executar exclusão em cascata pelo Admin', async () => {
      // 1. Candidato existente
      const cpfClean = '00000000191';
      const cpfHash = await sha256(cpfClean);

      await db.insert(schema.candidates).values({
        id: 'cand-lgpd-del',
        fullName: 'Lucas Oliveira',
        email: 'lucas.lgpd@teste.com',
        phone: '(31) 97777-6666',
        cpfHash,
        city: 'Betim',
        state: 'MG',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Currículo no R2
      mockR2Storage.set('resumes/cand-lgpd-del/curriculo.pdf', new Uint8Array([1, 2, 3]));
      await db.insert(schema.resumes).values({
        id: 'res-lgpd-1',
        candidateId: 'cand-lgpd-del',
        fileKey: 'resumes/cand-lgpd-del/curriculo.pdf',
        originalFilename: 'lucas.pdf',
        mimeType: 'application/pdf',
        fileSizeBytes: 3,
        fileSha256: 'test-hash',
        isCurrent: true,
        uploadedAt: new Date(),
      });

      // 2. Titular solicita exclusão
      const delReqRes = await app.request('/api/lgpd/deletion-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'lucas.lgpd@teste.com',
          cpf: cpfClean,
          reason: 'Não desejo mais manter currículo no banco.',
          turnstileToken: 'test',
        }),
      });

      expect(delReqRes.status).toBe(200);
      const reqData = (await delReqRes.json()) as any;
      expect(reqData.success).toBe(true);
      expect(reqData.protocol).toContain('LGPD-');

      // 3. Admin lista e executa exclusão
      const pass = await hashPassword('AdminLgpd123!');
      await db.insert(schema.adminUsers).values({
        id: 'adm-dpo',
        name: 'Encarregado DPO',
        email: 'dpo@ajnengenharia.com.br',
        passwordHash: pass.hash,
        passwordSalt: pass.salt,
        role: 'super_admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const loginRes = await app.request('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'dpo@ajnengenharia.com.br', password: 'AdminLgpd123!' }),
      });
      const { token } = (await loginRes.json()) as any;

      const listReqRes = await app.request('/api/admin/lgpd/requests', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const listData = (await listReqRes.json()) as any;
      expect(listData.requests.length).toBe(1);
      const requestId = listData.requests[0].id;

      // Executa exclusão
      const execRes = await app.request(
        `/api/admin/lgpd/requests/${requestId}/execute`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        },
        { DB: {} as any, RESUMES_BUCKET: mockR2Bucket } as any
      );

      expect(execRes.status).toBe(200);

      // Confirma que o arquivo no R2 foi deletado
      expect(mockR2Storage.has('resumes/cand-lgpd-del/curriculo.pdf')).toBe(false);

      // Confirma que o registro do candidato foi removido do banco
      const candidateInDb = db
        .select()
        .from(schema.candidates)
        .where(eq(schema.candidates.id, 'cand-lgpd-del'))
        .get();
      expect(candidateInDb).toBeUndefined();
    });
  });
});
