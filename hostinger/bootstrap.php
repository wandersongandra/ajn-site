<?php
declare(strict_types=1);

// Esta pasta deve ser instalada fora da raiz pública do site.
// Não pode ser incluída no build Astro nem publicada via FTP em public_html.
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: strict-origin-when-cross-origin');
// A resposta nunca deve ser lida por outra origem nem reaproveitada por cache compartilhado.
header('Cross-Origin-Resource-Policy: same-origin');
header('Vary: Origin');

// Nome do cookie de sessao do painel. O prefixo __Host- faz o navegador recusar
// o cookie se nao vier com Secure, path=/ e sem Domain, o que impede que um
// subdominio comprometido injete sessao no dominio principal.
const AJN_SESSION_COOKIE = '__Host-ajn_admin_session';
const AJN_SESSION_IDLE_SECONDS = 1800;
const AJN_SESSION_ABSOLUTE_SECONDS = 28800;

function ajn_json(array $payload, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

function ajn_uuid(): string
{
    $bytes = random_bytes(16);
    $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
    $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);
    $value = bin2hex($bytes);
    return substr($value, 0, 8) . '-' . substr($value, 8, 4) . '-' . substr($value, 12, 4) . '-' . substr($value, 16, 4) . '-' . substr($value, 20);
}

function ajn_body(): array
{
    if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== 0) {
        ajn_json(['error' => 'Content-Type deve ser application/json.'], 415);
    }
    $raw = file_get_contents('php://input', false, null, 0, 131073);
    if (!is_string($raw) || strlen($raw) > 131072) {
        ajn_json(['error' => 'Requisição muito grande.'], 413);
    }
    $data = json_decode($raw, true);
    if (!is_array($data) || array_is_list($data)) {
        ajn_json(['error' => 'JSON inválido.'], 400);
    }
    return $data;
}

function ajn_text(mixed $value, int $max = 200): string
{
    return is_string($value) ? mb_substr(trim($value), 0, $max, 'UTF-8') : '';
}

function ajn_escape_like(string $value): string
{
    return strtr($value, ['!' => '!!', '%' => '!%', '_' => '!_']);
}

function ajn_optional_http_url(mixed $value, int $max = 500): ?string
{
    $url = ajn_text($value, $max);
    if ($url === '') return null;
    if (preg_match('/[\x00-\x20\x7f]/', $url) || !filter_var($url, FILTER_VALIDATE_URL)) {
        ajn_json(['error' => 'URL inválida. Utilize um endereço http:// ou https:// válido.'], 400);
    }
    $parts = parse_url($url);
    $scheme = strtolower((string) ($parts['scheme'] ?? ''));
    if (!in_array($scheme, ['http', 'https'], true) || empty($parts['host']) || isset($parts['user']) || isset($parts['pass'])) {
        ajn_json(['error' => 'URL inválida. Utilize um endereço http:// ou https:// válido.'], 400);
    }
    return $url;
}

function ajn_private_resume_dir(array $config, bool $requireWritable = false): ?string
{
    $privateRaw = trim((string) ($config['resume_directory'] ?? ''));
    $publicRaw = trim((string) ($_SERVER['DOCUMENT_ROOT'] ?? ''));
    $privateDirectory = $privateRaw !== '' ? realpath($privateRaw) : false;
    $publicRoot = $publicRaw !== '' ? realpath($publicRaw) : false;
    if (!$privateDirectory || !is_dir($privateDirectory) || ($requireWritable && !is_writable($privateDirectory)) || !$publicRoot || !is_dir($publicRoot)) {
        return null;
    }
    $normPrivate = rtrim(str_replace('\\', '/', $privateDirectory), '/');
    $normPublic = rtrim(str_replace('\\', '/', $publicRoot), '/');
    if (DIRECTORY_SEPARATOR === '\\') {
        $normPrivate = strtolower($normPrivate);
        $normPublic = strtolower($normPublic);
    }
    if ($normPrivate === $normPublic || str_starts_with($normPrivate . '/', $normPublic . '/')) {
        return null;
    }
    return $privateDirectory;
}

function ajn_fetch(PDO $db, string $sql, array $values = []): ?array
{
    $query = $db->prepare($sql);
    $query->execute($values);
    $row = $query->fetch(PDO::FETCH_ASSOC);
    return is_array($row) ? $row : null;
}

function ajn_list(PDO $db, string $sql, array $values = []): array
{
    $query = $db->prepare($sql);
    $query->execute($values);
    return $query->fetchAll(PDO::FETCH_ASSOC);
}

function ajn_exec(PDO $db, string $sql, array $values = []): int
{
    $query = $db->prepare($sql);
    $query->execute($values);
    return $query->rowCount();
}

function ajn_audit(PDO $db, string $actorType, ?string $actorId, string $action, string $resource, ?string $resourceId = null): void
{
    ajn_exec($db,
        'INSERT INTO audit_logs (id,actor_id,actor_type,action,resource,resource_id,ip_address,user_agent,timestamp) VALUES (?,?,?,?,?,?,?,?,?)',
        [ajn_uuid(), $actorId, $actorType, $action, $resource, $resourceId, $_SERVER['REMOTE_ADDR'] ?? null, mb_substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 500), time()]
    );
}

/**
 * Contador por janela. Por padrao a chave e o IP de origem; passar $identity
 * permite limitar por sujeito autenticado, o que e o que importa em acoes que
 * so existem apos login e podem vazar dado pessoal em volume.
 */
function ajn_rate_limit(PDO $db, string $scope, int $max, int $window, ?string $identity = null): void
{
    $key = hash('sha256', $scope . ':' . ($identity ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown'));
    $now = time();
    $isSqlite = $db->getAttribute(PDO::ATTR_DRIVER_NAME) === 'sqlite';
    // A tabela so cresce se ninguem remover janelas vencidas. Nao ha cron na
    // hospedagem compartilhada, entao a limpeza ocorre de forma amostral.
    if (random_int(1, 100) === 1) {
        if ($isSqlite) {
            ajn_exec($db, 'DELETE FROM request_rate_limits WHERE bucket_key IN (SELECT bucket_key FROM request_rate_limits WHERE expires_at <= ? LIMIT 1000)', [$now - 86400]);
        } else {
            ajn_exec($db, 'DELETE FROM request_rate_limits WHERE expires_at <= ? LIMIT 1000', [$now - 86400]);
        }
    }
    $upsertSql = $isSqlite
        ? 'INSERT INTO request_rate_limits (bucket_key,window_started_at,hits,expires_at) VALUES (?,?,1,?) ON CONFLICT(bucket_key) DO UPDATE SET hits=CASE WHEN expires_at<=? THEN 1 ELSE hits+1 END,window_started_at=CASE WHEN expires_at<=? THEN ? ELSE window_started_at END,expires_at=CASE WHEN expires_at<=? THEN ? ELSE expires_at END'
        : 'INSERT INTO request_rate_limits (bucket_key,window_started_at,hits,expires_at) VALUES (?,?,1,?) ON DUPLICATE KEY UPDATE hits=IF(expires_at<=?,1,hits+1),window_started_at=IF(expires_at<=?, ?, window_started_at),expires_at=IF(expires_at<=?, ?, expires_at)';
    ajn_exec($db, $upsertSql, [$key, $now, $now + $window, $now, $now, $now, $now, $now + $window]);
    $row = ajn_fetch($db, 'SELECT hits, expires_at FROM request_rate_limits WHERE bucket_key=?', [$key]);
    if (($row['hits'] ?? 0) > $max) {
        header('Retry-After: ' . max(1, ((int) $row['expires_at']) - $now));
        ajn_json(['error' => 'Muitas tentativas. Aguarde antes de tentar novamente.'], 429);
    }
}

function ajn_require_origin(array $config): void
{
    $expected = rtrim($config['app_url'] ?? '', '/');
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if (!is_string($origin) || !hash_equals($expected, $origin)) {
        ajn_json(['error' => 'Origem não autorizada.'], 403);
    }
}

if (!function_exists('ajn_verify_turnstile')) {
function ajn_verify_turnstile(array $config, mixed $token): void
{
    $secret = $config['turnstile_secret_key'] ?? '';
    if (!is_string($secret) || strlen($secret) < 10 || !function_exists('curl_init')) {
        ajn_json(['error' => 'Verificação antispam ainda não configurada.'], 503);
    }
    if (!is_string($token) || strlen($token) < 10 || strlen($token) > 2048) {
        ajn_json(['error' => 'Conclua a verificação antispam antes de enviar.'], 400);
    }
    $payload = ['secret' => $secret, 'response' => $token];
    $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    if (is_string($ip) && filter_var($ip, FILTER_VALIDATE_IP)) $payload['remoteip'] = $ip;
    $client = curl_init('https://challenges.cloudflare.com/turnstile/v0/siteverify');
    if ($client === false) ajn_json(['error' => 'Serviço antispam indisponível.'], 503);
    curl_setopt_array($client, [
        CURLOPT_POST => true, CURLOPT_POSTFIELDS => http_build_query($payload),
        CURLOPT_RETURNTRANSFER => true, CURLOPT_CONNECTTIMEOUT => 3,
        CURLOPT_TIMEOUT => 8, CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_SSL_VERIFYPEER => true, CURLOPT_SSL_VERIFYHOST => 2,
    ]);
    $response = curl_exec($client);
    $status = (int) curl_getinfo($client, CURLINFO_RESPONSE_CODE);
    curl_close($client);
    if (!is_string($response) || $status !== 200) {
        ajn_json(['error' => 'Serviço antispam temporariamente indisponível.'], 503);
    }
    $verification = json_decode($response, true);
    $host = parse_url($config['app_url'], PHP_URL_HOST);
    if (!is_array($verification) || ($verification['success'] ?? false) !== true ||
        !is_string($host) || !hash_equals($host, (string) ($verification['hostname'] ?? ''))) {
        ajn_json(['error' => 'Verificação antispam inválida ou expirada.'], 400);
    }
}
}

function ajn_session(PDO $db): ?array
{
    $token = $_COOKIE[AJN_SESSION_COOKIE] ?? '';
    if (!is_string($token) || !preg_match('/^[a-f0-9]{64}$/D', $token)) return null;
    $now = time();
    $hash = hash('sha256', $token);
    $row = ajn_fetch($db,
        'SELECT u.id,u.name,u.email,u.role,u.is_active,u.mfa_enabled,u.mfa_required,s.expires_at,s.absolute_expires_at FROM admin_sessions s JOIN admin_users u ON u.id=s.user_id WHERE s.session_token_hash=? AND s.expires_at>? AND s.absolute_expires_at>? LIMIT 1',
        [$hash, $now, $now]
    );
    if (!$row || !(int) $row['is_active']) return null;
    // expires_at e a janela de inatividade e desliza a cada uso, sempre limitada
    // pelo teto absoluto gravado na emissao da sessao.
    $next = min($now + AJN_SESSION_IDLE_SECONDS, (int) $row['absolute_expires_at']);
    if ($next > (int) $row['expires_at']) {
        ajn_exec($db, 'UPDATE admin_sessions SET expires_at=? WHERE session_token_hash=?', [$next, $hash]);
    }
    return $row;
}

function ajn_auth(PDO $db, ?string $permission = null): array
{
    $user = ajn_session($db);
    if (!$user) ajn_json(['error' => 'Não autenticado.'], 401);
    if ($permission !== null && $user['role'] !== 'super_admin') {
        $allowed = ajn_fetch($db, 'SELECT id FROM admin_permissions WHERE role=? AND permission=?', [$user['role'], $permission]);
        if (!$allowed) ajn_json(['error' => 'Permissão insuficiente.'], 403);
    }
    return $user;
}

/**
 * Tamanho sozinho nao basta: "aaaaaaaaaaaaaaaa" tem 16 caracteres. Em vez de
 * exigir composicao rigida, que a NIST SP 800-63B desaconselha, recusa apenas
 * os casos degenerados de repeticao e sequencia, que e o que aparece quando
 * alguem preenche o campo so para passar da validacao.
 */
function ajn_password_is_weak(string $password): bool
{
    $lower = mb_strtolower($password, 'UTF-8');
    if (count(array_unique(mb_str_split($lower, 1, 'UTF-8'))) < 8) return true;
    if (preg_match('/(.)\1{3,}/u', $lower)) return true;
    foreach (['0123456789', 'abcdefghijklmnopqrstuvwxyz', 'qwertyuiop', 'asdfghjkl'] as $sequence) {
        for ($offset = 0; $offset + 6 <= strlen($sequence); $offset++) {
            $window = substr($sequence, $offset, 6);
            if (str_contains($lower, $window) || str_contains($lower, strrev($window))) return true;
        }
    }
    return false;
}

function ajn_user_public(array $user): array
{
    return [
        'id' => $user['id'], 'name' => $user['name'], 'email' => $user['email'],
        'role' => $user['role'], 'mfaEnabled' => (bool) ($user['mfa_enabled'] ?? false),
        'mfaRequired' => (bool) ($user['mfa_required'] ?? false),
    ];
}

function ajn_issue_session(PDO $db, array $user): void
{
    $token = bin2hex(random_bytes(32));
    $now = time();
    $absolute = $now + AJN_SESSION_ABSOLUTE_SECONDS;
    ajn_exec($db,
        'INSERT INTO admin_sessions (id,user_id,session_token_hash,role,ip_address,user_agent,expires_at,absolute_expires_at,created_at) VALUES (?,?,?,?,?,?,?,?,?)',
        [ajn_uuid(), $user['id'], hash('sha256', $token), $user['role'], $_SERVER['REMOTE_ADDR'] ?? null, mb_substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 500), $now + AJN_SESSION_IDLE_SECONDS, $absolute, $now]
    );
    setcookie(AJN_SESSION_COOKIE, $token, [
        'expires' => $absolute, 'path' => '/', 'secure' => true,
        'httponly' => true, 'samesite' => 'Strict',
    ]);
}

/**
 * Devolve o contador TOTP que validou o codigo, ou null quando nenhum serve.
 * O contador e necessario para que o chamador recuse reapresentacao do mesmo
 * codigo dentro da janela de tolerancia.
 */
function ajn_totp(string $secret, int $window = 1, ?string $code = null): ?int
{
    if ($code === null || !preg_match('/^\d{6}$/D', $code)) return null;
    $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    $bits = '';
    foreach (str_split(strtoupper(rtrim($secret, '='))) as $char) {
        $pos = strpos($alphabet, $char);
        if ($pos === false) return null;
        $bits .= str_pad(decbin($pos), 5, '0', STR_PAD_LEFT);
    }
    $binary = '';
    foreach (str_split($bits, 8) as $byte) {
        if (strlen($byte) === 8) $binary .= chr(bindec($byte));
    }
    if (strlen($binary) < 10) return null;
    for ($step = -$window; $step <= $window; $step++) {
        $counter = intdiv(time(), 30) + $step;
        $hmac = hash_hmac('sha1', pack('N2', 0, $counter), $binary, true);
        $offset = ord($hmac[19]) & 0x0f;
        $number = ((ord($hmac[$offset]) & 0x7f) << 24) | (ord($hmac[$offset + 1]) << 16) | (ord($hmac[$offset + 2]) << 8) | ord($hmac[$offset + 3]);
        if (hash_equals(str_pad((string) ($number % 1000000), 6, '0', STR_PAD_LEFT), $code)) return $counter;
    }
    return null;
}

function ajn_decrypt(string $value, array $config): string
{
    // O novo backend não tenta interpretar ciphertext do Web Crypto antigo.
    $key = hex2bin($config['encryption_key'] ?? '');
    if (!is_string($key) || strlen($key) !== 32) return '';
    $binary = base64_decode($value, true);
    if (!is_string($binary) || strlen($binary) < 29) return '';
    $iv = substr($binary, 0, 12);
    $tag = substr($binary, 12, 16);
    return openssl_decrypt(substr($binary, 28), 'aes-256-gcm', $key, OPENSSL_RAW_DATA, $iv, $tag) ?: '';
}

function ajn_encrypt(string $value, array $config): string
{
    $key = hex2bin($config['encryption_key'] ?? '');
    if (!is_string($key) || strlen($key) !== 32) throw new RuntimeException('Encryption key missing.');
    $iv = random_bytes(12);
    $tag = '';
    $encrypted = openssl_encrypt($value, 'aes-256-gcm', $key, OPENSSL_RAW_DATA, $iv, $tag);
    if (!is_string($encrypted)) throw new RuntimeException('Encryption failed.');
    return base64_encode($iv . $tag . $encrypted);
}

function ajn_email_configured(array $config): bool
{
    $smtp = $config['smtp'] ?? null;
    if (!is_array($smtp)) return false;
    foreach (['host', 'username', 'password', 'from'] as $key) {
        if (!is_string($smtp[$key] ?? null) || trim($smtp[$key]) === '' || str_starts_with($smtp[$key], 'SUBSTITUIR_')) return false;
    }
    return filter_var($smtp['from'], FILTER_VALIDATE_EMAIL) !== false &&
        !str_contains($smtp['host'], "\r") && !str_contains($smtp['host'], "\n");
}

function ajn_smtp_read($socket, array $expectedCodes): bool
{
    $line = fgets($socket, 2048);
    if (!is_string($line)) return false;
    $code = (int) substr($line, 0, 3);
    while (isset($line[3]) && $line[3] === '-') {
        $line = fgets($socket, 2048);
        if (!is_string($line)) return false;
    }
    return in_array($code, $expectedCodes, true);
}

function ajn_smtp_command($socket, string $command, array $expectedCodes): bool
{
    if (fwrite($socket, $command . "\r\n") === false) return false;
    return ajn_smtp_read($socket, $expectedCodes);
}

/**
 * Cabecalho de e-mail aceita apenas ASCII imprimivel (RFC 5322). Assunto com
 * acento precisa viajar como encoded-word (RFC 2047) ou chega corrompido em
 * parte dos clientes. As quebras seguem limite de linha e fronteira de
 * caractere, para nao partir um UTF-8 multibyte no meio.
 */
function ajn_mime_header(string $value): string
{
    if (preg_match('/^[\x20-\x7E]*$/D', $value)) return $value;
    $words = [];
    $current = '';
    foreach (mb_str_split($value, 1, 'UTF-8') as $char) {
        if (strlen($current . $char) > 42) {
            $words[] = '=?UTF-8?B?' . base64_encode($current) . '?=';
            $current = '';
        }
        $current .= $char;
    }
    if ($current !== '') $words[] = '=?UTF-8?B?' . base64_encode($current) . '?=';
    return implode("\r\n ", $words);
}

if (!function_exists('ajn_send_email')) {
function ajn_send_email(array $config, string $recipient, string $subject, string $body): bool
{
    if (!ajn_email_configured($config) || !filter_var($recipient, FILTER_VALIDATE_EMAIL) || !is_string($body)) {
        return false;
    }
    $smtp = $config['smtp'];
    $host = trim($smtp['host']);
    if ($host === '' || preg_match('/[\r\n\0\s]/', $host) || preg_match('/[\r\n\0]/', $recipient . $subject . $smtp['from'])) {
        return false;
    }
    $port = (int) ($smtp['port'] ?? 465);
    if (!in_array($port, [465, 587], true)) return false;
    $cryptoMethod = STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT | (defined('STREAM_CRYPTO_METHOD_TLSv1_3_CLIENT') ? STREAM_CRYPTO_METHOD_TLSv1_3_CLIENT : 0);
    $context = stream_context_create([
        'ssl' => [
            'verify_peer' => true,
            'verify_peer_name' => true,
            'allow_self_signed' => false,
            'SNI_enabled' => true,
            'peer_name' => $host,
            'crypto_method' => $cryptoMethod,
        ],
    ]);
    $transport = $port === 465 ? 'ssl://' . $host : $host;
    $errno = 0;
    $error = '';
    $socket = @stream_socket_client($transport . ':' . $port, $errno, $error, 8, STREAM_CLIENT_CONNECT, $context);
    if (!is_resource($socket)) return false;
    try {
        if (!ajn_smtp_read($socket, [220])) return false;
        stream_set_timeout($socket, 8);
        if (!ajn_smtp_command($socket, 'EHLO ajnengenharia.com.br', [250])) return false;
        if ($port === 587) {
            if (!ajn_smtp_command($socket, 'STARTTLS', [220]) || !stream_socket_enable_crypto($socket, true, $cryptoMethod)) return false;
            if (!ajn_smtp_command($socket, 'EHLO ajnengenharia.com.br', [250])) return false;
        }
        if (!ajn_smtp_command($socket, 'AUTH LOGIN', [334]) ||
            !ajn_smtp_command($socket, base64_encode($smtp['username']), [334]) ||
            !ajn_smtp_command($socket, base64_encode($smtp['password']), [235]) ||
            !ajn_smtp_command($socket, 'MAIL FROM:<' . $smtp['from'] . '>', [250]) ||
            !ajn_smtp_command($socket, 'RCPT TO:<' . $recipient . '>', [250, 251]) ||
            !ajn_smtp_command($socket, 'DATA', [354])) return false;
        $safeBody = str_replace(["\r\n", "\r", "\n"], "\r\n", $body);
        $safeBody = preg_replace('/^\./m', '..', $safeBody) ?? $safeBody;
        $message = 'From: AJN Carreiras <' . $smtp['from'] . ">\r\n" .
            'To: <' . $recipient . ">\r\n" .
            'Subject: ' . ajn_mime_header($subject) . "\r\n" .
            "MIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n" . $safeBody . "\r\n.";
        if (fwrite($socket, $message . "\r\n") === false || !ajn_smtp_read($socket, [250])) return false;
        ajn_smtp_command($socket, 'QUIT', [221]);
        return true;
    } finally {
        fclose($socket);
    }
}
}

if (!defined('AJN_DISABLE_AUTO_DISPATCH')) {
    $configFile = __DIR__ . '/config.php';
    if (!is_file($configFile)) ajn_json(['error' => 'Configuração privada ausente.'], 503);
    $config = require $configFile;
    if (!is_array($config) || !filter_var($config['app_url'] ?? null, FILTER_VALIDATE_URL) || !str_starts_with($config['app_url'], 'https://')) {
        ajn_json(['error' => 'Configuração do ambiente inválida.'], 503);
    }

    try {
        $dbc = $config['database'] ?? [];
        $db = new PDO(
            'mysql:host=' . ($dbc['host'] ?? '') . ';port=' . (int) ($dbc['port'] ?? 3306) . ';dbname=' . ($dbc['name'] ?? '') . ';charset=utf8mb4',
            $dbc['username'] ?? '', $dbc['password'] ?? '',
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_EMULATE_PREPARES => false, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
        );
        require __DIR__ . '/app.php';
    } catch (Throwable $error) {
        error_log('[AJN_CAREIRAS] ' . get_class($error));
        ajn_json(['error' => 'Serviço temporariamente indisponível.'], 503);
    }
}
