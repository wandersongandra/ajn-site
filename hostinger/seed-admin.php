<?php
declare(strict_types=1);

// Uso exclusivo de CLI em ambiente isolado: primeiro administrador com MFA.
// NUNCA disponibilizar este arquivo pela web e nunca comitar credenciais.
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

define('AJN_DISABLE_AUTO_DISPATCH', true);
require_once __DIR__ . '/bootstrap.php';

$configFile = getenv('AJN_CONFIG_PATH') ?: (__DIR__ . '/config.php');
$config = is_file($configFile) ? require $configFile : null;
$rawEmail = getenv('AJN_ADMIN_EMAIL');
$rawName = getenv('AJN_ADMIN_NAME');
if (getenv('AJN_ADMIN_INITIAL_PASSWORD') !== false && getenv('AJN_ADMIN_INITIAL_PASSWORD') !== '') {
    fwrite(STDERR, "Por seguranca, nao passe AJN_ADMIN_INITIAL_PASSWORD na linha de comando. Forneca a senha pelo prompt oculto (stdin).\n");
    exit(1);
}
foreach (array_slice($argv ?? [], 1) as $arg) {
    if (str_contains((string) $arg, 'password')) {
        fwrite(STDERR, "Por seguranca, nao passe a senha como argumento de linha de comando. Use o prompt oculto (stdin).\n");
        exit(1);
    }
}
$isTty = function_exists('stream_isatty') ? @stream_isatty(STDIN) : false;
if ($isTty && DIRECTORY_SEPARATOR === '/') {
    fwrite(STDERR, 'Senha inicial do super_admin (min. 16 caracteres, oculta): ');
    @system('stty -echo');
    $rawPassword = fgets(STDIN);
    @system('stty echo');
    fwrite(STDERR, "\n");
} else {
    if ($isTty) {
        fwrite(STDERR, 'Senha inicial do super_admin (min. 16 caracteres): ');
    }
    $rawPassword = fgets(STDIN);
}
$password = is_string($rawPassword) ? rtrim($rawPassword, "\r\n") : '';
$email = is_string($rawEmail) ? mb_strtolower(trim($rawEmail), 'UTF-8') : '';
$name = is_string($rawName) ? trim($rawName) : '';

if (!is_array($config) || !filter_var($email, FILTER_VALIDATE_EMAIL) ||
    mb_strlen($name, 'UTF-8') < 3 || mb_strlen($name, 'UTF-8') > 150 ||
    !is_string($password) || strlen($password) < 16 || strlen($password) > 1024 || ajn_password_is_weak($password)) {
    fwrite(STDERR, "Configuração inválida. Informe AJN_ADMIN_EMAIL, AJN_ADMIN_NAME (3 a 150 caracteres) e forneça via STDIN uma senha de 16 a 1024 caracteres sem sequências fracas.\n");
    exit(1);
}
$secretKey = hex2bin($config['encryption_key'] ?? '');
if (!is_string($secretKey) || strlen($secretKey) !== 32) {
    fwrite(STDERR, "Configure encryption_key com 32 bytes hexadecimais antes de continuar.\n");
    exit(1);
}

$db = null;
try {
    $db = ajn_pdo($config);
    $db->beginTransaction();

    $check = $db->prepare('SELECT id FROM admin_users WHERE email=? LIMIT 1');
    $check->execute([$email]);
    if ($check->fetch()) {
        throw new RuntimeException('Já existe operador com este e-mail; não sobrescrever.');
    }

    $totpSecret = ajn_base32_encode(random_bytes(20));
    $cipher = ajn_encrypt($totpSecret, $config);
    $id = ajn_uuid();
    $now = time();

    $stmt = $db->prepare('INSERT INTO admin_users (id,name,email,password_hash,role,is_active,mfa_enabled,mfa_secret,mfa_required,created_at,updated_at) VALUES (?,?,?,?,?,1,1,?,1,?,?)');
    $stmt->execute([$id, $name, $email, ajn_password_hash($password), 'super_admin', $cipher, $now, $now]);
    $recoveryCodes = ajn_generate_recovery_codes($db, $id, 8);
    ajn_audit($db, 'system', $id, 'admin.seeded', 'admin_users', $id);
    $db->commit();

    fwrite(STDOUT, "Administrador criado. Guarde imediatamente a URI MFA em cofre seguro; ela será exibida uma única vez:\n");
    fwrite(STDOUT, 'otpauth://totp/AJN%20Carreiras:' . rawurlencode($email) . '?secret=' . $totpSecret . "&issuer=AJN%20Engenharia\n");
    fwrite(STDOUT, "Códigos de recuperação de uso único (guarde em cofre seguro):\n" . implode("\n", $recoveryCodes) . "\n");
} catch (Throwable $error) {
    if ($db instanceof PDO && $db->inTransaction()) {
        $db->rollBack();
    }
    fwrite(STDERR, 'Erro ao criar administrador: ' . get_class($error) . "\n");
    exit(1);
}
