-- Migration 005: Hardening de seguranca maxima (PII cifrada em repouso, tracking token 256 bits, codigos de recuperacao MFA, step-up auth, cadeia de hash em audit_logs).
-- Aplicar apos 001_initial.sql, 002_hardening.sql, 003_least_privilege.sql e 004_indexes.sql.
-- Sintaxe compativel com MySQL 8+ e MariaDB 10+ (sem IF NOT EXISTS em CREATE INDEX).

ALTER TABLE candidates
  ADD COLUMN phone_encrypted TEXT NULL AFTER phone,
  ADD COLUMN cpf_encrypted TEXT NULL AFTER cpf_masked,
  ADD COLUMN key_version VARCHAR(16) NOT NULL DEFAULT 'v1' AFTER cpf_encrypted;

ALTER TABLE job_applications
  MODIFY COLUMN tracking_code VARCHAR(96) NOT NULL,
  ADD COLUMN tracking_token_hash CHAR(64) NULL AFTER tracking_code,
  ADD COLUMN tracking_expires_at BIGINT UNSIGNED NULL AFTER tracking_token_hash;

CREATE INDEX idx_applications_tracking_hash ON job_applications (tracking_token_hash);

ALTER TABLE admin_users
  MODIFY COLUMN mfa_required TINYINT(1) NOT NULL DEFAULT 1,
  ADD COLUMN known_ips_json TEXT NULL AFTER mfa_last_counter;

UPDATE admin_users SET mfa_required = 1;

ALTER TABLE admin_sessions
  ADD COLUMN step_up_until BIGINT UNSIGNED NULL DEFAULT NULL AFTER absolute_expires_at;

CREATE TABLE admin_recovery_codes (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  code_hash CHAR(64) NOT NULL,
  used_at BIGINT UNSIGNED NULL,
  created_at BIGINT UNSIGNED NOT NULL,
  INDEX idx_recovery_codes_user (user_id),
  CONSTRAINT fk_recovery_codes_user FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE audit_logs
  ADD COLUMN prev_hash CHAR(64) NULL AFTER user_agent,
  ADD COLUMN entry_hash CHAR(64) NULL AFTER prev_hash;

CREATE INDEX idx_audit_logs_entry_hash ON audit_logs (entry_hash);

INSERT INTO admin_permissions (id, role, permission, created_at) VALUES
  ('rec-7', 'recruiter', 'candidates:export', UNIX_TIMESTAMP()),
  ('dpo-5', 'dpo', 'candidates:export', UNIX_TIMESTAMP());
