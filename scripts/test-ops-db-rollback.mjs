import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const ROOT_DIR = resolve(dirname(__filename), '..');
const HOSTINGER_DIR = join(ROOT_DIR, 'hostinger');
const MIGRATE_SCRIPT = join(HOSTINGER_DIR, 'migrate.php');
const BACKUP_SH = join(HOSTINGER_DIR, 'ops', 'backup.sh');
const ROLLBACK_SH = join(HOSTINGER_DIR, 'ops', 'rollback.sh');
const INIT_CONFIG_PHP = join(HOSTINGER_DIR, 'ops', 'init-config.php');
const CONFIG_EXAMPLE = join(HOSTINGER_DIR, 'config.example.php');

function toBashPath(winOrPosixPath) {
  if (process.platform === 'win32') {
    return execFileSync('wsl', ['-e', 'wslpath', '-a', winOrPosixPath], { encoding: 'utf8' }).trim();
  }
  return winOrPosixPath;
}

function runBash(command, envOverrides = {}) {
  const envPrefix = Object.entries(envOverrides)
    .map(([k, v]) => `export ${k}=${JSON.stringify(String(v))}`)
    .join('; ');
  const fullCmd = envPrefix ? `${envPrefix}; ${command}` : command;
  if (process.platform === 'win32') {
    return execFileSync('wsl', ['-e', 'bash', '-lc', fullCmd], { encoding: 'utf8' });
  }
  return execFileSync('bash', ['-lc', fullCmd], { encoding: 'utf8' });
}

function runPhpMigrate(configPath, extraArgs = []) {
  return execFileSync('php', ['-d', 'extension=sodium', MIGRATE_SCRIPT, ...extraArgs], {
    encoding: 'utf8',
    env: { ...process.env, AJN_CONFIG_PATH: configPath },
  });
}

function inspectSqliteState(dbPath) {
  const phpCode = `
    $pdo = new PDO('sqlite:' . $argv[1], null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $tables = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name ASC")->fetchAll(PDO::FETCH_COLUMN);
    $indexes = $pdo->query("SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%' ORDER BY name ASC")->fetchAll(PDO::FETCH_COLUMN);
    $columns = [];
    foreach ($tables as $t) {
      $cols = $pdo->query('PRAGMA table_info("' . str_replace('"', '""', $t) . '")')->fetchAll(PDO::FETCH_ASSOC);
      $columns[$t] = array_map(static fn($c) => $c['name'] . ':' . $c['type'], $cols);
    }
    $jobs = $pdo->query("SELECT id, title, slug, status FROM job_postings ORDER BY id ASC")->fetchAll(PDO::FETCH_ASSOC);
    $candidates = $pdo->query("SELECT id, full_name, email, phone FROM candidates ORDER BY id ASC")->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['tables' => $tables, 'indexes' => $indexes, 'columns' => $columns, 'jobs' => $jobs, 'candidates' => $candidates], JSON_UNESCAPED_UNICODE);
  `;
  const raw = execFileSync('php', ['-r', phpCode, dbPath], { encoding: 'utf8' });
  return JSON.parse(raw);
}

test('Item 3.b: backup real em 004 -> migra 006 -> rollback.sh remove tabelas 005/006/schema_migrations e restaura estado 004 -> migra novamente', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'ajn-real-db-rollback-'));
  try {
    const publicDir = join(tmp, 'staging-site', 'public_html');
    const privateDir = join(tmp, 'ajn-private-staging');
    const backupsDir = join(tmp, 'backups');
    const sql004Dir = join(tmp, 'sql-004');
    const dbPath = join(tmp, 'staging-real.sqlite');
    const configPath = join(tmp, 'staging.config.php');

    mkdirSync(join(publicDir, 'api'), { recursive: true });
    mkdirSync(privateDir, { recursive: true });
    mkdirSync(backupsDir, { recursive: true });
    mkdirSync(sql004Dir, { recursive: true });

    writeFileSync(join(publicDir, '.htaccess'), 'Options -Indexes\n', 'utf8');
    writeFileSync(join(publicDir, 'index.html'), '<html><body>v004-staging</body></html>\n', 'utf8');
    writeFileSync(join(publicDir, 'api', 'index.php'), '<?php // api\n', 'utf8');
    writeFileSync(join(privateDir, 'bootstrap.php'), '<?php // bootstrap\n', 'utf8');

    for (const m4 of ['001_initial.sql', '002_hardening.sql', '003_least_privilege.sql', '004_indexes.sql']) {
      copyFileSync(join(HOSTINGER_DIR, 'migrations', m4), join(sql004Dir, m4));
    }

    execFileSync(
      'php',
      [
        '-r',
        `file_put_contents($argv[1], "<?php\\nreturn " . var_export([
          'environment' => 'staging',
          'app_url' => 'https://staging.ajnengenharia.com.br',
          'database' => ['dsn' => 'sqlite:' . $argv[2]],
          'resume_directory' => $argv[3],
          'encryption_key' => str_repeat('a', 64),
          'turnstile_secret_key' => '1x0000000000000000000000000000000AA',
          'security_alert_email' => 'faleconosco@ajnengenharia.com.br',
        ], true) . ";\\n");`,
        configPath,
        dbPath,
        join(tmp, 'resumes'),
      ],
      { encoding: 'utf8' }
    );

    // 1. Semeia DB real no estado 004 (sem schema_migrations) + registros reais
    runPhpMigrate(configPath, [`--migrations-dir=${sql004Dir}`]);
    execFileSync(
      'php',
      [
        '-r',
        `
        $pdo = new PDO('sqlite:' . $argv[1], null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
        $pdo->exec('DROP TABLE schema_migrations');
        $now = 1700000000;
        $pdo->prepare("INSERT INTO job_postings (id, title, slug, department, location, employment_type, experience_level, description, requirements, status, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)")
          ->execute(['00000000-0000-4000-8000-000000000101', 'Engenheiro 004', 'engenheiro-004', 'Engenharia', 'BH / MG', 'CLT', 'Pleno', 'Descricao completa da vaga', 'Requisitos basicos', 'published', $now, $now]);
        $pdo->prepare("INSERT INTO candidates (id, full_name, email, phone, city, state, is_talent_pool, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?)")
          ->execute(['00000000-0000-4000-8000-000000000201', 'Candidato 004', 'cand004@example.invalid', '(31) 99999-1234', 'BH', 'MG', 0, $now, $now]);
        `,
        dbPath,
      ],
      { encoding: 'utf8' }
    );

    const stateAt004 = inspectSqliteState(dbPath);
    assert.equal(stateAt004.tables.includes('schema_migrations'), false);
    assert.equal(stateAt004.tables.includes('admin_login_locks'), false);
    assert.equal(stateAt004.tables.includes('security_alert_queue'), false);
    assert.equal(stateAt004.columns.candidates.some((c) => c.startsWith('phone_encrypted:')), false);
    assert.equal(stateAt004.jobs.length, 1);
    assert.equal(stateAt004.candidates.length, 1);

    // 2. Backup real em 004 via hostinger/ops/backup.sh (--db-driver=sqlite)
    const shBackup = toBashPath(BACKUP_SH);
    const shRollback = toBashPath(ROLLBACK_SH);
    const shPublic = toBashPath(publicDir);
    const shPrivate = toBashPath(privateDir);
    const shBackups = toBashPath(backupsDir);
    const shDb = toBashPath(dbPath);

    runBash(
      `"${shBackup}" --env=staging --public-dir="${shPublic}" --private-dir="${shPrivate}" --backups-dir="${shBackups}" --db-driver=sqlite --db-name="${shDb}"`,
      { BACKUP_PASSPHRASE: 'RealRollback#Pass2026!' }
    );

    // 3. Simula deploy + upgrade real 004 -> 006 (novas tabelas, colunas e alteracao destrutiva no webroot/DB)
    const baselineOut = runPhpMigrate(configPath, ['--baseline=004']);
    assert.match(baselineOut, /marcadas=4/);
    const upgradeOut = runPhpMigrate(configPath);
    assert.match(upgradeOut, /aplicadas=2/);

    execFileSync(
      'php',
      [
        '-r',
        `
        $pdo = new PDO('sqlite:' . $argv[1], null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
        $pdo->prepare("INSERT INTO security_alert_queue (id, event_type, recipient_email, subject, body, context_json, status, attempts, created_at) VALUES (?,?,?,?,?,?,?,?,?)")
          ->execute(['00000000-0000-4000-8000-000000000999', 'TEST_UPGRADE', 'faleconosco@ajnengenharia.com.br', '[TEST]', 'Teste 006', '{}', 'pending', 0, 1700000100]);
        $pdo->prepare("INSERT INTO job_postings (id, title, slug, department, location, employment_type, experience_level, description, requirements, status, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)")
          ->execute(['00000000-0000-4000-8000-000000000102', 'Vaga 006 Indesejada', 'vaga-006', 'TI', 'SP / SP', 'CLT', 'Senior', 'Descricao 006', 'Req 006', 'draft', 1700000100, 1700000100]);
        `,
        dbPath,
      ],
      { encoding: 'utf8' }
    );
    writeFileSync(join(publicDir, 'index.html'), '<html><body>BROKEN-006-DEPLOY</body></html>\n', 'utf8');

    const stateAt006 = inspectSqliteState(dbPath);
    assert.equal(stateAt006.tables.includes('schema_migrations'), true);
    assert.equal(stateAt006.tables.includes('admin_login_locks'), true);
    assert.equal(stateAt006.tables.includes('security_alert_queue'), true);
    assert.equal(stateAt006.columns.candidates.some((c) => c.startsWith('phone_encrypted:')), true);
    assert.equal(stateAt006.jobs.length, 2);

    // 4. Rollback real via hostinger/ops/rollback.sh (--db-driver=sqlite)
    const rollbackOut = runBash(
      `"${shRollback}" staging --public-dir="${shPublic}" --private-dir="${shPrivate}" --backups-dir="${shBackups}" --db-driver=sqlite --db-name="${shDb}"`,
      { BACKUP_PASSPHRASE: 'RealRollback#Pass2026!' }
    );
    assert.match(rollbackOut, /ROLLBACK CONCLUIDO \(staging\)/);

    const stateAfterRollback = inspectSqliteState(dbPath);
    assert.deepEqual(
      stateAfterRollback,
      stateAt004,
      'Estado do banco apos rollback deve ser identico ao 004, sem schema_migrations e sem tabelas/colunas de 005/006'
    );
    assert.equal(readFileSync(join(publicDir, 'index.html'), 'utf8'), '<html><body>v004-staging</body></html>\n');

    // 5. Re-aplica baseline 004 -> 006 apos rollback confirmando idempotencia do caminho de recuperacao
    const reBaselineOut = runPhpMigrate(configPath, ['--baseline=004']);
    assert.match(reBaselineOut, /marcadas=4/);
    const reUpgradeOut = runPhpMigrate(configPath);
    assert.match(reUpgradeOut, /aplicadas=2/);

    const stateAfterRemigrate = inspectSqliteState(dbPath);
    assert.equal(stateAfterRemigrate.tables.includes('schema_migrations'), true);
    assert.equal(stateAfterRemigrate.tables.includes('admin_login_locks'), true);
    assert.equal(stateAfterRemigrate.tables.includes('security_alert_queue'), true);
    assert.equal(stateAfterRemigrate.columns.candidates.some((c) => c.startsWith('phone_encrypted:')), true);
    assert.deepEqual(stateAfterRemigrate.jobs, stateAt004.jobs);
    assert.deepEqual(stateAfterRemigrate.candidates, stateAt004.candidates);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test('Item 3 (Ensaio de rollback real): drill cria tabela rollback_drill_marker, linha falsa em schema_migrations e marcador em robots.txt -> rollback reverte tudo', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'ajn-real-drill-rollback-'));
  try {
    const publicDir = join(tmp, 'staging-site', 'public_html');
    const privateDir = join(tmp, 'ajn-private-staging');
    const backupsDir = join(tmp, 'backups');
    const dbPath = join(tmp, 'staging-006.sqlite');
    const configPath = join(tmp, 'staging.config.php');

    mkdirSync(join(publicDir, 'api'), { recursive: true });
    mkdirSync(privateDir, { recursive: true });
    mkdirSync(backupsDir, { recursive: true });

    writeFileSync(join(publicDir, '.htaccess'), 'Options -Indexes\n', 'utf8');
    writeFileSync(join(publicDir, 'index.html'), '<html><body>v006-staging</body></html>\n', 'utf8');
    writeFileSync(join(publicDir, 'robots.txt'), 'User-agent: *\nDisallow: /\n', 'utf8');
    writeFileSync(join(publicDir, 'api', 'index.php'), '<?php // api\n', 'utf8');
    writeFileSync(join(privateDir, 'bootstrap.php'), '<?php // bootstrap\n', 'utf8');

    execFileSync(
      'php',
      [
        '-r',
        `file_put_contents($argv[1], "<?php\\nreturn " . var_export([
          'environment' => 'staging',
          'app_url' => 'https://staging.ajnengenharia.com.br',
          'database' => ['dsn' => 'sqlite:' . $argv[2]],
          'resume_directory' => $argv[3],
          'encryption_key' => str_repeat('b', 64),
          'turnstile_secret_key' => '1x0000000000000000000000000000000AA',
          'security_alert_email' => 'faleconosco@ajnengenharia.com.br',
        ], true) . ";\\n");`,
        configPath,
        dbPath,
        join(tmp, 'resumes'),
      ],
      { encoding: 'utf8' }
    );

    const migOut = runPhpMigrate(configPath);
    assert.match(migOut, /aplicadas=6/);

    const migrationsBefore = JSON.parse(
      execFileSync(
        'php',
        ['-r', '$pdo=new PDO("sqlite:".$argv[1]); echo json_encode($pdo->query("SELECT name FROM schema_migrations ORDER BY name ASC")->fetchAll(PDO::FETCH_COLUMN));', dbPath],
        { encoding: 'utf8' }
      )
    );
    assert.equal(migrationsBefore.length, 6);

    const shBackup = toBashPath(BACKUP_SH);
    const shRollback = toBashPath(ROLLBACK_SH);
    const shPublic = toBashPath(publicDir);
    const shPrivate = toBashPath(privateDir);
    const shBackups = toBashPath(backupsDir);
    const shDb = toBashPath(dbPath);

    runBash(
      `"${shBackup}" --env=staging --public-dir="${shPublic}" --private-dir="${shPrivate}" --backups-dir="${shBackups}" --db-driver=sqlite --db-name="${shDb}"`,
      { BACKUP_PASSPHRASE: 'DrillRollback#Pass2026!' }
    );

    const stamp = readFileSync(join(backupsDir, 'LAST_STAMP.staging'), 'utf8').trim();
    writeFileSync(join(publicDir, 'robots.txt'), `User-agent: *\nDisallow: /\n<!-- rollback-drill-${stamp} -->\n`, 'utf8');
    execFileSync(
      'php',
      [
        '-r',
        `
        $pdo = new PDO('sqlite:' . $argv[1], null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
        $pdo->exec("CREATE TABLE rollback_drill_marker (id INTEGER PRIMARY KEY, stamp TEXT NOT NULL)");
        $pdo->prepare("INSERT INTO rollback_drill_marker (id, stamp) VALUES (1, ?)")->execute([$argv[2]]);
        $pdo->prepare("INSERT INTO schema_migrations (name, checksum, applied_at) VALUES (?, ?, ?)")->execute(['999_rollback_drill.sql', str_repeat('0', 64), time()]);
        `,
        dbPath,
        stamp,
      ],
      { encoding: 'utf8' }
    );

    const dirtyMigrations = JSON.parse(
      execFileSync(
        'php',
        ['-r', '$pdo=new PDO("sqlite:".$argv[1]); echo json_encode($pdo->query("SELECT name FROM schema_migrations ORDER BY name ASC")->fetchAll(PDO::FETCH_COLUMN));', dbPath],
        { encoding: 'utf8' }
      )
    );
    assert.equal(dirtyMigrations.includes('999_rollback_drill.sql'), true);

    const rollbackOut = runBash(
      `"${shRollback}" staging --public-dir="${shPublic}" --private-dir="${shPrivate}" --backups-dir="${shBackups}" --db-driver=sqlite --db-name="${shDb}"`,
      { BACKUP_PASSPHRASE: 'DrillRollback#Pass2026!' }
    );
    assert.match(rollbackOut, /ROLLBACK CONCLUIDO \(staging\)/);

    const verifyAfter = JSON.parse(
      execFileSync(
        'php',
        [
          '-r',
          `
          $pdo = new PDO('sqlite:' . $argv[1], null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
          $hasDrillTbl = (int) $pdo->query("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='rollback_drill_marker'")->fetchColumn();
          $migs = $pdo->query("SELECT name FROM schema_migrations ORDER BY name ASC")->fetchAll(PDO::FETCH_COLUMN);
          echo json_encode(['hasDrillTbl' => $hasDrillTbl, 'migs' => $migs]);
          `,
          dbPath,
        ],
        { encoding: 'utf8' }
      )
    );
    assert.equal(verifyAfter.hasDrillTbl, 0);
    assert.deepEqual(verifyAfter.migs, migrationsBefore);
    assert.equal(readFileSync(join(publicDir, 'robots.txt'), 'utf8'), 'User-agent: *\nDisallow: /\n');
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test('Item 2 (disable_functions + somente CLI + sem vazar segredos + recusa sobrescrever + chmod 0600 em POSIX): init-config.php', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'ajn-init-cfg-test-'));
  try {
    const privDir = join(tmp, 'ajn-private-staging');
    mkdirSync(privDir, { recursive: true });
    copyFileSync(CONFIG_EXAMPLE, join(privDir, 'config.example.php'));
    const targetCfg = join(privDir, 'config.php');
    const exampleCfg = join(privDir, 'config.example.php');
    const pubRef = join(tmp, 'domains', 'staging.ajnengenharia.com.br', 'public_html').replaceAll('\\', '/');

    const dbPass = 'InitCfgDb#Secret!2026';
    const tsSecret = '1x0000000000000000000000000000000AA';
    const smtpPass = 'InitCfgSmtp#Secret!2026';

    const answers = [
      'staging',
      'https://staging.ajnengenharia.com.br',
      'https://staging.ajnengenharia.com.br',
      pubRef.startsWith('/') ? pubRef : `/${pubRef}`,
      'faleconosco@ajnengenharia.com.br',
      '127.0.0.1',
      '3306',
      'u999_stg_db',
      'u999_stg_app',
      dbPass,
      tsSecret,
      'smtp.hostinger.com',
      '465',
      'ssl',
      'carreiras@ajnengenharia.com.br',
      'carreiras@ajnengenharia.com.br',
      smtpPass,
    ];

    const runRes = spawnSync(
      'php',
      [
        '-d', 'extension=sodium',
        '-d', 'disable_functions=exec,shell_exec,system,passthru,proc_open,popen,parse_ini_file,show_source',
        INIT_CONFIG_PHP,
        `--target=${targetCfg}`,
        `--example=${exampleCfg}`,
        '--env=staging',
      ],
      {
        input: `${answers.join('\n')}\n`,
        encoding: 'utf8',
      }
    );
    assert.equal(runRes.status, 0, `init-config.php deveria sair 0 sob disable_functions: ${runRes.stderr}`);
    const outCombined = `${runRes.stdout}\n${runRes.stderr}`;
    assert.equal(outCombined.includes(dbPass), false);
    assert.equal(outCombined.includes(smtpPass), false);
    assert.equal(outCombined.includes(tsSecret), false);

    const parsedOut = JSON.parse(runRes.stdout.trim().split(/\r?\n/).pop());
    assert.equal(parsedOut.ok, true);
    assert.equal(parsedOut.environment, 'staging');
    assert.equal(parsedOut.database_name, 'u999_stg_db');
    assert.equal(parsedOut.encryption_key_generated, true);
    assert.equal(parsedOut.encryption_key_bytes, 32);

    const cfgCheck = JSON.parse(
      execFileSync(
        'php',
        [
          '-r',
          '$c = require $argv[1]; echo json_encode(["env"=>$c["environment"],"db"=>$c["database"]["name"],"keyLen"=>strlen($c["encryption_key"]),"keyHex"=>ctype_xdigit($c["encryption_key"])]);',
          targetCfg,
        ],
        { encoding: 'utf8' }
      ).trim()
    );
    assert.equal(cfgCheck.env, 'staging');
    assert.equal(cfgCheck.db, 'u999_stg_db');
    assert.equal(cfgCheck.keyLen, 64);
    assert.equal(cfgCheck.keyHex, true);

    // Recusa sobrescrever config.php existente
    const overwriteRes = spawnSync(
      'php',
      [
        '-d', 'disable_functions=exec,shell_exec,system,passthru,proc_open,popen',
        INIT_CONFIG_PHP,
        `--target=${targetCfg}`,
        `--example=${exampleCfg}`,
      ],
      {
        input: `${answers.join('\n')}\n`,
        encoding: 'utf8',
      }
    );
    assert.notEqual(overwriteRes.status, 0);

    // Em POSIX nativo (CI/Linux), valida PTY interativo real e chmod 0600
    if (process.platform !== 'win32') {
      const { statSync } = await import('node:fs');
      assert.equal(statSync(targetCfg).mode & 0o777, 0o600);
    }

    // Valida guarda CLI-only via servidor HTTP real (404)
    const { createServer } = await import('node:net');
    const port = await new Promise((resolvePort, rejectPort) => {
      const srv = createServer();
      srv.listen(0, '127.0.0.1', () => {
        const addr = srv.address();
        srv.close(() => resolvePort(addr.port));
      });
      srv.on('error', rejectPort);
    });
    const httpSrv = spawn('php', ['-S', `127.0.0.1:${port}`, '-t', join(HOSTINGER_DIR, 'ops')], {
      stdio: 'ignore',
    });
    try {
      let status = 0;
      for (let i = 0; i < 20; i++) {
        try {
          const resp = await fetch(`http://127.0.0.1:${port}/init-config.php`);
          status = resp.status;
          break;
        } catch {
          await new Promise((r) => setTimeout(r, 100));
        }
      }
      assert.equal(status, 404);
    } finally {
      httpSrv.kill();
    }
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});
