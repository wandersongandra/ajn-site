import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as schema from '../../worker/db/schema';
import { createCarreirasApp } from '../../worker/index';
import { hashPassword } from '../../worker/lib/crypto';
import { seedDatabase } from '../../worker/db/seed';

describe('Testes Específicos de Segurança, Autorização e Uploads Maliciosos', () => {
  let sqlite: InstanceType<typeof Database>;
  let db: ReturnType<typeof drizzle<typeof schema>>;
  let app: ReturnType<typeof createCarreirasApp>;
  let mockR2Storage: Map<string, Uint8Array>;
  let mockR2Bucket: any;

  beforeEach(async () => {
    sqlite = new Database(':memory:');
    sqlite.pragma('foreign_keys = ON');

    const migrationSql = readFileSync(
      resolve(process.cwd(), 'worker/db/migrations/0000_curious_the_executioner.sql'),
      'utf8'
    );
    for (const stmt of migrationSql.split('--> statement-breakpoint')) {
      if (stmt.trim()) sqlite.exec(stmt.trim());
    }

    db = drizzle(sqlite, { schema });
    await seedDatabase(db);

    mockR2Storage = new Map<string, Uint8Array>();
    mockR2Bucket = {
      put: async (key: string, value: any) => {
        mockR2Storage.set(key, value instanceof Uint8Array ? value : new Uint8Array(value));
      },
      get: async (key: string) => {
        const val = mockR2Storage.get(key);
        if (!val) return null;
        return { body: val, size: val.length };
      },
      delete: async (key: string) => {
        mockR2Storage.delete(key);
      },
    };

    app = createCarreirasApp(() => db);
  });

  describe('1. Proteção de Upload Malicioso', () => {
    it('deve rejeitar script PHP ou shell com extensão falsa .pdf', async () => {
      const phpScript = new TextEncoder().encode('<?php echo "malware"; system($_GET["cmd"]); ?>');
      const form = new FormData();
      form.append('fullName', 'Atacante PHP');
      form.append('email', 'php@ataque.com');
      form.append('phone', '(31) 98888-2222');
      form.append('cpf', '00000000191');
      form.append('city', 'Belo Horizonte');
      form.append('state', 'MG');
      form.append('consentTerms', 'true');
      form.append('resume', new File([phpScript], 'shell.pdf', { type: 'application/pdf' }));

      const res = await app.request(
        '/api/applications/talent-pool',
        { method: 'POST', body: form },
        { DB: {} as any, RESUMES_BUCKET: mockR2Bucket, TURNSTILE_SECRET_KEY: 'test' } as any
      );

      expect(res.status).toBe(400);
      const data = (await res.json()) as any;
      expect(data.error).toContain('Assinatura binária inválida');
    });

    it('deve rejeitar arquivo que exceda o limite de 5 MB', async () => {
      // Cria buffer simulado de 5.5 MB
      const oversizedBuffer = new Uint8Array(5.5 * 1024 * 1024);
      // Inicia com magic bytes de PDF
      oversizedBuffer[0] = 0x25;
      oversizedBuffer[1] = 0x50;
      oversizedBuffer[2] = 0x44;
      oversizedBuffer[3] = 0x46;

      const form = new FormData();
      form.append('fullName', 'Arquivo Gigante');
      form.append('email', 'gigante@teste.com');
      form.append('phone', '(31) 98888-2222');
      form.append('cpf', '00000000191');
      form.append('city', 'Belo Horizonte');
      form.append('state', 'MG');
      form.append('consentTerms', 'true');
      form.append('resume', new File([oversizedBuffer], 'grande.pdf', { type: 'application/pdf' }));

      const res = await app.request(
        '/api/applications/talent-pool',
        { method: 'POST', body: form },
        { DB: {} as any, RESUMES_BUCKET: mockR2Bucket, TURNSTILE_SECRET_KEY: 'test' } as any
      );

      expect(res.status).toBe(400);
      const data = (await res.json()) as any;
      expect(data.error).toContain('limite máximo permitido de 5 MB');
    });
  });

  describe('2. Testes de Autorização e Acesso a Currículos R2 Privados', () => {
    it('tentativa de download de currículo sem autenticação deve retornar 401', async () => {
      const res = await app.request('/api/admin/candidates/cand-123/resume');
      expect(res.status).toBe(401);
      const data = (await res.json()) as any;
      expect(data.error).toContain('Autenticação necessária');
    });

    it('tentativa de login de usuário inativo deve ser bloqueada com 403', async () => {
      const pass = await hashPassword('InativoPass123!');
      await db.insert(schema.adminUsers).values({
        id: 'usr-inativo',
        name: 'Usuário Demitido',
        email: 'inativo@ajnengenharia.com.br',
        passwordHash: pass.hash,
        passwordSalt: pass.salt,
        role: 'recruiter',
        isActive: false, // Desativado
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await app.request('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'inativo@ajnengenharia.com.br', password: 'InativoPass123!' }),
      });

      expect(res.status).toBe(403);
      const data = (await res.json()) as any;
      expect(data.error).toContain('Usuário desativado');
    });

    it('tentativa de bloqueio por força bruta (5 tentativas incorretas)', async () => {
      const pass = await hashPassword('BruteForcePass123!');
      await db.insert(schema.adminUsers).values({
        id: 'usr-alvo',
        name: 'Usuário Alvo',
        email: 'alvo@ajnengenharia.com.br',
        passwordHash: pass.hash,
        passwordSalt: pass.salt,
        role: 'recruiter',
        isActive: true,
        failedAttempts: 4, // 4 tentativas anteriores
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // 5ª tentativa incorreta deve bloquear a conta por 15 minutos
      const res = await app.request('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'alvo@ajnengenharia.com.br', password: 'SenhaTotalmenteErrada' }),
      });

      expect(res.status).toBe(401);
      const data = (await res.json()) as any;
      expect(data.error).toContain('Conta bloqueada por 15 minutos');

      // Tentativa subsequente deve retornar 423 Locked
      const resLocked = await app.request('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'alvo@ajnengenharia.com.br', password: 'BruteForcePass123!' }),
      });

      expect(resLocked.status).toBe(423);
      const lockedData = (await resLocked.json()) as any;
      expect(lockedData.error).toContain('Conta bloqueada temporariamente');
    });
  });
});
