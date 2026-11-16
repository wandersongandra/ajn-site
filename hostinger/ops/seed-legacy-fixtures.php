<?php
declare(strict_types=1);

// Seeder sintetico exclusivo para STAGING/TESTES (NUNCA producao):
// popula um banco no estado exato da migration 004 com dados legados artificiais
// para exercitar o ciclo completo de upgrade 004 -> 006 + migrate-legacy-data.php.
if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit("Este script só pode ser executado via CLI.\n");
}

$bootstrapCandidates = [
    dirname(__DIR__) . DIRECTORY_SEPARATOR . 'bootstrap.php',
    dirname(__DIR__) . DIRECTORY_SEPARATOR . 'ajn-carreiras-private' . DIRECTORY_SEPARATOR . 'bootstrap.php',
];
$bootstrapFile = null;
foreach ($bootstrapCandidates as $candidate) {
    if (is_file($candidate)) {
        $bootstrapFile = $candidate;
        break;
    }
}
if ($bootstrapFile === null) {
    fwrite(STDERR, "bootstrap.php privado não encontrado.\n");
    exit(1);
}

if (!defined('AJN_DISABLE_AUTO_DISPATCH')) {
    define('AJN_DISABLE_AUTO_DISPATCH', true);
}
require_once $bootstrapFile;

$config = ajn_config();
$env = strtolower(trim((string) ($config['environment'] ?? 'production')));
if ($env === 'production') {
    fwrite(STDERR, "RECUSADO: seed-legacy-fixtures.php não pode ser executado quando environment=production.\n");
    exit(1);
}

$keyHex = trim((string) ($config['encryption_key'] ?? ''));
$rawKey = @hex2bin($keyHex);
if (!is_string($rawKey) || strlen($rawKey) !== 32) {
    fwrite(STDERR, "Configure encryption_key válida (64 hex chars) antes de gerar fixtures.\n");
    exit(1);
}

$db = ajn_pdo($config);
$driver = (string) $db->getAttribute(PDO::ATTR_DRIVER_NAME);

$hasColumn = static function (PDO $db, string $driver, string $table, string $column): bool {
    if ($driver === 'sqlite') {
        $rows = $db->query("PRAGMA table_info({$table})")->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as $row) {
            if (strtolower((string) ($row['name'] ?? '')) === strtolower($column)) {
                return true;
            }
        }
        return false;
    }
    $row = ajn_fetch(
        $db,
        'SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
        [$table, $column]
    );
    return $row !== null;
};

if ($hasColumn($db, $driver, 'candidates', 'phone_encrypted') || $hasColumn($db, $driver, 'job_applications', 'tracking_token_hash')) {
    fwrite(STDERR, "RECUSADO: este banco já contém colunas da migration 005. Execute seed-legacy-fixtures.php apenas em um banco no estado 004.\n");
    exit(1);
}

$legacyEncryptAesGcm = static function (string $plaintext, string $key): string {
    $iv = random_bytes(12);
    $tag = '';
    $cipher = openssl_encrypt($plaintext, 'aes-256-gcm', $key, OPENSSL_RAW_DATA, $iv, $tag);
    if (!is_string($cipher) || strlen($tag) !== 16) {
        throw new RuntimeException('Falha ao gerar cifra legada AES-256-GCM.');
    }
    return base64_encode($iv . $tag . $cipher);
};

$now = time();
$legacyTotpSecret = 'JBSWY3DPEHPK3PXQ';
$legacyAesTotp = $legacyEncryptAesGcm($legacyTotpSecret, $rawKey);
$legacyBcryptHash = password_hash('Legado#Staging!2026', PASSWORD_BCRYPT, ['cost' => 10]);
$legacyTracking40Bit = 'AJN-2025-A1B2C3D4';

$db->beginTransaction();
try {
    $adminAesId = '00000000-0000-4000-8000-000000000401';
    $adminNoMfaId = '00000000-0000-4000-8000-000000000402';
    $candidateId = '00000000-0000-4000-8000-000000000403';
    $jobId = '00000000-0000-4000-8000-000000000404';
    $applicationId = '00000000-0000-4000-8000-000000000405';

    ajn_exec(
        $db,
        'INSERT INTO admin_users (id,name,email,password_hash,role,is_active,mfa_enabled,mfa_secret,mfa_required,created_at,updated_at) VALUES (?,?,?,?,?,1,1,?,0,?,?)',
        [$adminAesId, 'Recruiter Legado AES-GCM', 'legacy.aesgcm@example.invalid', $legacyBcryptHash, 'recruiter', $legacyAesTotp, $now - 86400, $now - 86400]
    );
    ajn_exec(
        $db,
        'INSERT INTO admin_users (id,name,email,password_hash,role,is_active,mfa_enabled,mfa_secret,mfa_required,created_at,updated_at) VALUES (?,?,?,?,?,1,0,NULL,0,?,?)',
        [$adminNoMfaId, 'DPO Legado Sem MFA', 'legacy.nomfa@example.invalid', $legacyBcryptHash, 'dpo', $now - 86400, $now - 86400]
    );

    ajn_exec(
        $db,
        'INSERT INTO candidates (id,full_name,email,phone,cpf_hash,cpf_masked,city,state,is_talent_pool,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,0,?,?)',
        [$candidateId, 'Candidato Sintetico Legado', 'legacy.candidato@example.invalid', '(31) 99988-7766', hash('sha256', '11144477735'), '111.***.***-35', 'Belo Horizonte', 'MG', $now - 86400, $now - 86400]
    );

    ajn_exec(
        $db,
        'INSERT INTO job_postings (id,title,slug,department,location,employment_type,experience_level,description,requirements,status,openings_count,published_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
        [$jobId, 'Engenheiro SST Sintetico Legado', 'engenheiro-sst-legado-004', 'SST', 'Belo Horizonte/MG', 'CLT', 'Pleno', 'Vaga sintetica de teste 004->006.', 'CREA ativo.', 'published', 1, $now - 86400, $now - 86400, $now - 86400]
    );

    ajn_exec(
        $db,
        'INSERT INTO job_applications (id,job_id,candidate_id,tracking_code,status,source,applied_at,updated_at) VALUES (?,?,?,?,?,?,?,?)',
        [$applicationId, $jobId, $candidateId, $legacyTracking40Bit, 'active', 'portal', $now - 86400, $now - 86400]
    );

    $db->commit();
} catch (Throwable $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    fwrite(STDERR, 'Erro ao popular fixtures legadas: ' . $e->getMessage() . "\n");
    exit(1);
}

fwrite(STDOUT, json_encode([
    'ok' => true,
    'environment' => $env,
    'admin_aes_gcm' => 'legacy.aesgcm@example.invalid',
    'admin_without_mfa' => 'legacy.nomfa@example.invalid',
    'candidate_plaintext_phone' => 'legacy.candidato@example.invalid',
    'legacy_tracking_40bit' => $legacyTracking40Bit,
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n");
exit(0);
