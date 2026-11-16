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

$failIntegrity = static function (PDO $db, array $config, string $message, array $context = []): never {
    fwrite(STDERR, $message . "\n");
    try {
        ajn_security_alert($db, $config, 'AUDIT_CHAIN_INTEGRITY_FAILED', $message, null, $context);
    } catch (Throwable) {
        // Nao mascarar a falha principal se o alerta falhar ao gravar na fila.
    }
    exit(1);
};

try {
    $rows = ajn_list(
        $db,
        'SELECT id, actor_type, actor_id, action, resource, resource_id, details_json, ip_address, user_agent, timestamp, prev_hash, entry_hash FROM audit_logs ORDER BY timestamp ASC, id ASC'
    );

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
            $failIntegrity(
                $db,
                $config,
                sprintf(
                    'FALHA DE INTEGRIDADE (id=%s): entry_hash divergente (esperado=%s, encontrado=%s).',
                    (string) $row['id'],
                    $computed,
                    (string) $entryHash
                ),
                ['entry_id' => (string) $row['id'], 'reason' => 'hash_mismatch']
            );
        }
        $prevKey = (string) $prevHash;
        if (isset($byPrev[$prevKey])) {
            $failIntegrity(
                $db,
                $config,
                sprintf(
                    'FALHA DE INTEGRIDADE (id=%s): bifurcacao detectada em prev_hash=%s.',
                    (string) $row['id'],
                    $prevKey
                ),
                ['entry_id' => (string) $row['id'], 'reason' => 'chain_fork']
            );
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
        $failIntegrity(
            $db,
            $config,
            sprintf(
                'FALHA DE INTEGRIDADE: cadeia quebrada (%d encadeados a partir da genesis de um total de %d registros com hash).',
                $checked,
                count($chainedRows)
            ),
            ['checked' => $checked, 'total_chained' => count($chainedRows), 'reason' => 'broken_chain']
        );
    }

    fwrite(STDOUT, sprintf(
        "OK: Cadeia de auditoria integra (%d registros encadeados verificados, %d registros legados anteriores a migracao 005).\n",
        $checked,
        $legacyCount
    ));
    exit(0);
} catch (Throwable $error) {
    $failIntegrity(
        $db,
        $config,
        'FALHA AO VERIFICAR CADEIA DE AUDITORIA: ' . $error->getMessage(),
        ['reason' => 'exception']
    );
}
