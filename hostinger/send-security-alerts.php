<?php
declare(strict_types=1);

// Worker CLI para envio assincrono da fila de alertas de seguranca (cron).
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

define('AJN_DISABLE_AUTO_DISPATCH', true);
require_once __DIR__ . '/bootstrap.php';

$configFile = getenv('AJN_CONFIG_PATH') ?: (__DIR__ . '/config.php');
$config = is_file($configFile) ? require $configFile : null;
if (!is_array($config)) {
    fwrite(STDERR, "Instale config.php privado ou defina AJN_CONFIG_PATH.\n");
    exit(1);
}

$options = getopt('', ['dry-run', 'limit::']);
$dryRun = array_key_exists('dry-run', $options) || in_array('--dry-run', $argv ?? [], true);
$limit = isset($options['limit']) ? max(1, min(500, (int) $options['limit'])) : 50;

$db = ajn_pdo($config);
$result = ajn_process_security_alert_queue($db, $config, $limit, $dryRun);

fwrite(STDOUT, json_encode([
    'ok' => true,
    'dryRun' => $dryRun,
    'limit' => $limit,
    'pending' => $result['pending'],
    'sent' => $result['sent'],
    'failed' => $result['failed'],
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n");
