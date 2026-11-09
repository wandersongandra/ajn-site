CREATE TABLE `admin_permissions` (
	`id` text PRIMARY KEY NOT NULL,
	`role` text NOT NULL,
	`permission` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_admin_permissions_role` ON `admin_permissions` (`role`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_admin_permissions_unique` ON `admin_permissions` (`role`,`permission`);--> statement-breakpoint
CREATE TABLE `admin_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`session_token_hash` text NOT NULL,
	`role` text NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `admin_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admin_sessions_session_token_hash_unique` ON `admin_sessions` (`session_token_hash`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_admin_sessions_token` ON `admin_sessions` (`session_token_hash`);--> statement-breakpoint
CREATE INDEX `idx_admin_sessions_user_id` ON `admin_sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_admin_sessions_expires_at` ON `admin_sessions` (`expires_at`);--> statement-breakpoint
CREATE TABLE `admin_users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`password_salt` text NOT NULL,
	`role` text DEFAULT 'recruiter' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`mfa_enabled` integer DEFAULT false NOT NULL,
	`mfa_secret` text,
	`failed_attempts` integer DEFAULT 0 NOT NULL,
	`locked_until` integer,
	`reset_token_hash` text,
	`reset_expires_at` integer,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admin_users_email_unique` ON `admin_users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_admin_users_email` ON `admin_users` (`email`);--> statement-breakpoint
CREATE INDEX `idx_admin_users_role` ON `admin_users` (`role`);--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_id` text,
	`actor_type` text NOT NULL,
	`action` text NOT NULL,
	`resource` text NOT NULL,
	`resource_id` text,
	`details_json` text,
	`ip_address` text,
	`user_agent` text,
	`timestamp` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_audit_logs_action` ON `audit_logs` (`action`);--> statement-breakpoint
CREATE INDEX `idx_audit_logs_resource` ON `audit_logs` (`resource`,`resource_id`);--> statement-breakpoint
CREATE INDEX `idx_audit_logs_timestamp` ON `audit_logs` (`timestamp`);--> statement-breakpoint
CREATE INDEX `idx_audit_logs_actor` ON `audit_logs` (`actor_type`,`actor_id`);--> statement-breakpoint
CREATE TABLE `candidates` (
	`id` text PRIMARY KEY NOT NULL,
	`full_name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`cpf_hash` text,
	`cpf_masked` text,
	`city` text NOT NULL,
	`state` text NOT NULL,
	`linkedin_url` text,
	`portfolio_url` text,
	`current_title` text,
	`summary` text,
	`is_talent_pool` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_candidates_email` ON `candidates` (`email`);--> statement-breakpoint
CREATE INDEX `idx_candidates_cpf_hash` ON `candidates` (`cpf_hash`);--> statement-breakpoint
CREATE INDEX `idx_candidates_location` ON `candidates` (`state`,`city`);--> statement-breakpoint
CREATE INDEX `idx_candidates_talent_pool` ON `candidates` (`is_talent_pool`);--> statement-breakpoint
CREATE TABLE `certifications` (
	`id` text PRIMARY KEY NOT NULL,
	`candidate_id` text NOT NULL,
	`name` text NOT NULL,
	`issuing_organization` text,
	`issue_date` text,
	`expiration_date` text,
	`credential_id` text,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`candidate_id`) REFERENCES `candidates`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_certifications_candidate_id` ON `certifications` (`candidate_id`);--> statement-breakpoint
CREATE INDEX `idx_certifications_name` ON `certifications` (`name`);--> statement-breakpoint
CREATE TABLE `data_consents` (
	`id` text PRIMARY KEY NOT NULL,
	`candidate_id` text NOT NULL,
	`consent_type` text NOT NULL,
	`consent_version` text NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`consented_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`revoked_at` integer,
	FOREIGN KEY (`candidate_id`) REFERENCES `candidates`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_data_consents_candidate` ON `data_consents` (`candidate_id`);--> statement-breakpoint
CREATE INDEX `idx_data_consents_type` ON `data_consents` (`consent_type`);--> statement-breakpoint
CREATE TABLE `data_subject_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`candidate_id` text NOT NULL,
	`request_type` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`reason` text,
	`requested_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`completed_at` integer,
	`completed_by` text,
	FOREIGN KEY (`candidate_id`) REFERENCES `candidates`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`completed_by`) REFERENCES `admin_users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_data_subject_requests_candidate` ON `data_subject_requests` (`candidate_id`);--> statement-breakpoint
CREATE INDEX `idx_data_subject_requests_status` ON `data_subject_requests` (`status`);--> statement-breakpoint
CREATE TABLE `job_applications` (
	`id` text PRIMARY KEY NOT NULL,
	`job_id` text,
	`candidate_id` text NOT NULL,
	`resume_id` text,
	`current_stage_id` text,
	`tracking_code` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`source` text DEFAULT 'portal' NOT NULL,
	`recruiter_rating` integer,
	`recruiter_notes` text,
	`rejection_reason` text,
	`applied_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`job_id`) REFERENCES `job_postings`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`candidate_id`) REFERENCES `candidates`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`resume_id`) REFERENCES `resumes`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`current_stage_id`) REFERENCES `recruitment_stages`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `job_applications_tracking_code_unique` ON `job_applications` (`tracking_code`);--> statement-breakpoint
CREATE INDEX `idx_applications_job_id` ON `job_applications` (`job_id`);--> statement-breakpoint
CREATE INDEX `idx_applications_candidate_id` ON `job_applications` (`candidate_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_applications_tracking_code` ON `job_applications` (`tracking_code`);--> statement-breakpoint
CREATE INDEX `idx_applications_status` ON `job_applications` (`status`);--> statement-breakpoint
CREATE INDEX `idx_applications_stage` ON `job_applications` (`current_stage_id`);--> statement-breakpoint
CREATE TABLE `job_postings` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`department` text NOT NULL,
	`location` text NOT NULL,
	`employment_type` text NOT NULL,
	`experience_level` text NOT NULL,
	`description` text NOT NULL,
	`requirements` text NOT NULL,
	`differentials` text,
	`benefits` text,
	`salary_min` integer,
	`salary_max` integer,
	`salary_is_disclosed` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'published' NOT NULL,
	`openings_count` integer DEFAULT 1 NOT NULL,
	`published_at` integer,
	`closed_at` integer,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `job_postings_slug_unique` ON `job_postings` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_jobs_slug` ON `job_postings` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_jobs_status` ON `job_postings` (`status`);--> statement-breakpoint
CREATE INDEX `idx_jobs_department` ON `job_postings` (`department`);--> statement-breakpoint
CREATE TABLE `recruitment_stages` (
	`id` text PRIMARY KEY NOT NULL,
	`job_id` text,
	`name` text NOT NULL,
	`stage_order` integer NOT NULL,
	`is_terminal_hired` integer DEFAULT false NOT NULL,
	`is_terminal_rejected` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`job_id`) REFERENCES `job_postings`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_stages_job_id` ON `recruitment_stages` (`job_id`);--> statement-breakpoint
CREATE INDEX `idx_stages_order` ON `recruitment_stages` (`stage_order`);--> statement-breakpoint
CREATE TABLE `resumes` (
	`id` text PRIMARY KEY NOT NULL,
	`candidate_id` text NOT NULL,
	`file_key` text NOT NULL,
	`original_filename` text NOT NULL,
	`mime_type` text NOT NULL,
	`file_size_bytes` integer NOT NULL,
	`file_sha256` text NOT NULL,
	`is_current` integer DEFAULT true NOT NULL,
	`uploaded_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`candidate_id`) REFERENCES `candidates`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `resumes_file_key_unique` ON `resumes` (`file_key`);--> statement-breakpoint
CREATE INDEX `idx_resumes_candidate_id` ON `resumes` (`candidate_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_resumes_file_key` ON `resumes` (`file_key`);--> statement-breakpoint
CREATE TABLE `work_experiences` (
	`id` text PRIMARY KEY NOT NULL,
	`candidate_id` text NOT NULL,
	`company_name` text NOT NULL,
	`role` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text,
	`is_current` integer DEFAULT false NOT NULL,
	`description` text,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`candidate_id`) REFERENCES `candidates`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_work_experiences_candidate_id` ON `work_experiences` (`candidate_id`);