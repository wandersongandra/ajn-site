import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as schema from '../../worker/db/schema';
import { eq } from 'drizzle-orm';

describe('D1 SQLite Database Schema & Integrity Tests', () => {
  let sqlite: InstanceType<typeof Database>;
  let db: ReturnType<typeof drizzle<typeof schema>>;

  beforeEach(() => {
    sqlite = new Database(':memory:');
    sqlite.pragma('foreign_keys = ON');

    // Executa a migration SQL gerada pelo Drizzle
    const migrationSql = readFileSync(
      resolve(process.cwd(), 'worker/db/migrations/0000_curious_the_executioner.sql'),
      'utf8'
    );

    // O Drizzle separa os comandos por `--> statement-breakpoint`
    const statements = migrationSql.split('--> statement-breakpoint');
    for (const stmt of statements) {
      const trimmed = stmt.trim();
      if (trimmed) {
        sqlite.exec(trimmed);
      }
    }

    db = drizzle(sqlite, { schema });
  });

  it('deve aplicar todas as 13 tabelas com integridade relacional habilitada', () => {
    const tables = sqlite
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
      .all() as { name: string }[];
    const tableNames = tables.map((t) => t.name);

    expect(tableNames).toContain('candidates');
    expect(tableNames).toContain('resumes');
    expect(tableNames).toContain('certifications');
    expect(tableNames).toContain('work_experiences');
    expect(tableNames).toContain('job_postings');
    expect(tableNames).toContain('recruitment_stages');
    expect(tableNames).toContain('job_applications');
    expect(tableNames).toContain('admin_users');
    expect(tableNames).toContain('admin_sessions');
    expect(tableNames).toContain('admin_permissions');
    expect(tableNames).toContain('data_consents');
    expect(tableNames).toContain('data_subject_requests');
    expect(tableNames).toContain('audit_logs');
  });

  it('deve criar e consultar vaga com slug único', () => {
    const jobData = {
      id: 'job-1',
      title: 'Engenheiro de Segurança do Trabalho',
      slug: 'engenheiro-de-seguranca-do-trabalho',
      department: 'Segurança do Trabalho',
      location: 'Belo Horizonte - MG',
      employmentType: 'CLT',
      experienceLevel: 'Sênior',
      description: 'Elaboração e coordenação de PGR, LTCAT e auditorias.',
      requirements: JSON.stringify(['Graduação em Engenharia', 'Pós em Segurança do Trabalho', 'Registro ativo no CREA']),
      differentials: 'Experiência com eSocial e auditorias de NRs',
      benefits: 'Vale Alimentação, Plano de Saúde, Seguro de Vida',
      salaryMin: 8500,
      salaryMax: 11000,
      salaryIsDisclosed: true,
      status: 'published',
      openingsCount: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    db.insert(schema.jobPostings).values(jobData).run();

    const inserted = db.select().from(schema.jobPostings).where(eq(schema.jobPostings.id, 'job-1')).get();
    expect(inserted).toBeDefined();
    expect(inserted?.title).toBe('Engenheiro de Segurança do Trabalho');
    expect(inserted?.slug).toBe('engenheiro-de-seguranca-do-trabalho');

    // Tentativa de duplicidade de slug deve falhar
    expect(() => {
      db.insert(schema.jobPostings).values({
        ...jobData,
        id: 'job-2',
      }).run();
    }).toThrow();
  });

  it('deve inserir candidato, currículo e respeitar cascade delete', () => {
    const candidateId = 'cand-123';
    db.insert(schema.candidates).values({
      id: candidateId,
      fullName: 'Candidato Teste Silva',
      email: 'candidato.teste@exemplo.com',
      phone: '(31) 99999-8888',
      city: 'Belo Horizonte',
      state: 'MG',
      isTalentPool: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).run();

    db.insert(schema.resumes).values({
      id: 'res-456',
      candidateId,
      fileKey: `resumes/${candidateId}/curriculo.pdf`,
      originalFilename: 'curriculo_teste.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 102400,
      fileSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      isCurrent: true,
      uploadedAt: new Date(),
    }).run();

    db.insert(schema.certifications).values({
      id: 'cert-789',
      candidateId,
      name: 'NR-10 Básico e SEP',
      issuingOrganization: 'SENAI',
      createdAt: new Date(),
    }).run();

    // Registra consentimento LGPD
    db.insert(schema.dataConsents).values({
      id: 'consent-1',
      candidateId,
      consentType: 'privacy_policy',
      consentVersion: '1.0',
      ipAddress: '127.0.0.1',
      userAgent: 'Vitest/TestRunner',
      consentedAt: new Date(),
    }).run();

    // Verifica que registros existem
    const resumeBefore = db.select().from(schema.resumes).where(eq(schema.resumes.id, 'res-456')).get();
    expect(resumeBefore).toBeDefined();

    // Deletar o candidato deve disparar cascade delete no SQLite para currículos, certificações e consentimentos
    db.delete(schema.candidates).where(eq(schema.candidates.id, candidateId)).run();

    const resumeAfter = db.select().from(schema.resumes).where(eq(schema.resumes.id, 'res-456')).get();
    expect(resumeAfter).toBeUndefined();

    const certAfter = db.select().from(schema.certifications).where(eq(schema.certifications.id, 'cert-789')).get();
    expect(certAfter).toBeUndefined();

    const consentAfter = db.select().from(schema.dataConsents).where(eq(schema.dataConsents.id, 'consent-1')).get();
    expect(consentAfter).toBeUndefined();
  });

  it('deve impedir criação de candidatura com código de rastreamento duplicado', () => {
    db.insert(schema.candidates).values({
      id: 'c-1',
      fullName: 'Ana Pereira',
      email: 'ana@exemplo.com',
      phone: '(31) 98888-7777',
      city: 'Contagem',
      state: 'MG',
      createdAt: new Date(),
      updatedAt: new Date(),
    }).run();

    db.insert(schema.jobApplications).values({
      id: 'app-1',
      candidateId: 'c-1',
      trackingCode: 'AJN-2026-TRACK1',
      status: 'active',
      source: 'portal',
      appliedAt: new Date(),
      updatedAt: new Date(),
    }).run();

    expect(() => {
      db.insert(schema.jobApplications).values({
        id: 'app-2',
        candidateId: 'c-1',
        trackingCode: 'AJN-2026-TRACK1', // Código duplicado
        status: 'active',
        source: 'portal',
        appliedAt: new Date(),
        updatedAt: new Date(),
      }).run();
    }).toThrow();
  });

  it('deve registrar logs de auditoria imutáveis com formato padronizado', () => {
    db.insert(schema.auditLogs).values({
      id: 'audit-log-1',
      actorId: 'admin-usr-1',
      actorType: 'admin',
      action: 'RESUME_DOWNLOADED',
      resource: 'resume',
      resourceId: 'res-456',
      detailsJson: JSON.stringify({ reason: 'triagem_tecnica', candidateId: 'c-1' }),
      ipAddress: '192.168.1.10',
      userAgent: 'Mozilla/5.0 Admin',
      timestamp: new Date(),
    }).run();

    const log = db.select().from(schema.auditLogs).where(eq(schema.auditLogs.id, 'audit-log-1')).get();
    expect(log).toBeDefined();
    expect(log?.action).toBe('RESUME_DOWNLOADED');
    expect(log?.actorType).toBe('admin');
    expect(JSON.parse(log!.detailsJson!)).toEqual({ reason: 'triagem_tecnica', candidateId: 'c-1' });
  });
});
