<?php
declare(strict_types=1);

// Uso exclusivo via CLI: migracao idempotente de dados legados (004 -> 005).
if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit("Este script só pode ser executado via CLI.\n");
}

define('AJN_DISABLE_AUTO_DISPATCH', true);
require_once __DIR__ . '/bootstrap.php';

$dryRun = in_array('--dry-run', $argv ?? [], true);
$config = ajn_config();
$db = ajn_pdo($config);
$now = time();

$reencryptedMfa = 0;
$encryptedPhones = 0;
$migratedTracking = 0;
$adminsWithoutMfa = [];

$db->beginTransaction();
try {
    // a) Recifrar segredos TOTP legados (AES-256-GCM base64) para libsodium secretbox (s1:)
    // e listar administradores sem MFA ativo antes do deploy.
    $admins = ajn_list($db, 'SELECT id, email, role, is_active, mfa_enabled, mfa_secret FROM admin_users ORDER BY created_at ASC');
    foreach ($admins as $admin) {
        $id = (string) $admin['id'];
        $secretCipher = (string) ($admin['mfa_secret'] ?? '');
        $mfaEnabled = (int) ($admin['mfa_enabled'] ?? 0) === 1;

        if (!$mfaEnabled || $secretCipher === '') {
            $adminsWithoutMfa[] = [
                'id' => $id,
                'email' => (string) $admin['email'],
                'role' => (string) $admin['role'],
                'is_active' => (int) ($admin['is_active'] ?? 0),
            ];
            continue;
        }

        if (!str_starts_with($secretCipher, 's1:')) {
            $plainSecret = ajn_decrypt($secretCipher, $config);
            if ($plainSecret === '') {
                throw new RuntimeException("Falha ao decifrar mfa_secret legado do admin ID {$id}.");
            }
            $newCipher = ajn_encrypt($plainSecret, $config);
            if (!$dryRun) {
                ajn_exec($db, 'UPDATE admin_users SET mfa_secret=?, updated_at=? WHERE id=?', [$newCipher, $now, $id]);
            }
            $reencryptedMfa++;
        }
    }

    // b) Cifrar telefones em texto claro para phone_encrypted (s1:) e mascarar a coluna antiga phone.
    $candidates = ajn_list($db, 'SELECT id, phone, phone_encrypted FROM candidates ORDER BY created_at ASC');
    foreach ($candidates as $cand) {
        $cid = (string) $cand['id'];
        $phone = (string) ($cand['phone'] ?? '');
        $phoneEncrypted = (string) ($cand['phone_encrypted'] ?? '');

        $needsEncrypt = ($phoneEncrypted === '' && $phone !== '' && !str_contains($phone, '*'));
        $needsReencrypt = ($phoneEncrypted !== '' && !str_starts_with($phoneEncrypted, 's1:'));
        $needsMask = ($phone !== '' && !str_contains($phone, '*'));

        if ($needsEncrypt || $needsReencrypt || $needsMask) {
            $rawPhone = $phoneEncrypted !== '' ? ajn_decrypt($phoneEncrypted, $config) : $phone;
            if ($rawPhone === '') {
                $rawPhone = $phone;
            }
            $newPhoneEncrypted = $rawPhone !== '' ? ajn_encrypt($rawPhone, $config) : $phoneEncrypted;
            $maskedPhone = ajn_mask_phone($rawPhone !== '' ? $rawPhone : $phone);
            if (!$dryRun) {
                ajn_exec(
                    $db,
                    'UPDATE candidates SET phone=?, phone_encrypted=?, updated_at=? WHERE id=?',
                    [$maskedPhone, $newPhoneEncrypted, $now, $cid]
                );
            }
            $encryptedPhones++;
        }
    }

    // c) Codigos de acompanhamento antigos de 40 bits (ex.: AJN-YYYY-XXXXXX, < 20 chars) ou sem hash:
    // preencher tracking_token_hash com SHA-256 e expirar codigos legados de 40 bits (tracking_expires_at = 1),
    // mantendo a mesma resposta HTTP 404 para codigos expirados/inexistentes.
    $applications = ajn_list($db, 'SELECT id, tracking_code, tracking_token_hash, tracking_expires_at, applied_at FROM job_applications ORDER BY applied_at ASC');
    foreach ($applications as $app) {
        $appId = (string) $app['id'];
        $code = (string) ($app['tracking_code'] ?? '');
        $existingHash = (string) ($app['tracking_token_hash'] ?? '');
        $existingExpires = $app['tracking_expires_at'];

        $isLegacyShortCode = strlen($code) < 20;
        $computedHash = hash('sha256', $code);
        $targetExpires = $isLegacyShortCode
            ? 1
            : ($existingExpires !== null ? (int) $existingExpires : ((int) ($app['applied_at'] ?? $now) + (180 * 86400)));

        if ($existingHash !== $computedHash || ($isLegacyShortCode && (int) $existingExpires !== 1) || $existingExpires === null) {
            if (!$dryRun) {
                ajn_exec(
                    $db,
                    'UPDATE job_applications SET tracking_token_hash=?, tracking_expires_at=?, updated_at=? WHERE id=?',
                    [$computedHash, $targetExpires, $now, $appId]
                );
            }
            $migratedTracking++;
        }
    }

    if ($dryRun) {
        $db->rollBack();
    } else {
        ajn_audit($db, 'system', null, 'LEGACY_DATA_MIGRATED', 'migration', null, [
            'reencrypted_mfa' => $reencryptedMfa,
            'encrypted_phones' => $encryptedPhones,
            'migrated_tracking' => $migratedTracking,
            'admins_without_mfa_count' => count($adminsWithoutMfa),
        ]);
        $db->commit();
    }
} catch (Throwable $error) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    fwrite(STDERR, 'Erro na migracao de dados legados: ' . $error->getMessage() . "\n");
    exit(1);
}

$modeLabel = $dryRun ? 'DRY-RUN' : 'APPLIED';
fwrite(STDOUT, sprintf(
    "[%s] mfa_recifrados=%d, telefones_cifrados=%d, tracking_migrados=%d, admins_sem_mfa=%d\n",
    $modeLabel,
    $reencryptedMfa,
    $encryptedPhones,
    $migratedTracking,
    count($adminsWithoutMfa)
));

foreach ($adminsWithoutMfa as $adm) {
    fwrite(STDOUT, sprintf(
        "ADMIN_WITHOUT_MFA: id=%s email=%s role=%s active=%d\n",
        $adm['id'],
        $adm['email'],
        $adm['role'],
        $adm['is_active']
    ));
}
