import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { eq } from 'drizzle-orm';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as schema from '../../worker/db/schema';
import worker, { createCarreirasApp } from '../../worker/index';
import { hashPassword, generateCurrentTotp, generateTotpSecret } from '../../worker/lib/crypto';
import { seedDatabase } from '../../worker/db/seed';
import { resetRateLimiterStore } from '../../worker/middleware/rate-limit';

describe('INTEGRAÇÃO LOCAL COM FIXTURES — AJN CARREIRAS (não é prova remota)', () => {
  let sqlite: InstanceType<typeof Database>;
  let db: ReturnType<typeof drizzle<typeof schema>>;
  let app: ReturnType<typeof createCarreirasApp>;
  let mockR2Storage: Map<string, Uint8Array>;
  let mockR2Bucket: any;
  let mockDOBinding: any;
  let superAdminTotpSecret: string;

  beforeEach(async () => {
    resetRateLimiterStore();

    mockDOBinding = {
      idFromName: (_name: string) => ({ toString: () => 'do-stub-id' }),
      get: (_id: any) => ({
        fetch: async () =>
          new Response(
            JSON.stringify({ allowed: true, count: 1, remaining: 59, resetTimestamp: Math.ceil(Date.now() / 1000) + 60, retryAfter: 0 }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json', 'X-RateLimit-Limit': '60', 'X-RateLimit-Remaining': '59', 'X-RateLimit-Reset': '1000' },
            }
          ),
      }),
    };

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
    await seedDatabase(db, { autoPublishJobs: false });

    // Configura Super Admin com MFA
    superAdminTotpSecret = generateTotpSecret();
    const adminPass = await hashPassword('SuperAdminPass123!');
    await db.insert(schema.adminUsers).values({
      id: 'usr-super-admin',
      name: 'Diretoria RH',
      email: 'admin.gate@ajnengenharia.com.br',
      passwordHash: adminPass.hash,
      passwordSalt: adminPass.salt,
      role: 'super_admin',
      isActive: true,
      mfaEnabled: true,
      mfaSecret: superAdminTotpSecret,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Configura Recrutador
    const recPass = await hashPassword('RecruiterPass123!');
    await db.insert(schema.adminUsers).values({
      id: 'usr-recruiter-gate',
      name: 'Recrutadora Juliana',
      email: 'juliana.gate@ajnengenharia.com.br',
      passwordHash: recPass.hash,
      passwordSalt: recPass.salt,
      role: 'recruiter',
      isActive: true,
      mfaEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    app = createCarreirasApp(() => db);
  });

  const getEnv = (overrides: any = {}) => ({
    DB: {} as any,
    RESUMES_BUCKET: mockR2Bucket,
    RATE_LIMITER_DO: mockDOBinding,
    ENVIRONMENT: 'test',
    TURNSTILE_SECRET_KEY: 'test',
    TURNSTILE_SITE_KEY: '0x4AAAAAAAx_GATE_TEST_KEY',
    APP_URL: 'https://carreiras.ajnengenharia.com.br',
    ...overrides,
  });

  // Fixture local: D1, R2 e Durable Object são substituídos por adaptadores de teste.
  it('Integração local: login MFA e consultas autenticadas usando apenas Cookie HttpOnly', async () => {
    const validTotp = await generateCurrentTotp(superAdminTotpSecret);

    // 1. Login com credenciais e código MFA
    const loginRes = await app.request(
      '/api/admin/auth/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin.gate@ajnengenharia.com.br',
          password: 'SuperAdminPass123!',
          mfaCode: validTotp,
        }),
      },
      getEnv()
    );

    expect(loginRes.status).toBe(200);
    const loginData = (await loginRes.json()) as any;
    expect(loginData.success).toBe(true);
    expect(loginData.user.email).toBe('admin.gate@ajnengenharia.com.br');

    // Extrai o Cookie HttpOnly
    const setCookie = loginRes.headers.get('set-cookie');
    expect(setCookie).toContain('ajn_admin_session=');
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('SameSite=Strict');

    const cookieMatch = setCookie!.match(/ajn_admin_session=([^;]+)/);
    const sessionCookie = `ajn_admin_session=${cookieMatch![1]}`;

    // 2. Consulta de Vagas usando APENAS o cookie e simulando o envio de 'Bearer undefined'
    const jobsRes = await app.request(
      '/api/admin/jobs',
      {
        headers: {
          Cookie: sessionCookie,
          Authorization: 'Bearer undefined', // Deve ser ignorado pelo backend, usando o cookie
        },
      },
      getEnv()
    );
    expect(jobsRes.status).toBe(200);
    const jobsData = (await jobsRes.json()) as any;
    expect(Array.isArray(jobsData.jobs)).toBe(true);

    // 3. Consulta de Candidatos usando APENAS o cookie
    const candidatesRes = await app.request(
      '/api/admin/candidates',
      {
        headers: {
          Cookie: sessionCookie,
        },
      },
      getEnv()
    );
    expect(candidatesRes.status).toBe(200);
    const candidatesData = (await candidatesRes.json()) as any;
    expect(Array.isArray(candidatesData.candidates)).toBe(true);
  });

  it('Integração local: restauração de sessão em refresh e gestão de recrutadores', async () => {
    const validTotp = await generateCurrentTotp(superAdminTotpSecret);
    const loginRes = await app.request(
      '/api/admin/auth/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin.gate@ajnengenharia.com.br',
          password: 'SuperAdminPass123!',
          mfaCode: validTotp,
        }),
      },
      getEnv()
    );

    const sessionCookie = `ajn_admin_session=${loginRes.headers.get('set-cookie')!.match(/ajn_admin_session=([^;]+)/)![1]}`;

    // Simula refresh da página: frontend chama /api/admin/auth/me com cookie
    const meRes = await app.request(
      '/api/admin/auth/me',
      {
        headers: { Cookie: sessionCookie },
      },
      getEnv()
    );
    expect(meRes.status).toBe(200);
    const meData = (await meRes.json()) as any;
    expect(meData.user.name).toBe('Diretoria RH');
    expect(meData.user.role).toBe('super_admin');

    // Gestão de Contas: Super Admin lista recrutadores
    const usersRes = await app.request(
      '/api/admin/users',
      {
        headers: { Cookie: sessionCookie },
      },
      getEnv()
    );
    expect(usersRes.status).toBe(200);
    const usersData = (await usersRes.json()) as any;
    expect(usersData.users.length).toBeGreaterThanOrEqual(2);

    // Gestão de Contas: Super Admin cria novo recrutador
    const createRes = await app.request(
      '/api/admin/users',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: sessionCookie,
        },
        body: JSON.stringify({
          name: 'Carlos Recrutador',
          email: 'carlos.rec@ajnengenharia.com.br',
          role: 'recruiter',
          password: 'PasswordSegura123!',
        }),
      },
      getEnv()
    );
    expect(createRes.status).toBe(201);
    const createData = (await createRes.json()) as any;
    expect(createData.user.email).toBe('carlos.rec@ajnengenharia.com.br');

    // Gestão de Contas: Super Admin desativa recrutador
    const statusRes = await app.request(
      `/api/admin/users/${createData.user.id}/status`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Cookie: sessionCookie,
        },
        body: JSON.stringify({ isActive: false }),
      },
      getEnv()
    );
    expect(statusRes.status).toBe(200);
  });

  it('Integração local: logout revoga sessão, limpa cookie e invalida acesso', async () => {
    const validTotp = await generateCurrentTotp(superAdminTotpSecret);
    const loginRes = await app.request(
      '/api/admin/auth/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin.gate@ajnengenharia.com.br',
          password: 'SuperAdminPass123!',
          mfaCode: validTotp,
        }),
      },
      getEnv()
    );

    const sessionCookie = `ajn_admin_session=${loginRes.headers.get('set-cookie')!.match(/ajn_admin_session=([^;]+)/)![1]}`;

    // Executa Logout
    const logoutRes = await app.request(
      '/api/admin/auth/logout',
      {
        method: 'POST',
        headers: { Cookie: sessionCookie },
      },
      getEnv()
    );
    expect(logoutRes.status).toBe(200);
    const logoutCookie = logoutRes.headers.get('set-cookie');
    expect(logoutCookie).toContain('Max-Age=0');

    // Próxima chamada autenticada é rejeitada com 401
    const postLogoutRes = await app.request(
      '/api/admin/auth/me',
      {
        headers: { Cookie: sessionCookie },
      },
      getEnv()
    );
    expect(postLogoutRes.status).toBe(401);
  });

  it('Integração local: candidatura com magic bytes, D1 SQLite e R2 Map', async () => {
    // 1. Cria uma vaga publicada no D1
    const [insertedJob] = await db
      .insert(schema.jobPostings)
      .values({
        id: 'job-real-teste',
        title: 'Técnico em Segurança do Trabalho Pleno',
        slug: 'tecnico-seguranca-teste',
        department: 'Engenharia de Segurança',
        location: 'Belo Horizonte - MG',
        employmentType: 'CLT',
        experienceLevel: 'Pleno',
        description: 'Vaga real de teste para comprovação de integração D1/R2.',
        requirements: JSON.stringify(['Registro MTE ativo', 'Disponibilidade para viagens']),
        status: 'published',
        openingsCount: 1,
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // 2. Prepara FormData com arquivo PDF válido (magic bytes %PDF- e tamanho >= 16 bytes)
    const pdfBytes = new Uint8Array([
      0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x35, 0x0a, 0x25, 0xd0, 0xd4, 0xc5, 0xd8, 0x0a, 0x25, 0x25, 0x45, 0x4f, 0x46
    ]);
    const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });

    const formData = new FormData();
    formData.append('fullName', 'Candidato Teste Integração');
    formData.append('email', 'candidato.gate@teste.com');
    formData.append('phone', '(31) 98888-7777');
    formData.append('cpf', '00000000191');
    formData.append('city', 'Belo Horizonte');
    formData.append('state', 'MG');
    formData.append('currentTitle', 'Técnico de Segurança');
    formData.append('consentTerms', 'true');
    formData.append('consentRetention', 'true');
    formData.append('turnstileToken', 'valid-test-token');
    formData.append('resume', pdfBlob, 'curriculo_candidato.pdf');

    // 3. Submissão
    const applyRes = await app.request(
      `/api/applications/jobs/${insertedJob.slug}/apply`,
      {
        method: 'POST',
        body: formData,
      },
      getEnv()
    );

    expect(applyRes.status).toBe(201);
    const applyData = (await applyRes.json()) as any;
    expect(applyData.success).toBe(true);
    expect(applyData.trackingCode).toMatch(/^AJN-\d{4}-[A-Z0-9]{6}$/);

    // 4. Comprova persistência no D1
    const candidateDb = await db.select().from(schema.candidates).where(eq(schema.candidates.email, 'candidato.gate@teste.com')).get();
    expect(candidateDb).toBeDefined();
    expect(candidateDb?.fullName).toBe('Candidato Teste Integração');

    const applicationDb = await db.select().from(schema.jobApplications).where(eq(schema.jobApplications.candidateId, candidateDb!.id)).get();
    expect(applicationDb).toBeDefined();
    expect(applicationDb?.jobId).toBe(insertedJob.id);

    // 5. Comprova persistência privada no R2
    const resumeDb = await db.select().from(schema.resumes).where(eq(schema.resumes.candidateId, candidateDb!.id)).get();
    expect(resumeDb).toBeDefined();
    expect(mockR2Storage.has(resumeDb!.fileKey)).toBe(true);
  });

  it('Integração local: criação de vaga e HTML/JSON-LD SSR', async () => {
    // 1. Login do recrutador
    const recLogin = await app.request(
      '/api/admin/auth/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'juliana.gate@ajnengenharia.com.br',
          password: 'RecruiterPass123!',
        }),
      },
      getEnv()
    );
    const sessionCookie = `ajn_admin_session=${recLogin.headers.get('set-cookie')!.match(/ajn_admin_session=([^;]+)/)![1]}`;

    // 2. Criação da vaga no painel
    const createJobRes = await app.request(
      '/api/admin/jobs',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: sessionCookie,
        },
        body: JSON.stringify({
          title: 'Engenheiro Ambiental e Sustentabilidade',
          slug: 'eng-ambiental-gate',
          department: 'Meio Ambiente',
          location: 'Belo Horizonte - MG (Híbrido)',
          employmentType: 'CLT',
          experienceLevel: 'Sênior',
          description: 'Responsável pela gestão de licenças ambientais e laudos de campo.',
          requirements: ['Graduação em Engenharia Ambiental', 'CREA ativo', '5 anos de experiência'],
          differentials: 'Pós-graduação em Auditoria Ambiental',
          benefits: 'Plano de Saúde, Seguro de Vida, VA/VR',
          status: 'published',
          openingsCount: 2,
        }),
      },
      getEnv()
    );
    expect(createJobRes.status).toBe(201);
    const createdJob = (await createJobRes.json()) as any;
    expect(createdJob.success).toBe(true);

    // 3. Acesso direto à URL individual com Accept: text/html (crawler/navegador)
    const pageRes = await app.request(
      '/carreiras/eng-ambiental-gate',
      {
        headers: { Accept: 'text/html' },
      },
      getEnv()
    );

    expect(pageRes.status).toBe(200);
    const html = await pageRes.text();

    expect(html).toContain('<h1 class="carreiras-title">Engenheiro Ambiental e Sustentabilidade</h1>');
    expect(html).toContain('Meio Ambiente');
    expect(html).toContain('Responsável pela gestão de licenças ambientais');
    expect(html).toContain('"@type":"JobPosting"');
    expect(html).toContain('https://carreiras.ajnengenharia.com.br/carreiras/eng-ambiental-gate/');
    expect(html).toContain('0x4AAAAAAAx_GATE_TEST_KEY'); // Turnstile SiteKey dinâmica
  });

  it('Integração local: status HTTP e SEO sem JavaScript para aberta, inexistente e listagem', async () => {
    // Vaga publicada no D1
    await db.insert(schema.jobPostings).values({
      id: 'job-sem-js',
      title: 'Especialista em Higiene Ocupacional',
      slug: 'especialista-higiene-ocupacional',
      department: 'Higiene Ocupacional',
      location: 'Belo Horizonte - MG',
      employmentType: 'CLT',
      experienceLevel: 'Especialista',
      description: 'Atuação avançada em medições quantitativas de agentes físicos e químicos.',
      requirements: JSON.stringify(['Certificação ABHO', 'Experiência em laudos complexos']),
      status: 'published',
      openingsCount: 1,
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 1. Vaga aberta: HTTP 200 com HTML semântico e JobPosting
    const openRes = await app.request(
      '/carreiras/especialista-higiene-ocupacional',
      { headers: { Accept: 'text/html' } },
      getEnv()
    );
    expect(openRes.status).toBe(200);
    const openHtml = await openRes.text();
    expect(openHtml).toContain('<h1 class="carreiras-title">Especialista em Higiene Ocupacional</h1>');
    expect(openHtml).toContain('"@type":"JobPosting"');
    expect(openHtml).toContain('<!DOCTYPE html>');

    // 2. Vaga inexistente ou encerrada: HTTP 404 semântico (não 200) e robots noindex
    const notFoundRes = await app.request(
      '/carreiras/vaga-que-nao-existe-ou-fechou',
      { headers: { Accept: 'text/html' } },
      getEnv()
    );
    expect(notFoundRes.status).toBe(404);
    const notFoundHtml = await notFoundRes.text();
    expect(notFoundHtml).toContain('Vaga Não Encontrada | AJN Carreiras');
    expect(notFoundHtml).toContain('<meta name="robots" content="noindex, follow">');
    expect(notFoundHtml).not.toContain('"@type":"JobPosting"');

    // 3. Listagem geral: HTTP 200 com WebPage e sem schema JobPosting
    const listRes = await app.request(
      '/carreiras',
      { headers: { Accept: 'text/html' } },
      getEnv()
    );
    expect(listRes.status).toBe(200);
    const listHtml = await listRes.text();
    expect(listHtml).toContain('Vagas e oportunidades na AJN');
    expect(listHtml).toContain('Especialista em Higiene Ocupacional');
    expect(listHtml).toContain('"@type":"WebPage"');
    expect(listHtml).not.toContain('"@type":"JobPosting"'); // Sem JobPosting na listagem!
  });

  it('Integração local: configuração staging canônica, CORS explícito e Cookie SameSite', async () => {
    const stagingEnv = getEnv({
      ENVIRONMENT: 'staging',
      CORS_ORIGIN: '',
      CORS_ORIGINS: '',
      APP_URL: '',
      TURNSTILE_SITE_KEY: '',
    });

    // 1. CORS em preflight vindo da origem canônica do Worker
    const corsRes = await app.request(
      'https://staging.example.test/api/jobs',
      {
        method: 'OPTIONS',
        headers: {
          Origin: 'https://staging.example.test',
          'Access-Control-Request-Method': 'GET',
        },
      },
      stagingEnv
    );
    expect(corsRes.status).toBe(204);
    expect(corsRes.headers.get('access-control-allow-origin')).toBe('https://staging.example.test');
    expect(corsRes.headers.get('access-control-allow-credentials')).toBe('true');

    // 2. CORS rejeita origem da antiga página Hostinger e origem maliciosa
    const legacyCorsRes = await app.request(
      'https://staging.example.test/api/jobs',
      {
        method: 'OPTIONS',
        headers: {
          Origin: 'https://sienna-mongoose-223157.hostingersite.com',
          'Access-Control-Request-Method': 'GET',
        },
      },
      stagingEnv
    );
    expect(legacyCorsRes.headers.get('access-control-allow-origin')).toBeNull();

    const localCorsRes = await app.request(
      'https://staging.example.test/api/jobs',
      {
        method: 'OPTIONS',
        headers: {
          Origin: 'http://localhost:4321',
          'Access-Control-Request-Method': 'GET',
        },
      },
      stagingEnv
    );
    expect(localCorsRes.headers.get('access-control-allow-origin')).toBeNull();

    const badCorsRes = await app.request(
      'https://staging.example.test/api/jobs',
      {
        method: 'OPTIONS',
        headers: {
          Origin: 'https://hacker-site-malicioso.com',
          'Access-Control-Request-Method': 'GET',
        },
      },
      stagingEnv
    );
    expect(badCorsRes.headers.get('access-control-allow-origin')).toBeNull();

    // 3. Validação do Cookie de sessão gerado em Staging; Origin é obrigatório para POST real.
    const loginRes = await app.request(
      'https://staging.example.test/api/admin/auth/login',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'https://staging.example.test',
        },
        body: JSON.stringify({
          email: 'juliana.gate@ajnengenharia.com.br',
          password: 'RecruiterPass123!',
        }),
      },
      stagingEnv
    );
    const cookie = loginRes.headers.get('set-cookie');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Secure');
    expect(cookie).toContain('SameSite=Strict');

    // 4. Operações administrativas rejeitam CSRF sem Origin confiável.
    const forgedRes = await app.request(
      'https://staging.example.test/api/admin/auth/login',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'https://hacker-site-malicioso.com',
        },
        body: JSON.stringify({
          email: 'juliana.gate@ajnengenharia.com.br',
          password: 'RecruiterPass123!',
        }),
      },
      stagingEnv
    );
    expect(forgedRes.status).toBe(403);

    const missingOriginRes = await app.request(
      'https://staging.example.test/api/admin/auth/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'juliana.gate@ajnengenharia.com.br',
          password: 'RecruiterPass123!',
        }),
      },
      stagingEnv
    );
    expect(missingOriginRes.status).toBe(403);
  });

  it('Contrato local: Worker serve assets estáticos e não mascara 404 de API', async () => {
    let assetFetchCalls = 0;
    const mockAssets = {
      fetch: async (request: Request) => {
        assetFetchCalls += 1;
        const pathname = new URL(request.url).pathname;
        expect(['/styles/carreiras.css', '/carreiras/talentos/']).toContain(pathname);
        return new Response(pathname === '/styles/carreiras.css' ? '/* careers asset */' : '<html><body>talentos</body></html>', {
          status: 200,
          headers: { 'Content-Type': pathname.endsWith('.css') ? 'text/css' : 'text/html' },
        });
      },
    };

    const assetResponse = await worker.fetch(
      new Request('https://staging.example.test/styles/carreiras.css'),
      getEnv({ ENVIRONMENT: 'staging', ASSETS: mockAssets }),
      {} as ExecutionContext
    );
    expect(assetResponse.status).toBe(200);
    expect(await assetResponse.text()).toContain('careers asset');
    expect(assetResponse.headers.get('Content-Security-Policy')).toContain("default-src 'self'");

    const staticCareerResponse = await worker.fetch(
      new Request('https://staging.example.test/carreiras/talentos/'),
      getEnv({ ENVIRONMENT: 'staging', ASSETS: mockAssets }),
      {} as ExecutionContext
    );
    expect(staticCareerResponse.status).toBe(200);
    expect(await staticCareerResponse.text()).toContain('talentos');

    const api404Response = await worker.fetch(
      new Request('https://staging.example.test/api/endpoint-inexistente'),
      getEnv({ ENVIRONMENT: 'staging', ASSETS: mockAssets }),
      {} as ExecutionContext
    );
    expect(api404Response.status).toBe(404);
    expect(assetFetchCalls).toBe(2);
  });

  it('Integração local: Turnstile, R2 e bloqueio de login falham fechados', async () => {
    // 1. Falha de Turnstile em produção/staging (sem token) -> fail-secure 400
    const turnstileFailRes = await app.request(
      '/api/applications/request-verification',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cpf: '00000000191',
          turnstileToken: '', // Token vazio
        }),
      },
      getEnv({ ENVIRONMENT: 'production' })
    );
    expect(turnstileFailRes.status).toBe(400);
    const errData = (await turnstileFailRes.json()) as any;
    expect(errData.error).toContain('Turnstile');

    // 2. Falha de R2: R2 indisponível -> 503
    const brokenR2Env = getEnv({
      RESUMES_BUCKET: {
        put: async () => {
          throw new Error('R2_NETWORK_TIMEOUT: Cloudflare R2 bucket connection failed');
        },
      },
    });

    const pdfBytes = new Uint8Array([
      0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x35, 0x0a, 0x25, 0xd0, 0xd4, 0xc5, 0xd8, 0x0a, 0x25, 0x25, 0x45, 0x4f, 0x46
    ]);
    const formData = new FormData();
    formData.append('fullName', 'Candidato R2 Falha');
    formData.append('email', 'r2.falha@teste.com');
    formData.append('phone', '(31) 98888-7777');
    formData.append('cpf', '00000000191');
    formData.append('city', 'Belo Horizonte');
    formData.append('state', 'MG');
    formData.append('consentTerms', 'true');
    formData.append('consentRetention', 'true');
    formData.append('turnstileToken', 'valid-test-token');
    formData.append('resume', new Blob([pdfBytes], { type: 'application/pdf' }), 'curriculo.pdf');

    const r2FailRes = await app.request(
      '/api/applications/talent-pool',
      { method: 'POST', body: formData },
      brokenR2Env
    );
    expect(r2FailRes.status).toBe(502);
    const r2Err = (await r2FailRes.json()) as any;
    expect(r2Err.error).toContain('Falha na gravação do currículo no armazenamento seguro');

    // Comprova que nada foi gravado no D1
    const candidateCheck = await db.select().from(schema.candidates).where(eq(schema.candidates.email, 'r2.falha@teste.com')).get();
    expect(candidateCheck).toBeUndefined();

    // 3. Falha de Autenticação com bloqueio após tentativas excessivas (423 Locked)
    for (let i = 0; i < 5; i++) {
      await app.request(
        '/api/admin/auth/login',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'juliana.gate@ajnengenharia.com.br',
            password: 'SenhaErrada123!',
          }),
        },
        getEnv()
      );
    }

    const lockedRes = await app.request(
      '/api/admin/auth/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'juliana.gate@ajnengenharia.com.br',
          password: 'RecruiterPass123!', // Senha correta, mas conta bloqueada
        }),
      },
      getEnv()
    );
    expect(lockedRes.status).toBe(423);
    const lockedData = (await lockedRes.json()) as any;
    expect(lockedData.error).toContain('Conta bloqueada temporariamente');
  });
});
