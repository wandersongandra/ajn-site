<?php
declare(strict_types=1);

// Esta pasta deve ser instalada fora da raiz publica do site.
// Nao pode ser incluida no build Astro nem publicada via FTP em public_html.
@ini_set('display_errors', '0');
@ini_set('display_startup_errors', '0');
@ini_set('log_errors', '1');
@ini_set('session.use_strict_mode', '1');
@ini_set('session.cookie_secure', '1');
@ini_set('session.cookie_httponly', '1');
@ini_set('session.cookie_samesite', 'Strict');
@ini_set('expose_php', '0');

if (PHP_SAPI !== 'cli') {
    if (function_exists('header_remove')) {
        @header_remove('X-Powered-By');
    }
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, max-age=0');
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header('Permissions-Policy: accelerometer=(), autoplay=(), camera=(), clipboard-read=(), clipboard-write=(), geolocation=(), microphone=(), payment=(), usb=()');
    header('Cross-Origin-Opener-Policy: same-origin');
    // A resposta nunca deve ser lida por outra origem nem reaproveitada por cache compartilhado.
    header('Cross-Origin-Resource-Policy: same-origin');
    header('Strict-Transport-Security: max-age=63072000; includeSubDomains; preload');
    header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'; object-src 'none'");
    header('Vary: Origin');
}

// Nome do cookie de sessao do painel. O prefixo __Host- faz o navegador recusar
// o cookie se nao vier com Secure, path=/ e sem Domain, o que impede que um
// subdominio comprometido injete sessao no dominio principal.
const AJN_SESSION_COOKIE = '__Host-ajn_admin_session';
const AJN_SESSION_IDLE_SECONDS = 1200;
const AJN_SESSION_ABSOLUTE_SECONDS = 28800;
const AJN_STEP_UP_SECONDS = 300;
const AJN_TRACKING_TTL_SECONDS = 7776000;

function ajn_json(array $payload, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

function ajn_enforce_min_duration_ms(int $startedNs, int $minMs = 400): void
{
    $targetNs = $startedNs + ($minMs * 1_000_000);
    while (($remainingNs = $targetNs - hrtime(true)) > 0) {
        if ($remainingNs > 2_000_000) {
            usleep((int) intdiv($remainingNs - 1_000_000, 1000));
        }
    }
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
    if (!is_array($data) || ($data !== [] && array_is_list($data)) || str_starts_with(ltrim($raw), '[')) {
        ajn_json(['error' => 'JSON inválido.'], 400);
    }
    return $data;
}

function ajn_pagination(int $defaultLimit = 200, int $maxLimit = 200): array
{
    $limit = max(1, min($maxLimit, (int) ($_GET['limit'] ?? $defaultLimit)));
    $offset = max(0, min(10000, (int) ($_GET['offset'] ?? 0)));
    return [$limit, $offset];
}

function ajn_pdo(array $config): PDO
{
    if (!empty($config['error_log_path']) && is_string($config['error_log_path'])) {
        $logDir = dirname($config['error_log_path']);
        if (is_dir($logDir) && is_writable($logDir)) {
            @ini_set('error_log', $config['error_log_path']);
        }
    }
    $dbc = $config['database'] ?? [];
    if (!empty($dbc['dsn']) && is_string($dbc['dsn'])) {
        return new PDO(
            $dbc['dsn'],
            $dbc['username'] ?? '',
            $dbc['password'] ?? '',
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_EMULATE_PREPARES => false, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
        );
    }
    return new PDO(
        'mysql:host=' . ($dbc['host'] ?? '') . ';port=' . (int) ($dbc['port'] ?? 3306) . ';dbname=' . ($dbc['name'] ?? '') . ';charset=utf8mb4',
        $dbc['username'] ?? '', $dbc['password'] ?? '',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_EMULATE_PREPARES => false, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
    );
}

function ajn_base32_encode(string $binary): string
{
    $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    $bits = '';
    foreach (str_split($binary) as $byte) $bits .= str_pad(decbin(ord($byte)), 8, '0', STR_PAD_LEFT);
    $encoded = '';
    foreach (str_split($bits, 5) as $chunk) {
        $encoded .= $alphabet[bindec(str_pad($chunk, 5, '0', STR_PAD_RIGHT))];
    }
    return $encoded;
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

function ajn_normalize_fs_path(string $path): string
{
    $normalized = rtrim(str_replace('\\', '/', $path), '/');
    return DIRECTORY_SEPARATOR === '\\' ? strtolower($normalized) : $normalized;
}

function ajn_known_webroots(array $config = []): array
{
    $candidates = [];
    if (!empty($_SERVER['DOCUMENT_ROOT']) && is_string($_SERVER['DOCUMENT_ROOT'])) {
        $candidates[] = $_SERVER['DOCUMENT_ROOT'];
    }
    foreach ([$_SERVER['AJN_KNOWN_WEBROOTS'] ?? null, getenv('AJN_KNOWN_WEBROOTS')] as $envRoots) {
        if (is_string($envRoots) && trim($envRoots) !== '') {
            foreach (preg_split('/[' . preg_quote(PATH_SEPARATOR, '/') . ',;]/', $envRoots) ?: [] as $item) {
                $candidates[] = $item;
            }
        }
    }
    $cfgRoots = $config['known_webroots'] ?? [];
    if (is_string($cfgRoots)) {
        $cfgRoots = preg_split('/[' . preg_quote(PATH_SEPARATOR, '/') . ',;]/', $cfgRoots) ?: [];
    }
    if (is_array($cfgRoots)) {
        foreach ($cfgRoots as $item) {
            if (is_string($item)) {
                $candidates[] = $item;
            }
        }
    }

    $roots = [];
    foreach ($candidates as $raw) {
        $trimmed = trim((string) $raw);
        if ($trimmed === '') {
            continue;
        }
        $real = realpath($trimmed);
        if ($real !== false && is_dir($real)) {
            $norm = ajn_normalize_fs_path($real);
            $roots[$norm] = $real;
        }
    }
    return $roots;
}

function ajn_path_is_inside_webroot(string $pathReal, array $knownWebroots): bool
{
    $normPath = ajn_normalize_fs_path($pathReal);
    if ($normPath === '') {
        return true;
    }
    if (preg_match('/(?:^|\/)(?:public_html|htdocs|httpdocs|www)(?:\/|$)/i', $normPath) === 1) {
        return true;
    }
    foreach ($knownWebroots as $normRoot => $_raw) {
        if ($normPath === $normRoot || str_starts_with($normPath . '/', $normRoot . '/')) {
            return true;
        }
    }
    return false;
}

function ajn_private_resume_dir(array $config, bool $requireWritable = false): ?string
{
    $privateRaw = trim((string) ($config['resume_directory'] ?? ''));
    $privateDirectory = $privateRaw !== '' ? realpath($privateRaw) : false;
    $webroots = ajn_known_webroots($config);
    if (!$privateDirectory || !is_dir($privateDirectory) || ($requireWritable && !is_writable($privateDirectory)) || $webroots === []) {
        return null;
    }
    if (ajn_path_is_inside_webroot($privateDirectory, $webroots)) {
        return null;
    }
    return $privateDirectory;
}

function ajn_prepare_and_execute(PDO $db, string $sql, array $values = []): PDOStatement
{
    $query = $db->prepare($sql);
    $index = 1;
    foreach ($values as $key => $val) {
        $param = is_int($key) ? $index : (str_starts_with((string) $key, ':') ? (string) $key : ':' . (string) $key);
        if (is_int($val)) {
            $query->bindValue($param, $val, PDO::PARAM_INT);
        } elseif (is_bool($val)) {
            $query->bindValue($param, $val ? 1 : 0, PDO::PARAM_INT);
        } elseif ($val === null) {
            $query->bindValue($param, null, PDO::PARAM_NULL);
        } else {
            $query->bindValue($param, (string) $val, PDO::PARAM_STR);
        }
        $index++;
    }
    $query->execute();
    return $query;
}

function ajn_fetch(PDO $db, string $sql, array $values = []): ?array
{
    $query = ajn_prepare_and_execute($db, $sql, $values);
    $row = $query->fetch(PDO::FETCH_ASSOC);
    return is_array($row) ? $row : null;
}

function ajn_list(PDO $db, string $sql, array $values = []): array
{
    $query = ajn_prepare_and_execute($db, $sql, $values);
    return $query->fetchAll(PDO::FETCH_ASSOC);
}

function ajn_exec(PDO $db, string $sql, array $values = []): int
{
    $query = ajn_prepare_and_execute($db, $sql, $values);
    return $query->rowCount();
}

function ajn_sanitize_audit_details(?array $details): ?string
{
    if ($details === null || $details === []) return null;
    $forbidden = ['cpf', 'cpf_raw', 'password', 'newpassword', 'stepuppassword', 'mfacode', 'stepupmfacode', 'recoverycode', 'token', 'turnstiletoken'];
    $clean = [];
    foreach ($details as $k => $v) {
        if (in_array(strtolower((string) $k), $forbidden, true)) continue;
        $clean[$k] = $v;
    }
    if ($clean === []) return null;
    $encoded = json_encode($clean, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    return is_string($encoded) ? $encoded : null;
}

function ajn_compute_audit_hash(
    string $prevHash,
    string $id,
    string $actorType,
    ?string $actorId,
    string $action,
    string $resource,
    ?string $resourceId,
    ?string $detailsJson,
    ?string $ip,
    ?string $ua,
    int $timestamp
): string {
    return hash('sha256', implode('|', [
        $prevHash,
        $id,
        $actorType,
        (string) ($actorId ?? ''),
        $action,
        $resource,
        (string) ($resourceId ?? ''),
        (string) ($detailsJson ?? ''),
        (string) ($ip ?? ''),
        (string) ($ua ?? ''),
        (string) $timestamp,
    ]));
}

function ajn_audit(PDO $db, string $actorType, ?string $actorId, string $action, string $resource, ?string $resourceId = null, ?array $details = null): void
{
    $id = ajn_uuid();
    $now = time();
    $ip = $_SERVER['REMOTE_ADDR'] ?? null;
    $ua = mb_substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 500);
    $detailsJson = ajn_sanitize_audit_details($details);

    $prevRow = ajn_fetch(
        $db,
        'SELECT entry_hash FROM audit_logs WHERE entry_hash IS NOT NULL AND NOT EXISTS (SELECT 1 FROM audit_logs a2 WHERE a2.prev_hash = audit_logs.entry_hash) ORDER BY timestamp DESC, id DESC LIMIT 1'
    );
    $prevHash = (string) ($prevRow['entry_hash'] ?? str_repeat('0', 64));
    $entryHash = ajn_compute_audit_hash($prevHash, $id, $actorType, $actorId, $action, $resource, $resourceId, $detailsJson, $ip, $ua, $now);

    ajn_exec($db,
        'INSERT INTO audit_logs (id,actor_id,actor_type,action,resource,resource_id,details_json,ip_address,user_agent,prev_hash,entry_hash,timestamp) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
        [$id, $actorId, $actorType, $action, $resource, $resourceId, $detailsJson, $ip, $ua, $prevHash, $entryHash, $now]
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

function ajn_allowed_origins(array $config): array
{
    $list = [$config['app_url'] ?? ''];
    if (is_array($config['cors_allowed_origins'] ?? null)) {
        $list = array_merge($list, $config['cors_allowed_origins']);
    }
    $out = [];
    foreach ($list as $origin) {
        if (!is_string($origin)) continue;
        $norm = rtrim(trim($origin), '/');
        if ($norm !== '' && !in_array($norm, $out, true)) {
            $out[] = $norm;
        }
    }
    return $out;
}

function ajn_require_origin(array $config): void
{
    $secFetchSite = strtolower(trim((string) ($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '')));
    if ($secFetchSite !== '' && !in_array($secFetchSite, ['same-origin', 'none'], true)) {
        ajn_json(['error' => 'Requisição cross-site bloqueada.'], 403);
    }
    $expected = rtrim($config['app_url'] ?? '', '/');
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if (!is_string($origin)) {
        ajn_json(['error' => 'Origem não autorizada.'], 403);
    }
    $normalizedOrigin = rtrim(trim($origin), '/');
    $matched = false;
    foreach (ajn_allowed_origins($config) as $allowed) {
        if (hash_equals($allowed, $normalizedOrigin)) {
            $matched = true;
            break;
        }
    }
    if (!$matched && !hash_equals($expected, $origin)) {
        ajn_json(['error' => 'Origem não autorizada.'], 403);
    }
    if (PHP_SAPI !== 'cli' && $normalizedOrigin !== '') {
        header('Access-Control-Allow-Origin: ' . $normalizedOrigin);
        header('Access-Control-Allow-Credentials: true');
    }
}

function ajn_csrf_token(string $sessionTokenHash, array $config = []): string
{
    $key = (string) ($config['encryption_key'] ?? ($GLOBALS['__ajn_active_config']['encryption_key'] ?? AJN_SESSION_COOKIE));
    return hash_hmac('sha256', 'csrf:' . $sessionTokenHash, $key);
}

function ajn_require_csrf(array $user, array $config = [], ?array $body = null): void
{
    $sessionHash = (string) ($user['session_token_hash'] ?? '');
    if ($sessionHash === '') {
        ajn_json(['error' => 'Token CSRF inválido ou ausente.'], 403);
    }
    $provided = trim((string) ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? ($body['csrfToken'] ?? '')));
    $expected = ajn_csrf_token($sessionHash, $config);
    if ($provided === '' || !hash_equals($expected, $provided)) {
        ajn_json(['error' => 'Token CSRF inválido ou ausente.'], 403);
    }
}

function ajn_check_anti_abuse(array $input, int $minSeconds = 2): void
{
    $honeypot = trim((string) ($input['website'] ?? ($input['company_website'] ?? '')));
    if ($honeypot !== '') {
        ajn_json(['error' => 'Não foi possível processar sua solicitação.'], 400);
    }
    if (isset($input['formStartedAt']) && $input['formStartedAt'] !== '' && $input['formStartedAt'] !== null) {
        $raw = (int) $input['formStartedAt'];
        if ($raw > 0) {
            $nowMs = (int) round(microtime(true) * 1000);
            $startedMs = $raw < 10000000000 ? ($raw * 1000) : $raw;
            $elapsedMs = $nowMs - $startedMs;
            if ($elapsedMs < ($minSeconds * 1000) || $elapsedMs > 86400000) {
                ajn_json(['error' => 'Preenchimento muito rápido ou inválido. Aguarde alguns segundos e tente novamente.'], 400);
            }
        }
    }
}

if (!function_exists('ajn_verify_turnstile')) {
function ajn_verify_turnstile(array $config, mixed $token, ?string $expectedAction = null): void
{
    $secret = trim((string) ($config['turnstile_secret_key'] ?? ''));
    $env = strtolower(trim((string) ($config['environment'] ?? 'production')));
    if ($secret === '' || strlen($secret) < 10 || ($env === 'production' && preg_match('/^[123]x/i', $secret) === 1)) {
        ajn_json(['error' => 'Verificação antispam ainda não configurada.'], 503);
    }
    if (!is_string($token) || strlen(trim($token)) < 10 || strlen($token) > 2048) {
        ajn_json(['error' => 'Conclua a verificação antispam antes de enviar.'], 400);
    }
    $token = trim($token);
    if ($env === 'production' && ($token === 'XXXX.DUMMY.TOKEN.XXXX' || stripos($token, 'DUMMY.TOKEN') !== false)) {
        ajn_json(['error' => 'Verificação antispam inválida ou expirada.'], 400);
    }
    if ($env !== 'production') {
        if ($secret === '1x0000000000000000000000000000000AA') {
            if ($token === 'invalid-token' || str_starts_with($token, 'invalid')) {
                ajn_json(['error' => 'Verificação antispam inválida ou expirada.'], 400);
            }
            return;
        }
        if ($secret === '2x0000000000000000000000000000000AA' || preg_match('/^[23]x/i', $secret) === 1) {
            ajn_json(['error' => 'Verificação antispam inválida ou expirada.'], 400);
        }
    }
    if (!function_exists('curl_init')) {
        ajn_json(['error' => 'Verificação antispam ainda não configurada.'], 503);
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
    if ($expectedAction !== null && isset($verification['action']) && (string) $verification['action'] !== '') {
        if (!hash_equals($expectedAction, (string) $verification['action'])) {
            ajn_json(['error' => 'Ação antispam inválida.'], 400);
        }
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
        'SELECT u.id,u.name,u.email,u.role,u.is_active,u.mfa_enabled,u.mfa_required,u.mfa_secret,u.mfa_last_counter,u.password_hash,s.id AS session_id,s.session_token_hash,s.expires_at,s.absolute_expires_at,s.step_up_until FROM admin_sessions s JOIN admin_users u ON u.id=s.user_id WHERE s.session_token_hash=? AND s.expires_at>? AND s.absolute_expires_at>? LIMIT 1',
        [$hash, $now, $now]
    );
    if (!$row || !hash_equals((string) ($row['session_token_hash'] ?? ''), $hash)) return null;
    if (!(int) $row['is_active'] || !(int) ($row['mfa_enabled'] ?? 0) || !(int) ($row['mfa_required'] ?? 0) || empty($row['mfa_secret'])) {
        ajn_exec($db, 'DELETE FROM admin_sessions WHERE session_token_hash=?', [$hash]);
        return null;
    }
    // expires_at e a janela de inatividade e desliza a cada uso, sempre limitada
    // pelo teto absoluto gravado na emissao da sessao.
    $next = min($now + AJN_SESSION_IDLE_SECONDS, (int) $row['absolute_expires_at']);
    if ($next > (int) $row['expires_at']) {
        ajn_exec($db, 'UPDATE admin_sessions SET expires_at=? WHERE session_token_hash=?', [$next, $hash]);
    }
    $row['csrf_token'] = ajn_csrf_token($hash);
    if (PHP_SAPI !== 'cli') {
        header('X-CSRF-Token: ' . $row['csrf_token']);
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

function ajn_password_algo(): string|int
{
    return defined('PASSWORD_ARGON2ID') ? PASSWORD_ARGON2ID : PASSWORD_DEFAULT;
}

function ajn_password_options(): array
{
    if (defined('PASSWORD_ARGON2ID')) {
        return ['memory_cost' => 65536, 'time_cost' => 3, 'threads' => 1];
    }
    return ['cost' => 12];
}

function ajn_password_hash(string $password): string
{
    return password_hash($password, ajn_password_algo(), ajn_password_options());
}

function ajn_dummy_password_hash(): string
{
    static $hash = null;
    if (!is_string($hash)) {
        // Hash Argon2id valido com os mesmos parametros de ajn_password_options() (m=65536,t=3,p=1).
        $baseline = '$argon2id$v=19$m=65536,t=3,p=1$VWtlZkpodEtWTEl4a1FMUw$1ekwnPtcb7GFrkRlnFniXfdBydfu15hucXcXKQE28G4';
        $hash = ajn_password_needs_rehash($baseline)
            ? ajn_password_hash('ajn-constant-time-dummy-' . bin2hex(random_bytes(8)))
            : $baseline;
    }
    return $hash;
}

function ajn_password_needs_rehash(string $hash): bool
{
    return password_needs_rehash($hash, ajn_password_algo(), ajn_password_options());
}

function ajn_user_public(array $user): array
{
    return [
        'id' => $user['id'], 'name' => $user['name'], 'email' => $user['email'],
        'role' => $user['role'], 'mfaEnabled' => (bool) ($user['mfa_enabled'] ?? false),
        'mfaRequired' => (bool) ($user['mfa_required'] ?? false),
    ];
}

function ajn_issue_session(PDO $db, array $user, ?int $stepUpUntil = null): string
{
    $prevToken = $_COOKIE[AJN_SESSION_COOKIE] ?? '';
    if (is_string($prevToken) && preg_match('/^[a-f0-9]{64}$/D', $prevToken)) {
        ajn_exec($db, 'DELETE FROM admin_sessions WHERE session_token_hash=?', [hash('sha256', $prevToken)]);
    }
    $token = bin2hex(random_bytes(32));
    $hash = hash('sha256', $token);
    $now = time();
    $absolute = $now + AJN_SESSION_ABSOLUTE_SECONDS;
    ajn_exec($db,
        'INSERT INTO admin_sessions (id,user_id,session_token_hash,role,ip_address,user_agent,expires_at,absolute_expires_at,step_up_until,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
        [ajn_uuid(), $user['id'], $hash, $user['role'], $_SERVER['REMOTE_ADDR'] ?? null, mb_substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 500), $now + AJN_SESSION_IDLE_SECONDS, $absolute, $stepUpUntil, $now]
    );
    setcookie(AJN_SESSION_COOKIE, $token, [
        'expires' => $absolute, 'path' => '/', 'secure' => true,
        'httponly' => true, 'samesite' => 'Strict',
    ]);
    $_COOKIE[AJN_SESSION_COOKIE] = $token;
    $csrf = ajn_csrf_token($hash);
    if (PHP_SAPI !== 'cli') {
        header('X-CSRF-Token: ' . $csrf);
    }
    return $csrf;
}

function ajn_rotate_session(PDO $db, array &$user, ?int $stepUpUntil = null): string
{
    if (!empty($user['session_token_hash'])) {
        ajn_exec($db, 'DELETE FROM admin_sessions WHERE session_token_hash=?', [(string) $user['session_token_hash']]);
    }
    $csrf = ajn_issue_session($db, $user, $stepUpUntil);
    $user['session_token_hash'] = hash('sha256', (string) ($_COOKIE[AJN_SESSION_COOKIE] ?? ''));
    $user['csrf_token'] = $csrf;
    $user['step_up_until'] = $stepUpUntil;
    return $csrf;
}

function ajn_generate_recovery_codes(PDO $db, string $userId, int $count = 8): array
{
    ajn_exec($db, 'DELETE FROM admin_recovery_codes WHERE user_id=?', [$userId]);
    $now = time();
    $codes = [];
    for ($i = 0; $i < $count; $i++) {
        $raw = strtoupper(bin2hex(random_bytes(6)));
        $formatted = substr($raw, 0, 4) . '-' . substr($raw, 4, 4) . '-' . substr($raw, 8, 4);
        $codes[] = $formatted;
        ajn_exec(
            $db,
            'INSERT INTO admin_recovery_codes (id,user_id,code_hash,used_at,created_at) VALUES (?,?,?,NULL,?)',
            [ajn_uuid(), $userId, hash('sha256', $raw), $now]
        );
    }
    return $codes;
}

function ajn_consume_recovery_code(PDO $db, string $userId, string $rawCode): bool
{
    $normalized = strtoupper((string) preg_replace('/[^A-Za-z0-9]/', '', $rawCode));
    if (strlen($normalized) < 8) return false;
    $candidateHash = hash('sha256', $normalized);
    $rows = ajn_list($db, 'SELECT id,code_hash FROM admin_recovery_codes WHERE user_id=? AND used_at IS NULL', [$userId]);
    $matchedId = null;
    foreach ($rows as $row) {
        if (hash_equals((string) $row['code_hash'], $candidateHash)) {
            $matchedId = (string) $row['id'];
        }
    }
    if ($matchedId === null) return false;
    $updated = ajn_exec($db, 'UPDATE admin_recovery_codes SET used_at=? WHERE id=? AND used_at IS NULL', [time(), $matchedId]);
    return $updated === 1;
}

function ajn_verify_mfa_or_recovery(PDO $db, array $user, array $config, mixed $code, string &$failureReason = 'AUTH_MFA_FAILED'): bool
{
    if (!is_string($code) || trim($code) === '') {
        $failureReason = 'AUTH_MFA_REQUIRED';
        return false;
    }
    $trimmed = trim($code);
    if (preg_match('/^\d{6}$/D', $trimmed)) {
        $secret = ajn_decrypt((string) ($user['mfa_secret'] ?? ''), $config);
        $counter = $secret === '' ? null : ajn_totp($secret, 1, $trimmed);
        $consumed = $counter === null ? 0 : ajn_exec($db,
            'UPDATE admin_users SET mfa_last_counter=?,updated_at=? WHERE id=? AND (mfa_last_counter IS NULL OR mfa_last_counter < ?)',
            [$counter, time(), $user['id'], $counter]
        );
        if ($counter === null || $consumed !== 1) {
            $failureReason = $counter === null ? 'AUTH_MFA_FAILED' : 'AUTH_MFA_REPLAY_BLOCKED';
            return false;
        }
        return true;
    }
    if (ajn_consume_recovery_code($db, (string) $user['id'], $trimmed)) {
        ajn_audit($db, 'admin', (string) $user['id'], 'AUTH_RECOVERY_CODE_USED', 'auth', (string) $user['id']);
        return true;
    }
    $failureReason = 'AUTH_MFA_FAILED';
    return false;
}

function ajn_require_step_up(PDO $db, array &$admin, array $config, ?array $body = null): void
{
    $now = time();
    $stepUpPassword = $body['stepUpPassword'] ?? ($_SERVER['HTTP_X_STEP_UP_PASSWORD'] ?? null);
    $stepUpMfa = $body['stepUpMfaCode'] ?? ($body['stepUpRecoveryCode'] ?? ($_SERVER['HTTP_X_STEP_UP_MFA'] ?? null));

    if (is_string($stepUpPassword) && $stepUpPassword !== '' && is_string($stepUpMfa) && trim($stepUpMfa) !== '') {
        $userRow = ajn_fetch($db, 'SELECT * FROM admin_users WHERE id=? AND is_active=1 LIMIT 1', [$admin['id']]);
        if (!$userRow || !password_verify($stepUpPassword, (string) $userRow['password_hash'])) {
            ajn_audit($db, 'admin', (string) $admin['id'], 'AUTH_STEP_UP_FAILED', 'auth', (string) $admin['id']);
            ajn_json(['error' => 'Falha na confirmação step-up (senha inválida).', 'stepUpRequired' => true], 403);
        }
        $reason = 'AUTH_MFA_FAILED';
        if (!ajn_verify_mfa_or_recovery($db, $userRow, $config, $stepUpMfa, $reason)) {
            ajn_audit($db, 'admin', (string) $admin['id'], $reason, 'auth', (string) $admin['id']);
            ajn_json(['error' => 'Falha na confirmação step-up (código MFA inválido ou reutilizado).', 'stepUpRequired' => true], 403);
        }
        ajn_rotate_session($db, $admin, $now + AJN_STEP_UP_SECONDS);
        ajn_audit($db, 'admin', (string) $admin['id'], 'AUTH_STEP_UP_VERIFIED', 'auth', (string) $admin['id']);
        return;
    }

    if ((int) ($admin['step_up_until'] ?? 0) > $now) {
        return;
    }

    ajn_json(['error' => 'Confirmação de segurança (step-up: senha + TOTP) obrigatória para esta ação.', 'stepUpRequired' => true], 403);
}

/**
 * Devolve o contador TOTP que validou o codigo, ou null quando nenhum serve.
 * O contador e necessario para que o chamador recuse reapresentacao do mesmo
 * codigo dentro da janela de tolerancia.
 */
function ajn_totp(string $secret, int $window = 1, ?string $code = null): ?int
{
    if ($code === null || !preg_match('/^\d{6}$/D', $code)) return null;
    $window = max(0, min(1, $window));
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

function ajn_all_encryption_keys(array $config): array
{
    $keys = [];
    $primary = @hex2bin((string) ($config['encryption_key'] ?? ''));
    if (is_string($primary) && strlen($primary) === 32) {
        $keys[] = $primary;
    }
    if (is_array($config['previous_encryption_keys'] ?? null)) {
        foreach ($config['previous_encryption_keys'] as $hexKey) {
            if (!is_string($hexKey)) continue;
            $bin = @hex2bin($hexKey);
            if (is_string($bin) && strlen($bin) === 32) {
                $keys[] = $bin;
            }
        }
    }
    return $keys;
}

function ajn_decrypt_single_key(string $value, string $key): ?string
{
    if (str_starts_with($value, 's1:')) {
        if (!function_exists('sodium_crypto_secretbox_open')) return null;
        $binary = base64_decode(substr($value, 3), true);
        if (!is_string($binary) || strlen($binary) <= SODIUM_CRYPTO_SECRETBOX_NONCEBYTES) return null;
        $nonce = substr($binary, 0, SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
        $cipher = substr($binary, SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
        $plain = sodium_crypto_secretbox_open($cipher, $nonce, $key);
        return is_string($plain) ? $plain : null;
    }
    $rawB64 = str_starts_with($value, 'g1:') ? substr($value, 3) : $value;
    $binary = base64_decode($rawB64, true);
    if (!is_string($binary) || strlen($binary) < 29) return null;
    $iv = substr($binary, 0, 12);
    $tag = substr($binary, 12, 16);
    $plain = openssl_decrypt(substr($binary, 28), 'aes-256-gcm', $key, OPENSSL_RAW_DATA, $iv, $tag);
    return is_string($plain) ? $plain : null;
}

function ajn_decrypt(string $value, array $config): string
{
    // Suporta libsodium secretbox (s1:) e AES-256-GCM legado, com rotacao de chaves.
    $keys = ajn_all_encryption_keys($config);
    if ($keys === []) return '';
    foreach ($keys as $key) {
        $plain = ajn_decrypt_single_key($value, $key);
        if ($plain !== null) return $plain;
    }
    return '';
}

function ajn_encrypt(string $value, array $config): string
{
    $key = @hex2bin((string) ($config['encryption_key'] ?? ''));
    if (!is_string($key) || strlen($key) !== 32) throw new RuntimeException('Encryption key missing.');
    if (function_exists('sodium_crypto_secretbox')) {
        $nonce = random_bytes(SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
        $encrypted = sodium_crypto_secretbox($value, $nonce, $key);
        return 's1:' . base64_encode($nonce . $encrypted);
    }
    $iv = random_bytes(12);
    $tag = '';
    $encrypted = openssl_encrypt($value, 'aes-256-gcm', $key, OPENSSL_RAW_DATA, $iv, $tag);
    if (!is_string($encrypted)) throw new RuntimeException('Encryption failed.');
    return base64_encode($iv . $tag . $encrypted);
}

function ajn_needs_reencrypt(string $value, array $config): bool
{
    $primary = @hex2bin((string) ($config['encryption_key'] ?? ''));
    if (!is_string($primary) || strlen($primary) !== 32) return false;
    if (function_exists('sodium_crypto_secretbox') && !str_starts_with($value, 's1:')) return true;
    return ajn_decrypt_single_key($value, $primary) === null;
}

function ajn_mask_phone(string $phone): string
{
    $digits = preg_replace('/\D+/', '', $phone) ?? '';
    if (strlen($digits) < 4) return '(**) *****-****';
    return '(**) *****-' . substr($digits, -4);
}

function ajn_decrypt_pii(?string $encrypted, string $fallback, array $config): string
{
    if (is_string($encrypted) && $encrypted !== '') {
        $plain = ajn_decrypt($encrypted, $config);
        if ($plain !== '') return $plain;
    }
    return $fallback;
}

function ajn_security_alert(PDO $db, array $config, string $event, string $summary, string|array|null $resourceId = null, array $details = []): void
{
    if (is_array($resourceId)) {
        $details = $resourceId;
        $resourceId = isset($details['user_id']) ? (string) $details['user_id'] : (isset($details['actor_id']) ? (string) $details['actor_id'] : null);
    }
    $mergedDetails = array_merge(['summary' => $summary], $details);
    ajn_audit($db, 'system', null, 'SECURITY_ALERT', $event, $resourceId, $mergedDetails);
    $recipient = trim((string) ($config['security_alert_email'] ?? ($config['smtp']['from'] ?? ($config['smtp']['from_email'] ?? ''))));
    if ($recipient !== '' && filter_var($recipient, FILTER_VALIDATE_EMAIL)) {
        $ref = $resourceId ?? 'n/a';
        $subject = '[ALERTA DE SEGURANCA AJN] ' . $event;
        $body = "Alerta de seguranca AJN Carreiras\n\nEvento: $event\nRecurso ID: $ref\nResumo: $summary\nData (UTC): " . gmdate('c');
        $contextJson = ajn_sanitize_audit_details($mergedDetails);
        try {
            ajn_exec(
                $db,
                'INSERT INTO security_alert_queue (id,event_type,recipient_email,subject,body,context_json,status,attempts,created_at) VALUES (?,?,?,?,?,?,?,?,?)',
                [ajn_uuid(), $event, $recipient, $subject, $body, $contextJson, 'pending', 0, time()]
            );
        } catch (Throwable) {
            // Se a migration 006 ainda nao estiver aplicada, registra apenas na auditoria sem bloquear a requisicao.
        }
    }
}

function ajn_process_security_alert_queue(PDO $db, array $config, int $limit = 50, bool $dryRun = false): array
{
    $limit = max(1, min(500, $limit));
    $rows = ajn_list(
        $db,
        "SELECT * FROM security_alert_queue WHERE status='pending' AND attempts < 5 ORDER BY created_at ASC LIMIT ?",
        [$limit]
    );
    if ($dryRun) {
        return ['pending' => count($rows), 'sent' => 0, 'failed' => 0, 'items' => $rows];
    }
    $sent = 0;
    $failed = 0;
    $now = time();
    foreach ($rows as $row) {
        $ok = @ajn_send_email($config, (string) $row['recipient_email'], (string) $row['subject'], (string) $row['body']);
        $attempts = ((int) ($row['attempts'] ?? 0)) + 1;
        if ($ok) {
            ajn_exec(
                $db,
                "UPDATE security_alert_queue SET status='sent',attempts=?,sent_at=?,last_error=NULL WHERE id=?",
                [$attempts, $now, $row['id']]
            );
            $sent++;
        } else {
            $newStatus = $attempts >= 5 ? 'failed' : 'pending';
            ajn_exec(
                $db,
                'UPDATE security_alert_queue SET status=?,attempts=?,last_error=? WHERE id=?',
                [$newStatus, $attempts, 'Falha no envio SMTP', $row['id']]
            );
            $failed++;
        }
    }
    return ['pending' => count($rows), 'sent' => $sent, 'failed' => $failed];
}

function ajn_email_configured(array $config): bool
{
    $smtp = $config['smtp'] ?? null;
    if (!is_array($smtp)) return false;
    $from = $smtp['from'] ?? ($smtp['from_email'] ?? null);
    foreach ([$smtp['host'] ?? null, $smtp['username'] ?? null, $smtp['password'] ?? null, $from] as $val) {
        if (!is_string($val) || trim($val) === '' || str_starts_with($val, 'SUBSTITUIR_') || str_starts_with($val, 'SUBSTITUA_')) return false;
    }
    return filter_var($from, FILTER_VALIDATE_EMAIL) !== false &&
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
    $from = trim((string) ($smtp['from'] ?? ($smtp['from_email'] ?? '')));
    if ($host === '' || preg_match('/[\r\n\0\s]/', $host) || preg_match('/[\r\n\0]/', $recipient . $subject . $from)) {
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
            !ajn_smtp_command($socket, 'MAIL FROM:<' . $from . '>', [250]) ||
            !ajn_smtp_command($socket, 'RCPT TO:<' . $recipient . '>', [250, 251]) ||
            !ajn_smtp_command($socket, 'DATA', [354])) return false;
        $safeBody = str_replace(["\r\n", "\r", "\n"], "\r\n", $body);
        $safeBody = preg_replace('/^\./m', '..', $safeBody) ?? $safeBody;
        $message = 'From: AJN Carreiras <' . $from . ">\r\n" .
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

if (!function_exists('ajn_maintenance_flag_path')) {
    function ajn_maintenance_flag_path(array $config): string
    {
        $configured = $config['maintenance_flag_path'] ?? null;
        if (is_string($configured) && trim($configured) !== '') {
            return trim($configured);
        }
        return __DIR__ . '/maintenance.flag';
    }
}

if (!function_exists('ajn_is_maintenance_active')) {
    function ajn_is_maintenance_active(array $config): bool
    {
        $flagPath = ajn_maintenance_flag_path($config);
        clearstatcache(true, $flagPath);
        return is_file($flagPath);
    }
}

if (!function_exists('ajn_enforce_maintenance_mode')) {
    function ajn_enforce_maintenance_mode(array $config, string $path): void
    {
        if (!ajn_is_maintenance_active($config)) {
            return;
        }
        $isApi = $path === '/api' || str_starts_with($path, '/api/');
        $isAdmin = $path === '/admin' || str_starts_with($path, '/admin/');
        if (!$isApi && !$isAdmin) {
            return;
        }
        $retryAfter = max(60, (int) ($config['maintenance_retry_after'] ?? 300));
        header('Retry-After: ' . $retryAfter);
        header('Cache-Control: no-store, max-age=0');
        header('X-Robots-Tag: noindex, nofollow');
        if ($isAdmin) {
            http_response_code(503);
            header('Content-Type: text/html; charset=utf-8');
            echo '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><title>Manutenção programada | AJN Carreiras</title></head><body><main><h1>Sistema em manutenção programada</h1><p>O painel administrativo de carreiras está temporariamente em manutenção. Tente novamente em alguns minutos.</p></main></body></html>';
            exit;
        }
        ajn_json(['error' => 'Sistema em manutenção programada. Tente novamente em instantes.'], 503);
    }
}

if (!function_exists('ajn_cli_config_path')) {
    function ajn_cli_config_path(): string
    {
        if (PHP_SAPI === 'cli') {
            $envPath = getenv('AJN_CONFIG_PATH');
            if (is_string($envPath) && $envPath !== '') {
                return $envPath;
            }
        }
        return __DIR__ . '/config.php';
    }
}

if (!function_exists('ajn_config')) {
    function ajn_config(): array
    {
        $configFile = ajn_cli_config_path();
        if (!is_file($configFile)) {
            if (PHP_SAPI === 'cli') {
                fwrite(STDERR, "Instale config.php privado ou defina AJN_CONFIG_PATH.\n");
                exit(1);
            }
            ajn_json(['error' => 'Configuração privada ausente.'], 503);
        }
        $cfg = require $configFile;
        if (!is_array($cfg)) {
            if (PHP_SAPI === 'cli') {
                fwrite(STDERR, "Configuração privada inválida.\n");
                exit(1);
            }
            ajn_json(['error' => 'Configuração do ambiente inválida.'], 503);
        }
        return $cfg;
    }
}

if (!defined('AJN_DISABLE_AUTO_DISPATCH')) {
    $configFile = __DIR__ . '/config.php';
    if (!is_file($configFile)) ajn_json(['error' => 'Configuração privada ausente.'], 503);
    $config = require $configFile;
    if (!is_array($config) || !filter_var($config['app_url'] ?? null, FILTER_VALIDATE_URL) || !str_starts_with($config['app_url'], 'https://')) {
        ajn_json(['error' => 'Configuração do ambiente inválida.'], 503);
    }
    $GLOBALS['__ajn_active_config'] = $config;

    $requestPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
    if (is_string($requestPath)) {
        ajn_enforce_maintenance_mode($config, $requestPath);
    }

    try {
        $db = ajn_pdo($config);
        require __DIR__ . '/app.php';
    } catch (Throwable $error) {
        error_log('[AJN_CAREIRAS] ' . get_class($error));
        ajn_json(['error' => 'Serviço temporariamente indisponível.'], 503);
    }
}
