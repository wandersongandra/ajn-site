<?php
declare(strict_types=1);

// Testes funcionais e de seguranca reais do backend PHP/Hostinger com SQLite PDO
// e servidor HTTP built-in em diretorio temporario isolado.
// Uso: php hostinger/tests/functional.php

if (PHP_SAPI !== 'cli') {
    exit(1);
}

define('AJN_DISABLE_AUTO_DISPATCH', true);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../app.php';
require_once __DIR__ . '/../admin.php';
require_once __DIR__ . '/../applications.php';
require_once __DIR__ . '/../lgpd.php';

$checks = [];
function fn_check(string $label, bool $condition, string $detail = ''): void
{
    global $checks;
    $checks[] = [$label, $condition, $detail];
}

function fn_rfc6238_totp(string $base32Secret, int $stepOffset = 0): string
{
    $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    $bits = '';
    foreach (str_split(strtoupper(rtrim($base32Secret, '='))) as $char) {
        $pos = strpos($alphabet, $char);
        if ($pos === false) throw new RuntimeException('Invalid base32 secret');
        $bits .= str_pad(decbin($pos), 5, '0', STR_PAD_LEFT);
    }
    $binary = '';
    foreach (str_split($bits, 8) as $byte) {
        if (strlen($byte) === 8) $binary .= chr(bindec($byte));
    }
    $counter = intdiv(time(), 30) + $stepOffset;
    $hmac = hash_hmac('sha1', pack('N2', 0, $counter), $binary, true);
    $offset = ord($hmac[19]) & 0x0f;
    $number = ((ord($hmac[$offset]) & 0x7f) << 24)
        | (ord($hmac[$offset + 1]) << 16)
        | (ord($hmac[$offset + 2]) << 8)
        | ord($hmac[$offset + 3]);
    return str_pad((string) ($number % 1000000), 6, '0', STR_PAD_LEFT);
}

function fn_rmdir_recursive(string $dir): void
{
    if (!is_dir($dir)) return;
    $items = scandir($dir);
    if (!is_array($items)) return;
    foreach ($items as $item) {
        if ($item === '.' || $item === '..') continue;
        $path = $dir . DIRECTORY_SEPARATOR . $item;
        if (is_dir($path) && !is_link($path)) {
            fn_rmdir_recursive($path);
        } else {
            @unlink($path);
        }
    }
    @rmdir($dir);
}

function fn_find_free_port(): int
{
    $socket = @stream_socket_server('tcp://127.0.0.1:0', $errno, $errstr);
    if (!is_resource($socket)) {
        throw new RuntimeException("Falha ao reservar porta local: $errstr");
    }
    $name = stream_socket_get_name($socket, false);
    fclose($socket);
    $parts = explode(':', (string) $name);
    return (int) end($parts);
}

$GLOBALS['__ajn_csrf_by_cookie'] = [];

function fn_http(string $baseUrl, string $method, string $path, array $options = []): array
{
    $url = rtrim($baseUrl, '/') . $path;
    $ch = curl_init($url);
    if ($ch === false) throw new RuntimeException('curl_init failed');
    $responseHeaders = [];
    $headers = $options['headers'] ?? [];
    if (isset($options['cookie'])) {
        $headers[] = 'Cookie: ' . $options['cookie'];
        $csrf = $GLOBALS['__ajn_csrf_by_cookie'][$options['cookie']] ?? null;
        if ($csrf && in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'], true) && empty($options['skip_csrf'])) {
            $hasCsrfHeader = false;
            foreach ($headers as $h) {
                if (stripos($h, 'X-CSRF-Token:') === 0) {
                    $hasCsrfHeader = true;
                    break;
                }
            }
            if (!$hasCsrfHeader) {
                $headers[] = 'X-CSRF-Token: ' . $csrf;
            }
        }
        if (in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'], true)
            && !array_key_exists('json', $options)
            && !array_key_exists('multipart', $options)
            && !array_key_exists('raw_body', $options)
            && empty($options['skip_auto_json'])) {
            $options['json'] = [];
        }
    }
    $curlOpts = [
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 3,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_HEADERFUNCTION => static function ($curl, string $headerLine) use (&$responseHeaders): int {
            $len = strlen($headerLine);
            $colon = strpos($headerLine, ':');
            if ($colon !== false) {
                $name = strtolower(trim(substr($headerLine, 0, $colon)));
                $value = trim(substr($headerLine, $colon + 1));
                $responseHeaders[$name][] = $value;
            }
            return $len;
        },
    ];
    if (array_key_exists('json', $options)) {
        $headers[] = 'Content-Type: application/json';
        $payload = $options['json'] === [] ? (object) [] : $options['json'];
        $curlOpts[CURLOPT_POSTFIELDS] = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    } elseif (array_key_exists('multipart', $options)) {
        $curlOpts[CURLOPT_POSTFIELDS] = $options['multipart'];
    } elseif (array_key_exists('raw_body', $options)) {
        $curlOpts[CURLOPT_POSTFIELDS] = (string) $options['raw_body'];
    }
    if ($headers) {
        $curlOpts[CURLOPT_HTTPHEADER] = $headers;
    }
    curl_setopt_array($ch, $curlOpts);
    $body = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    if (!is_string($body)) {
        throw new RuntimeException("HTTP $method $path falhou: $error");
    }
    $json = json_decode($body, true);
    $setCookie = $responseHeaders['set-cookie'][0] ?? '';
    $newCsrf = $responseHeaders['x-csrf-token'][0] ?? (is_array($json) ? ($json['csrfToken'] ?? null) : null);
    if ($setCookie !== '' && preg_match('/__Host-ajn_admin_session=([^;]+)/', $setCookie, $cm)) {
        $cookieKey = '__Host-ajn_admin_session=' . $cm[1];
        if (is_string($newCsrf) && $newCsrf !== '') {
            $GLOBALS['__ajn_csrf_by_cookie'][$cookieKey] = $newCsrf;
        }
    }
    return [
        'status' => $status,
        'headers' => $responseHeaders,
        'body' => $body,
        'json' => is_array($json) ? $json : null,
    ];
}

$tmpRoot = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'ajn_php_test_' . bin2hex(random_bytes(6));
$docRoot = $tmpRoot . DIRECTORY_SEPARATOR . 'public_html';
$privateDir = $tmpRoot . DIRECTORY_SEPARATOR . 'private_resumes';
$insideDocDir = $docRoot . DIRECTORY_SEPARATOR . 'unsafe_resumes';
mkdir($docRoot, 0700, true);
mkdir($privateDir, 0700, true);
mkdir($insideDocDir, 0700, true);

$dbFile = $tmpRoot . DIRECTORY_SEPARATOR . 'careers.sqlite';
$mailLog = $tmpRoot . DIRECTORY_SEPARATOR . 'mails.jsonl';
$flagBadStorage = $tmpRoot . DIRECTORY_SEPARATOR . 'use_bad_storage.flag';
$flagProdEnv = $tmpRoot . DIRECTORY_SEPARATOR . 'use_prod_env.flag';
$flagWrongTurnstileKey = $tmpRoot . DIRECTORY_SEPARATOR . 'use_wrong_turnstile_key.flag';
$turnstileSecretFile = $tmpRoot . DIRECTORY_SEPARATOR . 'turnstile_secret.txt';
$maintenanceFlagFile = $tmpRoot . DIRECTORY_SEPARATOR . 'maintenance.flag';
$cliMailStubFile = $tmpRoot . DIRECTORY_SEPARATOR . 'cli-mail-stub.php';
file_put_contents($cliMailStubFile, sprintf(<<<'PHP'
<?php
$GLOBALS['__ajn_mail_log'] = %s;
if (!function_exists('ajn_send_email')) {
    function ajn_send_email(array $config, string $recipient, string $subject, string $body): bool
    {
        file_put_contents($GLOBALS['__ajn_mail_log'], json_encode(['to' => $recipient, 'subject' => $subject, 'body' => $body], JSON_UNESCAPED_UNICODE) . "\n", FILE_APPEND | LOCK_EX);
        return true;
    }
}
PHP,
    var_export($mailLog, true)
));
file_put_contents($docRoot . DIRECTORY_SEPARATOR . 'index.html', '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>AJN</title></head><body>ok</body></html>');
@mkdir($docRoot . DIRECTORY_SEPARATOR . 'admin' . DIRECTORY_SEPARATOR . 'carreiras', 0700, true);
file_put_contents($docRoot . DIRECTORY_SEPARATOR . 'admin' . DIRECTORY_SEPARATOR . 'carreiras' . DIRECTORY_SEPARATOR . 'index.html', '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Admin</title></head><body>admin</body></html>');
@mkdir($docRoot . DIRECTORY_SEPARATOR . 'styles', 0700, true);
$routerFile = $tmpRoot . DIRECTORY_SEPARATOR . 'router.php';
$encKey = bin2hex(random_bytes(32));
$appUrl = 'https://ajnengenharia.com.br';
$process = null;

try {
    // 1. Testes unitarios em memoria das funcoes de seguranca adicionadas/endurecidas
    $prevDocRoot = $_SERVER['DOCUMENT_ROOT'] ?? null;
    $_SERVER['DOCUMENT_ROOT'] = $docRoot;

    fn_check('ajn_escape_like escapa %, _ e !', ajn_escape_like('100%_!x') === '100!%!_!!x');
    fn_check('ajn_private_resume_dir aceita diretorio irmao fora da raiz publica',
        ajn_private_resume_dir(['resume_directory' => $privateDir], true) === realpath($privateDir));
    fn_check('ajn_private_resume_dir recusa diretorio dentro do DOCUMENT_ROOT',
        ajn_private_resume_dir(['resume_directory' => $insideDocDir], false) === null);
    fn_check('ajn_private_resume_dir recusa exatamente o DOCUMENT_ROOT',
        ajn_private_resume_dir(['resume_directory' => $docRoot], false) === null);
    fn_check('ajn_private_resume_dir recusa diretorio inexistente',
        ajn_private_resume_dir(['resume_directory' => $tmpRoot . DIRECTORY_SEPARATOR . 'missing'], false) === null);

    if ($prevDocRoot === null) {
        unset($_SERVER['DOCUMENT_ROOT']);
    } else {
        $_SERVER['DOCUMENT_ROOT'] = $prevDocRoot;
    }

    $testSecret = 'JBSWY3DPEHPK3PXP';
    $validTotp = fn_rfc6238_totp($testSecret);
    fn_check('ajn_totp valida codigo RFC 6238 valido', ajn_totp($testSecret, 1, $validTotp) !== null);
    fn_check('ajn_totp recusa codigo invalido', ajn_totp($testSecret, 1, '000000') === null || $validTotp === '000000');

    $encCfg = ['encryption_key' => $encKey];
    $cipher = ajn_encrypt('SEGREDO-AJN-2026', $encCfg);
    fn_check('ajn_encrypt/ajn_decrypt roundtrip libsodium secretbox (s1:)', str_starts_with($cipher, 's1:') && ajn_decrypt($cipher, $encCfg) === 'SEGREDO-AJN-2026');
    $rotatedCfg = ['encryption_key' => bin2hex(random_bytes(32)), 'previous_encryption_keys' => [$encKey]];
    fn_check('ajn_decrypt suporta rotacao de chave via previous_encryption_keys', ajn_decrypt($cipher, $rotatedCfg) === 'SEGREDO-AJN-2026');
    $tampered = substr($cipher, 0, -4) . 'AAAA';
    fn_check('ajn_decrypt detecta adulteracao', ajn_decrypt($tampered, $encCfg) === '' || $tampered === $cipher);
    $argonHash = ajn_password_hash('S9#vK2!mL8@qR5$wX');
    fn_check('ajn_password_hash usa Argon2id e ajn_password_needs_rehash detecta bcrypt legado',
        str_starts_with($argonHash, '$argon2id$')
        && !ajn_password_needs_rehash($argonHash)
        && ajn_password_needs_rehash('$2y$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'));

    fn_check('ajn_password_is_weak recusa repeticao longa', ajn_password_is_weak('aaaaaaaaaaaaaaaa') === true);
    fn_check('ajn_password_is_weak recusa sequencia numerica', ajn_password_is_weak('Ajn@0123456789!#') === true);
    fn_check('ajn_password_is_weak aceita passphrase forte', ajn_password_is_weak('N8#pQ2!vL9@xR4$mZ1') === false);
    $dummyArgonHash = ajn_dummy_password_hash();
    fn_check('ajn_dummy_password_hash retorna Argon2id com custo equivalente ao baseline e sem necessitar rehash',
        str_starts_with($dummyArgonHash, '$argon2id$')
        && !ajn_password_needs_rehash($dummyArgonHash)
        && password_verify('qualquer-senha', $dummyArgonHash) === false);
    fn_check('ajn_mime_header codifica assunto UTF-8 em Base64 encoded-word',
        str_starts_with(ajn_mime_header('Recuperação de acesso AJN'), '=?UTF-8?B?'));
    fn_check('ajn_email_configured recusa placeholder SUBSTITUIR_',
        ajn_email_configured(['smtp' => ['host' => 'smtp.example.com', 'username' => 'u', 'password' => 'SUBSTITUIR_SENHA', 'from' => 'a@ajnengenharia.com.br']]) === false);

    // 2. Inicializa banco SQLite isolado e contas de teste por perfil
    $pdo = new PDO('sqlite:' . $dbFile, null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_EMULATE_PREPARES => false,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    $pdo->exec('PRAGMA foreign_keys = ON;');
    $pdo->exec('PRAGMA busy_timeout = 3000;');
    $pdo->exec("
        CREATE TABLE candidates (
            id TEXT PRIMARY KEY, full_name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, phone TEXT NOT NULL,
            phone_encrypted TEXT, cpf_hash TEXT UNIQUE, cpf_masked TEXT, cpf_encrypted TEXT,
            key_version TEXT NOT NULL DEFAULT 'v1', city TEXT NOT NULL, state TEXT NOT NULL,
            linkedin_url TEXT, portfolio_url TEXT, current_title TEXT, summary TEXT,
            is_talent_pool INTEGER NOT NULL DEFAULT 0, email_verification_code_hash TEXT,
            email_verification_expires_at INTEGER, email_verification_attempts INTEGER NOT NULL DEFAULT 0,
            created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
        );
        CREATE TABLE resumes (
            id TEXT PRIMARY KEY, candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
            file_key TEXT NOT NULL UNIQUE, original_filename TEXT NOT NULL, mime_type TEXT NOT NULL,
            file_size_bytes INTEGER NOT NULL, file_sha256 TEXT NOT NULL, is_current INTEGER NOT NULL DEFAULT 1,
            uploaded_at INTEGER NOT NULL
        );
        CREATE TABLE certifications (
            id TEXT PRIMARY KEY, candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
            name TEXT NOT NULL, issuing_organization TEXT, issue_date TEXT, expiration_date TEXT,
            credential_id TEXT, created_at INTEGER NOT NULL
        );
        CREATE TABLE work_experiences (
            id TEXT PRIMARY KEY, candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
            company_name TEXT NOT NULL, role TEXT NOT NULL, start_date TEXT NOT NULL, end_date TEXT,
            is_current INTEGER NOT NULL DEFAULT 0, description TEXT, created_at INTEGER NOT NULL
        );
        CREATE TABLE job_postings (
            id TEXT PRIMARY KEY, title TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, department TEXT NOT NULL,
            location TEXT NOT NULL, employment_type TEXT NOT NULL, experience_level TEXT NOT NULL,
            description TEXT NOT NULL, requirements TEXT NOT NULL, differentials TEXT, benefits TEXT,
            salary_min INTEGER, salary_max INTEGER, salary_is_disclosed INTEGER NOT NULL DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'draft', openings_count INTEGER NOT NULL DEFAULT 1,
            published_at INTEGER, closed_at INTEGER, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
        );
        CREATE TABLE recruitment_stages (
            id TEXT PRIMARY KEY, job_id TEXT REFERENCES job_postings(id) ON DELETE CASCADE,
            name TEXT NOT NULL, stage_order INTEGER NOT NULL, is_terminal_hired INTEGER NOT NULL DEFAULT 0,
            is_terminal_rejected INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL
        );
        CREATE TABLE job_applications (
            id TEXT PRIMARY KEY, job_id TEXT REFERENCES job_postings(id) ON DELETE SET NULL,
            candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
            resume_id TEXT REFERENCES resumes(id) ON DELETE SET NULL,
            current_stage_id TEXT REFERENCES recruitment_stages(id) ON DELETE SET NULL,
            tracking_code TEXT NOT NULL UNIQUE, tracking_token_hash TEXT, tracking_expires_at INTEGER,
            status TEXT NOT NULL DEFAULT 'active',
            source TEXT NOT NULL DEFAULT 'portal', recruiter_rating INTEGER, recruiter_notes TEXT,
            rejection_reason TEXT, recovery_code_hash TEXT, recovery_expires_at INTEGER,
            recovery_attempts INTEGER NOT NULL DEFAULT 0, applied_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
        );
        CREATE TABLE admin_users (
            id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL,
            password_salt TEXT, role TEXT NOT NULL DEFAULT 'recruiter', is_active INTEGER NOT NULL DEFAULT 1,
            mfa_enabled INTEGER NOT NULL DEFAULT 0, mfa_secret TEXT, pending_mfa_secret TEXT,
            mfa_required INTEGER NOT NULL DEFAULT 1, mfa_last_counter INTEGER, failed_attempts INTEGER NOT NULL DEFAULT 0,
            locked_until INTEGER, reset_token_hash TEXT, reset_expires_at INTEGER, reset_attempts INTEGER NOT NULL DEFAULT 0,
            known_ips_json TEXT,
            created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
        );
        CREATE TABLE admin_sessions (
            id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
            session_token_hash TEXT NOT NULL UNIQUE, role TEXT NOT NULL, ip_address TEXT, user_agent TEXT,
            expires_at INTEGER NOT NULL, absolute_expires_at INTEGER NOT NULL, step_up_until INTEGER, created_at INTEGER NOT NULL
        );
        CREATE TABLE admin_recovery_codes (
            id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
            code_hash TEXT NOT NULL, used_at INTEGER, created_at INTEGER NOT NULL
        );
        CREATE TABLE admin_permissions (
            id TEXT PRIMARY KEY, role TEXT NOT NULL, permission TEXT NOT NULL, created_at INTEGER NOT NULL,
            UNIQUE(role, permission)
        );
        CREATE TABLE data_consents (
            id TEXT PRIMARY KEY, candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
            consent_type TEXT NOT NULL, consent_version TEXT NOT NULL, granted INTEGER NOT NULL DEFAULT 1,
            ip_address TEXT, user_agent TEXT, consented_at INTEGER NOT NULL, revoked_at INTEGER
        );
        CREATE TABLE data_subject_requests (
            id TEXT PRIMARY KEY, candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
            request_type TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', reason TEXT,
            requested_at INTEGER NOT NULL, completed_at INTEGER,
            completed_by TEXT REFERENCES admin_users(id) ON DELETE SET NULL
        );
        CREATE TABLE audit_logs (
            id TEXT PRIMARY KEY, actor_id TEXT, actor_type TEXT NOT NULL, action TEXT NOT NULL,
            resource TEXT NOT NULL, resource_id TEXT, details_json TEXT, ip_address TEXT,
            user_agent TEXT, prev_hash TEXT, entry_hash TEXT, timestamp INTEGER NOT NULL
        );
        CREATE TABLE request_rate_limits (
            bucket_key TEXT PRIMARY KEY, window_started_at INTEGER NOT NULL,
            hits INTEGER NOT NULL, expires_at INTEGER NOT NULL
        );
        CREATE TABLE admin_login_locks (
            id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
            ip_address TEXT NOT NULL, failed_attempts INTEGER NOT NULL DEFAULT 0,
            locked_until INTEGER, updated_at INTEGER NOT NULL,
            UNIQUE(user_id, ip_address)
        );
        CREATE TABLE security_alert_queue (
            id TEXT PRIMARY KEY, event_type TEXT NOT NULL, recipient_email TEXT NOT NULL,
            subject TEXT NOT NULL, body TEXT NOT NULL, context_json TEXT,
            status TEXT NOT NULL DEFAULT 'pending', attempts INTEGER NOT NULL DEFAULT 0,
            created_at INTEGER NOT NULL, sent_at INTEGER, last_error TEXT
        );
    ");

    $now = time();
    foreach ([
        ['stage-1-triagem', 'Triagem & Inscrição', 1, 0, 0],
        ['stage-2-requisitos', 'Análise de Requisitos', 2, 0, 0],
        ['stage-6-contratado', 'Contratado', 6, 1, 0],
        ['stage-7-banco', 'Banco de Talentos / Declinado', 7, 0, 1],
    ] as [$sid, $sname, $order, $hired, $rejected]) {
        ajn_exec($pdo, 'INSERT INTO recruitment_stages (id,name,stage_order,is_terminal_hired,is_terminal_rejected,created_at) VALUES (?,?,?,?,?,?)',
            [$sid, $sname, $order, $hired, $rejected, $now]);
    }
    foreach ([
        ['rec-1', 'recruiter', 'jobs:read'],
        ['rec-2', 'recruiter', 'jobs:write'],
        ['rec-3', 'recruiter', 'candidates:read'],
        ['rec-4', 'recruiter', 'resumes:read'],
        ['rec-5', 'recruiter', 'applications:read'],
        ['rec-6', 'recruiter', 'applications:stage_move'],
        ['rec-7', 'recruiter', 'candidates:export'],
        ['viewer-1', 'viewer', 'jobs:read'],
        ['viewer-2', 'viewer', 'candidates:read'],
        ['viewer-3', 'viewer', 'applications:read'],
        ['dpo-1', 'dpo', 'candidates:read'],
        ['dpo-2', 'dpo', 'lgpd:read'],
        ['dpo-3', 'dpo', 'lgpd:execute'],
        ['dpo-4', 'dpo', 'audit:read'],
        ['dpo-5', 'dpo', 'candidates:export'],
    ] as [$pid, $role, $perm]) {
        ajn_exec($pdo, 'INSERT INTO admin_permissions (id,role,permission,created_at) VALUES (?,?,?,?)',
            [$pid, $role, $perm, $now]);
    }

    $superPass = 'S9#vK2!mL8@qR5$wX';
    $recruiterPass = 'R4$bN7!tP2@zM6#vQ';
    $viewerPass = 'V3!kM9@pX2#sL8$nW';
    $dpoPass = 'D6#nR4!qZ8@vT2$kM';
    $inactivePass = 'I5@wP8#mN3!kB7$zL';

    $recruiterSecret = ajn_base32_encode(random_bytes(10));
    $viewerSecret = ajn_base32_encode(random_bytes(10));
    $dpoSecret = ajn_base32_encode(random_bytes(10));

    $superId = ajn_uuid();
    $recruiterId = ajn_uuid();
    $viewerId = ajn_uuid();
    $dpoId = ajn_uuid();
    $inactiveId = ajn_uuid();
    $noMfaId = ajn_uuid();

    $insertUser = static function (PDO $db, string $id, string $name, string $email, string $pass, string $role, int $active, int $mfaEnabled, ?string $encMfa, int $now, bool $useBcrypt = false): void {
        $hash = $useBcrypt ? password_hash($pass, PASSWORD_BCRYPT, ['cost' => 4]) : ajn_password_hash($pass);
        ajn_exec($db,
            'INSERT INTO admin_users (id,name,email,password_hash,role,is_active,mfa_enabled,mfa_secret,mfa_required,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
            [$id, $name, $email, $hash, $role, $active, $mfaEnabled, $encMfa, 1, $now, $now]
        );
    };
    $insertUser($pdo, $superId, 'Super Admin', 'super@ajnengenharia.com.br', $superPass, 'super_admin', 1, 1, ajn_encrypt($testSecret, $encCfg), $now, true);
    $insertUser($pdo, $recruiterId, 'Recruiter', 'recruiter@ajnengenharia.com.br', $recruiterPass, 'recruiter', 1, 1, ajn_encrypt($recruiterSecret, $encCfg), $now);
    $insertUser($pdo, $viewerId, 'Viewer', 'viewer@ajnengenharia.com.br', $viewerPass, 'viewer', 1, 1, ajn_encrypt($viewerSecret, $encCfg), $now);
    $insertUser($pdo, $dpoId, 'DPO', 'dpo@ajnengenharia.com.br', $dpoPass, 'dpo', 1, 1, ajn_encrypt($dpoSecret, $encCfg), $now);
    $insertUser($pdo, $inactiveId, 'Inactive', 'inactive@ajnengenharia.com.br', $inactivePass, 'recruiter', 0, 1, ajn_encrypt($recruiterSecret, $encCfg), $now);
    $insertUser($pdo, $noMfaId, 'No MFA', 'nomfa@ajnengenharia.com.br', $viewerPass, 'viewer', 1, 0, null, $now);

    // 3. Gera router temporario para php -S (somente dentro de sys_get_temp_dir)
    $port = fn_find_free_port();
    $baseUrl = "http://127.0.0.1:$port";
    $hostingerDir = str_replace('\\', '/', realpath(__DIR__ . '/..'));
    $routerCode = sprintf(<<<'PHP'
<?php
declare(strict_types=1);
define('AJN_DISABLE_AUTO_DISPATCH', true);
$GLOBALS['__ajn_mail_log'] = %s;
$__docRoot = %s;
$_SERVER['DOCUMENT_ROOT'] = $__docRoot;
if (isset($_SERVER['HTTP_X_AJN_TEST_CLIENT_IP']) && filter_var($_SERVER['HTTP_X_AJN_TEST_CLIENT_IP'], FILTER_VALIDATE_IP)) {
    $_SERVER['REMOTE_ADDR'] = $_SERVER['HTTP_X_AJN_TEST_CLIENT_IP'];
}
if (!function_exists('ajn_send_email')) {
    function ajn_send_email(array $config, string $recipient, string $subject, string $body): bool
    {
        file_put_contents($GLOBALS['__ajn_mail_log'], json_encode(['to' => $recipient, 'subject' => $subject, 'body' => $body], JSON_UNESCAPED_UNICODE) . "\n", FILE_APPEND | LOCK_EX);
        return true;
    }
}
require_once %s . '/bootstrap.php';
require_once %s . '/app.php';
$__turnstileFile = %s;
$__wrongTurnstileFlag = %s;
$config = [
    'app_url' => %s,
    'cors_allowed_origins' => [%s],
    'environment' => file_exists(%s) ? 'production' : 'staging',
    'encryption_key' => %s,
    'resume_directory' => file_exists(%s) ? %s : %s,
    'maintenance_flag_path' => %s,
    'maintenance_retry_after' => 300,
    'security_alert_email' => 'faleconosco@ajnengenharia.com.br',
    'smtp' => ['host' => 'smtp.example.com', 'port' => 465, 'username' => 'noreply', 'password' => 'secret', 'from' => 'noreply@ajnengenharia.com.br'],
];
if (file_exists($__wrongTurnstileFlag)) {
    $config['turnstile_secret'] = 'prod-real-secret-key-min-len-99999';
} else {
    $config['turnstile_secret_key'] = is_file($__turnstileFile) ? trim((string) file_get_contents($__turnstileFile)) : '1x0000000000000000000000000000000AA';
}
$db = new PDO('sqlite:' . %s, null, null, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_EMULATE_PREPARES => false,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
]);
$db->exec('PRAGMA foreign_keys = ON;');
$db->exec('PRAGMA busy_timeout = 3000;');
$__reqPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
if ($__reqPath === '/__test-config-sapi') {
    $resolved = ajn_cli_config_path();
    $envRaw = getenv('AJN_CONFIG_PATH');
    header('X-Test-Sapi: ' . PHP_SAPI);
    header('X-Test-Env-Set: ' . ($envRaw !== false && $envRaw !== '' ? '1' : '0'));
    header('X-Test-Resolved-Path: ' . $resolved);
    ajn_config();
}
if (file_exists($config['maintenance_flag_path']) && (str_starts_with($__reqPath, '/api/') || str_starts_with($__reqPath, '/admin/'))) {
    ajn_dispatch($db, $config);
}
if (!str_starts_with($__reqPath, '/api/') && !preg_match('~^/carreiras/vaga(?:/|$)~', $__reqPath)) {
    $__legacyRedirects = [
        '/sitemap.xml' => '/sitemap-index.xml',
        '/informacoes' => '/mapa-site',
        '/empresa' => '/sobre/',
        '/fale-conosco' => '/contato/',
        '/projetos-eletricos-prediais' => '/servicos',
        '/regularizacao-avcb' => '/servicos/regularizacao-de-imoveis-junto-ao-corpo-de-bombeiros/',
    ];
    $__normPath = $__reqPath === '/' ? '/' : rtrim($__reqPath, '/');
    if (isset($__legacyRedirects[$__normPath])) {
        http_response_code(301);
        header('Location: ' . $__legacyRedirects[$__normPath]);
        exit;
    }
    if (preg_match('~(?:^|/)\.(?!well-known(?:/|$))~i', $__reqPath)
        || preg_match('~\.(?:sql|env|md|log|bak|old|orig|swp|dist|ini|sh|zip|tar|gz)$~i', $__reqPath)
        || preg_match('~(?:composer\.(?:json|lock)|package(?:-lock)?\.json)$~i', $__reqPath)
        || (str_ends_with(strtolower($__reqPath), '.php') && $__reqPath !== '/api/index.php')) {
        http_response_code(403);
        exit('Forbidden');
    }
    $__fsTarget = $__docRoot . str_replace('/', DIRECTORY_SEPARATOR, $__reqPath);
    if (is_dir($__fsTarget) && !is_file($__fsTarget . DIRECTORY_SEPARATOR . 'index.html')) {
        http_response_code(403);
        exit('Directory listing denied');
    }
    if ($__reqPath === '/admin/carreiras' || $__reqPath === '/admin/carreiras/') {
        $adminHtml = $__docRoot . DIRECTORY_SEPARATOR . 'admin' . DIRECTORY_SEPARATOR . 'carreiras' . DIRECTORY_SEPARATOR . 'index.html';
        if (is_file($adminHtml)) {
            http_response_code(200);
            header('Content-Type: text/html; charset=utf-8');
            readfile($adminHtml);
            exit;
        }
    }
    if ($__reqPath === '/' && is_file($__docRoot . DIRECTORY_SEPARATOR . 'index.html')) {
        http_response_code(200);
        header('Content-Type: text/html; charset=utf-8');
        header("Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; img-src 'self' data:");
        readfile($__docRoot . DIRECTORY_SEPARATOR . 'index.html');
        exit;
    }
}
ajn_dispatch($db, $config);
PHP,
        var_export($mailLog, true),
        var_export($docRoot, true),
        var_export($hostingerDir, true),
        var_export($hostingerDir, true),
        var_export($turnstileSecretFile, true),
        var_export($flagWrongTurnstileKey, true),
        var_export($appUrl, true),
        var_export($baseUrl, true),
        var_export($flagProdEnv, true),
        var_export($encKey, true),
        var_export($flagBadStorage, true),
        var_export($insideDocDir, true),
        var_export($privateDir, true),
        var_export($maintenanceFlagFile, true),
        var_export($dbFile, true)
    );
    $cliSapiConfigFile = $tmpRoot . DIRECTORY_SEPARATOR . 'sapi-override-config.php';
    file_put_contents($cliSapiConfigFile, "<?php return ['app_url' => 'https://attacker.invalid', 'environment' => 'staging', 'encryption_key' => " . var_export($encKey, true) . ", 'resume_directory' => " . var_export($privateDir, true) . "];");
    file_put_contents($routerFile, $routerCode);
    $descriptors = [
        0 => ['pipe', 'r'],
        1 => ['file', $tmpRoot . DIRECTORY_SEPARATOR . 'server.out.log', 'a'],
        2 => ['file', $tmpRoot . DIRECTORY_SEPARATOR . 'server.err.log', 'a'],
    ];
    $serverEnv = array_merge($_ENV, getenv() ?: [], ['AJN_CONFIG_PATH' => $cliSapiConfigFile]);
    $process = proc_open([PHP_BINARY, '-d', 'extension=sodium', '-S', "127.0.0.1:$port", '-t', $docRoot, $routerFile], $descriptors, $pipes, null, $serverEnv);
    if (!is_resource($process)) {
        throw new RuntimeException('Não foi possível iniciar o servidor PHP temporário.');
    }

    $ready = false;
    $deadline = microtime(true) + 5.0;
    while (microtime(true) < $deadline) {
        $probe = @fsockopen('127.0.0.1', $port, $e, $s, 0.2);
        if (is_resource($probe)) {
            fclose($probe);
            $ready = true;
            break;
        }
        usleep(50000);
    }
    if (!$ready) {
        throw new RuntimeException('Servidor PHP temporário não respondeu a tempo.');
    }

    // 4. Fluxos HTTP end-to-end
    // 4.1 Health staging vs production e headers de seguranca
    $healthStaging = fn_http($baseUrl, 'GET', '/api/health');
    fn_check('HTTP /api/health staging retorna 200 e headers de isolamento',
        $healthStaging['status'] === 200
        && ($healthStaging['json']['environment'] ?? null) === 'staging'
        && ($healthStaging['headers']['x-frame-options'][0] ?? '') === 'DENY'
        && ($healthStaging['headers']['x-content-type-options'][0] ?? '') === 'nosniff'
        && ($healthStaging['headers']['cross-origin-resource-policy'][0] ?? '') === 'same-origin');

    file_put_contents($flagProdEnv, '1');
    $healthProd = fn_http($baseUrl, 'GET', '/api/health');
    @unlink($flagProdEnv);
    fn_check('HTTP /api/health em production oculta marcador environment',
        $healthProd['status'] === 200 && !array_key_exists('environment', $healthProd['json'] ?? []));

    // 4.2 Origem cruzada bloqueada antes de gravar rate limit
    $badOrigin = fn_http($baseUrl, 'POST', '/api/admin/auth/login', [
        'headers' => ['Origin: https://evil.example'],
        'json' => ['email' => 'super@ajnengenharia.com.br', 'password' => $superPass],
    ]);
    $loginBucket = hash('sha256', 'admin-login:127.0.0.1');
    $rlRows = ajn_fetch($pdo, 'SELECT hits FROM request_rate_limits WHERE bucket_key=?', [$loginBucket]);
    fn_check('HTTP login cross-origin retorna 403 antes de consumir cota',
        $badOrigin['status'] === 403 && $rlRows === null);

    // 4.3 & 4.4 Anti-enumeracao no login: mesmo status (401), mesmo corpo byte a byte e tempo uniforme
    // para conta inexistente, conta inativa, senha errada e conta bloqueada
    $t0 = hrtime(true);
    $unknownLogin = fn_http($baseUrl, 'POST', '/api/admin/auth/login', [
        'headers' => ['Origin: ' . $appUrl],
        'json' => ['email' => 'missing@ajnengenharia.com.br', 'password' => $superPass],
    ]);
    $tUnknownMs = (hrtime(true) - $t0) / 1e6;

    $t0 = hrtime(true);
    $inactiveLogin = fn_http($baseUrl, 'POST', '/api/admin/auth/login', [
        'headers' => ['Origin: ' . $appUrl],
        'json' => ['email' => 'inactive@ajnengenharia.com.br', 'password' => $inactivePass],
    ]);
    $tInactiveMs = (hrtime(true) - $t0) / 1e6;

    $wrongPassLogin = null;
    $tWrongPassMs = 0.0;
    for ($i = 0; $i < 5; $i++) {
        $t0 = hrtime(true);
        $wrongPassLogin = fn_http($baseUrl, 'POST', '/api/admin/auth/login', [
            'headers' => ['Origin: ' . $appUrl],
            'json' => ['email' => 'viewer@ajnengenharia.com.br', 'password' => 'WrongPassword#2026'],
        ]);
        $tWrongPassMs = (hrtime(true) - $t0) / 1e6;
    }

    $t0 = hrtime(true);
    $lockedViewer = fn_http($baseUrl, 'POST', '/api/admin/auth/login', [
        'headers' => ['Origin: ' . $appUrl],
        'json' => ['email' => 'viewer@ajnengenharia.com.br', 'password' => $viewerPass],
    ]);
    $tLockedMs = (hrtime(true) - $t0) / 1e6;

    $viewerLockRow = ajn_fetch($pdo, "SELECT failed_attempts, locked_until FROM admin_login_locks WHERE user_id=? AND ip_address='127.0.0.1'", [$viewerId]);
    $lockedAuditRow = ajn_fetch($pdo, "SELECT id FROM audit_logs WHERE action='AUTH_LOGIN_LOCKED_ATTEMPT' AND resource_id=? LIMIT 1", [$viewerId]);

    fn_check('HTTP conta inexistente, inativa, senha errada e conta bloqueada retornam 401 e corpo identico byte a byte',
        $unknownLogin['status'] === 401
        && $inactiveLogin['status'] === 401
        && ($wrongPassLogin['status'] ?? 0) === 401
        && $lockedViewer['status'] === 401
        && $unknownLogin['body'] === '{"error":"Credenciais inválidas."}'
        && $unknownLogin['body'] === $inactiveLogin['body']
        && $inactiveLogin['body'] === ($wrongPassLogin['body'] ?? '')
        && ($wrongPassLogin['body'] ?? '') === $lockedViewer['body']
        && $tUnknownMs > 1.0 && $tInactiveMs > 1.0 && $tWrongPassMs > 1.0 && $tLockedMs > 1.0);

    fn_check('HTTP bloqueio progressivo apos 5 falhas permanece ativo por (conta + IP) e audita tentativa sem revelar 423 ao cliente',
        (int) ($viewerLockRow['failed_attempts'] ?? 0) >= 5
        && (int) ($viewerLockRow['locked_until'] ?? 0) > time()
        && $lockedAuditRow !== null);

    // 3.a IP B legitimo nao e bloqueado pelas falhas do IP A (127.0.0.1)
    $viewerIpB = fn_http($baseUrl, 'POST', '/api/admin/auth/login', [
        'headers' => ['Origin: ' . $appUrl, 'X-AJN-Test-Client-Ip: 198.51.100.77'],
        'json' => ['email' => 'viewer@ajnengenharia.com.br', 'password' => $viewerPass, 'mfaCode' => fn_rfc6238_totp($viewerSecret)],
    ]);
    $viewerLockedStillIpA = fn_http($baseUrl, 'POST', '/api/admin/auth/login', [
        'headers' => ['Origin: ' . $appUrl],
        'json' => ['email' => 'viewer@ajnengenharia.com.br', 'password' => $viewerPass, 'mfaCode' => fn_rfc6238_totp($viewerSecret)],
    ]);
    fn_check('HTTP 3.a bloqueio por (conta + IP): IP A segue bloqueado (401) enquanto IP B autentica com 200',
        $viewerIpB['status'] === 200 && $viewerLockedStillIpA['status'] === 401);

    // Desbloqueia viewer e limpa sessao/replay temporarios para testes de RBAC posteriores
    ajn_exec($pdo, 'DELETE FROM admin_login_locks WHERE user_id=?', [$viewerId]);
    ajn_exec($pdo, 'DELETE FROM admin_sessions WHERE user_id=?', [$viewerId]);
    ajn_exec($pdo, 'UPDATE admin_users SET failed_attempts=0, locked_until=NULL, mfa_last_counter=NULL WHERE id=?', [$viewerId]);

    // 4.5 Login super_admin com MFA TOTP + protecao anti-replay + rehash Argon2id + MFA obrigatorio
    $totpCode = fn_rfc6238_totp($testSecret);
    $superLogin = fn_http($baseUrl, 'POST', '/api/admin/auth/login', [
        'headers' => ['Origin: ' . $appUrl],
        'json' => ['email' => 'super@ajnengenharia.com.br', 'password' => $superPass, 'mfaCode' => $totpCode],
    ]);
    $setCookie = $superLogin['headers']['set-cookie'][0] ?? '';
    fn_check('HTTP login MFA emite cookie __Host- Secure HttpOnly SameSite=Strict sem Domain',
        $superLogin['status'] === 200
        && str_starts_with($setCookie, '__Host-ajn_admin_session=')
        && stripos($setCookie, '; HttpOnly') !== false
        && stripos($setCookie, '; secure') !== false
        && stripos($setCookie, '; SameSite=Strict') !== false
        && stripos($setCookie, 'Domain=') === false);
    preg_match('/__Host-ajn_admin_session=([^;]+)/', $setCookie, $cm);
    $superCookie = '__Host-ajn_admin_session=' . ($cm[1] ?? '');

    $upgradedHash = (string) (ajn_fetch($pdo, 'SELECT password_hash FROM admin_users WHERE id=?', [$superId])['password_hash'] ?? '');
    fn_check('HTTP login atualiza hash legado bcrypt para Argon2id via password_needs_rehash',
        str_starts_with($upgradedHash, '$argon2id$'));

    $replayLogin = fn_http($baseUrl, 'POST', '/api/admin/auth/login', [
        'headers' => ['Origin: ' . $appUrl],
        'json' => ['email' => 'super@ajnengenharia.com.br', 'password' => $superPass, 'mfaCode' => $totpCode],
    ]);
    $replayAudit = ajn_fetch($pdo, "SELECT id FROM audit_logs WHERE actor_id=? AND action='AUTH_MFA_REPLAY_BLOCKED' LIMIT 1", [$superId]);
    fn_check('HTTP reapresentacao do mesmo codigo TOTP e bloqueada e auditada',
        $replayLogin['status'] === 401 && $replayAudit !== null);

    // 4.6 Expiracao de inatividade e teto absoluto de sessao
    $meOk = fn_http($baseUrl, 'GET', '/api/admin/auth/me', ['cookie' => $superCookie]);
    fn_check('HTTP sessao valida acessa /api/admin/auth/me', $meOk['status'] === 200);

    $tokenHash = hash('sha256', $cm[1] ?? '');
    ajn_exec($pdo, 'UPDATE admin_sessions SET expires_at=? WHERE session_token_hash=?', [time() - 5, $tokenHash]);
    $meIdleExpired = fn_http($baseUrl, 'GET', '/api/admin/auth/me', ['cookie' => $superCookie]);
    fn_check('HTTP sessao expirada por inatividade retorna 401', $meIdleExpired['status'] === 401);

    ajn_exec($pdo, 'UPDATE admin_sessions SET expires_at=?, absolute_expires_at=? WHERE session_token_hash=?', [time() + 1800, time() - 5, $tokenHash]);
    $meAbsExpired = fn_http($baseUrl, 'GET', '/api/admin/auth/me', ['cookie' => $superCookie]);
    fn_check('HTTP sessao expirada pelo teto absoluto retorna 401', $meAbsExpired['status'] === 401);
    ajn_exec($pdo, 'UPDATE admin_sessions SET expires_at=?, absolute_expires_at=? WHERE session_token_hash=?', [time() + 1800, time() + 28800, $tokenHash]);

    // 4.7 Step-up, criacao de usuario e politica de senha + reset single-use e limite por IP no login
    $noStepUpUser = fn_http($baseUrl, 'POST', '/api/admin/users', [
        'headers' => ['Origin: ' . $appUrl],
        'cookie' => $superCookie,
        'json' => ['name' => 'Sem StepUp', 'email' => 'nostepup@ajnengenharia.com.br', 'password' => 'N8#pQ2!vL9@xR4$mZ1', 'role' => 'recruiter'],
    ]);
    fn_check('HTTP criacao de usuario exige step-up (403 stepUpRequired)',
        $noStepUpUser['status'] === 403 && ($noStepUpUser['json']['stepUpRequired'] ?? false) === true);

    $stepUpRes = fn_http($baseUrl, 'POST', '/api/admin/auth/step-up', [
        'headers' => ['Origin: ' . $appUrl],
        'cookie' => $superCookie,
        'json' => ['password' => $superPass, 'mfaCode' => fn_rfc6238_totp($testSecret, 1)],
    ]);
    preg_match('/__Host-ajn_admin_session=([^;]+)/', $stepUpRes['headers']['set-cookie'][0] ?? '', $stepCm);
    $rotatedSuperCookie = '__Host-ajn_admin_session=' . ($stepCm[1] ?? '');
    fn_check('HTTP /api/admin/auth/step-up valida senha+TOTP e rotaciona token de sessao',
        $stepUpRes['status'] === 200 && ($stepCm[1] ?? '') !== '' && $rotatedSuperCookie !== $superCookie);
    $superCookie = $rotatedSuperCookie;

    $weakUser = fn_http($baseUrl, 'POST', '/api/admin/users', [
        'headers' => ['Origin: ' . $appUrl],
        'cookie' => $superCookie,
        'json' => ['name' => 'Fraco', 'email' => 'fraco@ajnengenharia.com.br', 'password' => 'aaaaaaaaaaaaaaaa', 'role' => 'recruiter'],
    ]);
    fn_check('HTTP criacao de usuario recusa senha degenerada', $weakUser['status'] === 400);

    $forgot = fn_http($baseUrl, 'POST', '/api/admin/auth/forgot-password', [
        'headers' => ['Origin: ' . $appUrl],
        'json' => ['email' => 'recruiter@ajnengenharia.com.br'],
    ]);
    $mailLines = file($mailLog, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
    $ResetTokenFound = '';
    foreach (array_reverse($mailLines) as $mLine) {
        $parsedMail = json_decode((string) $mLine, true);
        if (preg_match('/resetToken=([a-f0-9]{64})/', (string) ($parsedMail['body'] ?? ''), $rm)) {
            $ResetTokenFound = $rm[1];
            break;
        }
    }
    $resetToken = $ResetTokenFound;
    $newRecruiterPass = 'R9#kM4!qV7@pX2$wZ';
    ajn_exec($pdo, 'UPDATE admin_users SET failed_attempts=5, locked_until=? WHERE id=?', [time() + 900, $recruiterId]);
    ajn_exec($pdo, 'INSERT OR REPLACE INTO admin_login_locks (id,user_id,ip_address,failed_attempts,locked_until,updated_at) VALUES (?,?,?,?,?,?)',
        [ajn_uuid(), $recruiterId, '203.0.113.10', 5, time() + 900, time()]);

    $resetOnce = fn_http($baseUrl, 'POST', '/api/admin/auth/reset-password', [
        'headers' => ['Origin: ' . $appUrl],
        'json' => ['token' => $resetToken, 'newPassword' => $newRecruiterPass],
    ]);
    $resetTwice = fn_http($baseUrl, 'POST', '/api/admin/auth/reset-password', [
        'headers' => ['Origin: ' . $appUrl],
        'json' => ['token' => $resetToken, 'newPassword' => 'Z8#pM5!qW3@kR9$vL'],
    ]);
    $recUserAfterReset = ajn_fetch($pdo, 'SELECT failed_attempts, locked_until FROM admin_users WHERE id=?', [$recruiterId]);
    $recLocksAfterReset = (int) (ajn_fetch($pdo, 'SELECT COUNT(*) AS c FROM admin_login_locks WHERE user_id=?', [$recruiterId])['c'] ?? 0);
    fn_check('HTTP token de redefinicao funciona uma unica vez e zera bloqueios da conta (3.b)',
        $forgot['status'] === 202
        && $resetToken !== ''
        && $resetOnce['status'] === 200
        && $resetTwice['status'] === 400
        && (int) ($recUserAfterReset['failed_attempts'] ?? -1) === 0
        && is_array($recUserAfterReset)
        && $recUserAfterReset['locked_until'] === null
        && $recLocksAfterReset === 0);

    $rateLimitedLogin = ['status' => 0, 'headers' => []];
    for ($rlTry = 0; $rlTry < 32; $rlTry++) {
        $rateLimitedLogin = fn_http($baseUrl, 'POST', '/api/admin/auth/login', [
            'headers' => ['Origin: ' . $appUrl],
            'json' => ['email' => 'recruiter@ajnengenharia.com.br', 'password' => $newRecruiterPass],
        ]);
        if ($rateLimitedLogin['status'] === 429) {
            break;
        }
    }
    fn_check('HTTP rate limit de login excedido na mesma janela retorna 429 com Retry-After',
        $rateLimitedLogin['status'] === 429 && !empty($rateLimitedLogin['headers']['retry-after'][0]));

    // Limpa janela de rate limit e locks de login para prosseguir com os testes de RBAC por perfil
    ajn_exec($pdo, 'DELETE FROM request_rate_limits');
    ajn_exec($pdo, 'DELETE FROM admin_login_locks');
    ajn_exec($pdo, 'UPDATE admin_users SET failed_attempts=0, locked_until=NULL');

    $noMfaLogin = fn_http($baseUrl, 'POST', '/api/admin/auth/login', [
        'headers' => ['Origin: ' . $appUrl],
        'json' => ['email' => 'nomfa@ajnengenharia.com.br', 'password' => $viewerPass, 'mfaCode' => '123456'],
    ]);
    fn_check('HTTP login bloqueia conta admin sem MFA provisionado (403 sem bypass)',
        $noMfaLogin['status'] === 403 && str_contains((string) ($noMfaLogin['json']['error'] ?? ''), 'MFA'));

    // Loga recruiter (com nova senha), viewer e dpo
    $loginRole = static function (string $email, string $pass, string $mfaSecret) use ($baseUrl, $appUrl): string {
        $res = fn_http($baseUrl, 'POST', '/api/admin/auth/login', [
            'headers' => ['Origin: ' . $appUrl],
            'json' => ['email' => $email, 'password' => $pass, 'mfaCode' => fn_rfc6238_totp($mfaSecret)],
        ]);
        if ($res['status'] !== 200) throw new RuntimeException("Login falhou para $email: {$res['status']}");
        preg_match('/__Host-ajn_admin_session=([^;]+)/', $res['headers']['set-cookie'][0] ?? '', $m);
        return '__Host-ajn_admin_session=' . ($m[1] ?? '');
    };
    $recruiterCookie = $loginRole('recruiter@ajnengenharia.com.br', $newRecruiterPass, $recruiterSecret);
    $viewerCookie = $loginRole('viewer@ajnengenharia.com.br', $viewerPass, $viewerSecret);
    $dpoCookie = $loginRole('dpo@ajnengenharia.com.br', $dpoPass, $dpoSecret);

    // 4.8 Matriz RBAC + criacao de vagas para teste LIKE e XSS SSR
    $viewerCreateJob = fn_http($baseUrl, 'POST', '/api/admin/jobs', [
        'headers' => ['Origin: ' . $appUrl],
        'cookie' => $viewerCookie,
        'json' => ['title' => 'Negado', 'slug' => 'negado', 'department' => 'SST', 'location' => 'BH', 'employmentType' => 'CLT', 'experienceLevel' => 'Pleno', 'description' => 'x', 'requirements' => ['NR-10']],
    ]);
    $recruiterCreateUser = fn_http($baseUrl, 'POST', '/api/admin/users', [
        'headers' => ['Origin: ' . $appUrl],
        'cookie' => $recruiterCookie,
        'json' => ['name' => 'X', 'email' => 'x@ajnengenharia.com.br', 'password' => 'N8#pQ2!vL9@xR4$mZ1', 'role' => 'viewer'],
    ]);
    $recruiterAudit = fn_http($baseUrl, 'GET', '/api/admin/audit', ['cookie' => $recruiterCookie]);
    $dpoAudit = fn_http($baseUrl, 'GET', '/api/admin/audit', ['cookie' => $dpoCookie]);
    $dpoCreateJob = fn_http($baseUrl, 'POST', '/api/admin/jobs', [
        'headers' => ['Origin: ' . $appUrl],
        'cookie' => $dpoCookie,
        'json' => ['title' => 'Negado DPO', 'slug' => 'negado-dpo', 'department' => 'SST', 'location' => 'BH', 'employmentType' => 'CLT', 'experienceLevel' => 'Pleno', 'description' => 'x', 'requirements' => ['NR-10']],
    ]);
    fn_check('HTTP matriz RBAC reforca privilegio minimo entre viewer, recruiter e dpo',
        $viewerCreateJob['status'] === 403
        && $recruiterCreateUser['status'] === 403
        && $recruiterAudit['status'] === 403
        && $dpoAudit['status'] === 200
        && $dpoCreateJob['status'] === 403);

    $createSpecialJob = fn_http($baseUrl, 'POST', '/api/admin/jobs', [
        'headers' => ['Origin: ' . $appUrl],
        'cookie' => $recruiterCookie,
        'json' => [
            'title' => 'Engenheiro 100%_Seguranca <script>alert(1)</script>',
            'slug' => 'eng-xss-like-test',
            'department' => 'SST',
            'location' => 'Belo Horizonte',
            'employmentType' => 'CLT',
            'experienceLevel' => 'Pleno',
            'description' => 'Vaga com caracteres 100%_especiais & teste',
            'requirements' => ['CREA ativo', '<b>NR-35</b>'],
            'status' => 'published',
        ],
    ]);
    $createNormalJob = fn_http($baseUrl, 'POST', '/api/admin/jobs', [
        'headers' => ['Origin: ' . $appUrl],
        'cookie' => $recruiterCookie,
        'json' => [
            'title' => 'Analista Ambiental Pleno',
            'slug' => 'analista-ambiental-pleno',
            'department' => 'Meio Ambiente',
            'location' => 'Contagem',
            'employmentType' => 'CLT',
            'experienceLevel' => 'Pleno',
            'description' => 'Vaga regular sem curingas',
            'requirements' => ['Superior completo'],
            'status' => 'published',
        ],
    ]);
    fn_check('HTTP criacao de vagas publicadas retorna 201',
        $createSpecialJob['status'] === 201 && $createNormalJob['status'] === 201);

    $validJobBase = [
        'title' => 'Vaga Validacao',
        'slug' => 'vaga-validacao-400',
        'department' => 'SST',
        'location' => 'BH',
        'employmentType' => 'CLT',
        'experienceLevel' => 'Pleno',
        'description' => 'Descricao valida',
        'requirements' => ['NR-10'],
        'status' => 'draft',
    ];
    $badNullOpenings = fn_http($baseUrl, 'POST', '/api/admin/jobs', [
        'headers' => ['Origin: ' . $appUrl], 'cookie' => $recruiterCookie,
        'json' => array_merge($validJobBase, ['openingsCount' => null]),
    ]);
    $badZeroOpenings = fn_http($baseUrl, 'POST', '/api/admin/jobs', [
        'headers' => ['Origin: ' . $appUrl], 'cookie' => $recruiterCookie,
        'json' => array_merge($validJobBase, ['openingsCount' => 0]),
    ]);
    $badEmptyReqs = fn_http($baseUrl, 'POST', '/api/admin/jobs', [
        'headers' => ['Origin: ' . $appUrl], 'cookie' => $recruiterCookie,
        'json' => array_merge($validJobBase, ['requirements' => []]),
    ]);
    $badTypeReqs = fn_http($baseUrl, 'POST', '/api/admin/jobs', [
        'headers' => ['Origin: ' . $appUrl], 'cookie' => $recruiterCookie,
        'json' => array_merge($validJobBase, ['requirements' => [123]]),
    ]);
    $badBlankReqs = fn_http($baseUrl, 'POST', '/api/admin/jobs', [
        'headers' => ['Origin: ' . $appUrl], 'cookie' => $recruiterCookie,
        'json' => array_merge($validJobBase, ['requirements' => ['   ']]),
    ]);
    $badSalaryRange = fn_http($baseUrl, 'POST', '/api/admin/jobs', [
        'headers' => ['Origin: ' . $appUrl], 'cookie' => $recruiterCookie,
        'json' => array_merge($validJobBase, ['salaryMin' => 6000, 'salaryMax' => 4000]),
    ]);
    $normalJobId = $createNormalJob['json']['jobId'] ?? '';
    $setSalaryRange = fn_http($baseUrl, 'PUT', "/api/admin/jobs/$normalJobId", [
        'headers' => ['Origin: ' . $appUrl], 'cookie' => $recruiterCookie,
        'json' => ['salaryMin' => 5000, 'salaryMax' => 8000],
    ]);
    $badPartialSalary = fn_http($baseUrl, 'PUT', "/api/admin/jobs/$normalJobId", [
        'headers' => ['Origin: ' . $appUrl], 'cookie' => $recruiterCookie,
        'json' => ['salaryMax' => 4000],
    ]);
    $badNullStatusPut = fn_http($baseUrl, 'PUT', "/api/admin/jobs/$normalJobId", [
        'headers' => ['Origin: ' . $appUrl], 'cookie' => $recruiterCookie,
        'json' => ['status' => null],
    ]);
    $badBlankTitlePut = fn_http($baseUrl, 'PUT', "/api/admin/jobs/$normalJobId", [
        'headers' => ['Origin: ' . $appUrl], 'cookie' => $recruiterCookie,
        'json' => ['title' => '   '],
    ]);
    fn_check('HTTP validacao de vagas rejeita openingsCount nulo/zero, requirements invalidos, faixa salarial invertida e nulos no PUT com 400',
        $badNullOpenings['status'] === 400
        && $badZeroOpenings['status'] === 400
        && $badEmptyReqs['status'] === 400
        && $badTypeReqs['status'] === 400
        && $badBlankReqs['status'] === 400
        && $badSalaryRange['status'] === 400
        && $setSalaryRange['status'] === 200
        && $badPartialSalary['status'] === 400
        && $badNullStatusPut['status'] === 400
        && $badBlankTitlePut['status'] === 400);

    // 4.9 LIKE wildcard escaping & SSR XSS escaping
    $likeSearch = fn_http($baseUrl, 'GET', '/api/jobs?q=' . rawurlencode('100%_'));
    $percentSearch = fn_http($baseUrl, 'GET', '/api/jobs?q=' . rawurlencode('%'));
    fn_check('HTTP /api/jobs escapa curingas % e _ na busca LIKE',
        $likeSearch['status'] === 200
        && count($likeSearch['json']['jobs'] ?? []) === 1
        && ($likeSearch['json']['jobs'][0]['slug'] ?? '') === 'eng-xss-like-test'
        && count($percentSearch['json']['jobs'] ?? []) === 1);

    $ssrPage = fn_http($baseUrl, 'GET', '/carreiras/eng-xss-like-test/');
    $ssrMissing = fn_http($baseUrl, 'GET', '/carreiras/vaga-inexistente/');
    fn_check('HTTP pagina SSR da vaga aplica CSP e escapa payload HTML/JSON-LD',
        $ssrPage['status'] === 200
        && !str_contains($ssrPage['body'], '<script>alert(1)</script>')
        && str_contains($ssrPage['body'], '&lt;script&gt;alert(1)&lt;/script&gt;')
        && str_contains(strtolower($ssrPage['headers']['content-security-policy'][0] ?? ''), "object-src 'none'"));
    fn_check('HTTP vaga inexistente retorna 404 com noindex',
        $ssrMissing['status'] === 404 && str_contains($ssrMissing['headers']['x-robots-tag'][0] ?? '', 'noindex'));

    // 4.10 Upload de curriculo, bloqueios e path safety fail-closed
    $pdfPath = $tmpRoot . DIRECTORY_SEPARATOR . 'cv_valid.pdf';
    $pdfBytes = "%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<<>>\n%%EOF\n";
    file_put_contents($pdfPath, $pdfBytes);

    $badPdfPath = $tmpRoot . DIRECTORY_SEPARATOR . 'forged.pdf';
    file_put_contents($badPdfPath, "MZ\x90\x00NOT_A_REAL_PDF_EXECUTABLE");

    $baseApplyFields = [
        'fullName' => 'Maria Clara Souza',
        'email' => 'maria.clara@example.com',
        'phone' => '(31) 99988-7766',
        'cpf' => '52998224725',
        'city' => 'Belo Horizonte',
        'state' => 'MG',
        'consentTerms' => 'true',
        'consentRetention' => 'true',
        'turnstileToken' => 'valid-test-turnstile-token',
    ];

    $jsSchemeApply = fn_http($baseUrl, 'POST', '/api/applications/jobs/eng-xss-like-test/apply', [
        'headers' => ['Origin: ' . $appUrl],
        'multipart' => $baseApplyFields + [
            'linkedinUrl' => 'javascript:alert(document.domain)',
            'resume' => new CURLFile($pdfPath, 'application/pdf', 'cv.pdf'),
        ],
    ]);
    fn_check('HTTP candidatura recusa linkedinUrl com esquema javascript:',
        $jsSchemeApply['status'] === 400 && count(glob($privateDir . DIRECTORY_SEPARATOR . '*')) === 0);

    $forgedApply = fn_http($baseUrl, 'POST', '/api/applications/jobs/eng-xss-like-test/apply', [
        'headers' => ['Origin: ' . $appUrl],
        'multipart' => $baseApplyFields + [
            'resume' => new CURLFile($badPdfPath, 'application/pdf', 'forged.pdf'),
        ],
    ]);
    fn_check('HTTP upload forjado com cabecalho nao-PDF e bloqueado com 400', $forgedApply['status'] === 400);

    $talentNoRetention = fn_http($baseUrl, 'POST', '/api/applications/talent-pool', [
        'headers' => ['Origin: ' . $appUrl],
        'multipart' => array_merge($baseApplyFields, [
            'consentRetention' => 'false',
            'resume' => new CURLFile($pdfPath, 'application/pdf', 'cv.pdf'),
        ]),
    ]);
    fn_check('HTTP Banco de Talentos exige consentimento explicito de retencao', $talentNoRetention['status'] === 400);

    file_put_contents($flagBadStorage, '1');
    $badStorageApply = fn_http($baseUrl, 'POST', '/api/applications/jobs/eng-xss-like-test/apply', [
        'headers' => ['Origin: ' . $appUrl],
        'multipart' => $baseApplyFields + [
            'resume' => new CURLFile($pdfPath, 'application/pdf', 'cv.pdf'),
        ],
    ]);
    @unlink($flagBadStorage);
    fn_check('HTTP armazenamento dentro da raiz publica falha fechado com 503', $badStorageApply['status'] === 503);

    $okApply = fn_http($baseUrl, 'POST', '/api/applications/jobs/eng-xss-like-test/apply', [
        'headers' => ['Origin: ' . $appUrl],
        'multipart' => $baseApplyFields + [
            'linkedinUrl' => 'https://www.linkedin.com/in/maria-clara',
            'portfolioUrl' => 'https://mariaclara.eng.br',
            'resume' => new CURLFile($pdfPath, 'application/pdf', 'cv.pdf'),
        ],
    ]);
    $candidateId = $okApply['json']['candidateId'] ?? '';
    $savedFilesAfterFirst = glob($privateDir . DIRECTORY_SEPARATOR . '*.pdf') ?: [];
    fn_check('HTTP candidatura valida grava candidato e PDF fora da raiz publica',
        $okApply['status'] === 201 && $candidateId !== '' && count($savedFilesAfterFirst) === 1);

    // 4.11 Recandidatura com verificacao de titularidade e promocao atomica de is_current
    $needVerify = fn_http($baseUrl, 'POST', '/api/applications/jobs/analista-ambiental-pleno/apply', [
        'headers' => ['Origin: ' . $appUrl],
        'multipart' => $baseApplyFields + [
            'resume' => new CURLFile($pdfPath, 'application/pdf', 'cv2.pdf'),
        ],
    ]);
    $mailLines2 = file($mailLog, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
    $verifyCode = '';
    foreach (array_reverse($mailLines2) as $mLine2) {
        $ownerMail = json_decode((string) $mLine2, true);
        if (preg_match('/:\s*(\d{6})\b/', (string) ($ownerMail['body'] ?? ''), $om)) {
            $verifyCode = $om[1];
            break;
        }
    }

    $reapplyOk = fn_http($baseUrl, 'POST', '/api/applications/jobs/analista-ambiental-pleno/apply', [
        'headers' => ['Origin: ' . $appUrl],
        'multipart' => $baseApplyFields + [
            'verificationToken' => $verifyCode,
            'resume' => new CURLFile($pdfPath, 'application/pdf', 'cv2.pdf'),
        ],
    ]);
    $currentResumesCount = (int) ajn_fetch($pdo, 'SELECT COUNT(*) AS c FROM resumes WHERE candidate_id=? AND is_current=1', [$candidateId])['c'];
    $totalResumesCount = (int) ajn_fetch($pdo, 'SELECT COUNT(*) AS c FROM resumes WHERE candidate_id=?', [$candidateId])['c'];
    fn_check('HTTP recandidatura exige titularidade e mantem somente 1 curriculo atual',
        $needVerify['status'] === 409 && $verifyCode !== '' && $reapplyOk['status'] === 201 && $totalResumesCount === 2 && $currentResumesCount === 1);

    // 4.12 Download de curriculo + RBAC + teto 40/h por operador + CSP sandbox
    $viewerDl = fn_http($baseUrl, 'GET', "/api/admin/candidates/$candidateId/resume", ['cookie' => $viewerCookie]);
    $recruiterDl = fn_http($baseUrl, 'GET', "/api/admin/candidates/$candidateId/resume", ['cookie' => $recruiterCookie]);
    fn_check('HTTP download de curriculo bloqueado para viewer e permitido para recruiter com CSP sandbox',
        $viewerDl['status'] === 403 && $recruiterDl['status'] === 200 && $recruiterDl['body'] === $pdfBytes
        && ($recruiterDl['headers']['x-content-type-options'][0] ?? '') === 'nosniff'
        && str_contains($recruiterDl['headers']['content-security-policy'][0] ?? '', 'sandbox'));

    $bucketKey = hash('sha256', 'admin-resume-download:' . $recruiterId);
    ajn_exec($pdo, 'UPDATE request_rate_limits SET hits=40 WHERE bucket_key=?', [$bucketKey]);
    $recruiterDlOverQuota = fn_http($baseUrl, 'GET', "/api/admin/candidates/$candidateId/resume", ['cookie' => $recruiterCookie]);
    fn_check('HTTP download acima de 40/hora por operador retorna 429', $recruiterDlOverQuota['status'] === 429);

    // 4.12b Criptografia em repouso de PII (CPF e telefone) + exportacao com step-up + protocolo 256 bits
    $candRow = ajn_fetch($pdo, 'SELECT phone, phone_encrypted, cpf_encrypted FROM candidates WHERE id=?', [$candidateId]);
    fn_check('SQLite candidato armazena telefone mascarado e phone_encrypted/cpf_encrypted com libsodium (s1:)',
        is_array($candRow)
        && str_contains((string) $candRow['phone'], '*')
        && str_starts_with((string) ($candRow['phone_encrypted'] ?? ''), 's1:')
        && str_starts_with((string) ($candRow['cpf_encrypted'] ?? ''), 's1:')
        && ajn_decrypt((string) $candRow['phone_encrypted'], $encCfg) === '(31) 99988-7766'
        && ajn_decrypt((string) $candRow['cpf_encrypted'], $encCfg) === '52998224725');

    $exportNoStepUp = fn_http($baseUrl, 'GET', '/api/admin/candidates/export', ['cookie' => $recruiterCookie]);
    $exportWithStepUp = fn_http($baseUrl, 'GET', '/api/admin/candidates/export', [
        'cookie' => $superCookie,
    ]);
    fn_check('HTTP /api/admin/candidates/export exige step-up (403 sem step-up, 200 com step-up) e decifra telefone',
        $exportNoStepUp['status'] === 403
        && $exportWithStepUp['status'] === 200
        && ($exportWithStepUp['json']['candidates'][0]['phone'] ?? '') === '(31) 99988-7766');

    $firstTrackingCode = (string) ($okApply['json']['trackingCode'] ?? '');
    $trackOk = fn_http($baseUrl, 'GET', "/api/applications/track/$firstTrackingCode?turnstileToken=valid-test-turnstile-token");
    $trackNoTurnstile = fn_http($baseUrl, 'GET', "/api/applications/track/$firstTrackingCode");
    ajn_exec($pdo, 'UPDATE job_applications SET tracking_expires_at=? WHERE tracking_code=?', [time() - 60, $firstTrackingCode]);
    $trackExpired = fn_http($baseUrl, 'GET', "/api/applications/track/$firstTrackingCode?turnstileToken=valid-test-turnstile-token");
    $trackMissing = fn_http($baseUrl, 'GET', '/api/applications/track/AJN-2026-' . str_repeat('A', 64) . '?turnstileToken=valid-test-turnstile-token');
    fn_check('HTTP acompanhamento usa token 256 bits, exige Turnstile e retorna 404 identico para expirado/inexistente',
        preg_match('/^AJN-\d{4}-[A-F0-9]{64}$/D', $firstTrackingCode) === 1
        && $trackOk['status'] === 200
        && $trackNoTurnstile['status'] === 400
        && $trackExpired['status'] === 404
        && $trackMissing['status'] === 404
        && ($trackExpired['json']['error'] ?? '') === ($trackMissing['json']['error'] ?? ''));

    // 4.13 Solicitacao LGPD + eliminacao fisica e logica pelo DPO com step-up
    $lgpdHoneypot = fn_http($baseUrl, 'POST', '/api/lgpd/deletion-request', [
        'headers' => ['Origin: ' . $appUrl],
        'json' => [
            'email' => 'maria.clara@example.com',
            'cpf' => '52998224725',
            'requestType' => 'erasure',
            'website' => 'https://bot.example',
            'turnstileToken' => 'valid-test-turnstile-token',
        ],
    ]);
    $lgpdFastFill = fn_http($baseUrl, 'POST', '/api/lgpd/deletion-request', [
        'headers' => ['Origin: ' . $appUrl],
        'json' => [
            'email' => 'maria.clara@example.com',
            'cpf' => '52998224725',
            'requestType' => 'erasure',
            'formStartedAt' => (string) (int) (microtime(true) * 1000),
            'turnstileToken' => 'valid-test-turnstile-token',
        ],
    ]);
    fn_check('HTTP anti-abuso bloqueia honeypot preenchido e envio em menos de 2s com 400',
        $lgpdHoneypot['status'] === 400 && $lgpdFastFill['status'] === 400);

    $lgpdReq = fn_http($baseUrl, 'POST', '/api/lgpd/deletion-request', [
        'headers' => ['Origin: ' . $appUrl],
        'json' => [
            'email' => 'maria.clara@example.com',
            'cpf' => '52998224725',
            'requestType' => 'erasure',
            'reason' => 'Teste LGPD',
            'turnstileToken' => 'valid-test-turnstile-token',
        ],
    ]);
    $lgpdList = fn_http($baseUrl, 'GET', '/api/admin/lgpd/requests', ['cookie' => $dpoCookie]);
    $reqId = $lgpdList['json']['requests'][0]['id'] ?? '';
    $recruiterExecute = fn_http($baseUrl, 'POST', "/api/admin/lgpd/requests/$reqId/execute", [
        'headers' => ['Origin: ' . $appUrl],
        'cookie' => $recruiterCookie,
    ]);
    $dpoExecuteNoStepUp = fn_http($baseUrl, 'POST', "/api/admin/lgpd/requests/$reqId/execute", [
        'headers' => ['Origin: ' . $appUrl],
        'cookie' => $dpoCookie,
    ]);
    $dpoExecute = fn_http($baseUrl, 'POST', "/api/admin/lgpd/requests/$reqId/execute", [
        'headers' => ['Origin: ' . $appUrl],
        'cookie' => $dpoCookie,
        'json' => ['stepUpPassword' => $dpoPass, 'stepUpMfaCode' => fn_rfc6238_totp($dpoSecret, 1)],
    ]);
    preg_match('/__Host-ajn_admin_session=([^;]+)/', $dpoExecute['headers']['set-cookie'][0] ?? '', $dpoCm);
    if (!empty($dpoCm[1])) {
        $dpoCookie = '__Host-ajn_admin_session=' . $dpoCm[1];
    }
    $remainingFiles = glob($privateDir . DIRECTORY_SEPARATOR . '*') ?: [];
    $candidateAfter = ajn_fetch($pdo, 'SELECT id FROM candidates WHERE id=?', [$candidateId]);
    $erasureAudit = ajn_fetch($pdo, "SELECT id FROM audit_logs WHERE action='LGPD_DATA_ERASURE' AND resource_id=? LIMIT 1", [$candidateId]);
    fn_check('HTTP LGPD erasure pelo DPO exige step-up, apaga arquivos do disco, remove candidato e preserva audit',
        $lgpdReq['status'] === 202 && $reqId !== '' && $recruiterExecute['status'] === 403
        && $dpoExecuteNoStepUp['status'] === 403 && $dpoExecute['status'] === 200
        && count($remainingFiles) === 0 && $candidateAfter === null && $erasureAudit !== null);

    // 4.14 Auditoria com IP, paginacao, cadeia de hash e rotas inexistentes com 404
    $auditPage = fn_http($baseUrl, 'GET', '/api/admin/audit?limit=1&offset=0', ['cookie' => $superCookie]);
    $candidatesPage = fn_http($baseUrl, 'GET', '/api/admin/candidates?limit=1&offset=0', ['cookie' => $superCookie]);
    $jobsPage = fn_http($baseUrl, 'GET', '/api/admin/jobs?limit=1&offset=0', ['cookie' => $superCookie]);
    $unknownAdminRoute = fn_http($baseUrl, 'GET', '/api/admin/rota-inexistente', ['cookie' => $superCookie]);
    $unknownLgpdRoute = fn_http($baseUrl, 'POST', '/api/lgpd/rota-inexistente', ['headers' => ['Origin: ' . $appUrl], 'json' => []]);
    fn_check('HTTP auditoria expoe ipAddress, listagens suportam paginacao e rotas invalidas retornam 404',
        $auditPage['status'] === 200
        && ($auditPage['json']['limit'] ?? 0) === 1
        && ($auditPage['json']['offset'] ?? -1) === 0
        && array_key_exists('ipAddress', $auditPage['json']['logs'][0] ?? [])
        && $candidatesPage['status'] === 200
        && ($candidatesPage['json']['limit'] ?? 0) === 1
        && $jobsPage['status'] === 200
        && ($jobsPage['json']['limit'] ?? 0) === 1
        && $unknownAdminRoute['status'] === 404
        && $unknownLgpdRoute['status'] === 404);

    // 4.14b Hardening complementar (CSRF, Sec-Fetch-Site, 405, 415, IDOR, auto-democao, recovery codes e cadeia de hash)
    $noCsrfMutation = fn_http($baseUrl, 'POST', '/api/admin/jobs', [
        'headers' => ['Origin: ' . $appUrl],
        'cookie' => $superCookie,
        'skip_csrf' => true,
        'json' => $validJobBase,
    ]);
    $crossSiteFetch = fn_http($baseUrl, 'POST', '/api/admin/jobs', [
        'headers' => ['Origin: ' . $appUrl, 'Sec-Fetch-Site: cross-site'],
        'cookie' => $superCookie,
        'json' => $validJobBase,
    ]);
    $methodNotAllowed = fn_http($baseUrl, 'DELETE', '/api/admin/jobs', [
        'headers' => ['Origin: ' . $appUrl],
        'cookie' => $superCookie,
    ]);
    $unsupportedMedia = fn_http($baseUrl, 'POST', '/api/admin/jobs', [
        'headers' => ['Origin: ' . $appUrl, 'Content-Type: text/plain'],
        'cookie' => $superCookie,
        'skip_auto_json' => true,
        'raw_body' => 'not-json',
    ]);
    fn_check('HTTP mutacoes exigem X-CSRF-Token (403), Sec-Fetch-Site same-origin (403), metodo permitido (405) e application/json (415)',
        $noCsrfMutation['status'] === 403
        && $crossSiteFetch['status'] === 403
        && $methodNotAllowed['status'] === 405
        && $unsupportedMedia['status'] === 415);

    $missingUuid = '00000000-0000-4000-8000-000000000000';
    $idorJob = fn_http($baseUrl, 'PUT', "/api/admin/jobs/$missingUuid", ['headers' => ['Origin: ' . $appUrl], 'cookie' => $superCookie, 'json' => ['title' => 'Valid Title']]);
    $idorApp = fn_http($baseUrl, 'PUT', "/api/admin/applications/$missingUuid/stage", ['headers' => ['Origin: ' . $appUrl], 'cookie' => $superCookie, 'json' => ['stageId' => 'stage-2-requisitos']]);
    $idorResume = fn_http($baseUrl, 'GET', "/api/admin/candidates/$missingUuid/resume", ['cookie' => $superCookie]);
    $idorLgpd = fn_http($baseUrl, 'POST', "/api/admin/lgpd/requests/$missingUuid/execute", ['headers' => ['Origin: ' . $appUrl], 'cookie' => $superCookie, 'json' => []]);
    $idorUserRole = fn_http($baseUrl, 'PUT', "/api/admin/users/$missingUuid/role", ['headers' => ['Origin: ' . $appUrl], 'cookie' => $superCookie, 'json' => ['role' => 'viewer']]);
    $selfRoleChange = fn_http($baseUrl, 'PUT', "/api/admin/users/$superId/role", ['headers' => ['Origin: ' . $appUrl], 'cookie' => $superCookie, 'json' => ['role' => 'recruiter']]);
    $selfDeactivate = fn_http($baseUrl, 'PUT', "/api/admin/users/$superId/status", ['headers' => ['Origin: ' . $appUrl], 'cookie' => $superCookie, 'json' => ['isActive' => false]]);
    fn_check('HTTP rotas com ID tratam IDOR com 404 e impedem auto-alteracao de papel/desativacao do ultimo super_admin (400)',
        $idorJob['status'] === 404
        && $idorApp['status'] === 404
        && $idorResume['status'] === 404
        && $idorLgpd['status'] === 404
        && $idorUserRole['status'] === 404
        && $selfRoleChange['status'] === 400
        && $selfDeactivate['status'] === 400);

    $recCodes = ajn_generate_recovery_codes($pdo, $superId, 4);
    $recUseOnce = fn_http($baseUrl, 'POST', '/api/admin/auth/step-up', [
        'headers' => ['Origin: ' . $appUrl],
        'cookie' => $superCookie,
        'json' => ['password' => $superPass, 'recoveryCode' => $recCodes[0]],
    ]);
    preg_match('/__Host-ajn_admin_session=([^;]+)/', $recUseOnce['headers']['set-cookie'][0] ?? '', $recCm);
    if (!empty($recCm[1])) {
        $superCookie = '__Host-ajn_admin_session=' . $recCm[1];
    }
    $recUseTwice = fn_http($baseUrl, 'POST', '/api/admin/auth/step-up', [
        'headers' => ['Origin: ' . $appUrl],
        'cookie' => $superCookie,
        'json' => ['password' => $superPass, 'recoveryCode' => $recCodes[0]],
    ]);
    fn_check('HTTP codigo de recuperacao MFA funciona uma unica vez e falha na reutilizacao',
        count($recCodes) === 4 && $recUseOnce['status'] === 200 && in_array($recUseTwice['status'], [401, 403], true));

    $auditRows = ajn_list($pdo, 'SELECT id, actor_type, actor_id, action, resource, resource_id, details_json, ip_address, user_agent, timestamp, prev_hash, entry_hash FROM audit_logs ORDER BY rowid ASC');
    $chainValid = count($auditRows) > 5;
    $expectedPrevHash = str_repeat('0', 64);
    foreach ($auditRows as $aRow) {
        $calcHash = ajn_compute_audit_hash(
            (string) $aRow['prev_hash'],
            (string) $aRow['id'],
            (string) $aRow['actor_type'],
            $aRow['actor_id'] !== null ? (string) $aRow['actor_id'] : null,
            (string) $aRow['action'],
            (string) $aRow['resource'],
            $aRow['resource_id'] !== null ? (string) $aRow['resource_id'] : null,
            $aRow['details_json'] !== null ? (string) $aRow['details_json'] : null,
            $aRow['ip_address'] !== null ? (string) $aRow['ip_address'] : null,
            $aRow['user_agent'] !== null ? (string) $aRow['user_agent'] : null,
            (int) $aRow['timestamp']
        );
        if ((string) $aRow['prev_hash'] !== $expectedPrevHash || !hash_equals($calcHash, (string) $aRow['entry_hash'])) {
            $chainValid = false;
            break;
        }
        $expectedPrevHash = (string) $aRow['entry_hash'];
    }
    $secAlertRow = ajn_fetch($pdo, "SELECT id FROM audit_logs WHERE action='SECURITY_ALERT' LIMIT 1");
    fn_check('SQLite audit_logs mantem cadeia de hash SHA-256 integra e registra SECURITY_ALERT',
        $chainValid && $secAlertRow !== null);

    // 4.14c Item 5: .htaccess HTTP real no servidor de teste
    file_put_contents($docRoot . DIRECTORY_SEPARATOR . 'evil.php', '<?php echo "pwned";');
    file_put_contents($docRoot . DIRECTORY_SEPARATOR . '.env', 'APP_SECRET=123');
    @mkdir($docRoot . DIRECTORY_SEPARATOR . '.git', 0700, true);
    file_put_contents($docRoot . DIRECTORY_SEPARATOR . '.git' . DIRECTORY_SEPARATOR . 'config', '[core]');
    file_put_contents($docRoot . DIRECTORY_SEPARATOR . 'dump.sql', 'SELECT 1;');
    file_put_contents($docRoot . DIRECTORY_SEPARATOR . 'README.md', '# Readme');
    @mkdir($docRoot . DIRECTORY_SEPARATOR . 'assets', 0700, true);
    file_put_contents($docRoot . DIRECTORY_SEPARATOR . 'assets' . DIRECTORY_SEPARATOR . 'app.txt', 'ok');

    $htHealth = fn_http($baseUrl, 'GET', '/api/health');
    $htEvilPhp = fn_http($baseUrl, 'GET', '/evil.php');
    $htDotEnv = fn_http($baseUrl, 'GET', '/.env');
    $htGitConfig = fn_http($baseUrl, 'GET', '/.git/config');
    $htSql = fn_http($baseUrl, 'GET', '/dump.sql');
    $htMd = fn_http($baseUrl, 'GET', '/README.md');
    $htDirIndex = fn_http($baseUrl, 'GET', '/assets/');
    fn_check('HTTP .htaccess: /api/health=200; .php fora de api/index.php=403; /.env, /.git/config, .sql, .md e listagem de diretorio=403',
        $htHealth['status'] === 200
        && $htEvilPhp['status'] === 403
        && $htDotEnv['status'] === 403
        && $htGitConfig['status'] === 403
        && $htSql['status'] === 403
        && $htMd['status'] === 403
        && $htDirIndex['status'] === 403);

    // 4.14d Item 9: Sec-Fetch-Site ausente (navegador antigo) nao bloqueia se Origin + CSRF estiverem presentes
    $noSecFetchValid = fn_http($baseUrl, 'POST', '/api/admin/jobs', [
        'headers' => ['Origin: ' . $appUrl],
        'cookie' => $recruiterCookie,
        'json' => array_merge($validJobBase, ['slug' => 'vaga-rascunho-idor', 'status' => 'draft']),
    ]);
    $draftJobId = (string) ($noSecFetchValid['json']['jobId'] ?? '');
    $noSecFetchNoOrigin = fn_http($baseUrl, 'POST', '/api/admin/jobs', [
        'cookie' => $recruiterCookie,
        'json' => array_merge($validJobBase, ['slug' => 'vaga-sem-origin']),
    ]);
    $noSecFetchNoCsrf = fn_http($baseUrl, 'POST', '/api/admin/jobs', [
        'headers' => ['Origin: ' . $appUrl],
        'cookie' => $recruiterCookie,
        'skip_csrf' => true,
        'json' => array_merge($validJobBase, ['slug' => 'vaga-sem-csrf']),
    ]);
    fn_check('HTTP requisicao sem Sec-Fetch-Site e aceita com Origin+CSRF (201) e bloqueada sem Origin (403) ou sem CSRF (403)',
        $noSecFetchValid['status'] === 201
        && $noSecFetchNoOrigin['status'] === 403
        && $noSecFetchNoCsrf['status'] === 403);

    // 4.14e Operacoes de usuario admin (criacao, mudanca de papel e rotacao MFA) com step-up para testar alertas e matriz IDOR
    $stepUpSuper = fn_http($baseUrl, 'POST', '/api/admin/auth/step-up', [
        'headers' => ['Origin: ' . $appUrl],
        'cookie' => $superCookie,
        'json' => ['password' => $superPass, 'mfaCode' => fn_rfc6238_totp($testSecret, 1)],
    ]);
    preg_match('/__Host-ajn_admin_session=([^;]+)/', $stepUpSuper['headers']['set-cookie'][0] ?? '', $stepSuperCm);
    if (!empty($stepSuperCm[1])) {
        $superCookie = '__Host-ajn_admin_session=' . $stepSuperCm[1];
        $GLOBALS['__ajn_csrf_by_cookie'][$superCookie] = (string) ($stepUpSuper['json']['csrfToken'] ?? '');
    }
    $createOpRes = fn_http($baseUrl, 'POST', '/api/admin/users', [
        'headers' => ['Origin: ' . $appUrl],
        'cookie' => $superCookie,
        'json' => [
            'name' => 'Operador Criado Teste',
            'email' => 'novo.operador@ajnengenharia.com.br',
            'password' => 'P9#mK3!vL8@xR2$qW',
            'role' => 'viewer',
        ],
    ]);
    $createdOpId = (string) ($createOpRes['json']['userId'] ?? '');
    $changeRoleRes = fn_http($baseUrl, 'PUT', "/api/admin/users/$createdOpId/role", [
        'headers' => ['Origin: ' . $appUrl],
        'cookie' => $superCookie,
        'json' => ['role' => 'recruiter'],
    ]);
    $rotateMfaRes = fn_http($baseUrl, 'POST', "/api/admin/users/$createdOpId/rotate-mfa", [
        'headers' => ['Origin: ' . $appUrl],
        'cookie' => $superCookie,
        'json' => [],
    ]);
    fn_check('HTTP super_admin cria operador (201), altera papel (200) e rotaciona MFA (200) com step-up',
        $createOpRes['status'] === 201 && $createdOpId !== '' && $changeRoleRes['status'] === 200 && $rotateMfaRes['status'] === 200);

    // 4.14f Item 7 e 3.c: Alertas de seguranca assincronos via fila + envio via send-security-alerts.php sem PII no corpo
    $cliConfigFile = $tmpRoot . DIRECTORY_SEPARATOR . 'cli-config.php';
    file_put_contents($cliConfigFile, sprintf(
        "<?php return ['app_url' => %s, 'environment' => 'staging', 'encryption_key' => %s, 'resume_directory' => %s, 'security_alert_email' => 'faleconosco@ajnengenharia.com.br', 'smtp' => ['host' => 'smtp.example.com', 'port' => 465, 'username' => 'noreply', 'password' => 'secret', 'from' => 'noreply@ajnengenharia.com.br'], 'database' => ['dsn' => %s]];",
        var_export($appUrl, true),
        var_export($encKey, true),
        var_export($privateDir, true),
        var_export('sqlite:' . $dbFile, true)
    ));
    $runCliScript = static function (string $scriptPath, array $args = [], array $envVars = [], ?string $stdin = null, array $extraPhpIni = []) use ($docRoot): array {
        $cmd = [PHP_BINARY, '-d', 'extension=sodium', ...$extraPhpIni, $scriptPath, ...$args];
        $desc = [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']];
        $env = array_merge($_ENV, getenv() ?: [], ['DOCUMENT_ROOT' => $docRoot], $envVars);
        $proc = proc_open($cmd, $desc, $p, dirname($scriptPath), $env);
        if (!is_resource($proc)) throw new RuntimeException("Falha ao iniciar $scriptPath");
        if ($stdin !== null) fwrite($p[0], $stdin);
        fclose($p[0]);
        $out = (string) stream_get_contents($p[1]);
        $err = (string) stream_get_contents($p[2]);
        fclose($p[1]);
        fclose($p[2]);
        $code = proc_close($proc);
        return ['code' => $code, 'out' => $out, 'err' => $err];
    };

    $syncAlertMails = array_values(array_filter(array_map(
        static fn(string $line): ?array => is_array($d = json_decode($line, true)) ? $d : null,
        is_file($mailLog) ? (file($mailLog, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: []) : []
    ), static fn(?array $m): bool => is_array($m) && str_starts_with((string) ($m['subject'] ?? ''), '[ALERTA DE SEGURANCA AJN]')));
    $queuedAlertsCount = (int) (ajn_fetch($pdo, "SELECT COUNT(*) AS c FROM security_alert_queue WHERE status='pending'")['c'] ?? 0);
    fn_check('Alerta L.1 / 3.c: requisicoes HTTP enfileiram alertas sem bloquear em SMTP sincrono',
        $syncAlertMails === [] && $queuedAlertsCount >= 7);

    $sendAlertsScript = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'send-security-alerts.php';
    $dryAlertsRes = $runCliScript($sendAlertsScript, ['--dry-run'], ['AJN_CONFIG_PATH' => $cliConfigFile]);
    $dryAlertsJson = json_decode(trim($dryAlertsRes['out']), true);
    $drainAlertsRes = $runCliScript($sendAlertsScript, [], ['AJN_CONFIG_PATH' => $cliConfigFile], null, ['-d', 'auto_prepend_file=' . $cliMailStubFile]);
    $drainAlertsJson = json_decode(trim($drainAlertsRes['out']), true);
    $remainingPending = (int) (ajn_fetch($pdo, "SELECT COUNT(*) AS c FROM security_alert_queue WHERE status='pending'")['c'] ?? -1);
    fn_check('CLI send-security-alerts.php --dry-run nao envia e execucao real drena fila de alertas para sent',
        $dryAlertsRes['code'] === 0
        && ($dryAlertsJson['dryRun'] ?? false) === true
        && (int) ($dryAlertsJson['sent'] ?? -1) === 0
        && (int) ($dryAlertsJson['pending'] ?? 0) >= 7
        && $drainAlertsRes['code'] === 0
        && (int) ($drainAlertsJson['sent'] ?? 0) >= 7
        && $remainingPending === 0);

    $allMails = array_values(array_filter(array_map(
        static fn(string $line): ?array => is_array($d = json_decode($line, true)) ? $d : null,
        file($mailLog, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: []
    )));
    $findSecurityAlertMail = static function (string $event) use ($allMails): ?array {
        foreach ($allMails as $m) {
            if (($m['to'] ?? '') === 'faleconosco@ajnengenharia.com.br'
                && ($m['subject'] ?? '') === '[ALERTA DE SEGURANCA AJN] ' . $event) {
                return $m;
            }
        }
        return null;
    };
    $mailHasNoPii = static function (?array $m): bool {
        if ($m === null) return false;
        $body = (string) ($m['body'] ?? '');
        return $body !== ''
            && !str_contains($body, '@')
            && !str_contains($body, 'Maria Clara')
            && !str_contains($body, 'Operador Criado')
            && !str_contains($body, '52998224725')
            && !str_contains($body, '99999')
            && !str_contains($body, '127.0.0.1');
    };
    foreach ([
        'ACCOUNT_LOCKED',
        'ADMIN_LOGIN_NEW_IP',
        'ADMIN_USER_CREATED',
        'ADMIN_ROLE_CHANGED',
        'ADMIN_MFA_ROTATED',
        'CANDIDATES_MASS_EXPORT',
        'LGPD_ERASURE_EXECUTED',
    ] as $alertEvent) {
        $alertMail = $findSecurityAlertMail($alertEvent);
        fn_check("Alerta L.1 [$alertEvent] enviado a security_alert_email sem dados pessoais no corpo",
            $mailHasNoPii($alertMail));
    }

    // 4.14g Item 8: Matriz completa de IDOR/RBAC para TODAS as 11 rotas que recebem id/slug/token por papel (viewer, recruiter, dpo)
    ajn_exec($pdo, 'DELETE FROM request_rate_limits');
    $idorCandId = ajn_uuid();
    $idorResId = ajn_uuid();
    $idorAppId = ajn_uuid();
    $idorLgpdId = ajn_uuid();
    $idorFileKey = ajn_uuid() . '.pdf';
    $idorTrackCode = 'AJN-2026-' . strtoupper(bin2hex(random_bytes(32)));
    file_put_contents($privateDir . DIRECTORY_SEPARATOR . $idorFileKey, "%PDF-1.4\n%IDOR test\n");
    ajn_exec($pdo, 'INSERT INTO candidates (id,full_name,email,phone,phone_encrypted,cpf_hash,cpf_masked,cpf_encrypted,city,state,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
        [$idorCandId, 'Candidato IDOR', 'idor@example.com', '(**) *****-0000', ajn_encrypt('(31) 98888-0000', $encCfg), hash_hmac('sha256', 'cpf:11144477735', $encKey), '***.444.777-**', ajn_encrypt('11144477735', $encCfg), 'BH', 'MG', $now, $now]);
    ajn_exec($pdo, 'INSERT INTO resumes (id,candidate_id,file_key,original_filename,mime_type,file_size_bytes,file_sha256,is_current,uploaded_at) VALUES (?,?,?,?,?,?,?,1,?)',
        [$idorResId, $idorCandId, $idorFileKey, 'cv.pdf', 'application/pdf', 18, hash('sha256', 'idor'), $now]);
    ajn_exec($pdo, 'INSERT INTO job_applications (id,job_id,candidate_id,resume_id,current_stage_id,tracking_code,tracking_token_hash,tracking_expires_at,status,source,applied_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
        [$idorAppId, $normalJobId, $idorCandId, $idorResId, 'stage-1-triagem', $idorTrackCode, hash('sha256', $idorTrackCode), $now + 86400, 'active', 'portal', $now, $now]);
    ajn_exec($pdo, 'INSERT INTO data_subject_requests (id,candidate_id,request_type,status,reason,requested_at) VALUES (?,?,?,?,?,?)',
        [$idorLgpdId, $idorCandId, 'access', 'pending', 'Consulta IDOR', $now]);

    // 1. GET /api/jobs/{slug}
    $rJobPub = fn_http($baseUrl, 'GET', '/api/jobs/analista-ambiental-pleno');
    $rJobDraft = fn_http($baseUrl, 'GET', '/api/jobs/vaga-rascunho-idor');
    $rJobMissing = fn_http($baseUrl, 'GET', '/api/jobs/slug-inexistente-idor');
    fn_check('IDOR Rota 1 [GET /api/jobs/{slug}]: publicada=200, rascunho=404, inexistente=404',
        $rJobPub['status'] === 200 && $rJobDraft['status'] === 404 && $rJobMissing['status'] === 404);

    // 2. POST /api/applications/jobs/{slug}/apply
    $rApplyDraft = fn_http($baseUrl, 'POST', '/api/applications/jobs/vaga-rascunho-idor/apply', [
        'headers' => ['Origin: ' . $appUrl],
        'multipart' => ['fullName' => 'Teste', 'email' => 't@example.com', 'phone' => '31999990000', 'city' => 'BH', 'state' => 'MG', 'turnstileToken' => 'valid-test-turnstile-token'],
    ]);
    $rApplyMissing = fn_http($baseUrl, 'POST', '/api/applications/jobs/slug-inexistente-idor/apply', [
        'headers' => ['Origin: ' . $appUrl],
        'multipart' => ['fullName' => 'Teste', 'email' => 't@example.com', 'phone' => '31999990000', 'city' => 'BH', 'state' => 'MG', 'turnstileToken' => 'valid-test-turnstile-token'],
    ]);
    fn_check('IDOR Rota 2 [POST /api/applications/jobs/{slug}/apply]: vaga rascunho=404, vaga inexistente=404',
        $rApplyDraft['status'] === 404 && $rApplyMissing['status'] === 404);

    // 3. GET /api/applications/track/{code}
    $rTrackValid = fn_http($baseUrl, 'GET', "/api/applications/track/$idorTrackCode?turnstileToken=valid-test-turnstile-token");
    $rTrackForeign = fn_http($baseUrl, 'GET', '/api/applications/track/AJN-2026-' . str_repeat('B', 64) . '?turnstileToken=valid-test-turnstile-token');
    fn_check('IDOR Rota 3 [GET /api/applications/track/{code}]: token valido=200, token alheio/inexistente=404',
        $rTrackValid['status'] === 200 && $rTrackForeign['status'] === 404);

    // 4. PUT /api/admin/jobs/{id}
    $rPutJobViewer = fn_http($baseUrl, 'PUT', "/api/admin/jobs/$normalJobId", ['headers' => ['Origin: ' . $appUrl], 'cookie' => $viewerCookie, 'json' => ['title' => 'T']]);
    $rPutJobDpo = fn_http($baseUrl, 'PUT', "/api/admin/jobs/$normalJobId", ['headers' => ['Origin: ' . $appUrl], 'cookie' => $dpoCookie, 'json' => ['title' => 'T']]);
    $rPutJobRecOk = fn_http($baseUrl, 'PUT', "/api/admin/jobs/$normalJobId", ['headers' => ['Origin: ' . $appUrl], 'cookie' => $recruiterCookie, 'json' => ['title' => 'Analista Ambiental Pleno Atualizado']]);
    $rPutJobRec404 = fn_http($baseUrl, 'PUT', "/api/admin/jobs/$missingUuid", ['headers' => ['Origin: ' . $appUrl], 'cookie' => $recruiterCookie, 'json' => ['title' => 'T']]);
    fn_check('IDOR Rota 4 [PUT /api/admin/jobs/{id}]: viewer=403, dpo=403, recruiter(existente)=200, recruiter(inexistente)=404',
        $rPutJobViewer['status'] === 403 && $rPutJobDpo['status'] === 403 && $rPutJobRecOk['status'] === 200 && $rPutJobRec404['status'] === 404);

    // 5. GET /api/admin/pipeline/{jobId}
    $rPipeViewerOk = fn_http($baseUrl, 'GET', "/api/admin/pipeline/$normalJobId", ['cookie' => $viewerCookie]);
    $rPipeViewer404 = fn_http($baseUrl, 'GET', "/api/admin/pipeline/$missingUuid", ['cookie' => $viewerCookie]);
    $rPipeRecOk = fn_http($baseUrl, 'GET', "/api/admin/pipeline/$normalJobId", ['cookie' => $recruiterCookie]);
    $rPipeRec404 = fn_http($baseUrl, 'GET', "/api/admin/pipeline/$missingUuid", ['cookie' => $recruiterCookie]);
    $rPipeDpo = fn_http($baseUrl, 'GET', "/api/admin/pipeline/$normalJobId", ['cookie' => $dpoCookie]);
    fn_check('IDOR Rota 5 [GET /api/admin/pipeline/{jobId}]: viewer=200/404, recruiter=200/404, dpo=403',
        $rPipeViewerOk['status'] === 200 && $rPipeViewer404['status'] === 404 && $rPipeRecOk['status'] === 200 && $rPipeRec404['status'] === 404 && $rPipeDpo['status'] === 403);

    // 6. POST /api/admin/pipeline/move-stage (applicationId / targetStageId)
    $rStageViewer = fn_http($baseUrl, 'POST', '/api/admin/pipeline/move-stage', ['headers' => ['Origin: ' . $appUrl], 'cookie' => $viewerCookie, 'json' => ['applicationId' => $idorAppId, 'targetStageId' => 'stage-2-requisitos']]);
    $rStageDpo = fn_http($baseUrl, 'POST', '/api/admin/pipeline/move-stage', ['headers' => ['Origin: ' . $appUrl], 'cookie' => $dpoCookie, 'json' => ['applicationId' => $idorAppId, 'targetStageId' => 'stage-2-requisitos']]);
    $rStageRecOk = fn_http($baseUrl, 'POST', '/api/admin/pipeline/move-stage', ['headers' => ['Origin: ' . $appUrl], 'cookie' => $recruiterCookie, 'json' => ['applicationId' => $idorAppId, 'targetStageId' => 'stage-2-requisitos']]);
    $rStageRec404 = fn_http($baseUrl, 'POST', '/api/admin/pipeline/move-stage', ['headers' => ['Origin: ' . $appUrl], 'cookie' => $recruiterCookie, 'json' => ['applicationId' => $missingUuid, 'targetStageId' => 'stage-2-requisitos']]);
    fn_check('IDOR Rota 6 [POST /api/admin/pipeline/move-stage]: viewer=403, dpo=403, recruiter(existente)=200, recruiter(inexistente)=404',
        $rStageViewer['status'] === 403 && $rStageDpo['status'] === 403 && $rStageRecOk['status'] === 200 && $rStageRec404['status'] === 404);

    // 7. GET /api/admin/candidates/{id}/resume
    $rResViewer = fn_http($baseUrl, 'GET', "/api/admin/candidates/$idorCandId/resume", ['cookie' => $viewerCookie]);
    $rResDpo = fn_http($baseUrl, 'GET', "/api/admin/candidates/$idorCandId/resume", ['cookie' => $dpoCookie]);
    $rResRecOk = fn_http($baseUrl, 'GET', "/api/admin/candidates/$idorCandId/resume", ['cookie' => $recruiterCookie]);
    $rResRec404 = fn_http($baseUrl, 'GET', "/api/admin/candidates/$missingUuid/resume", ['cookie' => $recruiterCookie]);
    fn_check('IDOR Rota 7 [GET /api/admin/candidates/{id}/resume]: viewer=403, dpo=403, recruiter(existente)=200, recruiter(inexistente)=404',
        $rResViewer['status'] === 403 && $rResDpo['status'] === 403 && $rResRecOk['status'] === 200 && $rResRec404['status'] === 404);

    // 8. POST /api/admin/lgpd/requests/{id}/execute
    $rLgpdViewer = fn_http($baseUrl, 'POST', "/api/admin/lgpd/requests/$idorLgpdId/execute", ['headers' => ['Origin: ' . $appUrl], 'cookie' => $viewerCookie, 'json' => []]);
    $rLgpdRec = fn_http($baseUrl, 'POST', "/api/admin/lgpd/requests/$idorLgpdId/execute", ['headers' => ['Origin: ' . $appUrl], 'cookie' => $recruiterCookie, 'json' => []]);
    $rLgpdDpo404 = fn_http($baseUrl, 'POST', "/api/admin/lgpd/requests/$missingUuid/execute", ['headers' => ['Origin: ' . $appUrl], 'cookie' => $dpoCookie, 'json' => []]);
    $rLgpdDpoOk = fn_http($baseUrl, 'POST', "/api/admin/lgpd/requests/$idorLgpdId/execute", ['headers' => ['Origin: ' . $appUrl], 'cookie' => $dpoCookie, 'json' => []]);
    fn_check('IDOR Rota 8 [POST /api/admin/lgpd/requests/{id}/execute]: viewer=403, recruiter=403, dpo(inexistente)=404, dpo(existente)=200',
        $rLgpdViewer['status'] === 403 && $rLgpdRec['status'] === 403 && $rLgpdDpo404['status'] === 404 && $rLgpdDpoOk['status'] === 200);

    // 9. PUT /api/admin/users/{id}/status
    $rStatViewer = fn_http($baseUrl, 'PUT', "/api/admin/users/$createdOpId/status", ['headers' => ['Origin: ' . $appUrl], 'cookie' => $viewerCookie, 'json' => ['isActive' => true]]);
    $rStatRec = fn_http($baseUrl, 'PUT', "/api/admin/users/$createdOpId/status", ['headers' => ['Origin: ' . $appUrl], 'cookie' => $recruiterCookie, 'json' => ['isActive' => true]]);
    $rStatDpo = fn_http($baseUrl, 'PUT', "/api/admin/users/$createdOpId/status", ['headers' => ['Origin: ' . $appUrl], 'cookie' => $dpoCookie, 'json' => ['isActive' => true]]);
    $rStatSuper404 = fn_http($baseUrl, 'PUT', "/api/admin/users/$missingUuid/status", ['headers' => ['Origin: ' . $appUrl], 'cookie' => $superCookie, 'json' => ['isActive' => true]]);
    $rStatSuperOk = fn_http($baseUrl, 'PUT', "/api/admin/users/$createdOpId/status", ['headers' => ['Origin: ' . $appUrl], 'cookie' => $superCookie, 'json' => ['isActive' => true]]);
    fn_check('IDOR Rota 9 [PUT /api/admin/users/{id}/status]: viewer=403, recruiter=403, dpo=403, super_admin(inexistente)=404, super_admin(existente)=200',
        $rStatViewer['status'] === 403 && $rStatRec['status'] === 403 && $rStatDpo['status'] === 403 && $rStatSuper404['status'] === 404 && $rStatSuperOk['status'] === 200);

    // 10. PUT /api/admin/users/{id}/role
    $rRoleViewer = fn_http($baseUrl, 'PUT', "/api/admin/users/$createdOpId/role", ['headers' => ['Origin: ' . $appUrl], 'cookie' => $viewerCookie, 'json' => ['role' => 'viewer']]);
    $rRoleRec = fn_http($baseUrl, 'PUT', "/api/admin/users/$createdOpId/role", ['headers' => ['Origin: ' . $appUrl], 'cookie' => $recruiterCookie, 'json' => ['role' => 'viewer']]);
    $rRoleDpo = fn_http($baseUrl, 'PUT', "/api/admin/users/$createdOpId/role", ['headers' => ['Origin: ' . $appUrl], 'cookie' => $dpoCookie, 'json' => ['role' => 'viewer']]);
    $rRoleSuper404 = fn_http($baseUrl, 'PUT', "/api/admin/users/$missingUuid/role", ['headers' => ['Origin: ' . $appUrl], 'cookie' => $superCookie, 'json' => ['role' => 'viewer']]);
    fn_check('IDOR Rota 10 [PUT /api/admin/users/{id}/role]: viewer=403, recruiter=403, dpo=403, super_admin(inexistente)=404, super_admin(self)=400',
        $rRoleViewer['status'] === 403 && $rRoleRec['status'] === 403 && $rRoleDpo['status'] === 403 && $rRoleSuper404['status'] === 404 && $selfRoleChange['status'] === 400);

    // 11. POST /api/admin/users/{id}/rotate-mfa
    $rMfaViewer = fn_http($baseUrl, 'POST', "/api/admin/users/$createdOpId/rotate-mfa", ['headers' => ['Origin: ' . $appUrl], 'cookie' => $viewerCookie, 'json' => []]);
    $rMfaRec = fn_http($baseUrl, 'POST', "/api/admin/users/$createdOpId/rotate-mfa", ['headers' => ['Origin: ' . $appUrl], 'cookie' => $recruiterCookie, 'json' => []]);
    $rMfaDpo = fn_http($baseUrl, 'POST', "/api/admin/users/$createdOpId/rotate-mfa", ['headers' => ['Origin: ' . $appUrl], 'cookie' => $dpoCookie, 'json' => []]);
    $rMfaSuper404 = fn_http($baseUrl, 'POST', "/api/admin/users/$missingUuid/rotate-mfa", ['headers' => ['Origin: ' . $appUrl], 'cookie' => $superCookie, 'json' => []]);
    fn_check('IDOR Rota 11 [POST /api/admin/users/{id}/rotate-mfa]: viewer=403, recruiter=403, dpo=403, super_admin(inexistente)=404, super_admin(existente)=200',
        $rMfaViewer['status'] === 403 && $rMfaRec['status'] === 403 && $rMfaDpo['status'] === 403 && $rMfaSuper404['status'] === 404 && $rotateMfaRes['status'] === 200);

    // 4.14h Item 4: Migracao de dados legados (migrate-legacy-data.php --dry-run e real)
    $legacyAdminId = ajn_uuid();
    $legacyAdminPass = 'L7#mK4!pQ9@vR2$xZ';
    $legacyTotpPlain = ajn_base32_encode(random_bytes(10));
    $aesIv = random_bytes(12);
    $aesTag = '';
    $aesCipher = openssl_encrypt($legacyTotpPlain, 'aes-256-gcm', (string) hex2bin($encKey), OPENSSL_RAW_DATA, $aesIv, $aesTag);
    $legacyAesMfa = base64_encode($aesIv . $aesTag . $aesCipher);
    $insertUser($pdo, $legacyAdminId, 'Legacy Admin', 'legacy.admin@ajnengenharia.com.br', $legacyAdminPass, 'recruiter', 1, 1, $legacyAesMfa, $now);

    $legacyCandId = ajn_uuid();
    ajn_exec($pdo, 'INSERT INTO candidates (id,full_name,email,phone,phone_encrypted,city,state,created_at,updated_at) VALUES (?,?,?,?,NULL,?,?,?,?)',
        [$legacyCandId, 'Candidato Legado 004', 'legado004@example.com', '(31) 98877-6655', 'BH', 'MG', $now, $now]);
    $legacyAppId = ajn_uuid();
    ajn_exec($pdo, 'INSERT INTO job_applications (id,job_id,candidate_id,current_stage_id,tracking_code,tracking_token_hash,tracking_expires_at,status,source,applied_at,updated_at) VALUES (?,?,?,?,?,NULL,NULL,?,?,?,?)',
        [$legacyAppId, $normalJobId, $legacyCandId, 'stage-1-triagem', 'AJN-2025-AB12CD', 'active', 'portal', $now - 86400, $now - 86400]);

    $migrateScript = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'migrate-legacy-data.php';
    $dryMigrate = $runCliScript($migrateScript, ['--dry-run'], ['AJN_CONFIG_PATH' => $cliConfigFile]);
    $beforeMfaRow = ajn_fetch($pdo, 'SELECT mfa_secret FROM admin_users WHERE id=?', [$legacyAdminId]);
    $beforeCandRow = ajn_fetch($pdo, 'SELECT phone, phone_encrypted FROM candidates WHERE id=?', [$legacyCandId]);

    $realMigrate = $runCliScript($migrateScript, [], ['AJN_CONFIG_PATH' => $cliConfigFile]);
    $idempotentMigrate = $runCliScript($migrateScript, [], ['AJN_CONFIG_PATH' => $cliConfigFile]);
    $afterMfaRow = ajn_fetch($pdo, 'SELECT mfa_secret FROM admin_users WHERE id=?', [$legacyAdminId]);
    $afterCandRow = ajn_fetch($pdo, 'SELECT phone, phone_encrypted FROM candidates WHERE id=?', [$legacyCandId]);
    $afterAppRow = ajn_fetch($pdo, 'SELECT tracking_token_hash, tracking_expires_at FROM job_applications WHERE id=?', [$legacyAppId]);

    // Testa login MFA do admin legado migrado, exportacao do telefone legado e acompanhamento do codigo 40 bits expirado
    ajn_exec($pdo, 'DELETE FROM request_rate_limits');
    $legacyLoginRes = fn_http($baseUrl, 'POST', '/api/admin/auth/login', [
        'headers' => ['Origin: ' . $appUrl],
        'json' => ['email' => 'legacy.admin@ajnengenharia.com.br', 'password' => $legacyAdminPass, 'mfaCode' => fn_rfc6238_totp($legacyTotpPlain)],
    ]);
    $exportAfterMigrate = fn_http($baseUrl, 'GET', '/api/admin/candidates/export', ['cookie' => $superCookie]);
    $exportedLegacyPhone = '';
    foreach ($exportAfterMigrate['json']['candidates'] ?? [] as $cItem) {
        if (($cItem['id'] ?? '') === $legacyCandId) {
            $exportedLegacyPhone = (string) ($cItem['phone'] ?? '');
            break;
        }
    }
    $trackLegacy40Bit = fn_http($baseUrl, 'GET', '/api/applications/track/AJN-2025-AB12CD?turnstileToken=valid-test-turnstile-token');
    $trackNonExistent = fn_http($baseUrl, 'GET', '/api/applications/track/AJN-2026-' . str_repeat('C', 64) . '?turnstileToken=valid-test-turnstile-token');

    fn_check('CLI migrate-legacy-data.php (--dry-run, real e idempotente): recifra AES-GCM->secretbox (s1:), cifra/mascara telefone, expira codigo 40 bits com 404 identico e lista admin sem MFA',
        $dryMigrate['code'] === 0
        && str_contains($dryMigrate['out'], '[DRY-RUN] mfa_recifrados=1, telefones_cifrados=1, tracking_migrados=1')
        && str_contains($dryMigrate['out'], 'ADMIN_WITHOUT_MFA:')
        && str_contains($dryMigrate['out'], 'nomfa@ajnengenharia.com.br')
        && (string) ($beforeMfaRow['mfa_secret'] ?? '') === $legacyAesMfa
        && $beforeCandRow['phone_encrypted'] === null
        && $realMigrate['code'] === 0
        && str_contains($realMigrate['out'], '[APPLIED] mfa_recifrados=1, telefones_cifrados=1, tracking_migrados=1')
        && $idempotentMigrate['code'] === 0
        && str_contains($idempotentMigrate['out'], '[APPLIED] mfa_recifrados=0, telefones_cifrados=0, tracking_migrados=0')
        && str_starts_with((string) ($afterMfaRow['mfa_secret'] ?? ''), 's1:')
        && (string) ($afterCandRow['phone'] ?? '') === '(**) *****-6655'
        && str_starts_with((string) ($afterCandRow['phone_encrypted'] ?? ''), 's1:')
        && (int) ($afterAppRow['tracking_expires_at'] ?? 0) === 1
        && $legacyLoginRes['status'] === 200
        && $exportedLegacyPhone === '(31) 98877-6655'
        && $trackLegacy40Bit['status'] === 404
        && $trackLegacy40Bit['body'] === $trackNonExistent['body']);

    // 4.14i Item 10a e 10c: purge-expired-data.php --dry-run e seed-admin.php lendo senha via STDIN
    $expiredCandId = ajn_uuid();
    ajn_exec($pdo, 'INSERT INTO candidates (id,full_name,email,phone,city,state,is_talent_pool,created_at,updated_at) VALUES (?,?,?,?,?,?,0,?,?)',
        [$expiredCandId, 'Candidato Vencido', 'vencido@example.com', '(**) *****-1111', 'BH', 'MG', $now - (400 * 86400), $now - (400 * 86400)]);
    $purgeScript = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'purge-expired-data.php';
    $dryPurge = $runCliScript($purgeScript, ['--dry-run'], ['AJN_CONFIG_PATH' => $cliConfigFile]);
    $stillThereAfterDry = ajn_fetch($pdo, 'SELECT id FROM candidates WHERE id=?', [$expiredCandId]);
    $realPurge = $runCliScript($purgeScript, [], ['AJN_CONFIG_PATH' => $cliConfigFile]);
    $goneAfterReal = ajn_fetch($pdo, 'SELECT id FROM candidates WHERE id=?', [$expiredCandId]);
    fn_check('CLI purge-expired-data.php --dry-run apenas lista candidatos vencidos sem apagar e execucao real expurga',
        $dryPurge['code'] === 0
        && str_contains($dryPurge['out'], 'DRY-RUN: apagaria candidatos=1')
        && str_contains($dryPurge['out'], $expiredCandId)
        && $stillThereAfterDry !== null
        && $realPurge['code'] === 0
        && str_contains($realPurge['out'], 'Expurgo concluido: candidatos=1')
        && $goneAfterReal === null);

    $seedScript = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'seed-admin.php';
    $seedEnvBlocked = $runCliScript($seedScript, [], [
        'AJN_CONFIG_PATH' => $cliConfigFile,
        'AJN_ADMIN_EMAIL' => 'seeded@ajnengenharia.com.br',
        'AJN_ADMIN_NAME' => 'Seeded Admin',
        'AJN_ADMIN_INITIAL_PASSWORD' => 'S8#pK3!vM9@xL2$qW',
    ]);
    $seedStdinOk = $runCliScript($seedScript, [], [
        'AJN_CONFIG_PATH' => $cliConfigFile,
        'AJN_ADMIN_EMAIL' => 'seeded@ajnengenharia.com.br',
        'AJN_ADMIN_NAME' => 'Seeded Admin',
        'AJN_ADMIN_INITIAL_PASSWORD' => '',
    ], "S8#pK3!vM9@xL2\$qW\n");
    $seededUserRow = ajn_fetch($pdo, 'SELECT id, password_hash, mfa_secret FROM admin_users WHERE email=?', ['seeded@ajnengenharia.com.br']);
    fn_check('CLI seed-admin.php bloqueia senha em variavel de ambiente e le senha via STDIN gerando Argon2id + MFA s1:',
        $seedEnvBlocked['code'] === 1
        && $seedStdinOk['code'] === 0
        && str_contains($seedStdinOk['out'], 'otpauth://totp/')
        && $seededUserRow !== null
        && str_starts_with((string) ($seededUserRow['password_hash'] ?? ''), '$argon2id$')
        && str_starts_with((string) ($seededUserRow['mfa_secret'] ?? ''), 's1:'));

    // 4.14j Item 1.e / Item 2: Turnstile fail-closed em production (503/400, incluindo chave com nome errado) e chaves de teste em staging
    ajn_exec($pdo, 'DELETE FROM request_rate_limits');
    $tsProdEmpty503 = null;
    $tsProdWrongKey503 = null;
    $tsProdTestKey503 = null;
    $tsProdDummyTok400 = null;
    $tsStagingFail2x400 = null;
    $tsStagingDummyOk200 = null;
    $tsMissingToken400 = null;
    try {
        $tsStagingDummyOk200 = fn_http($baseUrl, 'GET', "/api/applications/track/$idorTrackCode?turnstileToken=XXXX.DUMMY.TOKEN.XXXX");
        $tsMissingToken400 = fn_http($baseUrl, 'GET', "/api/applications/track/$idorTrackCode");

        file_put_contents($turnstileSecretFile, '2x0000000000000000000000000000000AA');
        $tsStagingFail2x400 = fn_http($baseUrl, 'GET', "/api/applications/track/$idorTrackCode?turnstileToken=XXXX.DUMMY.TOKEN.XXXX");

        file_put_contents($flagProdEnv, '1');
        file_put_contents($turnstileSecretFile, '');
        $tsProdEmpty503 = fn_http($baseUrl, 'GET', "/api/applications/track/$idorTrackCode?turnstileToken=valid-prod-token-sample-123");

        file_put_contents($flagWrongTurnstileKey, '1');
        $tsProdWrongKey503 = fn_http($baseUrl, 'GET', "/api/applications/track/$idorTrackCode?turnstileToken=valid-prod-token-sample-123");
        @unlink($flagWrongTurnstileKey);

        file_put_contents($turnstileSecretFile, '1x0000000000000000000000000000000AA');
        $tsProdTestKey503 = fn_http($baseUrl, 'GET', "/api/applications/track/$idorTrackCode?turnstileToken=valid-prod-token-sample-123");

        file_put_contents($turnstileSecretFile, 'prod-real-secret-key-min-len-99999');
        $tsProdDummyTok400 = fn_http($baseUrl, 'GET', "/api/applications/track/$idorTrackCode?turnstileToken=XXXX.DUMMY.TOKEN.XXXX");
    } finally {
        @unlink($flagProdEnv);
        @unlink($flagWrongTurnstileKey);
        @unlink($turnstileSecretFile);
    }
    fn_check('HTTP Turnstile: chave com nome errado em production = 503 (alem de vazio/1x = 503, DUMMY = 400 e staging 1x = 200)',
        ($tsStagingDummyOk200['status'] ?? 0) === 200
        && ($tsMissingToken400['status'] ?? 0) === 400
        && ($tsStagingFail2x400['status'] ?? 0) === 400
        && ($tsProdEmpty503['status'] ?? 0) === 503
        && ($tsProdWrongKey503['status'] ?? 0) === 503
        && ($tsProdTestKey503['status'] ?? 0) === 503
        && ($tsProdDummyTok400['status'] ?? 0) === 400);

    // 4.14j-bis Item 1.f & Item 2.2 & Item 6: AJN_CONFIG_PATH so CLI, modo manutencao (503 + Retry-After) e --test-alert
    $sapiRes = fn_http($baseUrl, 'GET', '/__test-config-sapi');
    $sapiHeader = $sapiRes['headers']['x-test-sapi'][0] ?? '';
    $sapiEnvSet = $sapiRes['headers']['x-test-env-set'][0] ?? '';
    $sapiResolved = $sapiRes['headers']['x-test-resolved-path'][0] ?? '';
    fn_check('Item 1.f: AJN_CONFIG_PATH e aceito em CLI e completamente ignorado em SAPI web (cli-server = 503)',
        $sapiHeader !== 'cli'
        && $sapiEnvSet === '1'
        && $sapiResolved !== $cliSapiConfigFile
        && !str_contains($sapiResolved, 'sapi-override-config.php')
        && $sapiRes['status'] === 503);

    $maintApiOff = fn_http($baseUrl, 'GET', '/api/health');
    $maintAdminOff = fn_http($baseUrl, 'GET', '/admin/carreiras/');
    $maintHomeOff = fn_http($baseUrl, 'GET', '/');
    file_put_contents($maintenanceFlagFile, (string) time());
    try {
        $maintApiOn = fn_http($baseUrl, 'GET', '/api/health');
        $maintLoginOn = fn_http($baseUrl, 'POST', '/api/admin/auth/login', [
            'headers' => ['Origin: ' . $appUrl],
            'json' => ['email' => 'missing@ajnengenharia.com.br', 'password' => 'SenhaTeste#2026'],
        ]);
        $maintAdminOn = fn_http($baseUrl, 'GET', '/admin/carreiras/');
        $maintHomeOn = fn_http($baseUrl, 'GET', '/');
    } finally {
        @unlink($maintenanceFlagFile);
    }
    $maintApiRestored = fn_http($baseUrl, 'GET', '/api/health');
    fn_check('Item 2.2: modo manutencao por flag fora do webroot retorna 503 + Retry-After em /api/* e /admin/* mantendo / em 200',
        $maintApiOff['status'] === 200
        && $maintAdminOff['status'] === 200
        && $maintHomeOff['status'] === 200
        && ($maintApiOn['status'] ?? 0) === 503
        && ($maintApiOn['headers']['retry-after'][0] ?? '') === '300'
        && ($maintLoginOn['status'] ?? 0) === 503
        && ($maintLoginOn['headers']['retry-after'][0] ?? '') === '300'
        && ($maintAdminOn['status'] ?? 0) === 503
        && ($maintAdminOn['headers']['retry-after'][0] ?? '') === '300'
        && ($maintHomeOn['status'] ?? 0) === 200
        && $maintApiRestored['status'] === 200);

    $testAlertRes = $runCliScript($sendAlertsScript, ['--test-alert'], ['AJN_CONFIG_PATH' => $cliConfigFile], null, ['-d', 'auto_prepend_file=' . $cliMailStubFile]);
    $testAlertJson = json_decode(trim($testAlertRes['out']), true);
    $allMailsAfterTestAlert = array_values(array_filter(array_map(
        static fn(string $line): ?array => is_array($d = json_decode($line, true)) ? $d : null,
        file($mailLog, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: []
    )));
    $foundTestAlertMail = false;
    foreach ($allMailsAfterTestAlert as $m) {
        if (($m['to'] ?? '') === 'faleconosco@ajnengenharia.com.br'
            && ($m['subject'] ?? '') === '[ALERTA DE SEGURANCA AJN] DEPLOY_TEST_ALERT') {
            $foundTestAlertMail = true;
            break;
        }
    }
    fn_check('Item 6: CLI send-security-alerts.php --test-alert envia alerta de teste para faleconosco@ajnengenharia.com.br',
        $testAlertRes['code'] === 0
        && ($testAlertJson['ok'] ?? false) === true
        && ($testAlertJson['testAlert'] ?? false) === true
        && ($testAlertJson['recipient'] ?? '') === 'faleconosco@ajnengenharia.com.br'
        && (int) ($testAlertJson['sent'] ?? 0) >= 1
        && $foundTestAlertMail);

    // 4.14k Item 3.b e 3.e: unlock-admin.php e equidade temporal real HTTP (20 amostras por caso, mediana <= 25%)
    ajn_exec($pdo, 'DELETE FROM request_rate_limits');
    ajn_exec($pdo, 'DELETE FROM admin_login_locks');
    ajn_exec($pdo, 'UPDATE admin_users SET failed_attempts=0, locked_until=NULL');
    for ($l = 0; $l < 5; $l++) {
        fn_http($baseUrl, 'POST', '/api/admin/auth/login', [
            'headers' => ['Origin: ' . $appUrl, 'X-AJN-Test-Client-Ip: 198.51.100.88'],
            'json' => ['email' => 'recruiter@ajnengenharia.com.br', 'password' => 'WrongPassword#UnlockTest'],
        ]);
    }
    $locksBeforeCliUnlock = (int) (ajn_fetch($pdo, 'SELECT COUNT(*) AS c FROM admin_login_locks WHERE user_id=?', [$recruiterId])['c'] ?? 0);
    $unlockScript = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'unlock-admin.php';
    $unlockRes = $runCliScript($unlockScript, ['--email=recruiter@ajnengenharia.com.br', '--reason=Teste funcional 3.b'], ['AJN_CONFIG_PATH' => $cliConfigFile]);
    $unlockJson = json_decode(trim($unlockRes['out']), true);
    $locksAfterCliUnlock = (int) (ajn_fetch($pdo, 'SELECT COUNT(*) AS c FROM admin_login_locks WHERE user_id=?', [$recruiterId])['c'] ?? 0);
    $unlockAudit = ajn_fetch($pdo, "SELECT id FROM audit_logs WHERE action='ADMIN_USER_UNLOCKED' AND resource_id=? LIMIT 1", [$recruiterId]);
    fn_check('CLI unlock-admin.php limpa admin_login_locks e audita desbloqueio (3.b)',
        $locksBeforeCliUnlock === 1
        && $unlockRes['code'] === 0
        && ($unlockJson['ok'] ?? false) === true
        && (int) ($unlockJson['clearedIpLocks'] ?? 0) === 1
        && $locksAfterCliUnlock === 0
        && $unlockAudit !== null);

    ajn_exec($pdo, 'DELETE FROM request_rate_limits');
    ajn_exec($pdo, 'DELETE FROM admin_login_locks');
    ajn_exec($pdo, 'UPDATE admin_users SET failed_attempts=0, locked_until=NULL');

    $timingCases = ['missing' => [], 'inactive' => [], 'wrong_pass' => [], 'trigger_lock' => [], 'locked' => []];
    $timingUniformOk = true;
    $medianOf = static function (array $vals): float {
        sort($vals, SORT_NUMERIC);
        $n = count($vals);
        $mid = intdiv($n, 2);
        return ($n % 2 === 1) ? (float) $vals[$mid] : (((float) $vals[$mid - 1] + (float) $vals[$mid]) / 2.0);
    };
    $measureLogin = static function (string $email, string $pass, string $ip) use ($baseUrl, $appUrl, &$timingUniformOk): float {
        $t0 = hrtime(true);
        $res = fn_http($baseUrl, 'POST', '/api/admin/auth/login', [
            'headers' => ['Origin: ' . $appUrl, 'X-AJN-Test-Client-Ip: ' . $ip],
            'json' => ['email' => $email, 'password' => $pass],
        ]);
        $ms = (hrtime(true) - $t0) / 1e6;
        if ($res['status'] !== 401 || $res['body'] !== '{"error":"Credenciais inválidas."}') {
            $timingUniformOk = false;
        }
        return $ms;
    };
    for ($sIdx = 0; $sIdx < 20; $sIdx++) {
        $ipMissing = '198.51.100.' . (10 + $sIdx);
        $ipLock = '198.51.101.' . (10 + $sIdx);
        $timingCases['missing'][] = $measureLogin("no-user-$sIdx@ajnengenharia.com.br", 'WrongPass#Timing2026', $ipMissing);
        $timingCases['inactive'][] = $measureLogin('inactive@ajnengenharia.com.br', $inactivePass, $ipMissing);
        $timingCases['wrong_pass'][] = $measureLogin('dpo@ajnengenharia.com.br', 'WrongPass#Timing2026', $ipMissing);

        ajn_exec($pdo, 'INSERT OR REPLACE INTO admin_login_locks (id,user_id,ip_address,failed_attempts,locked_until,updated_at) VALUES (?,?,?,?,NULL,?)',
            [ajn_uuid(), $dpoId, $ipLock, 4, time()]);
        $timingCases['trigger_lock'][] = $measureLogin('dpo@ajnengenharia.com.br', 'WrongPass#Timing2026', $ipLock);
        $timingCases['locked'][] = $measureLogin('dpo@ajnengenharia.com.br', $dpoPass, $ipLock);
    }
    $medians = [];
    $allTimingSamples = [];
    foreach ($timingCases as $k => $arr) {
        $medians[$k] = $medianOf($arr);
        foreach ($arr as $sampleMs) {
            $allTimingSamples[] = $sampleMs;
        }
    }
    $minSampleMs = $allTimingSamples !== [] ? min($allTimingSamples) : 0.0;
    $minMed = min($medians);
    $maxMed = max($medians);
    $spreadRatio = $minMed > 0.0 ? (($maxMed - $minMed) / $minMed) : 999.0;
    fn_check('HTTP 3.e / Item 5 paridade temporal de login (20 amostras x 5 ramos): min >= 400ms e medianas dentro de 5%',
        $timingUniformOk && $minSampleMs >= 400.0 && $spreadRatio <= 0.05,
        sprintf('min_sample=%.1fms spread=%.2f%% medians(missing=%.1f,inactive=%.1f,wrong=%.1f,trig=%.1f,locked=%.1f)',
            $minSampleMs,
            $spreadRatio * 100.0,
            $medians['missing'],
            $medians['inactive'],
            $medians['wrong_pass'],
            $medians['trigger_lock'],
            $medians['locked']));

    // Limpa estado pos timing test (inclusive fila gerada pelos 20 trigger_lock)
    ajn_exec($pdo, 'DELETE FROM request_rate_limits');
    ajn_exec($pdo, 'DELETE FROM admin_login_locks');
    ajn_exec($pdo, 'UPDATE admin_users SET failed_attempts=0, locked_until=NULL');

    // 4.14l Item 5: Todos os 7 scripts CLI funcionam sob disable_functions=system,exec,shell_exec,passthru,proc_open,popen
    $disabledFnIni = ['-d', 'disable_functions=system,exec,shell_exec,passthru,proc_open,popen'];
    $verifyScript = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'verify-audit-chain.php';
    $provisionScript = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'provision-user-mfa.php';

    $dfVerify = $runCliScript($verifyScript, [], ['AJN_CONFIG_PATH' => $cliConfigFile], null, $disabledFnIni);
    $dfPurge = $runCliScript($purgeScript, ['--dry-run'], ['AJN_CONFIG_PATH' => $cliConfigFile], null, $disabledFnIni);
    $dfMigrate = $runCliScript($migrateScript, ['--dry-run'], ['AJN_CONFIG_PATH' => $cliConfigFile], null, $disabledFnIni);
    $dfAlerts = $runCliScript($sendAlertsScript, ['--dry-run'], ['AJN_CONFIG_PATH' => $cliConfigFile], null, $disabledFnIni);
    $dfUnlock = $runCliScript($unlockScript, ['--email=recruiter@ajnengenharia.com.br', '--reason=DisableFunctions'], ['AJN_CONFIG_PATH' => $cliConfigFile], null, $disabledFnIni);
    $dfSeed = $runCliScript($seedScript, [], [
        'AJN_CONFIG_PATH' => $cliConfigFile,
        'AJN_ADMIN_EMAIL' => 'cli.disabled@ajnengenharia.com.br',
        'AJN_ADMIN_NAME' => 'Cli Disabled',
        'AJN_ADMIN_INITIAL_PASSWORD' => '',
    ], "D7#nQ4!wK8@pM2\$xV\n", $disabledFnIni);
    $dfProvision = $runCliScript($provisionScript, [], [
        'AJN_CONFIG_PATH' => $cliConfigFile,
        'AJN_ADMIN_EMAIL' => '',
        'AJN_MFA_ROTATE' => '1',
    ], "cli.disabled@ajnengenharia.com.br\n", $disabledFnIni);
    fn_check('CLIs (todos os 7 scripts) executam sob disable_functions=system,exec,shell_exec,passthru,proc_open,popen com fallback STDIN seguro',
        $dfVerify['code'] === 0 && str_contains($dfVerify['out'], 'OK: Cadeia de auditoria integra')
        && $dfPurge['code'] === 0 && str_contains($dfPurge['out'], 'DRY-RUN:')
        && $dfMigrate['code'] === 0 && str_contains($dfMigrate['out'], '[DRY-RUN]')
        && $dfAlerts['code'] === 0 && str_contains($dfAlerts['out'], '"ok":true')
        && $dfUnlock['code'] === 0 && str_contains($dfUnlock['out'], '"ok":true')
        && $dfSeed['code'] === 0 && str_contains($dfSeed['out'], 'otpauth://totp/') && str_contains($dfSeed['err'], 'Aviso: system() indisponivel')
        && $dfProvision['code'] === 0 && str_contains($dfProvision['out'], 'otpauth://totp/') && str_contains($dfProvision['err'], 'Aviso: system() indisponivel'),
        sprintf('codes=%d,%d,%d,%d,%d,%d,%d',
            $dfVerify['code'], $dfPurge['code'], $dfMigrate['code'], $dfAlerts['code'], $dfUnlock['code'], $dfSeed['code'], $dfProvision['code']));

    // 4.14m Item 6: Executa audit-live-hardening.mjs contra o servidor HTTP real de teste (inclui 301 legados)
    ajn_exec($pdo, 'DELETE FROM request_rate_limits');
    $liveAuditScript = dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'scripts' . DIRECTORY_SEPARATOR . 'audit-live-hardening.mjs';
    $nodeProc = proc_open(
        ['node', $liveAuditScript, '--url=' . $baseUrl],
        [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']],
        $np,
        dirname(__DIR__, 2)
    );
    $liveAuditOut = '';
    $liveAuditErr = '';
    $liveAuditCode = 1;
    if (is_resource($nodeProc)) {
        fclose($np[0]);
        $liveAuditOut = (string) stream_get_contents($np[1]);
        $liveAuditErr = (string) stream_get_contents($np[2]);
        fclose($np[1]);
        fclose($np[2]);
        $liveAuditCode = proc_close($nodeProc);
    }
    fn_check('Script scripts/audit-live-hardening.mjs passa contra servidor HTTP de teste (inclui headers, bloqueios e 301 legados)',
        $liveAuditCode === 0 && str_contains($liveAuditOut, '[live-audit] PASS:'),
        trim($liveAuditErr !== '' ? $liveAuditErr : $liveAuditOut));

    // 4.14n Item 2: Runner de migrations hostinger/migrate.php (banco novo, baseline=004, erro no meio, drift, idempotencia e GRANTs)
    $schemaMigrateScript = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'migrate.php';
    $migRoot = $tmpRoot . DIRECTORY_SEPARATOR . 'mig-suite';
    @mkdir($migRoot, 0700, true);
    $writeMigConfig = static function (string $cfgPath, string $dbPath, string $envName = 'staging') use ($tmpRoot, $encKey): void {
        $cfg = [
            'environment' => $envName,
            'app_url' => 'https://staging.ajnengenharia.com.br',
            'database' => ['dsn' => 'sqlite:' . $dbPath],
            'resume_directory' => $tmpRoot . DIRECTORY_SEPARATOR . 'resumes',
            'encryption_key' => $encKey,
            'turnstile_secret_key' => '1x0000000000000000000000000000000AA',
            'security_alert_email' => 'faleconosco@ajnengenharia.com.br',
            'test_bypass_network' => true,
        ];
        file_put_contents($cfgPath, "<?php\nreturn " . var_export($cfg, true) . ";\n");
    };

    $freshDb = $migRoot . DIRECTORY_SEPARATOR . 'fresh.sqlite';
    $freshCfg = $migRoot . DIRECTORY_SEPARATOR . 'fresh.config.php';
    $writeMigConfig($freshCfg, $freshDb, 'staging');
    $migDry = $runCliScript($schemaMigrateScript, ['--dry-run'], ['AJN_CONFIG_PATH' => $freshCfg]);
    $migRun1 = $runCliScript($schemaMigrateScript, [], ['AJN_CONFIG_PATH' => $freshCfg]);
    $migStatus = $runCliScript($schemaMigrateScript, ['--status'], ['AJN_CONFIG_PATH' => $freshCfg]);
    $migRun2 = $runCliScript($schemaMigrateScript, [], ['AJN_CONFIG_PATH' => $freshCfg]);
    $freshPdo = new PDO('sqlite:' . $freshDb);
    $appliedRows = $freshPdo->query('SELECT name, checksum FROM schema_migrations ORDER BY name ASC')->fetchAll(PDO::FETCH_ASSOC);
    $freshPdo = null;

    // Erro no meio da migration para imediatamente sem gravar proxima; checksum alterado recusa execucao e status
    $errDir = $migRoot . DIRECTORY_SEPARATOR . 'sql-err';
    @mkdir($errDir, 0700, true);
    copy(dirname(__DIR__) . '/migrations/001_initial.sql', $errDir . '/001_initial.sql');
    file_put_contents($errDir . '/002_broken.sql', "CREATE TABLE t_ok (id INTEGER);\nSELECT * FROM tabela_que_nao_existe_123;\n");
    file_put_contents($errDir . '/003_after.sql', "CREATE TABLE t_after (id INTEGER);\n");
    $errDb = $migRoot . DIRECTORY_SEPARATOR . 'err.sqlite';
    $errCfg = $migRoot . DIRECTORY_SEPARATOR . 'err.config.php';
    $writeMigConfig($errCfg, $errDb, 'staging');
    $migBroken = $runCliScript($schemaMigrateScript, ['--migrations-dir=' . $errDir], ['AJN_CONFIG_PATH' => $errCfg]);
    $errPdo = new PDO('sqlite:' . $errDb);
    $errApplied = $errPdo->query('SELECT name FROM schema_migrations')->fetchAll(PDO::FETCH_COLUMN);
    $afterExists = $errPdo->query("SELECT name FROM sqlite_master WHERE type='table' AND name='t_after'")->fetchColumn();
    $errPdo = null;

    $driftDir = $migRoot . DIRECTORY_SEPARATOR . 'sql-drift';
    @mkdir($driftDir, 0700, true);
    foreach (glob(dirname(__DIR__) . '/migrations/*.sql') ?: [] as $sqlFile) {
        copy($sqlFile, $driftDir . DIRECTORY_SEPARATOR . basename($sqlFile));
    }
    file_put_contents($driftDir . '/001_initial.sql', "\n-- tampered checksum\n", FILE_APPEND);
    $migDriftRun = $runCliScript($schemaMigrateScript, ['--migrations-dir=' . $driftDir], ['AJN_CONFIG_PATH' => $freshCfg]);
    $migDriftStatus = $runCliScript($schemaMigrateScript, ['--status', '--migrations-dir=' . $driftDir], ['AJN_CONFIG_PATH' => $freshCfg]);

    // Teste GRANT bloqueado em arquivo SQL + analise de SHOW GRANTS
    $grantDir = $migRoot . DIRECTORY_SEPARATOR . 'sql-grant';
    @mkdir($grantDir, 0700, true);
    file_put_contents($grantDir . '/001_bad_grant.sql', "GRANT DROP ON ajn_db.* TO 'u'@'localhost';\n");
    $grantDb = $migRoot . DIRECTORY_SEPARATOR . 'grant.sqlite';
    $grantCfg = $migRoot . DIRECTORY_SEPARATOR . 'grant.config.php';
    $writeMigConfig($grantCfg, $grantDb, 'staging');
    $migGrantBlocked = $runCliScript($schemaMigrateScript, ['--migrations-dir=' . $grantDir], ['AJN_CONFIG_PATH' => $grantCfg]);

    if (!defined('AJN_MIGRATE_LIB_ONLY')) {
        define('AJN_MIGRATE_LIB_ONLY', true);
    }
    require_once $schemaMigrateScript;
    $grantsSafe = ajn_migrate_analyze_grants([
        "GRANT USAGE ON *.* TO 'u_app'@'%'",
        "GRANT SELECT, INSERT, UPDATE, DELETE ON `ajn_carreiras`.* TO 'u_app'@'%'",
    ]);
    $grantsDangerous = ajn_migrate_analyze_grants([
        "GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, DROP ON `ajn_carreiras`.* TO 'u_app'@'%'",
    ]);
    $grantsAll = ajn_migrate_analyze_grants(["GRANT ALL PRIVILEGES ON `ajn_carreiras`.* TO 'u_app'@'%'"]);

    // Baseline=004 falha se faltar indice da 004, passa quando integro e aplica somente 005..006
    $baseDb = $migRoot . DIRECTORY_SEPARATOR . 'base004.sqlite';
    $baseCfg = $migRoot . DIRECTORY_SEPARATOR . 'base004.config.php';
    $writeMigConfig($baseCfg, $baseDb, 'staging');
    $migBasePre = $runCliScript($schemaMigrateScript, [], ['AJN_CONFIG_PATH' => $baseCfg]);
    $basePdo = new PDO('sqlite:' . $baseDb);
    $basePdo->exec('DROP TABLE schema_migrations');
    $basePdo->exec('DROP INDEX idx_jobs_status_published');
    $basePdo = null;
    $migBaseMissing = $runCliScript($schemaMigrateScript, ['--baseline=004'], ['AJN_CONFIG_PATH' => $baseCfg]);

    // Recria DB apenas com 001..004, valida baseline=004 e depois aplica 005..006
    $mig004Dir = $migRoot . DIRECTORY_SEPARATOR . 'sql-004';
    @mkdir($mig004Dir, 0700, true);
    foreach (['001_initial.sql', '002_hardening.sql', '003_least_privilege.sql', '004_indexes.sql'] as $m4) {
        copy(dirname(__DIR__) . '/migrations/' . $m4, $mig004Dir . '/' . $m4);
    }
    $upgDb = $migRoot . DIRECTORY_SEPARATOR . 'upg004.sqlite';
    $upgCfg = $migRoot . DIRECTORY_SEPARATOR . 'upg004.config.php';
    $writeMigConfig($upgCfg, $upgDb, 'staging');
    $upgSeed004 = $runCliScript($schemaMigrateScript, ['--migrations-dir=' . $mig004Dir], ['AJN_CONFIG_PATH' => $upgCfg]);
    $upgPdo = new PDO('sqlite:' . $upgDb);
    $upgPdo->exec('DROP TABLE schema_migrations');
    $upgPdo = null;
    $migBaseOk = $runCliScript($schemaMigrateScript, ['--baseline=004'], ['AJN_CONFIG_PATH' => $upgCfg]);
    $migAfterBase = $runCliScript($schemaMigrateScript, [], ['AJN_CONFIG_PATH' => $upgCfg]);

    fn_check('CLI migrate.php: banco novo, idempotencia, erro para execucao, drift de checksum, --baseline=004 e bloqueio/alerta de GRANT',
        $migDry['code'] === 0 && str_contains($migDry['out'], '001_initial.sql')
        && $migRun1['code'] === 0 && str_contains($migRun1['out'], 'aplicadas=6') && count($appliedRows) === 6
        && $migStatus['code'] === 0 && str_contains($migStatus['out'], "APPLIED\t006_security_alerts_and_ip_locks.sql")
        && $migRun2['code'] === 0 && str_contains($migRun2['out'], 'Nenhuma migration pendente')
        && $migBroken['code'] === 1 && $errApplied === ['001_initial.sql'] && $afterExists === false
        && $migDriftRun['code'] === 1 && $migDriftStatus['code'] === 1
        && $migGrantBlocked['code'] === 1 && str_contains($migGrantBlocked['err'], 'BLOQUEADO')
        && $grantsSafe['ok'] === true && $grantsDangerous['ok'] === false && in_array('DROP', $grantsDangerous['dangerous'], true)
        && $grantsAll['ok'] === false && in_array('ALL PRIVILEGES', $grantsAll['dangerous'], true)
        && $migBasePre['code'] === 0
        && $migBaseMissing['code'] === 1 && str_contains($migBaseMissing['err'], 'idx_jobs_status_published')
        && $upgSeed004['code'] === 0
        && $migBaseOk['code'] === 0 && str_contains($migBaseOk['out'], 'marcadas=4')
        && $migAfterBase['code'] === 0 && str_contains($migAfterBase['out'], 'aplicadas=2'));

    // 4.14o Item 6.d: seed-legacy-fixtures.php recusa prod/005+, popula 004 em staging e conclui upgrade 004->006 + migrate-legacy-data.php
    $seedLegacyScript = __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'ops' . DIRECTORY_SEPARATOR . 'seed-legacy-fixtures.php';
    $upgProdCfg = $migRoot . DIRECTORY_SEPARATOR . 'upg004-prod.config.php';
    $writeMigConfig($upgProdCfg, $upgDb, 'production');
    $cycle004Db = $migRoot . DIRECTORY_SEPARATOR . 'cycle004.sqlite';
    $cycle004Cfg = $migRoot . DIRECTORY_SEPARATOR . 'cycle004.config.php';
    $writeMigConfig($cycle004Cfg, $cycle004Db, 'staging');
    $cycleInit004 = $runCliScript($schemaMigrateScript, ['--migrations-dir=' . $mig004Dir], ['AJN_CONFIG_PATH' => $cycle004Cfg]);
    $cyclePdo = new PDO('sqlite:' . $cycle004Db);
    $cyclePdo->exec('DROP TABLE schema_migrations');
    $cyclePdo = null;

    $seedProdRefused = $runCliScript($seedLegacyScript, [], ['AJN_CONFIG_PATH' => $upgProdCfg]);
    $seed004Ok = $runCliScript($seedLegacyScript, [], ['AJN_CONFIG_PATH' => $cycle004Cfg]);
    $cycleBase = $runCliScript($schemaMigrateScript, ['--baseline=004'], ['AJN_CONFIG_PATH' => $cycle004Cfg]);
    $cycleUp = $runCliScript($schemaMigrateScript, [], ['AJN_CONFIG_PATH' => $cycle004Cfg]);
    $seedAfter005Refused = $runCliScript($seedLegacyScript, [], ['AJN_CONFIG_PATH' => $cycle004Cfg]);
    $cycleDataMig = $runCliScript($migrateScript, [], ['AJN_CONFIG_PATH' => $cycle004Cfg]);
    $cyclePdoCheck = new PDO('sqlite:' . $cycle004Db);
    $cycTotp = (string) ($cyclePdoCheck->query("SELECT mfa_secret FROM admin_users WHERE email='legacy.aesgcm@example.invalid'")->fetchColumn() ?: '');
    $cycPhone = (string) ($cyclePdoCheck->query("SELECT phone FROM candidates WHERE email='legacy.candidato@example.invalid'")->fetchColumn() ?: '');
    $cycPhoneEnc = (string) ($cyclePdoCheck->query("SELECT phone_encrypted FROM candidates WHERE email='legacy.candidato@example.invalid'")->fetchColumn() ?: '');
    $cycExp = (int) ($cyclePdoCheck->query("SELECT tracking_expires_at FROM job_applications WHERE id='00000000-0000-4000-8000-000000000405'")->fetchColumn() ?: 0);
    $cyclePdoCheck = null;

    fn_check('CLI ops/seed-legacy-fixtures.php (recusa prod/005+, popula 004 em staging e completa upgrade 004->006 + migrate-legacy-data)',
        $cycleInit004['code'] === 0
        && $seedProdRefused['code'] === 1 && str_contains($seedProdRefused['err'], 'environment=production')
        && $seed004Ok['code'] === 0 && str_contains($seed004Ok['out'], '"ok":true')
        && $cycleBase['code'] === 0 && $cycleUp['code'] === 0
        && $seedAfter005Refused['code'] === 1 && str_contains($seedAfter005Refused['err'], 'migration 005')
        && $cycleDataMig['code'] === 0
        && str_contains($cycleDataMig['out'], '[APPLIED] mfa_recifrados=1, telefones_cifrados=1, tracking_migrados=1')
        && str_contains($cycleDataMig['out'], 'legacy.nomfa@example.invalid')
        && str_starts_with($cycTotp, 's1:')
        && $cycPhone === '(**) *****-7766'
        && str_starts_with($cycPhoneEnc, 's1:')
        && $cycExp === 1);

    // 4.14p Item 4.b: public/api/index.php e ajn_private_resume_dir recusam qualquer caminho dentro de webroots conhecidos
    $secondWebroot = $tmpRoot . DIRECTORY_SEPARATOR . 'staging-sub' . DIRECTORY_SEPARATOR . 'public_html';
    $badPrivateInsideDoc = $tmpRoot . DIRECTORY_SEPARATOR . 'public_doc' . DIRECTORY_SEPARATOR . 'private_leak';
    $badPrivateInsideKnown = $secondWebroot . DIRECTORY_SEPARATOR . 'private_leak';
    $safeResumesOut = $tmpRoot . DIRECTORY_SEPARATOR . 'ajn-private-outside' . DIRECTORY_SEPARATOR . 'resumes';
    @mkdir($tmpRoot . DIRECTORY_SEPARATOR . 'public_doc' . DIRECTORY_SEPARATOR . 'api', 0700, true);
    @mkdir($badPrivateInsideDoc, 0700, true);
    @mkdir($badPrivateInsideKnown, 0700, true);
    @mkdir($safeResumesOut, 0700, true);
    copy(dirname(__DIR__, 2) . '/public/api/index.php', $tmpRoot . DIRECTORY_SEPARATOR . 'public_doc' . DIRECTORY_SEPARATOR . 'api' . DIRECTORY_SEPARATOR . 'index.php');
    file_put_contents($badPrivateInsideDoc . '/bootstrap.php', "<?php file_put_contents(__DIR__ . '/EXECUTED', '1'); echo 'LEAKED';\n");
    file_put_contents($badPrivateInsideKnown . '/bootstrap.php', "<?php file_put_contents(__DIR__ . '/EXECUTED', '1'); echo 'LEAKED';\n");

    $runApiEntry = static function (array $env) use ($tmpRoot): array {
        $doc = $tmpRoot . DIRECTORY_SEPARATOR . 'public_doc';
        $code = 'register_shutdown_function(static function () { fwrite(STDERR, "\nHTTP_CODE=" . http_response_code()); }); '
            . '$_SERVER["DOCUMENT_ROOT"] = ' . var_export($doc, true) . '; '
            . '$_SERVER["REQUEST_URI"] = "/api/health"; $_SERVER["REQUEST_METHOD"] = "GET"; '
            . 'require ' . var_export($doc . DIRECTORY_SEPARATOR . 'api' . DIRECTORY_SEPARATOR . 'index.php', true) . ';';
        $proc = proc_open([PHP_BINARY, '-d', 'extension=sodium', '-r', $code], [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $p, $doc, $env);
        fclose($p[0]);
        $out = (string) stream_get_contents($p[1]);
        $err = (string) stream_get_contents($p[2]);
        fclose($p[1]);
        fclose($p[2]);
        $rc = proc_close($proc);
        $httpCode = 0;
        if (preg_match('/HTTP_CODE=(\d+)/', $err, $m)) {
            $httpCode = (int) $m[1];
        }
        return ['code' => $rc, 'http' => $httpCode, 'out' => $out, 'err' => $err];
    };
    $apiDocLeak = $runApiEntry(['AJN_PRIVATE_DIR' => $badPrivateInsideDoc]);
    $apiKnownLeak = $runApiEntry(['AJN_PRIVATE_DIR' => $badPrivateInsideKnown, 'AJN_KNOWN_WEBROOTS' => $secondWebroot]);
    $resumeKnownRejected = ajn_private_resume_dir([
        'resume_directory' => $secondWebroot . DIRECTORY_SEPARATOR . 'resumes',
        'known_webroots' => [$secondWebroot],
    ], false);
    $resumeSafeAccepted = ajn_private_resume_dir([
        'resume_directory' => $safeResumesOut,
        'known_webroots' => [$secondWebroot],
    ], false);
    fn_check('Webroot guard: api/index.php (503 fail-closed sem incluir bootstrap) e ajn_private_resume_dir recusam qualquer caminho dentro de webroots',
        $apiDocLeak['http'] === 503 && !is_file($badPrivateInsideDoc . '/EXECUTED')
        && $apiKnownLeak['http'] === 503 && !is_file($badPrivateInsideKnown . '/EXECUTED')
        && $resumeKnownRejected === null
        && is_string($resumeSafeAccepted) && $resumeSafeAccepted !== '');

    // 4.14q Item 7: Falhas em verify-audit-chain.php e purge-expired-data.php enfileiram alerta em security_alert_queue
    $alertDb = $migRoot . DIRECTORY_SEPARATOR . 'alerts-cron.sqlite';
    copy($dbFile, $alertDb);
    $alertCfg = $migRoot . DIRECTORY_SEPARATOR . 'alerts-cron.config.php';
    $writeMigConfig($alertCfg, $alertDb, 'production');
    $aPdo = new PDO('sqlite:' . $alertDb);
    $aPdo->exec("UPDATE audit_logs SET details_json='{\"tampered\":true}' WHERE id = (SELECT id FROM audit_logs ORDER BY timestamp ASC LIMIT 1)");
    $aPdo = null;
    $verifyScript = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'verify-audit-chain.php';
    $verifyFailAlert = $runCliScript($verifyScript, [], ['AJN_CONFIG_PATH' => $alertCfg]);

    $aPdo2 = new PDO('sqlite:' . $alertDb);
    $auditAlertRow = $aPdo2->query("SELECT event_type, status FROM security_alert_queue WHERE event_type='AUDIT_CHAIN_INTEGRITY_FAILED' ORDER BY created_at DESC LIMIT 1")->fetch(PDO::FETCH_ASSOC);
    $expCandAlertId = ajn_uuid();
    $oldTs = time() - (400 * 86400);
    $aPdo2->prepare('INSERT INTO candidates (id,full_name,email,phone,city,state,is_talent_pool,created_at,updated_at) VALUES (?,?,?,?,?,?,0,?,?)')
        ->execute([$expCandAlertId, 'Exp Cron Fail', 'exp.cron@example.invalid', '(**) *****-0000', 'BH', 'MG', $oldTs, $oldTs]);
    $resUuid = ajn_uuid();
    $aPdo2->prepare('INSERT INTO resumes (id,candidate_id,file_key,original_filename,mime_type,file_size_bytes,file_sha256,is_current,uploaded_at) VALUES (?,?,?,?,?,?,?,1,?)')
        ->execute([$resUuid, $expCandAlertId, $resUuid . '.pdf', 'cv.pdf', 'application/pdf', 123, str_repeat('a', 64), $oldTs]);
    $aPdo2 = null;
    $badResumesDir = $tmpRoot . DIRECTORY_SEPARATOR . 'public_html' . DIRECTORY_SEPARATOR . 'bad-resumes';
    @mkdir($badResumesDir, 0700, true);
    $badPurgeCfg = $migRoot . DIRECTORY_SEPARATOR . 'alerts-purge-bad.config.php';
    file_put_contents($badPurgeCfg, "<?php\nreturn " . var_export([
        'environment' => 'production',
        'app_url' => 'https://ajnengenharia.com.br',
        'database' => ['dsn' => 'sqlite:' . $alertDb],
        'resume_directory' => $badResumesDir,
        'encryption_key' => $encKey,
        'turnstile_secret_key' => 'prod-real-secret-key-min-len-99999',
        'security_alert_email' => 'faleconosco@ajnengenharia.com.br',
    ], true) . ";\n");
    $purgeFailAlert = $runCliScript($purgeScript, [], ['AJN_CONFIG_PATH' => $badPurgeCfg]);
    $aPdo3 = new PDO('sqlite:' . $alertDb);
    $purgeAlertRow = $aPdo3->query("SELECT event_type, status FROM security_alert_queue WHERE event_type='DATA_RETENTION_PURGE_FAILED' ORDER BY created_at DESC LIMIT 1")->fetch(PDO::FETCH_ASSOC);
    $aPdo3 = null;

    fn_check('Crons verify-audit-chain.php e purge-expired-data.php em falha saem != 0 e enfileiram alerta na security_alert_queue',
        $verifyFailAlert['code'] !== 0
        && ($auditAlertRow['event_type'] ?? '') === 'AUDIT_CHAIN_INTEGRITY_FAILED'
        && $purgeFailAlert['code'] !== 0
        && ($purgeAlertRow['event_type'] ?? '') === 'DATA_RETENTION_PURGE_FAILED');

    // 4.15 Logout limpa dados e invalida cookie de sessao
    $logout = fn_http($baseUrl, 'POST', '/api/admin/auth/logout', [
        'headers' => ['Origin: ' . $appUrl],
        'cookie' => $superCookie,
    ]);
    $meAfterLogout = fn_http($baseUrl, 'GET', '/api/admin/auth/me', ['cookie' => $superCookie]);
    fn_check('HTTP logout envia Clear-Site-Data e invalida sessao no banco',
        $logout['status'] === 200
        && str_contains($logout['headers']['clear-site-data'][0] ?? '', 'cache')
        && $meAfterLogout['status'] === 401);
} finally {
    if (is_resource($process)) {
        @proc_terminate($process);
        @proc_close($process);
    }
    $pdo = null;
    fn_rmdir_recursive($tmpRoot);
}

$failed = 0;
foreach ($checks as [$label, $pass, $detail]) {
    if (!$pass) $failed++;
    $line = ($pass ? 'PASS' : 'FAIL') . ' - ' . $label . ($detail !== '' ? " ($detail)" : '') . "\n";
    fwrite($pass ? STDOUT : STDERR, $line);
}
if ($failed > 0) exit(1);
fwrite(STDOUT, count($checks) . " testes funcionais PHP/SQLite PASS.\n");
