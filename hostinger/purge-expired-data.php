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
$now = time();
$dryRun = in_array('--dry-run', $argv ?? [], true);

$failPurge = static function (PDO $db, array $config, bool $dryRun, string $message, array $context = []): never {
    fwrite(STDERR, $message . "\n");
    if (!$dryRun) {
        try {
            ajn_security_alert($db, $config, 'DATA_RETENTION_PURGE_FAILED', $message, null, $context);
        } catch (Throwable) {
            // Ignora falha secundaria de fila ao encerrar com erro.
        }
    }
    exit(1);
};

try {
    $retentionConfig = is_array($config['retention'] ?? null) ? $config['retention'] : [];
    $candidateDays = max(30, (int) ($retentionConfig['candidate_days'] ?? 365));
    $talentPoolDays = max(60, (int) ($retentionConfig['talent_pool_days'] ?? 730));
    $auditLogDays = max(90, (int) ($retentionConfig['audit_log_days'] ?? 1825));

    $candidateCutoff = $now - ($candidateDays * 86400);
    $talentPoolCutoff = $now - ($talentPoolDays * 86400);

    $expiredCandidates = ajn_list(
        $db,
        'SELECT id FROM candidates WHERE (is_talent_pool = 0 AND updated_at < ?) OR (is_talent_pool = 1 AND updated_at < ?)',
        [$candidateCutoff, $talentPoolCutoff]
    );

    $directory = ajn_private_resume_dir($config, false);
    $purgedCandidates = 0;
    $purgedFiles = 0;
    $candidateIds = [];
    $fileFailures = [];

    foreach ($expiredCandidates as $cand) {
        $cid = (string) $cand['id'];
        $candidateIds[] = $cid;
        $files = ajn_list($db, 'SELECT file_key FROM resumes WHERE candidate_id=?', [$cid]);
        if ($files !== [] && $directory === null) {
            $fileFailures[] = "Diretório privado de currículos inseguro ou indisponível para candidato {$cid}";
            if (!$dryRun) {
                continue;
            }
        }
        foreach ($files as $f) {
            $key = (string) ($f['file_key'] ?? '');
            if ($directory && preg_match('/^[a-f0-9-]{36}\.(pdf|doc|docx)$/D', $key)) {
                $path = $directory . DIRECTORY_SEPARATOR . $key;
                if (is_file($path)) {
                    if ($dryRun) {
                        $purgedFiles++;
                    } elseif (@unlink($path)) {
                        $purgedFiles++;
                    } else {
                        $fileFailures[] = "Falha ao remover arquivo {$key}";
                    }
                }
            }
        }
        if ($fileFailures !== [] && !$dryRun) {
            continue;
        }
        if ($dryRun) {
            $purgedCandidates++;
        } else {
            $deleted = ajn_exec($db, 'DELETE FROM candidates WHERE id=?', [$cid]);
            if ($deleted > 0) {
                $purgedCandidates += $deleted;
            }
        }
    }

    if ($fileFailures !== []) {
        $failPurge(
            $db,
            $config,
            $dryRun,
            'Falha no expurgo de retenção LGPD: ' . implode('; ', $fileFailures),
            ['failures' => count($fileFailures)]
        );
    }

    if ($dryRun) {
        $purgedSessions = (int) (ajn_fetch($db, 'SELECT COUNT(*) AS c FROM admin_sessions WHERE expires_at < ? OR absolute_expires_at < ?', [$now, $now])['c'] ?? 0);
        $purgedLimits = (int) (ajn_fetch($db, 'SELECT COUNT(*) AS c FROM request_rate_limits WHERE expires_at < ?', [$now])['c'] ?? 0);
        fwrite(STDOUT, sprintf(
            "DRY-RUN: apagaria candidatos=%d (ids=%s), arquivos=%d, sessoes=%d, rate_limits=%d\n",
            $purgedCandidates,
            $candidateIds === [] ? 'nenhum' : implode(',', $candidateIds),
            $purgedFiles,
            $purgedSessions,
            $purgedLimits
        ));
        exit(0);
    }

    $purgedSessions = ajn_exec($db, 'DELETE FROM admin_sessions WHERE expires_at < ? OR absolute_expires_at < ?', [$now, $now]);
    $purgedLimits = ajn_exec($db, 'DELETE FROM request_rate_limits WHERE expires_at < ?', [$now]);

    ajn_audit($db, 'system', null, 'DATA_RETENTION_PURGE', 'retention', null, [
        'purged_candidates' => $purgedCandidates,
        'purged_files' => $purgedFiles,
        'purged_sessions' => $purgedSessions,
        'purged_rate_limits' => $purgedLimits,
        'candidate_days' => $candidateDays,
        'talent_pool_days' => $talentPoolDays,
        'audit_log_days' => $auditLogDays,
    ]);

    fwrite(STDOUT, sprintf(
        "Expurgo concluido: candidatos=%d, arquivos=%d, sessoes=%d, rate_limits=%d\n",
        $purgedCandidates,
        $purgedFiles,
        $purgedSessions,
        $purgedLimits
    ));
    exit(0);
} catch (Throwable $error) {
    $failPurge(
        $db,
        $config,
        $dryRun,
        'Exceção no expurgo LGPD: ' . $error->getMessage(),
        ['reason' => 'exception']
    );
}
