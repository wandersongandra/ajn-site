import { describe, it, expect } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { readFileSync, unlinkSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import * as schema from '../../worker/db/schema';
import { seedDatabase } from '../../worker/db/seed';
import { eq } from 'drizzle-orm';

describe('Testes de Backup, Exportação e Recuperação de Desastre (Disaster Recovery)', () => {
  const tempDbFile = resolve(process.cwd(), 'temp_backup_test.db');
  const tempBackupFile = resolve(process.cwd(), 'temp_backup_dump.db');

  it('deve exportar snapshot íntegro do banco SQLite e restaurar 100% dos dados', async () => {
    // 1. Cria banco de produção simulado em arquivo temporário
    if (existsSync(tempDbFile)) unlinkSync(tempDbFile);
    if (existsSync(tempBackupFile)) unlinkSync(tempBackupFile);

    const mainSqlite = new Database(tempDbFile);
    mainSqlite.pragma('foreign_keys = ON');

    const migrationSql = readFileSync(
      resolve(process.cwd(), 'worker/db/migrations/0000_curious_the_executioner.sql'),
      'utf8'
    );
    for (const stmt of migrationSql.split('--> statement-breakpoint')) {
      if (stmt.trim()) mainSqlite.exec(stmt.trim());
    }

    const mainDb = drizzle(mainSqlite, { schema });
    await seedDatabase(mainDb);

    // Insere registros adicionais
    mainDb.insert(schema.candidates).values({
      id: 'cand-backup-1',
      fullName: 'Patrícia Alvarenga',
      email: 'patricia@exemplo.com',
      phone: '(31) 98888-0000',
      city: 'Nova Lima',
      state: 'MG',
      isTalentPool: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).run();

    // 2. Executa backup consistente utilizando a API SQLite Online Backup
    await mainSqlite.backup(tempBackupFile);
    mainSqlite.close();

    // 3. Simula perda/corrupção do banco original (Disaster scenario)
    unlinkSync(tempDbFile);
    expect(existsSync(tempDbFile)).toBe(false);

    // 4. Restaura a partir do arquivo de backup
    expect(existsSync(tempBackupFile)).toBe(true);
    const restoredSqlite = new Database(tempBackupFile);
    restoredSqlite.pragma('foreign_keys = ON');
    const restoredDb = drizzle(restoredSqlite, { schema });

    // 5. Verifica integridade dos dados recuperados
    const restoredCandidate = restoredDb
      .select()
      .from(schema.candidates)
      .where(eq(schema.candidates.id, 'cand-backup-1'))
      .get();

    expect(restoredCandidate).toBeDefined();
    expect(restoredCandidate?.fullName).toBe('Patrícia Alvarenga');
    expect(restoredCandidate?.city).toBe('Nova Lima');

    const restoredJobs = restoredDb.select().from(schema.jobPostings).all();
    expect(restoredJobs.length).toBeGreaterThanOrEqual(3);

    restoredSqlite.close();
    unlinkSync(tempBackupFile);
  });
});
