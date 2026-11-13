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

function fn_http(string $baseUrl, string $method, string $path, array $options = []): array
{
    $url = rtrim($baseUrl, '/') . $path;
    $ch = curl_init($url);
    if ($ch === false) throw new RuntimeException('curl_init failed');
    $responseHeaders = [];
    $headers = $options['headers'] ?? [];
    if (isset($options['cookie'])) {
        $headers[] = 'Cookie: ' . $options['cookie'];
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
        $curlOpts[CURLOPT_POSTFIELDS] = json_encode($options['json'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    } elseif (array_key_exists('multipart', $options)) {
        $curlOpts[CURLOPT_POSTFIELDS] = $options['multipart'];
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
    fn_check('ajn_encrypt/ajn_decrypt roundtrip AES-256-GCM', ajn_decrypt($cipher, $encCfg) === 'SEGREDO-AJN-2026');
    $tampered = substr($cipher, 0, -4) . 'AAAA';
    fn_check('ajn_decrypt detecta adulteracao', ajn_decrypt($tampered, $encCfg) === '' || $tampered === $cipher);

    fn_check('ajn_password_is_weak recusa repeticao longa', ajn_password_is_weak('aaaaaaaaaaaaaaaa') === true);
    fn_check('ajn_password_is_weak recusa sequencia numerica', ajn_password_is_weak('Ajn@0123456789!#') === true);
    fn_check('ajn_password_is_weak aceita passphrase forte', ajn_password_is_weak('N8#pQ2!vL9@xR4$mZ1') === false);
    fn_check('password_verify aceita hash dummy bcrypt sem falhar',
        password_verify('qualquer-senha', '$2y$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy') === false);
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
            cpf_hash TEXT UNIQUE, cpf_masked TEXT, city TEXT NOT NULL, state TEXT NOT NULL,
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
            tracking_code TEXT NOT NULL UNIQUE, status TEXT NOT NULL DEFAULT 'active',
            source TEXT NOT NULL DEFAULT 'portal', recruiter_rating INTEGER, recruiter_notes TEXT,
            rejection_reason TEXT, recovery_code_hash TEXT, recovery_expires_at INTEGER,
            recovery_attempts INTEGER NOT NULL DEFAULT 0, applied_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
        );
        CREATE TABLE admin_users (
            id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL,
            password_salt TEXT, role TEXT NOT NULL DEFAULT 'recruiter', is_active INTEGER NOT NULL DEFAULT 1,
            mfa_enabled INTEGER NOT NULL DEFAULT 0, mfa_secret TEXT, pending_mfa_secret TEXT,
            mfa_required INTEGER NOT NULL DEFAULT 0, mfa_last_counter INTEGER, failed_attempts INTEGER NOT NULL DEFAULT 0,
            locked_until INTEGER, reset_token_hash TEXT, reset_expires_at INTEGER, reset_attempts INTEGER NOT NULL DEFAULT 0,
            created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
        );
        CREATE TABLE admin_sessions (
            id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
            session_token_hash TEXT NOT NULL UNIQUE, role TEXT NOT NULL, ip_address TEXT, user_agent TEXT,
            expires_at INTEGER NOT NULL, absolute_expires_at INTEGER NOT NULL, created_at INTEGER NOT NULL
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
            user_agent TEXT, timestamp INTEGER NOT NULL
        );
        CREATE TABLE request_rate_limits (
            bucket_key TEXT PRIMARY KEY, window_started_at INTEGER NOT NULL,
            hits INTEGER NOT NULL, expires_at INTEGER NOT NULL
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
        ['viewer-1', 'viewer', 'jobs:read'],
        ['viewer-2', 'viewer', 'candidates:read'],
        ['viewer-3', 'viewer', 'applications:read'],
        ['dpo-1', 'dpo', 'candidates:read'],
        ['dpo-2', 'dpo', 'lgpd:read'],
        ['dpo-3', 'dpo', 'lgpd:execute'],
        ['dpo-4', 'dpo', 'audit:read'],
    ] as [$pid, $role, $perm]) {
        ajn_exec($pdo, 'INSERT INTO admin_permissions (id,role,permission,created_at) VALUES (?,?,?,?)',
            [$pid, $role, $perm, $now]);
    }

    $superPass = 'S9#vK2!mL8@qR5$wX';
    $recruiterPass = 'R4$bN7!tP2@zM6#vQ';
    $viewerPass = 'V3!kM9@pX2#sL8$nW';
    $dpoPass = 'D6#nR4!qZ8@vT2$kM';
    $inactivePass = 'I5@wP8#mN3!kB7$zL';

    $superId = ajn_uuid();
    $recruiterId = ajn_uuid();
    $viewerId = ajn_uuid();
    $dpoId = ajn_uuid();
    $inactiveId = ajn_uuid();

    $insertUser = static function (PDO $db, string $id, string $name, string $email, string $pass, string $role, int $active, int $mfaEnabled, ?string $encMfa, int $now): void {
        ajn_exec($db,
            'INSERT INTO admin_users (id,name,email,password_hash,role,is_active,mfa_enabled,mfa_secret,mfa_required,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
            [$id, $name, $email, password_hash($pass, PASSWORD_BCRYPT, ['cost' => 4]), $role, $active, $mfaEnabled, $encMfa, $mfaEnabled, $now, $now]
        );
    };
    $insertUser($pdo, $superId, 'Super Admin', 'super@ajnengenharia.com.br', $superPass, 'super_admin', 1, 1, ajn_encrypt($testSecret, $encCfg), $now);
    $insertUser($pdo, $recruiterId, 'Recruiter', 'recruiter@ajnengenharia.com.br', $recruiterPass, 'recruiter', 1, 0, null, $now);
    $insertUser($pdo, $viewerId, 'Viewer', 'viewer@ajnengenharia.com.br', $viewerPass, 'viewer', 1, 0, null, $now);
    $insertUser($pdo, $dpoId, 'DPO', 'dpo@ajnengenharia.com.br', $dpoPass, 'dpo', 1, 0, null, $now);
    $insertUser($pdo, $inactiveId, 'Inactive', 'inactive@ajnengenharia.com.br', $inactivePass, 'recruiter', 0, 0, null, $now);

    // 3. Gera router temporario para php -S (somente dentro de sys_get_temp_dir)
    $hostingerDir = str_replace('\\', '/', realpath(__DIR__ . '/..'));
    $routerCode = sprintf(<<<'PHP'
<?php
declare(strict_types=1);
define('AJN_DISABLE_AUTO_DISPATCH', true);
$GLOBALS['__ajn_mail_log'] = %s;
$__docRoot = %s;
$_SERVER['DOCUMENT_ROOT'] = $__docRoot;
if (!function_exists('ajn_verify_turnstile')) {
    function ajn_verify_turnstile(array $config, mixed $token): void
    {
        if (!is_string($token) || $token !== 'valid-test-turnstile-token') {
            ajn_json(['error' => 'Verificação antispam inválida ou expirada.'], 400);
        }
    }
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
$config = [
    'app_url' => %s,
    'environment' => file_exists(%s) ? 'production' : 'staging',
    'encryption_key' => %s,
    'resume_directory' => file_exists(%s) ? %s : %s,
    'turnstile_secret_key' => 'test-secret-key-min-len',
    'smtp' => ['host' => 'smtp.example.com', 'port' => 465, 'username' => 'noreply', 'password' => 'secret', 'from' => 'noreply@ajnengenharia.com.br'],
];
$db = new PDO('sqlite:' . %s, null, null, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_EMULATE_PREPARES => false,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
]);
$db->exec('PRAGMA foreign_keys = ON;');
$db->exec('PRAGMA busy_timeout = 3000;');
ajn_dispatch($db, $config);
PHP,
        var_export($mailLog, true),
        var_export($docRoot, true),
        var_export($hostingerDir, true),
        var_export($hostingerDir, true),
        var_export($appUrl, true),
        var_export($flagProdEnv, true),
        var_export($encKey, true),
        var_export($flagBadStorage, true),
        var_export($insideDocDir, true),
        var_export($privateDir, true),
        var_export($dbFile, true)
    );
    file_put_contents($routerFile, $routerCode);

    $port = fn_find_free_port();
    $baseUrl = "http://127.0.0.1:$port";
    $descriptors = [
        0 => ['pipe', 'r'],
        1 => ['file', $tmpRoot . DIRECTORY_SEPARATOR . 'server.out.log', 'a'],
        2 => ['file', $tmpRoot . DIRECTORY_SEPARATOR . 'server.err.log', 'a'],
    ];
    $process = proc_open([PHP_BINARY, '-S', "127.0.0.1:$port", '-t', $docRoot, $routerFile], $descriptors, $pipes);
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

    // 4.3 Login conta inexistente e conta inativa retornam 401
    $unknownLogin = fn_http($baseUrl, 'POST', '/api/admin/auth/login', [
        'headers' => ['Origin: ' . $appUrl],
        'json' => ['email' => 'missing@ajnengenharia.com.br', 'password' => $superPass],
    ]);
    $inactiveLogin = fn_http($baseUrl, 'POST', '/api/admin/auth/login', [
        'headers' => ['Origin: ' . $appUrl],
        'json' => ['email' => 'inactive@ajnengenharia.com.br', 'password' => $inactivePass],
    ]);
    fn_check('HTTP conta inexistente e inativa retornam 401',
        $unknownLogin['status'] === 401 && $inactiveLogin['status'] === 401);

    // 4.4 Bloqueio progressivo apos 5 senhas erradas (423 locked)
    for ($i = 0; $i < 5; $i++) {
        fn_http($baseUrl, 'POST', '/api/admin/auth/login', [
            'headers' => ['Origin: ' . $appUrl],
            'json' => ['email' => 'viewer@ajnengenharia.com.br', 'password' => 'WrongPassword#2026'],
        ]);
    }
    $lockedViewer = fn_http($baseUrl, 'POST', '/api/admin/auth/login', [
        'headers' => ['Origin: ' . $appUrl],
        'json' => ['email' => 'viewer@ajnengenharia.com.br', 'password' => $viewerPass],
    ]);
    fn_check('HTTP conta bloqueada apos 5 falhas retorna 423 mesmo com senha correta', $lockedViewer['status'] === 423);
    // Desbloqueia viewer para testes de RBAC posteriores
    ajn_exec($pdo, 'UPDATE admin_users SET failed_attempts=0, locked_until=NULL WHERE id=?', [$viewerId]);

    // 4.5 Login super_admin com MFA TOTP + protecao anti-replay
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

    // 4.7 Criacao de usuario e politica de senha + reset single-use e limite por IP no login
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
    $lastMail = json_decode((string) end($mailLines), true);
    preg_match('/resetToken=([a-f0-9]{64})/', (string) ($lastMail['body'] ?? ''), $rm);
    $resetToken = $rm[1] ?? '';
    $newRecruiterPass = 'R9#kM4!qV7@pX2$wZ';
    $resetOnce = fn_http($baseUrl, 'POST', '/api/admin/auth/reset-password', [
        'headers' => ['Origin: ' . $appUrl],
        'json' => ['token' => $resetToken, 'newPassword' => $newRecruiterPass],
    ]);
    $resetTwice = fn_http($baseUrl, 'POST', '/api/admin/auth/reset-password', [
        'headers' => ['Origin: ' . $appUrl],
        'json' => ['token' => $resetToken, 'newPassword' => 'Z8#pM5!qW3@kR9$vL'],
    ]);
    fn_check('HTTP token de redefinicao funciona uma unica vez (consumo atomico)',
        $forgot['status'] === 202 && $resetToken !== '' && $resetOnce['status'] === 200 && $resetTwice['status'] === 400);

    $rateLimitedLogin = fn_http($baseUrl, 'POST', '/api/admin/auth/login', [
        'headers' => ['Origin: ' . $appUrl],
        'json' => ['email' => 'recruiter@ajnengenharia.com.br', 'password' => $newRecruiterPass],
    ]);
    fn_check('HTTP 11a tentativa de login na mesma janela retorna 429 com Retry-After',
        $rateLimitedLogin['status'] === 429 && !empty($rateLimitedLogin['headers']['retry-after'][0]));

    // Limpa janela de rate limit de login para prosseguir com os testes de RBAC por perfil
    ajn_exec($pdo, 'DELETE FROM request_rate_limits');

    // Loga recruiter (com nova senha), viewer e dpo
    $loginRole = static function (string $email, string $pass) use ($baseUrl, $appUrl): string {
        $res = fn_http($baseUrl, 'POST', '/api/admin/auth/login', [
            'headers' => ['Origin: ' . $appUrl],
            'json' => ['email' => $email, 'password' => $pass],
        ]);
        if ($res['status'] !== 200) throw new RuntimeException("Login falhou para $email: {$res['status']}");
        preg_match('/__Host-ajn_admin_session=([^;]+)/', $res['headers']['set-cookie'][0] ?? '', $m);
        return '__Host-ajn_admin_session=' . ($m[1] ?? '');
    };
    $recruiterCookie = $loginRole('recruiter@ajnengenharia.com.br', $newRecruiterPass);
    $viewerCookie = $loginRole('viewer@ajnengenharia.com.br', $viewerPass);
    $dpoCookie = $loginRole('dpo@ajnengenharia.com.br', $dpoPass);

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
    $ownerMail = json_decode((string) end($mailLines2), true);
    preg_match('/:\s*(\d{6})\b/', (string) ($ownerMail['body'] ?? ''), $om);
    $verifyCode = $om[1] ?? '';

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

    // 4.12 Download de curriculo + RBAC + teto 40/h por operador
    $viewerDl = fn_http($baseUrl, 'GET', "/api/admin/candidates/$candidateId/resume", ['cookie' => $viewerCookie]);
    $recruiterDl = fn_http($baseUrl, 'GET', "/api/admin/candidates/$candidateId/resume", ['cookie' => $recruiterCookie]);
    fn_check('HTTP download de curriculo bloqueado para viewer e permitido para recruiter',
        $viewerDl['status'] === 403 && $recruiterDl['status'] === 200 && $recruiterDl['body'] === $pdfBytes
        && ($recruiterDl['headers']['x-content-type-options'][0] ?? '') === 'nosniff');

    $bucketKey = hash('sha256', 'admin-resume-download:' . $recruiterId);
    ajn_exec($pdo, 'UPDATE request_rate_limits SET hits=40 WHERE bucket_key=?', [$bucketKey]);
    $recruiterDlOverQuota = fn_http($baseUrl, 'GET', "/api/admin/candidates/$candidateId/resume", ['cookie' => $recruiterCookie]);
    fn_check('HTTP download acima de 40/hora por operador retorna 429', $recruiterDlOverQuota['status'] === 429);

    // 4.13 Solicitacao LGPD + eliminacao fisica e logica pelo DPO
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
    $dpoExecute = fn_http($baseUrl, 'POST', "/api/admin/lgpd/requests/$reqId/execute", [
        'headers' => ['Origin: ' . $appUrl],
        'cookie' => $dpoCookie,
    ]);
    $remainingFiles = glob($privateDir . DIRECTORY_SEPARATOR . '*') ?: [];
    $candidateAfter = ajn_fetch($pdo, 'SELECT id FROM candidates WHERE id=?', [$candidateId]);
    $erasureAudit = ajn_fetch($pdo, "SELECT id FROM audit_logs WHERE action='LGPD_DATA_ERASURE' AND resource_id=? LIMIT 1", [$candidateId]);
    fn_check('HTTP LGPD erasure pelo DPO apaga arquivos do disco, remove candidato e preserva audit',
        $lgpdReq['status'] === 202 && $reqId !== '' && $recruiterExecute['status'] === 403
        && $dpoExecute['status'] === 200 && count($remainingFiles) === 0 && $candidateAfter === null && $erasureAudit !== null);

    // 4.14 Logout limpa dados e invalida cookie de sessao
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
