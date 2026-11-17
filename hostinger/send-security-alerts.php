<?php
declare(strict_types=1);

// Worker CLI para envio assincrono da fila de alertas de seguranca (cron).
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

define('AJN_DISABLE_AUTO_DISPATCH', true);
require_once __DIR__ . '/bootstrap.php';

$config = ajn_config();

$options = getopt('', ['dry-run', 'test-alert', 'limit::']);
$dryRun = array_key_exists('dry-run', $options) || in_array('--dry-run', $argv ?? [], true);
$testAlert = array_key_exists('test-alert', $options) || in_array('--test-alert', $argv ?? [], true);
$limit = isset($options['limit']) ? max(1, min(500, (int) $options['limit'])) : 50;

$db = ajn_pdo($config);
if ($testAlert) {
    $recipient = trim((string) ($config['security_alert_email'] ?? ''));
    if ($recipient === '' || !filter_var($recipient, FILTER_VALIDATE_EMAIL)) {
        fwrite(STDERR, "Configure security_alert_email valido em config.php antes de testar alertas.\n");
        exit(1);
    }
    if (!$dryRun) {
        ajn_security_alert(
            $db,
            $config,
            'DEPLOY_TEST_ALERT',
            'Alerta de teste operacional do runbook AJN Carreiras.',
            null,
            ['mode' => 'cli_test_alert']
        );
    }
}

$result = ajn_process_security_alert_queue($db, $config, $limit, $dryRun);
$ok = !$testAlert || $dryRun || $result['sent'] > 0;

fwrite(STDOUT, json_encode([
    'ok' => $ok,
    'dryRun' => $dryRun,
    'testAlert' => $testAlert,
    'recipient' => $testAlert ? trim((string) ($config['security_alert_email'] ?? '')) : null,
    'limit' => $limit,
    'pending' => $result['pending'],
    'sent' => $result['sent'],
    'failed' => $result['failed'],
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n");
if (!$ok) {
    exit(1);
}
