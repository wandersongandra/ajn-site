<?php
declare(strict_types=1);

// Ativação controlada de um operador já cadastrado no painel administrativo.
// Executar somente por SSH/CLI, fora de public_html.
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

$configFile = __DIR__ . '/config.php';
$config = is_file($configFile) ? require $configFile : null;
$email = getenv('AJN_ADMIN_EMAIL');
if (!is_array($config) || !is_string($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    fwrite(STDERR, "Defina AJN_ADMIN_EMAIL e instale config.php privado.\n");
    exit(1);
}
$key = hex2bin($config['encryption_key'] ?? '');
if (!is_string($key) || strlen($key) !== 32) {
    fwrite(STDERR, "Configure uma encryption_key válida antes de provisionar MFA.\n");
    exit(1);
}

function ajn_provision_base32(string $binary): string
{
    $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    $bits = '';
    foreach (str_split($binary) as $char) $bits .= str_pad(decbin(ord($char)), 8, '0', STR_PAD_LEFT);
    $output = '';
    foreach (str_split($bits, 5) as $group) {
        $output .= $alphabet[bindec(str_pad($group, 5, '0', STR_PAD_RIGHT))];
    }
    return $output;
}

try {
    $dbc = $config['database'] ?? [];
    $db = new PDO(
        'mysql:host=' . ($dbc['host'] ?? '') . ';port=' . (int) ($dbc['port'] ?? 3306) . ';dbname=' . ($dbc['name'] ?? '') . ';charset=utf8mb4',
        $dbc['username'] ?? '', $dbc['password'] ?? '',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_EMULATE_PREPARES => false]
    );
    $statement = $db->prepare('SELECT id,mfa_enabled FROM admin_users WHERE email=? AND role IN (\'recruiter\',\'viewer\',\'dpo\') LIMIT 1');
    $statement->execute([mb_strtolower($email)]);
    $user = $statement->fetch(PDO::FETCH_ASSOC);
    if (!is_array($user) || (int) $user['mfa_enabled']) throw new RuntimeException('Operador não encontrado ou MFA já ativado.');

    $secret = ajn_provision_base32(random_bytes(20));
    $iv = random_bytes(12);
    $tag = '';
    $encrypted = openssl_encrypt($secret, 'aes-256-gcm', $key, OPENSSL_RAW_DATA, $iv, $tag);
    if (!is_string($encrypted)) throw new RuntimeException('Falha ao proteger segredo MFA.');
    $cipher = base64_encode($iv . $tag . $encrypted);
    $statement = $db->prepare('UPDATE admin_users SET mfa_enabled=1,mfa_required=1,mfa_secret=?,is_active=1,updated_at=? WHERE id=? AND mfa_enabled=0');
    $statement->execute([$cipher, time(), $user['id']]);
    if ($statement->rowCount() !== 1) throw new RuntimeException('Conta foi alterada durante o provisionamento.');
    fwrite(STDOUT, "MFA provisionado. Entregue o QR/URI somente ao operador, por canal seguro. A URI não será exibida novamente:\n");
    fwrite(STDOUT, 'otpauth://totp/AJN%20Carreiras:' . rawurlencode($email) . '?secret=' . $secret . "&issuer=AJN%20Engenharia\n");
} catch (Throwable $error) {
    fwrite(STDERR, 'Falha no provisionamento: ' . get_class($error) . "\n");
    exit(1);
}
