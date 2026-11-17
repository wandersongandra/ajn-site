import * as schema from './schema';
import { hashPassword, generateTotpSecret } from '../lib/crypto';

export const DEFAULT_STAGES = [
  { id: 'stage-1-triagem', name: 'Triagem & Inscrição', stageOrder: 1, isTerminalHired: false, isTerminalRejected: false },
  { id: 'stage-2-requisitos', name: 'Análise de Requisitos', stageOrder: 2, isTerminalHired: false, isTerminalRejected: false },
  { id: 'stage-3-entrevista-rh', name: 'Entrevista RH', stageOrder: 3, isTerminalHired: false, isTerminalRejected: false },
  { id: 'stage-4-entrevista-tecnica', name: 'Entrevista Técnica com Gestor', stageOrder: 4, isTerminalHired: false, isTerminalRejected: false },
  { id: 'stage-5-proposta', name: 'Proposta & Exames Admissionais', stageOrder: 5, isTerminalHired: false, isTerminalRejected: false },
  { id: 'stage-6-contratado', name: 'Contratado', stageOrder: 6, isTerminalHired: true, isTerminalRejected: false },
  { id: 'stage-7-banco', name: 'Banco de Talentos / Declinado', stageOrder: 7, isTerminalHired: false, isTerminalRejected: true },
];

export const DEFAULT_PERMISSIONS = [
  // Super Admin: acesso irrestrito
  { id: 'p-sa-1', role: 'super_admin', permission: 'jobs:read' },
  { id: 'p-sa-2', role: 'super_admin', permission: 'jobs:write' },
  { id: 'p-sa-3', role: 'super_admin', permission: 'jobs:delete' },
  { id: 'p-sa-4', role: 'super_admin', permission: 'candidates:read' },
  { id: 'p-sa-5', role: 'super_admin', permission: 'candidates:write' },
  { id: 'p-sa-6', role: 'super_admin', permission: 'resumes:read' },
  { id: 'p-sa-7', role: 'super_admin', permission: 'resumes:download' },
  { id: 'p-sa-8', role: 'super_admin', permission: 'applications:read' },
  { id: 'p-sa-9', role: 'super_admin', permission: 'applications:stage_move' },
  { id: 'p-sa-10', role: 'super_admin', permission: 'applications:rate' },
  { id: 'p-sa-11', role: 'super_admin', permission: 'lgpd:read' },
  { id: 'p-sa-12', role: 'super_admin', permission: 'lgpd:delete' },
  { id: 'p-sa-13', role: 'super_admin', permission: 'audit:read' },
  { id: 'p-sa-14', role: 'super_admin', permission: 'admin:manage' },

  // Recruiter: gestão de vagas, candidatos, pipeline e download de currículos
  { id: 'p-rec-1', role: 'recruiter', permission: 'jobs:read' },
  { id: 'p-rec-2', role: 'recruiter', permission: 'jobs:write' },
  { id: 'p-rec-3', role: 'recruiter', permission: 'candidates:read' },
  { id: 'p-rec-4', role: 'recruiter', permission: 'candidates:write' },
  { id: 'p-rec-5', role: 'recruiter', permission: 'resumes:read' },
  { id: 'p-rec-6', role: 'recruiter', permission: 'resumes:download' },
  { id: 'p-rec-7', role: 'recruiter', permission: 'applications:read' },
  { id: 'p-rec-8', role: 'recruiter', permission: 'applications:stage_move' },
  { id: 'p-rec-9', role: 'recruiter', permission: 'applications:rate' },
  { id: 'p-rec-10', role: 'recruiter', permission: 'audit:read' },

  // Viewer: somente leitura de vagas e candidatos (sem download de currículo ou movimentação)
  { id: 'p-vw-1', role: 'viewer', permission: 'jobs:read' },
  { id: 'p-vw-2', role: 'viewer', permission: 'candidates:read' },
  { id: 'p-vw-3', role: 'viewer', permission: 'applications:read' },
];

// Vagas de referência técnica: iniciam estritamente como 'draft' para exigir aprovação explícita (P0 Item 6)
export const INITIAL_JOB_POSTINGS = [
  {
    id: 'job-eng-seguranca',
    title: 'Engenheiro(a) de Segurança do Trabalho',
    slug: 'engenheiro-seguranca-do-trabalho',
    department: 'Segurança do Trabalho',
    location: 'Belo Horizonte - MG (Híbrido)',
    employmentType: 'CLT',
    experienceLevel: 'Sênior',
    description: 'Buscamos Engenheiro(a) de Segurança do Trabalho para coordenar diagnósticos ocupacionais, auditorias técnicas em clientes industriais e comerciais, e orientar a elaboração de laudos com excelência técnica.',
    requirements: JSON.stringify([
      'Graduação em Engenharia com pós-graduação completa em Engenharia de Segurança do Trabalho',
      'Registro ativo no CREA-MG',
      'Experiência consolidada em PGR, LTCAT, laudos de insalubridade e periculosidade',
      'Domínio dos eventos de SST no eSocial (S-2210, S-2220, S-2240)',
      'CNH B e disponibilidade para visitas técnicas na Região Metropolitana de BH',
    ]),
    differentials: 'Pós-graduação em Higiene Ocupacional ou experiência prévia em consultorias de engenharia.',
    benefits: 'Vale Alimentação/Refeição (R$ 950/mês), Plano de Saúde Unimed coparticipativo, Seguro de Vida, Auxílio Combustível para visitas.',
    salaryMin: 9200,
    salaryMax: 12500,
    salaryIsDisclosed: true,
    status: 'draft',
    openingsCount: 1,
    publishedAt: null,
  },
  {
    id: 'job-tec-seguranca',
    title: 'Técnico(a) em Segurança do Trabalho Pleno',
    slug: 'tecnico-seguranca-do-trabalho-pleno',
    department: 'Segurança do Trabalho',
    location: 'Belo Horizonte - MG (Presencial)',
    employmentType: 'CLT',
    experienceLevel: 'Pleno',
    description: 'Atuação direta no acompanhamento de frentes de serviço, realização de inspeções periódicas, controle e fiscalização de EPIs/EPCs, condução de Diálogos Diários de Segurança (DDS) e suporte aos laudos de campo.',
    requirements: JSON.stringify([
      'Curso Técnico completo em Segurança do Trabalho com registro no MTE',
      'Experiência prévia em ambientes industriais, construção civil ou facilities',
      'Conhecimento prático nas NRs 01, 06, 10, 12 e 35',
      'Habilidade com planilhas e relatórios fotográficos de não conformidade',
    ]),
    differentials: 'Certificação de instrutor de NR-35 e NR-33.',
    benefits: 'Vale Refeição, Vale Transporte, Plano Odontológico, Seguro de Vida em grupo.',
    salaryMin: 3800,
    salaryMax: 4800,
    salaryIsDisclosed: true,
    status: 'draft',
    openingsCount: 2,
    publishedAt: null,
  },
  {
    id: 'job-higienista-ocupacional',
    title: 'Especialista em Higiene Ocupacional e Medições Ambientais',
    slug: 'especialista-higiene-ocupacional-medicoes',
    department: 'Higiene Ocupacional',
    location: 'Belo Horizonte - MG (Com viagens em MG)',
    employmentType: 'CLT',
    experienceLevel: 'Especialista',
    description: 'Responsável pela realização de amostragens e quantificações de agentes físicos e químicos (ruído dosimétrico, calor IBUTG, vibração de corpo inteiro e mãos/braços, poeiras e fumos metálicos), emissão de relatórios de calibração e pareceres técnicos fundamentados nas NHOs da Fundacentro.',
    requirements: JSON.stringify([
      'Formação técnica ou superior em Química, Engenharia ou Segurança do Trabalho',
      'Certificação da ABHO ou sólida vivência comprovada com equipamentos de amostragem ocupacional',
      'Domínio das normas de higiene ocupacional NHO 01, NHO 06, NHO 09, NHO 10 e NHO 11',
      'Capacidade de redação técnica rigorosa e elaboração de pareceres conclusivos',
    ]),
    differentials: 'Mestrado ou pós-graduação na área de Higiene Ocupacional.',
    benefits: 'Pacote completo corporativo de benefícios, diárias de viagem, plano de saúde e previdência privada.',
    salaryMin: 7500,
    salaryMax: 9800,
    salaryIsDisclosed: true,
    status: 'draft',
    openingsCount: 1,
    publishedAt: null,
  },
];

export interface SeedOptions {
  autoPublishJobs?: boolean;
  adminUser?: {
    email: string;
    name: string;
    password: string;
    role?: 'super_admin' | 'recruiter' | 'viewer';
  };
}

export async function seedDatabase(db: any, options?: SeedOptions) {
  // 1. Etapas do pipeline
  for (const stage of DEFAULT_STAGES) {
    await db.insert(schema.recruitmentStages).values(stage).onConflictDoNothing();
  }

  // 2. Permissões RBAC
  for (const perm of DEFAULT_PERMISSIONS) {
    await db.insert(schema.adminPermissions).values(perm).onConflictDoNothing();
  }

  // 3. Vagas iniciais (somente publicadas se explicitamente solicitado em staging/testes)
  for (const job of INITIAL_JOB_POSTINGS) {
    const finalStatus = options?.autoPublishJobs ? 'published' : 'draft';
    await db.insert(schema.jobPostings).values({
      ...job,
      status: finalStatus,
      publishedAt: finalStatus === 'published' ? new Date() : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).onConflictDoNothing();
  }

  // 4. Criação reproduzível do usuário inicial administrativo (P1 Item 13)
  if (options?.adminUser) {
    const { hash, salt } = await hashPassword(options.adminUser.password);
    const mfaSecret = generateTotpSecret();

    await db
      .insert(schema.adminUsers)
      .values({
        id: 'usr-admin-bootstrap',
        name: options.adminUser.name,
        email: options.adminUser.email,
        passwordHash: hash,
        passwordSalt: salt,
        role: options.adminUser.role || 'super_admin',
        isActive: true,
        mfaEnabled: true,
        mfaSecret,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: schema.adminUsers.email,
        set: {
          passwordHash: hash,
          passwordSalt: salt,
          mfaSecret,
          mfaEnabled: true,
          isActive: true,
          updatedAt: new Date(),
        },
      });

    return {
      adminCreated: true,
      email: options.adminUser.email,
      mfaSecret,
      otpauthUri: `otpauth://totp/AJN%20Carreiras:${encodeURIComponent(options.adminUser.email)}?secret=${mfaSecret}&issuer=AJN%20Engenharia`,
    };
  }

  return { adminCreated: false };
}

// Suporte para execução direta via CLI (npx tsx worker/db/seed.ts)
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.includes('worker/db/seed')) {
  (async () => {
    const adminEmail = process.env.ADMIN_EMAIL || 'rh@ajnengenharia.com.br';
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword || adminPassword.length < 8) {
      console.error('[ERRO DE BOOTSTRAP] É obrigatório definir ADMIN_PASSWORD com no mínimo 8 caracteres.');
      console.error('Exemplo: ADMIN_EMAIL="rh@ajnengenharia.com.br" ADMIN_PASSWORD="<SENHA_FORTE>" npx tsx worker/db/seed.ts');
      process.exit(1);
    }

    console.log(`[BOOTSTRAP] Iniciando seed administrativo para: ${adminEmail}...`);

    try {
      const { resolve, join } = await import('node:path');
      const { existsSync, readdirSync } = await import('node:fs');
      const { execSync } = await import('node:child_process');

      const isRemote = process.argv.includes('--remote') || process.env.REMOTE === 'true';

      if (isRemote) {
        console.log('[BOOTSTRAP] Modo remoto detectado. Gerando comandos SQL em arquivo temporário seguro para Cloudflare D1...');
        const { hash, salt } = await hashPassword(adminPassword);
        const mfaSecret = generateTotpSecret();
        const escapeSql = (s: string) => s.replace(/'/g, "''");

        const sqlLines = [
          ...DEFAULT_STAGES.map((s) => `INSERT INTO recruitment_stages (id, name, stage_order, is_terminal_hired, is_terminal_rejected) VALUES ('${escapeSql(s.id)}', '${escapeSql(s.name)}', ${s.stageOrder}, ${s.isTerminalHired ? 1 : 0}, ${s.isTerminalRejected ? 1 : 0}) ON CONFLICT(id) DO NOTHING;`),
          ...DEFAULT_PERMISSIONS.map((p) => `INSERT INTO admin_permissions (id, role, permission) VALUES ('${escapeSql(p.id)}', '${escapeSql(p.role)}', '${escapeSql(p.permission)}') ON CONFLICT(id) DO NOTHING;`),
          `INSERT INTO admin_users (id, name, email, password_hash, password_salt, role, is_active, mfa_enabled, mfa_secret, created_at, updated_at) VALUES ('usr-admin-bootstrap', 'Administrador RH', '${escapeSql(adminEmail)}', '${escapeSql(hash)}', '${escapeSql(salt)}', 'super_admin', 1, 1, '${escapeSql(mfaSecret)}', unixepoch(), unixepoch()) ON CONFLICT(email) DO UPDATE SET password_hash='${escapeSql(hash)}', password_salt='${escapeSql(salt)}', mfa_secret='${escapeSql(mfaSecret)}', mfa_enabled=1, is_active=1, updated_at=unixepoch();`
        ].join('\n');

        const { writeFileSync, unlinkSync } = await import('node:fs');
        const { tmpdir } = await import('node:os');
        const { join: pathJoin } = await import('node:path');
        const { randomBytes } = await import('node:crypto');

        const tmpFile = pathJoin(tmpdir(), `d1-bootstrap-${randomBytes(8).toString('hex')}.sql`);
        writeFileSync(tmpFile, sqlLines, { mode: 0o600 });

        try {
          // Utiliza --file com permissões restritas em vez de --command para não expor credenciais em ps aux (P1 Item 5)
          execSync(`npx wrangler d1 execute prod-ajn-carreiras-d1 --config=./worker/wrangler.toml --remote --file="${tmpFile}"`, {
            stdio: 'inherit',
            cwd: process.cwd(),
          });
        } finally {
          try { unlinkSync(tmpFile); } catch {}
        }

        console.log('[BOOTSTRAP] Usuário inserido com sucesso no Cloudflare D1 remoto sem exposição em argumentos de processo (ps aux).');
        console.log(`[BOOTSTRAP] Administrador: ${adminEmail}`);
        if (process.stdout.isTTY) {
          console.log(`[BOOTSTRAP] Segredo MFA (TOTP): ${mfaSecret}`);
          console.log(`[BOOTSTRAP] URI TOTP: otpauth://totp/AJN%20Carreiras:${encodeURIComponent(adminEmail)}?secret=${mfaSecret}&issuer=AJN%20Engenharia`);
        } else {
          console.log('[BOOTSTRAP] Segredo MFA gerado e configurado no banco. Configure via autenticador seguro.');
        }
        return;
      }

      // Modo Local D1
      const d1Dir = resolve(process.cwd(), 'worker/.wrangler/state/v3/d1/miniflare-D1DatabaseObject');
      let sqlitePath: string | null = null;

      if (existsSync(d1Dir)) {
        const files = readdirSync(d1Dir);
        const sqliteFile = files.find((f: string) => f.endsWith('.sqlite') && !f.startsWith('metadata'));
        if (sqliteFile) {
          sqlitePath = join(d1Dir, sqliteFile);
        }
      }

      if (!sqlitePath) {
        console.log('[BOOTSTRAP] Banco D1 local não encontrado. Executando migração inicial...');
        execSync('npx wrangler d1 execute prod-ajn-carreiras-d1 --config=./worker/wrangler.toml --local --file=./worker/db/migrations/0000_curious_the_executioner.sql', {
          stdio: 'inherit',
          cwd: process.cwd(),
        });
        const files = readdirSync(d1Dir);
        const sqliteFile = files.find((f: string) => f.endsWith('.sqlite') && !f.startsWith('metadata'));
        if (sqliteFile) {
          sqlitePath = join(d1Dir, sqliteFile);
        }
      }

      if (!sqlitePath || !existsSync(sqlitePath)) {
        throw new Error('Não foi possível inicializar ou localizar o arquivo SQLite do D1 local.');
      }

      const Database = (await import('better-sqlite3')).default;
      const { drizzle } = await import('drizzle-orm/better-sqlite3');

      const sqlite = new Database(sqlitePath);
      sqlite.pragma('foreign_keys = ON');
      const db = drizzle(sqlite, { schema });

      const result = await seedDatabase(db, {
        adminUser: {
          email: adminEmail,
          name: process.env.ADMIN_NAME || 'Administrador RH',
          password: adminPassword,
          role: 'super_admin',
        },
        autoPublishJobs: false,
      });

      console.log('\n============================================================');
      console.log('AJN CARREIRAS — BOOTSTRAP ADMINISTRATIVO CONCLUÍDO NO D1 LOCAL');
      console.log('============================================================');
      console.log(`E-mail:       ${adminEmail}`);
      console.log(`Função:       super_admin`);
      console.log(`Status DB:    Usuário persistido no banco de dados D1 local`);
      if (process.stdout.isTTY) {
        console.log(`MFA Segredo:  ${result.mfaSecret}`);
        console.log(`URI TOTP:     ${result.otpauthUri}`);
      } else {
        console.log(`MFA Segredo:  [GERADO E SALVO NO D1 - TTY não detectado para evitar vazamento em log persistente]`);
      }
      console.log('============================================================\n');
    } catch (err) {
      console.error('[ERRO DE BOOTSTRAP] Falha ao persistir no D1:', err);
      process.exit(1);
    }
  })();
}
