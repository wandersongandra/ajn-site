-- AJN Carreiras: primeira instalação MySQL/MariaDB em ambiente isolado.
-- Execute apenas em um banco novo e dedicado ao módulo de carreiras.
-- IDs UUID textuais e datas UNIX (segundos) preservam os contratos do Worker antigo.
-- Exige InnoDB e utf8mb4. Não migra nem modifica tabelas do WordPress.

CREATE TABLE candidates (
  id VARCHAR(36) PRIMARY KEY,
  full_name VARCHAR(200) NOT NULL,
  email VARCHAR(254) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  cpf_hash CHAR(64) NULL,
  cpf_masked VARCHAR(20) NULL,
  city VARCHAR(120) NOT NULL,
  state CHAR(2) NOT NULL,
  linkedin_url VARCHAR(500) NULL,
  portfolio_url VARCHAR(500) NULL,
  current_title VARCHAR(200) NULL,
  summary TEXT NULL,
  is_talent_pool TINYINT(1) NOT NULL DEFAULT 0,
  email_verification_code_hash CHAR(64) NULL,
  email_verification_expires_at BIGINT UNSIGNED NULL,
  email_verification_attempts INT UNSIGNED NOT NULL DEFAULT 0,
  created_at BIGINT UNSIGNED NOT NULL,
  updated_at BIGINT UNSIGNED NOT NULL,
  UNIQUE KEY idx_candidates_email (email),
  UNIQUE KEY idx_candidates_cpf_hash (cpf_hash),
  INDEX idx_candidates_location (state, city),
  INDEX idx_candidates_talent_pool (is_talent_pool)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE resumes (
  id VARCHAR(36) PRIMARY KEY,
  candidate_id VARCHAR(36) NOT NULL,
  file_key VARCHAR(255) NOT NULL UNIQUE,
  original_filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size_bytes BIGINT UNSIGNED NOT NULL,
  file_sha256 CHAR(64) NOT NULL,
  is_current TINYINT(1) NOT NULL DEFAULT 1,
  uploaded_at BIGINT UNSIGNED NOT NULL,
  INDEX idx_resumes_candidate_id (candidate_id),
  CONSTRAINT fk_resumes_candidate FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE certifications (
  id VARCHAR(36) PRIMARY KEY,
  candidate_id VARCHAR(36) NOT NULL,
  name VARCHAR(200) NOT NULL,
  issuing_organization VARCHAR(200) NULL,
  issue_date CHAR(7) NULL,
  expiration_date CHAR(7) NULL,
  credential_id VARCHAR(200) NULL,
  created_at BIGINT UNSIGNED NOT NULL,
  INDEX idx_certifications_candidate_id (candidate_id),
  INDEX idx_certifications_name (name),
  CONSTRAINT fk_certifications_candidate FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE work_experiences (
  id VARCHAR(36) PRIMARY KEY,
  candidate_id VARCHAR(36) NOT NULL,
  company_name VARCHAR(200) NOT NULL,
  role VARCHAR(200) NOT NULL,
  start_date CHAR(7) NOT NULL,
  end_date CHAR(7) NULL,
  is_current TINYINT(1) NOT NULL DEFAULT 0,
  description TEXT NULL,
  created_at BIGINT UNSIGNED NOT NULL,
  INDEX idx_work_experiences_candidate_id (candidate_id),
  CONSTRAINT fk_work_experiences_candidate FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE job_postings (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL UNIQUE,
  department VARCHAR(120) NOT NULL,
  location VARCHAR(200) NOT NULL,
  employment_type VARCHAR(40) NOT NULL,
  experience_level VARCHAR(40) NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT NOT NULL,
  differentials TEXT NULL,
  benefits TEXT NULL,
  salary_min INT UNSIGNED NULL,
  salary_max INT UNSIGNED NULL,
  salary_is_disclosed TINYINT(1) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  openings_count INT UNSIGNED NOT NULL DEFAULT 1,
  published_at BIGINT UNSIGNED NULL,
  closed_at BIGINT UNSIGNED NULL,
  created_at BIGINT UNSIGNED NOT NULL,
  updated_at BIGINT UNSIGNED NOT NULL,
  INDEX idx_jobs_status (status),
  INDEX idx_jobs_department (department)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE recruitment_stages (
  id VARCHAR(36) PRIMARY KEY,
  job_id VARCHAR(36) NULL,
  name VARCHAR(120) NOT NULL,
  stage_order INT UNSIGNED NOT NULL,
  is_terminal_hired TINYINT(1) NOT NULL DEFAULT 0,
  is_terminal_rejected TINYINT(1) NOT NULL DEFAULT 0,
  created_at BIGINT UNSIGNED NOT NULL,
  INDEX idx_stages_job_id (job_id),
  INDEX idx_stages_order (stage_order),
  CONSTRAINT fk_stages_job FOREIGN KEY (job_id) REFERENCES job_postings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE job_applications (
  id VARCHAR(36) PRIMARY KEY,
  job_id VARCHAR(36) NULL,
  candidate_id VARCHAR(36) NOT NULL,
  resume_id VARCHAR(36) NULL,
  current_stage_id VARCHAR(36) NULL,
  tracking_code VARCHAR(40) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  source VARCHAR(40) NOT NULL DEFAULT 'portal',
  recruiter_rating TINYINT UNSIGNED NULL,
  recruiter_notes TEXT NULL,
  rejection_reason TEXT NULL,
  recovery_code_hash CHAR(64) NULL,
  recovery_expires_at BIGINT UNSIGNED NULL,
  recovery_attempts INT UNSIGNED NOT NULL DEFAULT 0,
  applied_at BIGINT UNSIGNED NOT NULL,
  updated_at BIGINT UNSIGNED NOT NULL,
  INDEX idx_applications_job_id (job_id),
  INDEX idx_applications_candidate_id (candidate_id),
  INDEX idx_applications_status (status),
  INDEX idx_applications_stage (current_stage_id),
  CONSTRAINT fk_applications_job FOREIGN KEY (job_id) REFERENCES job_postings(id) ON DELETE SET NULL,
  CONSTRAINT fk_applications_candidate FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
  CONSTRAINT fk_applications_resume FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE SET NULL,
  CONSTRAINT fk_applications_stage FOREIGN KEY (current_stage_id) REFERENCES recruitment_stages(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE admin_users (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  email VARCHAR(254) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  password_salt VARCHAR(128) NULL,
  role VARCHAR(30) NOT NULL DEFAULT 'recruiter',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  mfa_enabled TINYINT(1) NOT NULL DEFAULT 0,
  mfa_secret TEXT NULL,
  pending_mfa_secret TEXT NULL,
  mfa_required TINYINT(1) NOT NULL DEFAULT 0,
  failed_attempts INT UNSIGNED NOT NULL DEFAULT 0,
  locked_until BIGINT UNSIGNED NULL,
  reset_token_hash CHAR(64) NULL,
  reset_expires_at BIGINT UNSIGNED NULL,
  reset_attempts INT UNSIGNED NOT NULL DEFAULT 0,
  created_at BIGINT UNSIGNED NOT NULL,
  updated_at BIGINT UNSIGNED NOT NULL,
  INDEX idx_admin_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE admin_sessions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  session_token_hash CHAR(64) NOT NULL UNIQUE,
  role VARCHAR(30) NOT NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(500) NULL,
  expires_at BIGINT UNSIGNED NOT NULL,
  created_at BIGINT UNSIGNED NOT NULL,
  INDEX idx_admin_sessions_user_id (user_id),
  INDEX idx_admin_sessions_expires_at (expires_at),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE admin_permissions (
  id VARCHAR(36) PRIMARY KEY,
  role VARCHAR(30) NOT NULL,
  permission VARCHAR(100) NOT NULL,
  created_at BIGINT UNSIGNED NOT NULL,
  UNIQUE KEY idx_admin_permissions_unique (role, permission),
  INDEX idx_admin_permissions_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE data_consents (
  id VARCHAR(36) PRIMARY KEY,
  candidate_id VARCHAR(36) NOT NULL,
  consent_type VARCHAR(60) NOT NULL,
  consent_version VARCHAR(30) NOT NULL,
  granted TINYINT(1) NOT NULL DEFAULT 1,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(500) NULL,
  consented_at BIGINT UNSIGNED NOT NULL,
  revoked_at BIGINT UNSIGNED NULL,
  INDEX idx_data_consents_candidate (candidate_id),
  INDEX idx_data_consents_type (consent_type),
  CONSTRAINT fk_consents_candidate FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE data_subject_requests (
  id VARCHAR(36) PRIMARY KEY,
  candidate_id VARCHAR(36) NOT NULL,
  request_type VARCHAR(30) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  reason TEXT NULL,
  requested_at BIGINT UNSIGNED NOT NULL,
  completed_at BIGINT UNSIGNED NULL,
  completed_by VARCHAR(36) NULL,
  INDEX idx_data_subject_requests_candidate (candidate_id),
  INDEX idx_data_subject_requests_status (status),
  CONSTRAINT fk_subject_request_candidate FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
  CONSTRAINT fk_subject_request_admin FOREIGN KEY (completed_by) REFERENCES admin_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE audit_logs (
  id VARCHAR(36) PRIMARY KEY,
  actor_id VARCHAR(36) NULL,
  actor_type VARCHAR(30) NOT NULL,
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(50) NOT NULL,
  resource_id VARCHAR(36) NULL,
  details_json TEXT NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(500) NULL,
  timestamp BIGINT UNSIGNED NOT NULL,
  INDEX idx_audit_logs_action (action),
  INDEX idx_audit_logs_resource (resource, resource_id),
  INDEX idx_audit_logs_timestamp (timestamp),
  INDEX idx_audit_logs_actor (actor_type, actor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Rate limiting atômico com bloqueio em banco, sem KV/DO.
CREATE TABLE request_rate_limits (
  bucket_key CHAR(64) PRIMARY KEY,
  window_started_at BIGINT UNSIGNED NOT NULL,
  hits INT UNSIGNED NOT NULL,
  expires_at BIGINT UNSIGNED NOT NULL,
  INDEX idx_rate_limits_expiry (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Etapas globais; nenhuma vaga é publicada automaticamente.
INSERT INTO recruitment_stages (id, name, stage_order, is_terminal_hired, is_terminal_rejected, created_at) VALUES
('stage-1-triagem', 'Triagem & Inscrição', 1, 0, 0, UNIX_TIMESTAMP()),
('stage-2-requisitos', 'Análise de Requisitos', 2, 0, 0, UNIX_TIMESTAMP()),
('stage-3-entrevista-rh', 'Entrevista RH', 3, 0, 0, UNIX_TIMESTAMP()),
('stage-4-entrevista-tecnica', 'Entrevista Técnica com Gestor', 4, 0, 0, UNIX_TIMESTAMP()),
('stage-5-proposta', 'Proposta & Exames Admissionais', 5, 0, 0, UNIX_TIMESTAMP()),
('stage-6-contratado', 'Contratado', 6, 1, 0, UNIX_TIMESTAMP()),
('stage-7-banco', 'Banco de Talentos / Declinado', 7, 0, 1, UNIX_TIMESTAMP());

-- Super admin tem acesso irrestrito no código; funções subordinadas têm permissões explícitas.
INSERT INTO admin_permissions (id, role, permission, created_at) VALUES
('rec-1','recruiter','jobs:read',UNIX_TIMESTAMP()),
('rec-2','recruiter','jobs:write',UNIX_TIMESTAMP()),
('rec-3','recruiter','candidates:read',UNIX_TIMESTAMP()),
('rec-4','recruiter','resumes:read',UNIX_TIMESTAMP()),
('rec-5','recruiter','applications:read',UNIX_TIMESTAMP()),
('rec-6','recruiter','applications:stage_move',UNIX_TIMESTAMP()),
('rec-7','recruiter','audit:read',UNIX_TIMESTAMP()),
('viewer-1','viewer','jobs:read',UNIX_TIMESTAMP()),
('viewer-2','viewer','candidates:read',UNIX_TIMESTAMP()),
('viewer-3','viewer','applications:read',UNIX_TIMESTAMP()),
('dpo-1','dpo','candidates:read',UNIX_TIMESTAMP()),
('dpo-2','dpo','lgpd:read',UNIX_TIMESTAMP()),
('dpo-3','dpo','lgpd:execute',UNIX_TIMESTAMP()),
('dpo-4','dpo','audit:read',UNIX_TIMESTAMP());
