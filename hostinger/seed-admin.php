<?php
declare(strict_types=1);

// Uso exclusivo de CLI em ambiente isolado: primeiro administrador com MFA.
// NUNCA disponibilizar este arquivo pela web e nunca comitar credenciais.
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

$configFile = __DIR__ . '/config.php';
$config = is_file($configFile) ? require $configFile : null;
$email = getenv('AJN_ADMIN_EMAIL');
$name = getenv('AJN_ADMIN_NAME');
$password = getenv('AJN_ADMIN_INITIAL_PASSWORD');
if (!is_array($config) || !is_string($email) || !filter_var($email, FILTER_VALIDATE_EMAIL) ||
    !is_string($name) || strlen($name) < 3 || !is_string($password) || strlen($password) < 16) {
    fwrite(STDERR, "Configuração inválida. Informe AJN_ADMIN_EMAIL, AJN_ADMIN_NAME e AJN_ADMIN_INITIAL_PASSWORD (mínimo 16 caracteres) por variáveis de ambiente.\n");
    exit(1);
}
$secretKey = hex2bin($config['encryption_key'] ?? '');
if (!is_string($secretKey) || strlen($secretKey) !== 32) {
    fwrite(STDERR, "Configure encryption_key com 32 bytes hexadecimais antes de continuar.\n");
    exit(1);
}

function ajn_seed_base32(string $binary): string
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

$dbc = $config['database'] ?? [];
try {
    $db = new PDO(
        'mysql:host=' . ($dbc['host'] ?? '') . ';port=' . (int) ($dbc['port'] ?? 3306) . ';dbname=' . ($dbc['name'] ?? '') . ';charset=utf8mb4',
        $dbc['username'] ?? '', $dbc['password'] ?? '',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_EMULATE_PREPARES => false]
    );
    $check = $db->prepare('SELECT id FROM admin_users WHERE email=? LIMIT 1');
    $check->execute([mb_strtolower($email)]);
    if ($check->fetch()) throw new RuntimeException('Já existe operador com este e-mail; não sobrescrever.');

    $totpSecret = ajn_seed_base32(random_bytes(20));
    $iv = random_bytes(12);
    $tag = '';
    $ciphertext = openssl_encrypt($totpSecret, 'aes-256-gcm', $secretKey, OPENSSL_RAW_DATA, $iv, $tag);
    if (!is_string($ciphertext)) throw new RuntimeException('Falha na criptografia de MFA.');
    $cipher = base64_encode($iv . $tag . $ciphertext);
    $rawId = bin2hex(random_bytes(16));
    $id = substr($rawId, 0, 8) . '-' . substr($rawId, 8, 4) . '-' . substr($rawId, 12, 4) . '-' . substr($rawId, 16, 4) . '-' . substr($rawId, 20);
    $now = time();
    $stmt = $db->prepare('INSERT INTO admin_users (id,name,email,password_hash,role,is_active,mfa_enabled,mfa_secret,mfa_required,created_at,updated_at) VALUES (?,?,?,?,?,1,1,?,1,?,?)');
    $stmt->execute([$id, trim($name), mb_strtolower($email), password_hash($password, PASSWORD_DEFAULT), 'super_admin', $cipher, $now, $now]);
    fwrite(STDOUT, "Administrador criado. Guarde imediatamente a URI MFA em cofre seguro; ela será exibida uma única vez:\n");
    fwrite(STDOUT, 'otpauth://totp/AJN%20Carreiras:' . rawurlencode($email) . '?secret=' . $totpSecret . "&issuer=AJN%20Engenharia\n");
} catch (Throwable $error) {
    fwrite(STDERR, 'Erro ao criar administrador: ' . get_class($error) . "\n");
    exit(1);
}
