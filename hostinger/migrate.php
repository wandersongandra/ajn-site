<?php
declare(strict_types=1);

// Executor idempotente de migrations SQL (MySQL 8+/MariaDB 10+ e SQLite em testes).
// Uso exclusivo via CLI:
//   php -d extension=sodium migrate.php --defaults-file="$HOME/.my-migrator.cnf" [--status] [--dry-run] [--baseline=004]
if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit("Este script só pode ser executado via CLI.\n");
}

if (!defined('AJN_DISABLE_AUTO_DISPATCH')) {
    define('AJN_DISABLE_AUTO_DISPATCH', true);
}
require_once __DIR__ . '/bootstrap.php';

function ajn_migrate_parse_cnf(string $cnfPath): array
{
    if (!is_file($cnfPath) || !is_readable($cnfPath)) {
        throw new RuntimeException("Arquivo de credenciais não encontrado ou ilegível: {$cnfPath}");
    }
    $lines = file($cnfPath, FILE_IGNORE_NEW_LINES);
    if (!is_array($lines)) {
        throw new RuntimeException("Falha ao ler arquivo de credenciais: {$cnfPath}");
    }
    $inClient = false;
    $parsed = [];
    foreach ($lines as $rawLine) {
        $line = trim($rawLine);
        if ($line === '' || str_starts_with($line, '#') || str_starts_with($line, ';')) {
            continue;
        }
        if (preg_match('/^\[([^\]]+)\]$/', $line, $m)) {
            $inClient = strtolower(trim($m[1])) === 'client';
            continue;
        }
        if (!$inClient) {
            continue;
        }
        $eq = strpos($line, '=');
        if ($eq === false) {
            continue;
        }
        $key = strtolower(trim(substr($line, 0, $eq)));
        $val = trim(substr($line, $eq + 1));
        if ((str_starts_with($val, '"') && str_ends_with($val, '"')) || (str_starts_with($val, "'") && str_ends_with($val, "'"))) {
            $val = substr($val, 1, -1);
        }
        $parsed[$key] = $val;
    }
    return $parsed;
}

function ajn_migrate_normalize_sql(string $sql): string
{
    if (str_starts_with($sql, "\xEF\xBB\xBF")) {
        $sql = substr($sql, 3);
    }
    return str_replace(["\r\n", "\r"], "\n", $sql);
}

function ajn_migrate_checksum(string $sql): string
{
    return hash('sha256', ajn_migrate_normalize_sql($sql));
}

function ajn_migrate_split_statements(string $sql): array
{
    $sql = ajn_migrate_normalize_sql($sql);
    $len = strlen($sql);
    $statements = [];
    $buffer = '';
    $inSingle = false;
    $inDouble = false;
    $inBacktick = false;
    $inLineComment = false;
    $inBlockComment = false;

    for ($i = 0; $i < $len; $i++) {
        $ch = $sql[$i];
        $next = ($i + 1 < $len) ? $sql[$i + 1] : '';

        if ($inLineComment) {
            if ($ch === "\n") {
                $inLineComment = false;
                $buffer .= "\n";
            }
            continue;
        }
        if ($inBlockComment) {
            if ($ch === '*' && $next === '/') {
                $inBlockComment = false;
                $i++;
            }
            continue;
        }
        if ($inSingle) {
            $buffer .= $ch;
            if ($ch === '\\' && $next !== '') {
                $buffer .= $next;
                $i++;
                continue;
            }
            if ($ch === "'") {
                if ($next === "'") {
                    $buffer .= $next;
                    $i++;
                } else {
                    $inSingle = false;
                }
            }
            continue;
        }
        if ($inDouble) {
            $buffer .= $ch;
            if ($ch === '\\' && $next !== '') {
                $buffer .= $next;
                $i++;
                continue;
            }
            if ($ch === '"') {
                $inDouble = false;
            }
            continue;
        }
        if ($inBacktick) {
            $buffer .= $ch;
            if ($ch === '`') {
                $inBacktick = false;
            }
            continue;
        }

        if ($ch === '-' && $next === '-' && ($i + 2 >= $len || $sql[$i + 2] === ' ' || $sql[$i + 2] === "\t" || $sql[$i + 2] === "\n")) {
            $inLineComment = true;
            $i++;
            continue;
        }
        if ($ch === '#') {
            $inLineComment = true;
            continue;
        }
        if ($ch === '/' && $next === '*') {
            $inBlockComment = true;
            $i++;
            continue;
        }
        if ($ch === "'") {
            $inSingle = true;
            $buffer .= $ch;
            continue;
        }
        if ($ch === '"') {
            $inDouble = true;
            $buffer .= $ch;
            continue;
        }
        if ($ch === '`') {
            $inBacktick = true;
            $buffer .= $ch;
            continue;
        }
        if ($ch === ';') {
            $trimmed = trim($buffer);
            if ($trimmed !== '') {
                $statements[] = $trimmed;
            }
            $buffer = '';
            continue;
        }
        $buffer .= $ch;
    }

    $tail = trim($buffer);
    if ($tail !== '') {
        $statements[] = $tail;
    }
    return $statements;
}

function ajn_migrate_find_grant_or_revoke(string $sql): ?string
{
    foreach (ajn_migrate_split_statements($sql) as $stmt) {
        if (preg_match('/^\s*(GRANT|REVOKE)\b/i', $stmt, $m)) {
            return strtoupper($m[1]);
        }
    }
    return null;
}

function ajn_migrate_to_sqlite_statements(string $stmt): array
{
    $s = trim($stmt);
    if ($s === '') {
        return [];
    }
    $s = str_replace('UNIX_TIMESTAMP()', "CAST(strftime('%s','now') AS INTEGER)", $s);
    $s = preg_replace('/\bBIGINT\s+UNSIGNED\b/i', 'INTEGER', $s) ?? $s;
    $s = preg_replace('/\bINT\s+UNSIGNED\b/i', 'INTEGER', $s) ?? $s;
    $s = preg_replace('/\bTINYINT\s+UNSIGNED\b/i', 'INTEGER', $s) ?? $s;
    $s = preg_replace('/\bTINYINT\(\d+\)/i', 'INTEGER', $s) ?? $s;

    if (preg_match('/^CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_`]+)\s*\((.*)\)\s*(?:ENGINE=.*)?$/is', $s, $m)) {
        $table = trim($m[1], '`');
        $body = $m[2];
        $lines = preg_split('/\R/', $body) ?: [$body];
        $kept = [];
        $indexes = [];
        foreach ($lines as $rawLine) {
            $line = trim($rawLine);
            if ($line === '') {
                continue;
            }
            $hasComma = str_ends_with($line, ',');
            $clean = rtrim($line, ',');
            if (preg_match('/^UNIQUE\s+KEY\s+([a-zA-Z0-9_`]+)\s*\(([^)]+)\)$/i', $clean, $im)) {
                $idxName = trim($im[1], '`');
                $cols = trim($im[2]);
                $indexes[] = "CREATE UNIQUE INDEX IF NOT EXISTS {$idxName} ON {$table} ({$cols})";
                continue;
            }
            if (preg_match('/^INDEX\s+([a-zA-Z0-9_`]+)\s*\(([^)]+)\)$/i', $clean, $im)) {
                $idxName = trim($im[1], '`');
                $cols = trim($im[2]);
                $indexes[] = "CREATE INDEX IF NOT EXISTS {$idxName} ON {$table} ({$cols})";
                continue;
            }
            $kept[] = $clean;
        }
        $prefix = stripos($s, 'CREATE TABLE IF NOT EXISTS') === 0 ? 'CREATE TABLE IF NOT EXISTS' : 'CREATE TABLE';
        $createSql = "{$prefix} {$table} (\n  " . implode(",\n  ", $kept) . "\n)";
        return array_merge([$createSql], $indexes);
    }

    if (preg_match('/^ALTER\s+TABLE\s+([a-zA-Z0-9_`]+)\s+(.+)$/is', $s, $am)) {
        $table = trim($am[1], '`');
        $clausesRaw = $am[2];
        $parts = preg_split('/,\s*(?=(?:ADD|MODIFY|CHANGE|DROP)\s+COLUMN\b)/i', $clausesRaw) ?: [$clausesRaw];
        $out = [];
        foreach ($parts as $part) {
            $p = trim($part);
            if (preg_match('/^MODIFY\s+COLUMN\b/i', $p)) {
                continue;
            }
            $p = preg_replace('/\s+AFTER\s+[a-zA-Z0-9_`]+$/i', '', $p) ?? $p;
            $out[] = "ALTER TABLE {$table} {$p}";
        }
        return $out;
    }

    return [$s];
}

function ajn_migrate_analyze_grants(array $grantRows): array
{
    $dangerous = [];
    foreach ($grantRows as $row) {
        $line = is_array($row) ? (string) reset($row) : (string) $row;
        if (!preg_match('/^\s*GRANT\s+(.+?)\s+ON\s+/i', $line, $m)) {
            continue;
        }
        $privBlock = strtoupper($m[1]);
        $privs = array_map('trim', explode(',', $privBlock));
        foreach ($privs as $priv) {
            if ($priv === 'USAGE') {
                continue;
            }
            if (str_contains($priv, 'ALL PRIVILEGES') || $priv === 'ALL') {
                $dangerous[] = 'ALL PRIVILEGES';
                continue;
            }
            if (in_array($priv, ['DROP', 'ALTER', 'CREATE'], true)) {
                $dangerous[] = $priv;
            }
        }
    }
    $dangerous = array_values(array_unique($dangerous));
    return [
        'ok' => $dangerous === [],
        'dangerous' => $dangerous,
        'grants' => array_values(array_map(static fn ($r) => is_array($r) ? (string) reset($r) : (string) $r, $grantRows)),
    ];
}

function ajn_migrate_check_runtime_grants_pdo(PDO $runtimePdo): array
{
    $driver = (string) $runtimePdo->getAttribute(PDO::ATTR_DRIVER_NAME);
    if ($driver !== 'mysql') {
        return ['checked' => false, 'ok' => true, 'dangerous' => [], 'grants' => [], 'reason' => "Driver {$driver} não usa SHOW GRANTS."];
    }
    $stmt = $runtimePdo->query('SHOW GRANTS FOR CURRENT_USER()');
    $rows = $stmt ? $stmt->fetchAll(PDO::FETCH_NUM) : [];
    $analysis = ajn_migrate_analyze_grants($rows);
    return array_merge(['checked' => true], $analysis);
}

function ajn_migrate_table_exists(PDO $db, string $driver, string $table): bool
{
    if ($driver === 'sqlite') {
        $row = ajn_fetch($db, "SELECT name FROM sqlite_master WHERE type='table' AND name=?", [$table]);
        return $row !== null;
    }
    $row = ajn_fetch(
        $db,
        'SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?',
        [$table]
    );
    return $row !== null;
}

function ajn_migrate_ensure_table(PDO $db, string $driver): void
{
    if ($driver === 'mysql') {
        $db->exec(
            'CREATE TABLE IF NOT EXISTS schema_migrations (
                name VARCHAR(255) NOT NULL PRIMARY KEY,
                checksum CHAR(64) NOT NULL,
                applied_at BIGINT UNSIGNED NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
        );
        return;
    }
    $db->exec(
        'CREATE TABLE IF NOT EXISTS schema_migrations (
            name TEXT NOT NULL PRIMARY KEY,
            checksum TEXT NOT NULL,
            applied_at INTEGER NOT NULL
        )'
    );
}

function ajn_migrate_discover_files(string $migrationsDir): array
{
    if (!is_dir($migrationsDir)) {
        throw new RuntimeException("Diretório de migrations ausente: {$migrationsDir}");
    }
    $entries = scandir($migrationsDir);
    if (!is_array($entries)) {
        throw new RuntimeException("Falha ao listar migrations em: {$migrationsDir}");
    }
    $files = [];
    foreach ($entries as $entry) {
        if (preg_match('/^(\d+)_[a-zA-Z0-9_-]+\.sql$/D', $entry, $m)) {
            $files[] = [
                'prefix' => (int) $m[1],
                'name' => $entry,
                'path' => $migrationsDir . DIRECTORY_SEPARATOR . $entry,
            ];
        }
    }
    usort($files, static fn (array $a, array $b): int => [$a['prefix'], $a['name']] <=> [$b['prefix'], $b['name']]);
    return $files;
}

function ajn_migrate_verify_baseline_schema(PDO $db, string $driver, int $targetPrefix): array
{
    $errors = [];
    if ($targetPrefix < 1) {
        $errors[] = "Prefixo de baseline inválido: {$targetPrefix}";
        return $errors;
    }

    $requiredTables = [
        'candidates',
        'resumes',
        'certifications',
        'work_experiences',
        'job_postings',
        'recruitment_stages',
        'job_applications',
        'admin_users',
        'admin_sessions',
        'admin_permissions',
        'data_consents',
        'data_subject_requests',
        'audit_logs',
        'request_rate_limits',
    ];
    foreach ($requiredTables as $table) {
        if (!ajn_migrate_table_exists($db, $driver, $table)) {
            $errors[] = "Tabela ausente: {$table}";
        }
    }

    $requiredColumns = [];
    if ($targetPrefix >= 2) {
        $requiredColumns['admin_users'] = ['mfa_last_counter'];
        $requiredColumns['admin_sessions'] = ['absolute_expires_at'];
    }
    foreach ($requiredColumns as $table => $cols) {
        if (!ajn_migrate_table_exists($db, $driver, $table)) {
            continue;
        }
        $existingCols = [];
        if ($driver === 'sqlite') {
            foreach ($db->query("PRAGMA table_info({$table})")->fetchAll(PDO::FETCH_ASSOC) as $c) {
                $existingCols[strtolower((string) ($c['name'] ?? ''))] = true;
            }
        } else {
            $rows = ajn_list(
                $db,
                'SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?',
                [$table]
            );
            foreach ($rows as $r) {
                $existingCols[strtolower((string) ($r['COLUMN_NAME'] ?? ''))] = true;
            }
        }
        foreach ($cols as $col) {
            if (!isset($existingCols[strtolower($col)])) {
                $errors[] = "Coluna ausente (002_hardening): {$table}.{$col}";
            }
        }
    }

    if ($targetPrefix >= 3 && ajn_migrate_table_exists($db, $driver, 'admin_permissions')) {
        $leakRow = ajn_fetch($db, "SELECT COUNT(*) AS c FROM admin_permissions WHERE role='recruiter' AND permission='audit:read'");
        if ((int) ($leakRow['c'] ?? 0) > 0) {
            $errors[] = "Estado de menor privilégio (003_least_privilege) não aplicado: recruiter ainda possui audit:read";
        }
    }

    $requiredIndexes = [
        'candidates' => ['idx_candidates_email', 'idx_candidates_cpf_hash', 'idx_candidates_location', 'idx_candidates_talent_pool'],
        'resumes' => ['idx_resumes_candidate_id'],
        'job_postings' => ['idx_jobs_status', 'idx_jobs_department'],
        'job_applications' => ['idx_applications_job_id', 'idx_applications_candidate_id'],
        'admin_users' => ['idx_admin_users_role'],
        'admin_sessions' => ['idx_admin_sessions_user_id'],
        'audit_logs' => ['idx_audit_logs_timestamp'],
    ];
    if ($targetPrefix >= 4) {
        $requiredIndexes['job_postings'][] = 'idx_jobs_status_published';
        $requiredIndexes['candidates'][] = 'idx_candidates_created_at';
        $requiredIndexes['data_subject_requests'][] = 'idx_data_subject_requests_requested_at';
        $requiredIndexes['job_applications'][] = 'idx_applications_applied_at';
    }

    foreach ($requiredIndexes as $table => $idxs) {
        if (!ajn_migrate_table_exists($db, $driver, $table)) {
            continue;
        }
        $existingIdxs = [];
        if ($driver === 'sqlite') {
            foreach ($db->query("PRAGMA index_list({$table})")->fetchAll(PDO::FETCH_ASSOC) as $ix) {
                $existingIdxs[strtolower((string) ($ix['name'] ?? ''))] = true;
            }
        } else {
            $rows = ajn_list(
                $db,
                'SELECT INDEX_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?',
                [$table]
            );
            foreach ($rows as $r) {
                $existingIdxs[strtolower((string) ($r['INDEX_NAME'] ?? ''))] = true;
            }
        }
        foreach ($idxs as $idxName) {
            if (!isset($existingIdxs[strtolower($idxName)])) {
                $errors[] = "Índice ausente: {$table}.{$idxName}";
            }
        }
    }

    return $errors;
}

if (!defined('AJN_MIGRATE_LIB_ONLY')) {
    $statusOnly = false;
    $dryRun = false;
    $baselineSpec = null;
    $defaultsFile = null;
    $dbNameOverride = null;
    $migrationsDir = __DIR__ . '/migrations';
    $skipGrantsCheck = false;

    foreach (array_slice($argv ?? [], 1) as $arg) {
        if ($arg === '--status') {
            $statusOnly = true;
        } elseif ($arg === '--dry-run') {
            $dryRun = true;
        } elseif ($arg === '--skip-grants-check') {
            $skipGrantsCheck = true;
        } elseif (str_starts_with($arg, '--baseline=')) {
            $baselineSpec = trim(substr($arg, strlen('--baseline=')));
        } elseif (str_starts_with($arg, '--defaults-file=')) {
            $defaultsFile = trim(substr($arg, strlen('--defaults-file=')));
        } elseif (str_starts_with($arg, '--my-cnf=')) {
            $defaultsFile = trim(substr($arg, strlen('--my-cnf=')));
        } elseif (str_starts_with($arg, '--database=')) {
            $dbNameOverride = trim(substr($arg, strlen('--database=')));
        } elseif (str_starts_with($arg, '--migrations-dir=')) {
            $migrationsDir = trim(substr($arg, strlen('--migrations-dir=')));
        } elseif ($arg === '--help' || $arg === '-h') {
            fwrite(STDOUT, "Uso: php migrate.php [--defaults-file=PATH] [--database=NAME] [--status] [--dry-run] [--baseline=004]\n");
            exit(0);
        } else {
            fwrite(STDERR, "Argumento não reconhecido: {$arg}\n");
            exit(1);
        }
    }

    $runtimeConfig = ajn_config();
    $migratorConfig = $runtimeConfig;
    if ($defaultsFile !== null && $defaultsFile !== '') {
        $cnf = ajn_migrate_parse_cnf($defaultsFile);
        $migratorConfig['database'] = array_merge($migratorConfig['database'] ?? [], [
            'host' => $cnf['host'] ?? ($migratorConfig['database']['host'] ?? '127.0.0.1'),
            'port' => isset($cnf['port']) ? (int) $cnf['port'] : (int) ($migratorConfig['database']['port'] ?? 3306),
            'username' => $cnf['user'] ?? ($migratorConfig['database']['username'] ?? ''),
            'password' => $cnf['password'] ?? ($migratorConfig['database']['password'] ?? ''),
            'name' => $dbNameOverride ?? ($cnf['database'] ?? ($migratorConfig['database']['name'] ?? '')),
        ]);
    } elseif ($dbNameOverride !== null && $dbNameOverride !== '') {
        $migratorConfig['database']['name'] = $dbNameOverride;
    }

    try {
        $db = ajn_pdo($migratorConfig);
    } catch (Throwable $e) {
        fwrite(STDERR, "Falha ao conectar como migrator: " . $e->getMessage() . "\n");
        exit(1);
    }

    $driver = (string) $db->getAttribute(PDO::ATTR_DRIVER_NAME);
    if (!$skipGrantsCheck && $driver === 'mysql') {
        try {
            $runtimeDb = ajn_pdo($runtimeConfig);
            $grantsReport = ajn_migrate_check_runtime_grants_pdo($runtimeDb);
            if ($grantsReport['checked'] && !$grantsReport['ok']) {
                fwrite(
                    STDERR,
                    "[AVISO] Usuário de runtime (" . ($runtimeConfig['database']['username'] ?? '?')
                    . ") possui privilégios excessivos: " . implode(', ', $grantsReport['dangerous'])
                    . ". Restrinja pelo hPanel apenas a SELECT, INSERT, UPDATE, DELETE.\n"
                );
            }
        } catch (Throwable $e) {
            fwrite(STDERR, "[AVISO] Não foi possível consultar SHOW GRANTS do usuário de runtime: " . $e->getMessage() . "\n");
        }
    }

    $files = ajn_migrate_discover_files($migrationsDir);
    if ($files === []) {
        fwrite(STDERR, "Nenhum arquivo de migration encontrado em {$migrationsDir}\n");
        exit(1);
    }

    $hasTrackingTable = ajn_migrate_table_exists($db, $driver, 'schema_migrations');
    $recorded = [];
    if ($hasTrackingTable) {
        foreach (ajn_list($db, 'SELECT name, checksum, applied_at FROM schema_migrations ORDER BY name ASC') as $row) {
            $recorded[(string) $row['name']] = $row;
        }
    }

    $hasDrift = false;
    $items = [];
    foreach ($files as $f) {
        $rawSql = file_get_contents($f['path']);
        if (!is_string($rawSql)) {
            fwrite(STDERR, "Falha ao ler migration: {$f['path']}\n");
            exit(1);
        }
        $checksum = ajn_migrate_checksum($rawSql);
        $grantKeyword = ajn_migrate_find_grant_or_revoke($rawSql);
        $rec = $recorded[$f['name']] ?? null;
        $status = 'PENDING';
        if ($rec !== null) {
            if (hash_equals((string) $rec['checksum'], $checksum)) {
                $status = 'APPLIED';
            } else {
                $status = 'CHECKSUM_MISMATCH';
                $hasDrift = true;
            }
        }
        $items[] = [
            'prefix' => $f['prefix'],
            'name' => $f['name'],
            'path' => $f['path'],
            'sql' => $rawSql,
            'checksum' => $checksum,
            'grantKeyword' => $grantKeyword,
            'status' => $status,
            'recordedChecksum' => $rec['checksum'] ?? null,
            'appliedAt' => isset($rec['applied_at']) ? (int) $rec['applied_at'] : null,
        ];
    }

    if ($statusOnly) {
        foreach ($items as $item) {
            $at = $item['appliedAt'] !== null ? gmdate('Y-m-d\TH:i:s\Z', $item['appliedAt']) : '-';
            fwrite(STDOUT, sprintf("%s\t%s\t%s\t%s\n", $item['status'], $item['name'], substr($item['checksum'], 0, 12), $at));
        }
        if ($hasDrift) {
            fwrite(STDERR, "ERRO: Há migration aplicada com checksum modificado em disco.\n");
            exit(1);
        }
        exit(0);
    }

    if ($hasDrift) {
        foreach ($items as $item) {
            if ($item['status'] === 'CHECKSUM_MISMATCH') {
                fwrite(
                    STDERR,
                    "ERRO: Checksum de migration já aplicada foi alterado: {$item['name']} (banco={$item['recordedChecksum']}, disco={$item['checksum']}). Recusado.\n"
                );
            }
        }
        exit(1);
    }

    if ($baselineSpec !== null) {
        if (!preg_match('/^\d+$/D', $baselineSpec)) {
            fwrite(STDERR, "Valor inválido para --baseline: {$baselineSpec}\n");
            exit(1);
        }
        $targetPrefix = (int) $baselineSpec;
        $baselineTargets = array_values(array_filter($items, static fn (array $it): bool => $it['prefix'] <= $targetPrefix));
        if ($baselineTargets === []) {
            fwrite(STDERR, "Nenhuma migration encontrada até o prefixo {$baselineSpec}.\n");
            exit(1);
        }
        $schemaErrors = ajn_migrate_verify_baseline_schema($db, $driver, $targetPrefix);
        if ($schemaErrors !== []) {
            fwrite(STDERR, "ERRO: Banco não atende ao schema esperado para --baseline={$baselineSpec}:\n- " . implode("\n- ", $schemaErrors) . "\n");
            exit(1);
        }
        foreach ($items as $it) {
            if ($it['prefix'] > $targetPrefix && $it['status'] === 'APPLIED') {
                fwrite(STDERR, "ERRO: Já existe migration posterior aplicada ({$it['name']}) acima do baseline {$baselineSpec}.\n");
                exit(1);
            }
        }
        if ($dryRun) {
            foreach ($baselineTargets as $it) {
                fwrite(STDOUT, "[DRY-RUN BASELINE] {$it['status']} -> BASELINED: {$it['name']} ({$it['checksum']})\n");
            }
            exit(0);
        }
        ajn_migrate_ensure_table($db, $driver);
        $now = time();
        $inserted = 0;
        foreach ($baselineTargets as $it) {
            if ($it['status'] === 'APPLIED') {
                continue;
            }
            ajn_exec(
                $db,
                'INSERT INTO schema_migrations (name, checksum, applied_at) VALUES (?, ?, ?)',
                [$it['name'], $it['checksum'], $now]
            );
            $inserted++;
            fwrite(STDOUT, "BASELINE marcado: {$it['name']}\n");
        }
        fwrite(STDOUT, "Baseline concluído (marcadas={$inserted}).\n");
        exit(0);
    }

    $pending = array_values(array_filter($items, static fn (array $it): bool => $it['status'] === 'PENDING'));
    foreach ($pending as $it) {
        if ($it['grantKeyword'] !== null) {
            fwrite(
                STDERR,
                "BLOQUEADO: A migration {$it['name']} contém comando {$it['grantKeyword']} e deve ser executada manualmente via hPanel, nunca pela automação.\n"
            );
            exit(1);
        }
    }

    if ($dryRun) {
        if ($pending === []) {
            fwrite(STDOUT, "[DRY-RUN] Nenhuma migration pendente.\n");
            exit(0);
        }
        foreach ($pending as $it) {
            fwrite(STDOUT, "[DRY-RUN] Aplicaria: {$it['name']} ({$it['checksum']})\n");
        }
        exit(0);
    }

    ajn_migrate_ensure_table($db, $driver);
    if ($pending === []) {
        fwrite(STDOUT, "Nenhuma migration pendente.\n");
        exit(0);
    }

    $appliedCount = 0;
    foreach ($pending as $it) {
        $statements = ajn_migrate_split_statements($it['sql']);
        foreach ($statements as $idx => $stmt) {
            $execStatements = $driver === 'sqlite' ? ajn_migrate_to_sqlite_statements($stmt) : [$stmt];
            foreach ($execStatements as $execSql) {
                try {
                    $db->exec($execSql);
                } catch (Throwable $e) {
                    $stepNo = $idx + 1;
                    fwrite(
                        STDERR,
                        "ERRO ao executar migration {$it['name']} (instrução #{$stepNo}): " . $e->getMessage() . "\n"
                    );
                    exit(1);
                }
            }
        }
        ajn_exec(
            $db,
            'INSERT INTO schema_migrations (name, checksum, applied_at) VALUES (?, ?, ?)',
            [$it['name'], $it['checksum'], time()]
        );
        $appliedCount++;
        fwrite(STDOUT, "APLICADA: {$it['name']} ({$it['checksum']})\n");
    }

    fwrite(STDOUT, "Migrations concluídas com sucesso (aplicadas={$appliedCount}).\n");
    exit(0);
}
