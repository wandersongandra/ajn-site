import * as schema from './schema';
import { hashPassword, generateTotpSecret } from '../lib/crypto';
import type { BaseDatabase } from '../types';

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

    await db.insert(schema.adminUsers).values({
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
    }).onConflictDoNothing();

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
    // Em execução local fora do Worker, exibe o segredo TOTP e confirma o provisionamento
    const { hash, salt } = await hashPassword(adminPassword);
    const mfaSecret = generateTotpSecret();
    const otpauth = `otpauth://totp/AJN%20Carreiras:${encodeURIComponent(adminEmail)}?secret=${mfaSecret}&issuer=AJN%20Engenharia`;

    console.log('\n============================================================');
    console.log('AJN CARREIRAS — CREDENCIAIS ADMINISTRATIVAS GERADAS');
    console.log('============================================================');
    console.log(`E-mail:       ${adminEmail}`);
    console.log(`Função:       super_admin`);
    console.log(`MFA Segredo:  ${mfaSecret}`);
    console.log(`URI TOTP:     ${otpauth}`);
    console.log('Adicione este segredo no Google Authenticator ou Microsoft Authenticator.');
    console.log('============================================================\n');
  })();
}
