import * as schema from './schema';
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
    status: 'published',
    openingsCount: 1,
    publishedAt: new Date('2026-11-01T10:00:00Z'),
  },
  {
    id: 'job-tec-seguranca',
    title: 'Técnico(a) em Segurança do Trabalho Pleno',
    slug: 'tecnico-seguranca-do-trabalho-pleno',
    department: 'Segurança do Trabalho',
    location: 'Belo Horizonte - MG (Presencial)',
    employmentType: 'CLT',
    experienceLevel: 'Pleno',
    description: 'Atuação em campo para inspeções de conformidade de NRs, medições preliminares de higiene ocupacional, suporte à CIPA/CIPAMIN e elaboração de relatórios técnicos de visitas.',
    requirements: JSON.stringify([
      'Curso Técnico em Segurança do Trabalho concluído com registro no MTE',
      'Mínimo de 3 anos de experiência em rotinas industriais ou de construção civil',
      'Conhecimento prático nas NRs 01, 05, 06, 10, 12, 18 e 35',
      'Habilidade na condução de DDS e treinamentos normativos',
    ]),
    differentials: 'Certificação de instrutor de NR-35 e NR-33.',
    benefits: 'Vale Refeição, Vale Transporte, Plano Odontológico, Seguro de Vida em grupo.',
    salaryMin: 3800,
    salaryMax: 4800,
    salaryIsDisclosed: true,
    status: 'published',
    openingsCount: 2,
    publishedAt: new Date('2026-11-03T10:00:00Z'),
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
    status: 'published',
    openingsCount: 1,
    publishedAt: new Date('2026-11-05T10:00:00Z'),
  },
];

export async function seedDatabase(db: any) {
  // 1. Etapas
  for (const stage of DEFAULT_STAGES) {
    await db.insert(schema.recruitmentStages).values(stage).onConflictDoNothing();
  }

  // 2. Permissões
  for (const perm of DEFAULT_PERMISSIONS) {
    await db.insert(schema.adminPermissions).values(perm).onConflictDoNothing();
  }

  // 3. Vagas iniciais
  for (const job of INITIAL_JOB_POSTINGS) {
    await db.insert(schema.jobPostings).values({
      ...job,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).onConflictDoNothing();
  }
}
