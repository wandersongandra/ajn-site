<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit("Este script só pode ser executado via CLI.\n");
}

define('AJN_DISABLE_AUTO_DISPATCH', true);
require_once __DIR__ . '/bootstrap.php';

$config = ajn_config();
$db = ajn_pdo($config);

$rows = ajn_list($db, 'SELECT id, actor_type, actor_id, action, resource, resource_id, details_json, ip_address, user_agent, timestamp, prev_hash, entry_hash FROM audit_logs ORDER BY timestamp ASC, id ASC');

$byPrev = [];
$chainedRows = [];
$legacyCount = 0;

foreach ($rows as $row) {
    $entryHash = $row['entry_hash'] ?? null;
    $prevHash = $row['prev_hash'] ?? null;
    if ($entryHash === null || $entryHash === '') {
        $legacyCount++;
        continue;
    }
    $computed = ajn_compute_audit_hash(
        (string) $prevHash,
        (string) $row['id'],
        (string) $row['actor_type'],
        $row['actor_id'] !== null ? (string) $row['actor_id'] : null,
        (string) $row['action'],
        (string) $row['resource'],
        $row['resource_id'] !== null ? (string) $row['resource_id'] : null,
        $row['details_json'] !== null ? (string) $row['details_json'] : null,
        $row['ip_address'] !== null ? (string) $row['ip_address'] : null,
        $row['user_agent'] !== null ? (string) $row['user_agent'] : null,
        (int) $row['timestamp']
    );
    if (!hash_equals($computed, (string) $entryHash)) {
        fwrite(STDERR, sprintf(
            "FALHA DE INTEGRIDADE (id=%s): entry_hash divergente (esperado=%s, encontrado=%s).\n",
            (string) $row['id'],
            $computed,
            (string) $entryHash
        ));
        exit(1);
    }
    $prevKey = (string) $prevHash;
    if (isset($byPrev[$prevKey])) {
        fwrite(STDERR, sprintf(
            "FALHA DE INTEGRIDADE (id=%s): bifurcacao detectada em prev_hash=%s.\n",
            (string) $row['id'],
            $prevKey
        ));
        exit(1);
    }
    $byPrev[$prevKey] = $row;
    $chainedRows[] = $row;
}

$checked = 0;
$cursor = str_repeat('0', 64);
while (isset($byPrev[$cursor])) {
    $current = $byPrev[$cursor];
    $cursor = (string) $current['entry_hash'];
    $checked++;
}

if ($checked !== count($chainedRows)) {
    fwrite(STDERR, sprintf(
        "FALHA DE INTEGRIDADE: cadeia quebrada (%d encadeados a partir da genesis de um total de %d registros com hash).\n",
        $checked,
        count($chainedRows)
    ));
    exit(1);
}

fwrite(STDOUT, sprintf(
    "OK: Cadeia de auditoria integra (%d registros encadeados verificados, %d registros legados anteriores a migracao 005).\n",
    $checked,
    $legacyCount
));
exit(0);
