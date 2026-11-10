<?php
declare(strict_types=1);

function ajn_lgpd_request_payload(array $row): array
{
    return [
        'id' => $row['id'],
        'requestType' => $row['request_type'],
        'status' => $row['status'] === 'fulfilled' ? 'completed' : $row['status'],
        'reason' => $row['reason'],
        'requestedAt' => gmdate('c', (int) $row['requested_at']),
        'completedAt' => $row['completed_at'] ? gmdate('c', (int) $row['completed_at']) : null,
        'candidateName' => $row['full_name'] ?? null,
        'candidateEmail' => $row['email'] ?? null,
    ];
}

function ajn_public_lgpd(PDO $db, string $method, string $path, array $config): never
{
    if ($method !== 'POST' || !in_array($path, ['/api/lgpd/requests', '/api/lgpd/deletion-request'], true)) {
        ajn_json(['error' => 'Endpoint não encontrado.'], 404);
    }
    ajn_require_origin($config);
    ajn_rate_limit($db, 'lgpd-request', 5, 900);
    $body = ajn_body();
    $email = mb_strtolower(ajn_text($body['email'] ?? null, 254));
    $cpf = preg_replace('/\D+/', '', ajn_text($body['cpf'] ?? null, 20));
    $requestType = $path === '/api/lgpd/deletion-request' ? 'erasure' : ajn_text($body['requestType'] ?? null, 30);
    $reason = ajn_text($body['reason'] ?? null, 2000);
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || !ajn_valid_cpf((string) $cpf) || !in_array($requestType, ['access', 'rectification', 'erasure', 'portability', 'revocation'], true)) {
        ajn_json(['error' => 'Dados da solicitação inválidos.'], 400);
    }
    ajn_verify_turnstile($config, $body['turnstileToken'] ?? $body['cf-turnstile-response'] ?? null);
    $secret = hex2bin($config['encryption_key'] ?? '');
    if (!is_string($secret) || strlen($secret) !== 32) ajn_json(['error' => 'Configuração de privacidade indisponível.'], 503);
    $candidate = ajn_fetch($db, 'SELECT id FROM candidates WHERE email=? AND cpf_hash=? LIMIT 1', [$email, hash_hmac('sha256', (string) $cpf, $secret)]);
    $message = 'Se os dados conferirem, sua solicitação será analisada pela equipe responsável e poderá exigir confirmação adicional.';
    if (!$candidate) ajn_json(['success' => true, 'message' => $message], 202);
    $pending = ajn_fetch($db, 'SELECT id FROM data_subject_requests WHERE candidate_id=? AND status IN (\'pending\',\'in_analysis\') LIMIT 1', [$candidate['id']]);
    if (!$pending) {
        ajn_exec($db, 'INSERT INTO data_subject_requests (id,candidate_id,request_type,status,reason,requested_at) VALUES (?,?,?,?,?,?)', [ajn_uuid(), $candidate['id'], $requestType, 'pending', $reason ?: null, time()]);
        ajn_audit($db, 'candidate', $candidate['id'], 'LGPD_REQUEST_CREATED', 'data_subject_request', $candidate['id']);
    }
    ajn_json(['success' => true, 'message' => $message], 202);
}

function ajn_admin_lgpd(PDO $db, string $method, string $path, array $config): never
{
    if ($method === 'GET' && in_array($path, ['/api/admin/lgpd/requests', '/api/admin/lgpd/requests/'], true)) {
        ajn_auth($db, 'lgpd:read');
        $rows = ajn_list($db, 'SELECT r.id,r.request_type,r.status,r.reason,r.requested_at,r.completed_at,c.full_name,c.email FROM data_subject_requests r JOIN candidates c ON c.id=r.candidate_id ORDER BY r.requested_at DESC LIMIT 200');
        ajn_json(['requests' => array_map('ajn_lgpd_request_payload', $rows), 'count' => count($rows)]);
    }
    if ($method === 'POST' && preg_match('~^/api/admin/lgpd/requests/([a-f0-9-]{36})/execute$~D', $path, $match)) {
        $admin = ajn_auth($db, 'lgpd:execute');
        ajn_require_origin($config);
        $request = ajn_fetch($db, 'SELECT r.*,c.email FROM data_subject_requests r JOIN candidates c ON c.id=r.candidate_id WHERE r.id=? LIMIT 1', [$match[1]]);
        if (!$request) ajn_json(['error' => 'Solicitação não encontrada.'], 404);
        if (!in_array($request['status'], ['pending', 'in_analysis'], true)) ajn_json(['error' => 'Solicitação já atendida.'], 409);
        $candidateId = $request['candidate_id'];
        if ($request['request_type'] === 'erasure') {
            $directory = realpath($config['resume_directory'] ?? '');
            $publicRoot = realpath($_SERVER['DOCUMENT_ROOT'] ?? '');
            $files = ajn_list($db, 'SELECT file_key FROM resumes WHERE candidate_id=?', [$candidateId]);
            if (!$directory || !$publicRoot || str_starts_with($directory . '/', $publicRoot . '/')) ajn_json(['error' => 'Armazenamento privado não configurado.'], 503);
            foreach ($files as $file) {
                if (!preg_match('/^[a-f0-9-]{36}\.(pdf|doc|docx)$/D', (string) $file['file_key'])) ajn_json(['error' => 'Arquivo privado inválido.'], 503);
                $filename = $directory . DIRECTORY_SEPARATOR . $file['file_key'];
                if (is_file($filename) && !unlink($filename)) ajn_json(['error' => 'Não foi possível eliminar todos os anexos com segurança.'], 503);
            }
            $db->beginTransaction();
            try {
                ajn_audit($db, 'admin', $admin['id'], 'LGPD_DATA_ERASURE', 'candidate', $candidateId);
                $deleted = ajn_exec($db, 'DELETE FROM candidates WHERE id=?', [$candidateId]);
                if ($deleted !== 1) throw new RuntimeException('Candidato não encontrado durante a exclusão LGPD.');
                $db->commit();
            } catch (Throwable $error) {
                if ($db->inTransaction()) $db->rollBack();
                error_log('[AJN_CAREERS] LGPD erasure failed: ' . get_class($error));
                ajn_json(['error' => 'Não foi possível concluir a solicitação.'], 503);
            }
            ajn_json(['success' => true, 'message' => 'Solicitação de exclusão concluída.']);
        }
        ajn_exec($db, 'UPDATE data_subject_requests SET status=\'fulfilled\',completed_at=?,completed_by=? WHERE id=? AND status IN (\'pending\',\'in_analysis\')', [time(), $admin['id'], $match[1]]);
        ajn_audit($db, 'admin', $admin['id'], 'LGPD_REQUEST_FULFILLED', 'data_subject_request', $match[1]);
        ajn_json(['success' => true, 'message' => 'Solicitação registrada como concluída.']);
    }
    ajn_json(['error' => 'Endpoint não encontrado.'], 404);
}
