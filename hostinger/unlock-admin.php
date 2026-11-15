<?php
declare(strict_types=1);

// Desbloqueio administrativo de conta e locks por IP (somente CLI, auditado).
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

define('AJN_DISABLE_AUTO_DISPATCH', true);
require_once __DIR__ . '/bootstrap.php';

$configFile = getenv('AJN_CONFIG_PATH') ?: (__DIR__ . '/config.php');
$config = is_file($configFile) ? require $configFile : null;

$options = getopt('', ['email::', 'reason::']);
$rawEmail = $options['email'] ?? getenv('AJN_ADMIN_EMAIL');
if ((!is_string($rawEmail) || trim($rawEmail) === '') && !function_exists('system')) {
    fwrite(STDERR, "Aviso: system() indisponivel; informe --email ou AJN_ADMIN_EMAIL.\n");
}
$email = is_string($rawEmail) ? mb_strtolower(trim($rawEmail), 'UTF-8') : '';
$reason = is_string($options['reason'] ?? null) && trim((string) $options['reason']) !== ''
    ? trim((string) $options['reason'])
    : 'Desbloqueio administrativo via CLI';

if (!is_array($config) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    fwrite(STDERR, "Uso: php hostinger/unlock-admin.php --email=\"admin@ajn.com.br\" [--reason=\"Motivo\"]\n");
    exit(1);
}

$db = ajn_pdo($config);
$user = ajn_fetch(
    $db,
    'SELECT id, email, name, failed_attempts, locked_until FROM admin_users WHERE lower(email) = ? LIMIT 1',
    [$email]
);

if (!$user) {
    fwrite(STDERR, "Erro: Operador {$email} nao encontrado.\n");
    exit(1);
}

$clearedIpLocks = 0;
try {
    $row = ajn_fetch($db, 'SELECT COUNT(*) AS total FROM admin_login_locks WHERE user_id = ?', [$user['id']]);
    $clearedIpLocks = (int) ($row['total'] ?? 0);
    ajn_exec($db, 'DELETE FROM admin_login_locks WHERE user_id = ?', [$user['id']]);
} catch (Throwable) {
    $clearedIpLocks = 0;
}

ajn_exec(
    $db,
    'UPDATE admin_users SET failed_attempts = 0, locked_until = NULL, updated_at = ? WHERE id = ?',
    [time(), $user['id']]
);

ajn_audit(
    $db,
    'system',
    (string) $user['id'],
    'ADMIN_USER_UNLOCKED',
    'admin_users',
    (string) $user['id'],
    [
        'source' => 'cli',
        'reason' => $reason,
        'previous_failed_attempts' => (int) ($user['failed_attempts'] ?? 0),
        'previous_locked_until' => $user['locked_until'] !== null ? (int) $user['locked_until'] : null,
        'cleared_ip_locks' => $clearedIpLocks,
    ]
);

fwrite(STDOUT, json_encode([
    'ok' => true,
    'email' => $user['email'],
    'userId' => $user['id'],
    'clearedIpLocks' => $clearedIpLocks,
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n");
