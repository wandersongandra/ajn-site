import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// 1. Candidatos (Banco de talentos e candidatos a vagas)
export const candidates = sqliteTable('candidates', {
  id: text('id').primaryKey(),
  fullName: text('full_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  cpfHash: text('cpf_hash'), // Hash SHA-256 para prevenção de duplicidade / integridade LGPD
  cpfMasked: text('cpf_masked'), // Ex: '***.***.123-45' para identificação segura
  city: text('city').notNull(),
  state: text('state').notNull(), // Sigla do estado (MG, SP, etc.)
  linkedinUrl: text('linkedin_url'),
  portfolioUrl: text('portfolio_url'),
  currentTitle: text('current_title'),
  summary: text('summary'),
  isTalentPool: integer('is_talent_pool', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
}, (table) => [
  index('idx_candidates_email').on(table.email),
  index('idx_candidates_cpf_hash').on(table.cpfHash),
  index('idx_candidates_location').on(table.state, table.city),
  index('idx_candidates_talent_pool').on(table.isTalentPool),
]);

// 2. Currículos (Armazenamento privado em Cloudflare R2)
export const resumes = sqliteTable('resumes', {
  id: text('id').primaryKey(),
  candidateId: text('candidate_id').notNull().references(() => candidates.id, { onDelete: 'cascade' }),
  fileKey: text('file_key').notNull().unique(), // R2 key: resumes/<candidateId>/<uuid>.<ext>
  originalFilename: text('original_filename').notNull(),
  mimeType: text('mime_type').notNull(), // ex: application/pdf
  fileSizeBytes: integer('file_size_bytes').notNull(),
  fileSha256: text('file_sha256').notNull(),
  isCurrent: integer('is_current', { mode: 'boolean' }).notNull().default(true),
  uploadedAt: integer('uploaded_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
}, (table) => [
  index('idx_resumes_candidate_id').on(table.candidateId),
  uniqueIndex('idx_resumes_file_key').on(table.fileKey),
]);

// 3. Certificações (NRs, Laudos, Gestão, Conselhos Regionais)
export const certifications = sqliteTable('certifications', {
  id: text('id').primaryKey(),
  candidateId: text('candidate_id').notNull().references(() => candidates.id, { onDelete: 'cascade' }),
  name: text('name').notNull(), // Ex: 'NR-10', 'NR-35', 'PGR & LTCAT', 'CREA/CONFEA'
  issuingOrganization: text('issuing_organization'),
  issueDate: text('issue_date'), // YYYY-MM
  expirationDate: text('expiration_date'), // YYYY-MM
  credentialId: text('credential_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
}, (table) => [
  index('idx_certifications_candidate_id').on(table.candidateId),
  index('idx_certifications_name').on(table.name),
]);

// 4. Experiências profissionais
export const workExperiences = sqliteTable('work_experiences', {
  id: text('id').primaryKey(),
  candidateId: text('candidate_id').notNull().references(() => candidates.id, { onDelete: 'cascade' }),
  companyName: text('company_name').notNull(),
  role: text('role').notNull(),
  startDate: text('start_date').notNull(), // YYYY-MM
  endDate: text('end_date'), // YYYY-MM ou null se atual
  isCurrent: integer('is_current', { mode: 'boolean' }).notNull().default(false),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
}, (table) => [
  index('idx_work_experiences_candidate_id').on(table.candidateId),
]);

// 5. Vagas
export const jobPostings = sqliteTable('job_postings', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  department: text('department').notNull(), // 'Segurança do Trabalho', 'Engenharia', 'Higiene Ocupacional', 'Projetos', 'Administrativo'
  location: text('location').notNull(), // 'Belo Horizonte - MG', 'Híbrido', 'Remoto'
  employmentType: text('employment_type').notNull(), // 'CLT', 'PJ', 'Estágio', 'Temporário'
  experienceLevel: text('experience_level').notNull(), // 'Júnior', 'Pleno', 'Sênior', 'Especialista'
  description: text('description').notNull(),
  requirements: text('requirements').notNull(), // Texto ou JSON com lista de requisitos
  differentials: text('differentials'),
  benefits: text('benefits'),
  salaryMin: integer('salary_min'),
  salaryMax: integer('salary_max'),
  salaryIsDisclosed: integer('salary_is_disclosed', { mode: 'boolean' }).notNull().default(false),
  status: text('status').notNull().default('published'), // 'draft', 'published', 'paused', 'closed', 'archived'
  openingsCount: integer('openings_count').notNull().default(1),
  publishedAt: integer('published_at', { mode: 'timestamp' }),
  closedAt: integer('closed_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
}, (table) => [
  uniqueIndex('idx_jobs_slug').on(table.slug),
  index('idx_jobs_status').on(table.status),
  index('idx_jobs_department').on(table.department),
]);

// 6. Etapas de recrutamento (Pipeline do processo seletivo)
export const recruitmentStages = sqliteTable('recruitment_stages', {
  id: text('id').primaryKey(),
  jobId: text('job_id').references(() => jobPostings.id, { onDelete: 'cascade' }), // null = etapa global padrão
  name: text('name').notNull(),
  stageOrder: integer('stage_order').notNull(),
  isTerminalHired: integer('is_terminal_hired', { mode: 'boolean' }).notNull().default(false),
  isTerminalRejected: integer('is_terminal_rejected', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
}, (table) => [
  index('idx_stages_job_id').on(table.jobId),
  index('idx_stages_order').on(table.stageOrder),
]);

// 7. Candidaturas
export const jobApplications = sqliteTable('job_applications', {
  id: text('id').primaryKey(),
  jobId: text('job_id').references(() => jobPostings.id, { onDelete: 'set null' }), // null se banco geral
  candidateId: text('candidate_id').notNull().references(() => candidates.id, { onDelete: 'cascade' }),
  resumeId: text('resume_id').references(() => resumes.id, { onDelete: 'set null' }),
  currentStageId: text('current_stage_id').references(() => recruitmentStages.id),
  trackingCode: text('tracking_code').notNull().unique(), // Ex: 'AJN-2026-X8K9M'
  status: text('status').notNull().default('active'), // 'active', 'hired', 'rejected', 'withdrawn'
  source: text('source').notNull().default('portal'), // 'portal', 'linkedin', 'indicacao', 'talentos'
  recruiterRating: integer('recruiter_rating'), // 1 a 5 estrelas - exclusivamente avaliação humana, sem triagem automatizada por IA
  recruiterNotes: text('recruiter_notes'),
  rejectionReason: text('rejection_reason'),
  appliedAt: integer('applied_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
}, (table) => [
  index('idx_applications_job_id').on(table.jobId),
  index('idx_applications_candidate_id').on(table.candidateId),
  uniqueIndex('idx_applications_tracking_code').on(table.trackingCode),
  index('idx_applications_status').on(table.status),
  index('idx_applications_stage').on(table.currentStageId),
]);

// 8. Usuários administrativos
export const adminUsers = sqliteTable('admin_users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(), // PBKDF2/WebCrypto hash seguro
  passwordSalt: text('password_salt').notNull(),
  role: text('role').notNull().default('recruiter'), // 'super_admin', 'recruiter', 'viewer'
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  mfaEnabled: integer('mfa_enabled', { mode: 'boolean' }).notNull().default(false),
  mfaSecret: text('mfa_secret'), // TOTP secret cifrado
  failedAttempts: integer('failed_attempts').notNull().default(0),
  lockedUntil: integer('locked_until', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
}, (table) => [
  uniqueIndex('idx_admin_users_email').on(table.email),
  index('idx_admin_users_role').on(table.role),
]);

// 9. Sessões e permissões administrativas
export const adminSessions = sqliteTable('admin_sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => adminUsers.id, { onDelete: 'cascade' }),
  sessionTokenHash: text('session_token_hash').notNull().unique(), // SHA-256 do token bearer/cookie
  role: text('role').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
}, (table) => [
  uniqueIndex('idx_admin_sessions_token').on(table.sessionTokenHash),
  index('idx_admin_sessions_user_id').on(table.userId),
  index('idx_admin_sessions_expires_at').on(table.expiresAt),
]);

export const adminPermissions = sqliteTable('admin_permissions', {
  id: text('id').primaryKey(),
  role: text('role').notNull(), // 'super_admin', 'recruiter', 'viewer'
  permission: text('permission').notNull(), // Ex: 'jobs:write', 'candidates:read', 'resumes:read', 'applications:stage_move', 'lgpd:delete', 'admin:manage'
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
}, (table) => [
  index('idx_admin_permissions_role').on(table.role),
  uniqueIndex('idx_admin_permissions_unique').on(table.role, table.permission),
]);

// 10. Autorizações e registros de tratamento de dados (LGPD)
export const dataConsents = sqliteTable('data_consents', {
  id: text('id').primaryKey(),
  candidateId: text('candidate_id').notNull().references(() => candidates.id, { onDelete: 'cascade' }),
  consentType: text('consent_type').notNull(), // 'privacy_policy', 'recruitment_process', 'talent_pool_retention'
  consentVersion: text('consent_version').notNull(), // Ex: '1.0'
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  consentedAt: integer('consented_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  revokedAt: integer('revoked_at', { mode: 'timestamp' }),
}, (table) => [
  index('idx_data_consents_candidate').on(table.candidateId),
  index('idx_data_consents_type').on(table.consentType),
]);

export const dataSubjectRequests = sqliteTable('data_subject_requests', {
  id: text('id').primaryKey(),
  candidateId: text('candidate_id').notNull().references(() => candidates.id, { onDelete: 'cascade' }),
  requestType: text('request_type').notNull(), // 'deletion', 'export', 'rectification'
  status: text('status').notNull().default('pending'), // 'pending', 'processing', 'completed', 'rejected'
  reason: text('reason'),
  requestedAt: integer('requested_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  completedBy: text('completed_by').references(() => adminUsers.id),
}, (table) => [
  index('idx_data_subject_requests_candidate').on(table.candidateId),
  index('idx_data_subject_requests_status').on(table.status),
]);

// 11. Logs de auditoria (Registro imutável de eventos de segurança e tratamento)
export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey(),
  actorId: text('actor_id'), // ID do usuário admin ou do candidato
  actorType: text('actor_type').notNull(), // 'admin', 'candidate', 'system', 'anonymous'
  action: text('action').notNull(), // Ex: 'LOGIN_SUCCESS', 'RESUME_DOWNLOADED', 'STAGE_CHANGED', 'LGPD_DELETION'
  resource: text('resource').notNull(), // 'auth', 'job', 'candidate', 'resume', 'application', 'lgpd'
  resourceId: text('resource_id'),
  detailsJson: text('details_json'), // Dados estruturados sem PII em texto puro
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
}, (table) => [
  index('idx_audit_logs_action').on(table.action),
  index('idx_audit_logs_resource').on(table.resource, table.resourceId),
  index('idx_audit_logs_timestamp').on(table.timestamp),
  index('idx_audit_logs_actor').on(table.actorType, table.actorId),
]);
