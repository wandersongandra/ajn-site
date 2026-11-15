-- Migration 006: Bloqueio progressivo de login por par (conta + IP) e fila assíncrona de alertas de segurança
-- Compatível com MySQL 8.0+ e MariaDB 10.5+ (sem IF NOT EXISTS em índices)

CREATE TABLE IF NOT EXISTS admin_login_locks (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  failed_attempts INT NOT NULL DEFAULT 0,
  locked_until BIGINT NULL,
  updated_at BIGINT NOT NULL,
  UNIQUE KEY idx_admin_login_locks_user_ip (user_id, ip_address),
  INDEX idx_admin_login_locks_locked_until (locked_until),
  CONSTRAINT fk_admin_login_locks_user FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS security_alert_queue (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  recipient_email VARCHAR(254) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  context_json TEXT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  attempts INT NOT NULL DEFAULT 0,
  created_at BIGINT NOT NULL,
  sent_at BIGINT NULL,
  last_error VARCHAR(500) NULL,
  INDEX idx_security_alert_queue_status_created (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
