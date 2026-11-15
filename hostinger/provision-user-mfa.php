<?php
declare(strict_types=1);

// Ativação controlada de um operador já cadastrado no painel administrativo.
// Executar somente por SSH/CLI, fora de public_html.
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

define('AJN_DISABLE_AUTO_DISPATCH', true);
require_once __DIR__ . '/bootstrap.php';

$configFile = __DIR__ . '/config.php';
$config = is_file($configFile) ? require $configFile : null;
$rawEmail = getenv('AJN_ADMIN_EMAIL');
$email = is_string($rawEmail) ? mb_strtolower(trim($rawEmail), 'UTF-8') : '';
$rotate = getenv('AJN_MFA_ROTATE') === '1';

if (!is_array($config) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    fwrite(STDERR, "Defina AJN_ADMIN_EMAIL e instale config.php privado.\n");
    exit(1);
}
$key = hex2bin($config['encryption_key'] ?? '');
if (!is_string($key) || strlen($key) !== 32) {
    fwrite(STDERR, "Configure uma encryption_key válida antes de provisionar MFA.\n");
    exit(1);
}

$db = null;
try {
    $db = ajn_pdo($config);
    $db->beginTransaction();

    $allowedRoles = $rotate ? ['recruiter', 'viewer', 'dpo', 'super_admin'] : ['recruiter', 'viewer', 'dpo'];
    $statement = $db->prepare('SELECT id,role,mfa_enabled FROM admin_users WHERE email=? LIMIT 1');
    $statement->execute([$email]);
    $user = $statement->fetch(PDO::FETCH_ASSOC);
    if (!is_array($user) || !in_array($user['role'] ?? '', $allowedRoles, true)) {
        throw new RuntimeException('Operador não encontrado ou perfil não elegível para esta operação.');
    }
    if (!$rotate && (int) ($user['mfa_enabled'] ?? 0) !== 0) {
        throw new RuntimeException('MFA já ativado. Defina AJN_MFA_ROTATE=1 para rotacionar o segredo.');
    }

    $secret = ajn_base32_encode(random_bytes(20));
    $cipher = ajn_encrypt($secret, $config);
    $sql = 'UPDATE admin_users SET mfa_enabled=1,mfa_required=1,mfa_secret=?,mfa_last_counter=NULL,is_active=1,updated_at=? WHERE id=?'
        . ($rotate ? '' : ' AND mfa_enabled=0');
    $update = $db->prepare($sql);
    $update->execute([$cipher, time(), $user['id']]);
    if ($update->rowCount() !== 1) {
        throw new RuntimeException('Conta foi alterada durante o provisionamento.');
    }

    // Invalida sessões ativas para exigir reautenticação com o novo segredo MFA.
    ajn_exec($db, 'DELETE FROM admin_sessions WHERE user_id=?', [$user['id']]);
    $recoveryCodes = ajn_generate_recovery_codes($db, (string) $user['id'], 8);
    ajn_audit($db, 'system', $user['id'], $rotate ? 'admin.mfa_rotated' : 'admin.mfa_provisioned', 'admin_users', $user['id']);
    $db->commit();
    ajn_security_alert($db, $config, 'ADMIN_MFA_PROVISIONED', $rotate ? 'MFA de administrador rotacionado via CLI.' : 'MFA de administrador provisionado via CLI.', ['user_id' => $user['id'], 'email' => $email, 'rotate' => $rotate]);

    $actionMsg = $rotate ? 'MFA rotacionado e sessões anteriores encerradas.' : 'MFA provisionado.';
    fwrite(STDOUT, $actionMsg . " Entregue o QR/URI somente ao operador, por canal seguro. A URI não será exibida novamente:\n");
    fwrite(STDOUT, 'otpauth://totp/AJN%20Carreiras:' . rawurlencode($email) . '?secret=' . $secret . "&issuer=AJN%20Engenharia\n");
    fwrite(STDOUT, "Códigos de recuperação de uso único (guarde em cofre seguro):\n" . implode("\n", $recoveryCodes) . "\n");
} catch (Throwable $error) {
    if ($db instanceof PDO && $db->inTransaction()) {
        $db->rollBack();
    }
    fwrite(STDERR, 'Falha no provisionamento: ' . get_class($error) . "\n");
    exit(1);
}
