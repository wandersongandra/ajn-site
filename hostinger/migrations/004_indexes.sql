-- Indices adicionais para listagens paginadas e ordenacao administrativa.
-- Aplicar apos 001_initial.sql, 002_hardening.sql e 003_least_privilege.sql.
-- Sintaxe compativel com MySQL 8+ e MariaDB 10+.

CREATE INDEX idx_jobs_status_published ON job_postings (status, published_at, created_at);
CREATE INDEX idx_candidates_created_at ON candidates (created_at);
CREATE INDEX idx_data_subject_requests_requested_at ON data_subject_requests (requested_at);
CREATE INDEX idx_applications_applied_at ON job_applications (job_id, applied_at);
