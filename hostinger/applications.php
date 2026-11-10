<?php
declare(strict_types=1);

function ajn_valid_cpf(string $cpf): bool
{
    $cpf = preg_replace('/\D+/', '', $cpf);
    if (!is_string($cpf) || strlen($cpf) !== 11 || preg_match('/^(\d)\1{10}$/D', $cpf)) return false;
    for ($length = 9; $length <= 10; $length++) {
        $sum = 0;
        for ($n = 0; $n < $length; $n++) $sum += (int) $cpf[$n] * ($length + 1 - $n);
        $remainder = ($sum * 10) % 11;
        if (($remainder === 10 ? 0 : $remainder) !== (int) $cpf[$length]) return false;
    }
    return true;
}

function ajn_resume_upload(array $config): array
{
    $file = $_FILES['resume'] ?? null;
    if (!is_array($file) || is_array($file['error'] ?? null) || ($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        ajn_json(['error' => 'O anexo do currículo é obrigatório ou falhou no envio.'], 400);
    }
    if ((int) ($file['size'] ?? 0) < 16 || (int) $file['size'] > 5 * 1024 * 1024) {
        ajn_json(['error' => 'O currículo deve ter até 5 MB.'], 400);
    }
    $temporary = $file['tmp_name'] ?? '';
    if (!is_string($temporary) || !is_uploaded_file($temporary)) ajn_json(['error' => 'Upload inválido.'], 400);
    $name = basename(is_string($file['name'] ?? null) ? $file['name'] : 'curriculo');
    $extension = strtolower(pathinfo($name, PATHINFO_EXTENSION));
    $allowed = [
        'pdf' => ['application/pdf', '%PDF-'],
        'doc' => ['application/msword', "\xD0\xCF\x11\xE0\xA1\xB1\x1A\xE1"],
        'docx' => ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', "PK\x03\x04"],
    ];
    if (!isset($allowed[$extension])) ajn_json(['error' => 'Formato de currículo não permitido.'], 400);
    $fh = fopen($temporary, 'rb');
    if ($fh === false) ajn_json(['error' => 'Não foi possível validar o arquivo.'], 400);
    $signature = fread($fh, 8);
    fclose($fh);
    if (!str_starts_with((string) $signature, $allowed[$extension][1])) ajn_json(['error' => 'Assinatura do arquivo incompatível.'], 400);
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($temporary);
    $acceptedMimes = match ($extension) {
        'pdf' => ['application/pdf'],
        'doc' => ['application/msword', 'application/vnd.ms-office', 'application/octet-stream'],
        'docx' => ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip', 'application/octet-stream'],
    };
    if (!in_array($mime, $acceptedMimes, true)) ajn_json(['error' => 'Conteúdo do arquivo não permitido.'], 400);

    $privateDirectory = realpath($config['resume_directory'] ?? '');
    $publicRoot = realpath($_SERVER['DOCUMENT_ROOT'] ?? '');
    if (!$privateDirectory || !is_dir($privateDirectory) || !is_writable($privateDirectory) || !$publicRoot ||
        $privateDirectory === $publicRoot || str_starts_with($privateDirectory . '/', $publicRoot . '/')) {
        ajn_json(['error' => 'Armazenamento privado não configurado.'], 503);
    }
    return ['temporary' => $temporary, 'extension' => $extension, 'mime' => $allowed[$extension][0], 'name' => mb_substr($name, 0, 255), 'size' => (int) $file['size'], 'directory' => $privateDirectory];
}

function ajn_send_candidate_verification(PDO $db, array $candidate, array $config, string $action): void
{
    if (!ajn_email_configured($config)) ajn_json(['error' => 'Serviço de verificação temporariamente indisponível.'], 503);
    $code = (string) random_int(100000, 999999);
    $expires = time() + 900;
    ajn_exec($db, 'UPDATE candidates SET email_verification_code_hash=?,email_verification_expires_at=?,email_verification_attempts=0,updated_at=? WHERE id=?', [hash('sha256', $code), $expires, time(), $candidate['id']]);
    $subject = $action === 'tracking' ? 'Recuperação de acompanhamento — AJN Carreiras' : 'Verificação de titularidade — AJN Carreiras';
    $body = $action === 'tracking'
        ? "Recebemos um pedido para recuperar seus códigos de acompanhamento.\n\nSeu código de verificação é: $code\n\nEle expira em 15 minutos. Se você não solicitou, ignore esta mensagem."
        : "Recebemos um pedido para confirmar a titularidade do seu cadastro.\n\nSeu código de verificação é: $code\n\nEle expira em 15 minutos. Se você não solicitou, ignore esta mensagem.";
    if (!ajn_send_email($config, (string) $candidate['email'], $subject, $body)) {
        ajn_exec($db, 'UPDATE candidates SET email_verification_code_hash=NULL,email_verification_expires_at=NULL,email_verification_attempts=0,updated_at=? WHERE id=?', [time(), $candidate['id']]);
        error_log('[AJN_CAREERS] candidate verification email delivery failed');
        ajn_json(['error' => 'Serviço de e-mail temporariamente indisponível.'], 503);
    }
    ajn_audit($db, 'candidate', $candidate['id'], $action === 'tracking' ? 'TRACKING_RECOVERY_REQUESTED' : 'OWNERSHIP_VERIFICATION_REQUESTED', 'candidate', $candidate['id']);
}

function ajn_verify_candidate_verification(PDO $db, array $candidate, string $code): void
{
    if (!preg_match('/^\d{6}$/D', $code) || empty($candidate['email_verification_code_hash']) ||
        (int) ($candidate['email_verification_expires_at'] ?? 0) <= time() || (int) ($candidate['email_verification_attempts'] ?? 0) >= 5) {
        ajn_json(['error' => 'Código incorreto, expirado ou bloqueado.'], 400);
    }
    $codeHash = hash('sha256', $code);
    if (!hash_equals((string) $candidate['email_verification_code_hash'], $codeHash)) {
        ajn_exec($db, 'UPDATE candidates SET email_verification_attempts=email_verification_attempts+1,updated_at=? WHERE id=?', [time(), $candidate['id']]);
        ajn_json(['error' => 'Código incorreto, expirado ou bloqueado.'], 400);
    }
    $updated = ajn_exec($db, 'UPDATE candidates SET email_verification_code_hash=NULL,email_verification_expires_at=NULL,email_verification_attempts=0,updated_at=? WHERE id=? AND email_verification_code_hash=? AND email_verification_expires_at>? AND email_verification_attempts<5', [time(), $candidate['id'], $codeHash, time()]);
    if ($updated !== 1) ajn_json(['error' => 'Código incorreto, expirado ou bloqueado.'], 400);
}

function ajn_application_public_payload(array $item): array
{
    $stage = $item['stage_name'] ?: 'Em processamento';
    return [
        'trackingCode' => $item['tracking_code'], 'status' => $item['status'] === 'active' ? 'Em andamento' : ($item['status'] === 'hired' ? 'Aprovado' : 'Processo encerrado'),
        'stage' => $stage, 'currentStage' => $stage, 'department' => $item['job_department'] ?: 'Geral',
        'jobTitle' => $item['job_title'] ?: 'Banco de Talentos AJN', 'appliedAt' => gmdate('c', (int) $item['applied_at']),
        'updatedAt' => gmdate('c', (int) $item['updated_at']),
    ];
}

function ajn_public_applications(PDO $db, string $method, string $path, array $config): never
{
    if ($method === 'GET' && preg_match('~^/api/applications/track/(AJN-[0-9]{4}-[A-Z0-9]{6,16})$~D', $path, $match)) {
        ajn_rate_limit($db, 'application-tracking', 10, 600);
        $item = ajn_fetch($db,
            'SELECT a.tracking_code,a.status,a.applied_at,a.updated_at,s.name AS stage_name,j.title AS job_title,j.department AS job_department FROM job_applications a LEFT JOIN recruitment_stages s ON s.id=a.current_stage_id LEFT JOIN job_postings j ON j.id=a.job_id WHERE a.tracking_code=?', [$match[1]]);
        if (!$item) ajn_json(['error' => 'Nenhuma candidatura localizada com o código informado.'], 404);
        ajn_json(['application' => ajn_application_public_payload($item)]);
    }
    if ($method === 'POST' && $path === '/api/applications/recover-tracking') {
        ajn_require_origin($config);
        ajn_rate_limit($db, 'application-tracking-recovery', 5, 900);
        $body = ajn_body();
        $email = mb_strtolower(ajn_text($body['email'] ?? null, 254));
        $cpf = preg_replace('/\D+/', '', ajn_text($body['cpf'] ?? null, 20));
        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || !ajn_valid_cpf((string) $cpf)) ajn_json(['error' => 'Dados de recuperação inválidos.'], 400);
        ajn_verify_turnstile($config, $body['turnstileToken'] ?? $body['cf-turnstile-response'] ?? null);
        $secret = hex2bin($config['encryption_key'] ?? '');
        if (!is_string($secret) || strlen($secret) !== 32) ajn_json(['error' => 'Configuração de privacidade indisponível.'], 503);
        $candidate = ajn_fetch($db, 'SELECT * FROM candidates WHERE email=? AND cpf_hash=? LIMIT 1', [$email, hash_hmac('sha256', (string) $cpf, $secret)]);
        $message = 'Se os dados conferirem, enviaremos um código de verificação ao e-mail cadastrado.';
        if (!$candidate) ajn_json(['success' => true, 'message' => $message], 202);
        ajn_send_candidate_verification($db, $candidate, $config, 'tracking');
        ajn_json(['success' => true, 'message' => $message], 202);
    }
    if ($method === 'POST' && $path === '/api/applications/verify-recovery') {
        ajn_require_origin($config);
        ajn_rate_limit($db, 'application-tracking-verification', 10, 900);
        $body = ajn_body();
        $email = mb_strtolower(ajn_text($body['email'] ?? null, 254));
        $code = ajn_text($body['code'] ?? null, 6);
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) ajn_json(['error' => 'Dados de recuperação inválidos.'], 400);
        $candidate = ajn_fetch($db, 'SELECT * FROM candidates WHERE email=? LIMIT 1', [$email]);
        if (!$candidate) ajn_json(['error' => 'Código incorreto, expirado ou bloqueado.'], 400);
        ajn_verify_candidate_verification($db, $candidate, $code);
        $rows = ajn_list($db, 'SELECT a.tracking_code,a.status,a.applied_at,a.updated_at,s.name AS stage_name,j.title AS job_title,j.department AS job_department FROM job_applications a LEFT JOIN recruitment_stages s ON s.id=a.current_stage_id LEFT JOIN job_postings j ON j.id=a.job_id WHERE a.candidate_id=? ORDER BY a.applied_at DESC LIMIT 20', [$candidate['id']]);
        if (!$rows) ajn_json(['error' => 'Nenhuma candidatura localizada para os dados informados.'], 404);
        ajn_json(['applications' => array_map('ajn_application_public_payload', $rows)]);
    }
    if ($method === 'POST' && ($path === '/api/applications/talent-pool' || preg_match('~^/api/applications/jobs/([a-z0-9-]+)/apply$~D', $path, $match))) {
        ajn_require_origin($config);
        ajn_rate_limit($db, 'application-submit', 20, 600);
        if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'multipart/form-data') !== 0) ajn_json(['error' => 'Utilize multipart/form-data.'], 415);
        $slug = $match[1] ?? null;
        $job = $slug ? ajn_fetch($db, 'SELECT id FROM job_postings WHERE slug=? AND status=?', [$slug, 'published']) : null;
        if ($slug && !$job) ajn_json(['error' => 'A vaga não existe ou não está aberta.'], 404);
        if (!empty($_POST['website'])) ajn_json(['error' => 'Não foi possível processar sua solicitação.'], 400);
        $name = ajn_text($_POST['fullName'] ?? null, 200);
        $email = mb_strtolower(ajn_text($_POST['email'] ?? null, 254));
        $phone = ajn_text($_POST['phone'] ?? null, 30);
        $cpf = preg_replace('/\D+/', '', ajn_text($_POST['cpf'] ?? null, 20));
        $city = ajn_text($_POST['city'] ?? null, 120);
        $state = strtoupper(ajn_text($_POST['state'] ?? null, 2));
        $consentTerms = in_array($_POST['consentTerms'] ?? null, ['true', '1'], true);
        $consentRetention = in_array($_POST['consentRetention'] ?? null, ['true', '1'], true);
        if (mb_strlen($name) < 3 || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($phone) < 8 || !ajn_valid_cpf((string) $cpf) || $city === '' || !preg_match('/^[A-Z]{2}$/D', $state) || !$consentTerms) {
            ajn_json(['error' => 'Dados cadastrais inválidos ou aceite de privacidade ausente.'], 400);
        }
        if (!$job && !$consentRetention) {
            ajn_json(['error' => 'Para participar do Banco de Talentos, autorize a retenção dos dados do currículo.'], 400);
        }
        ajn_verify_turnstile($config, $_POST['turnstileToken'] ?? $_POST['cf-turnstile-response'] ?? null);
        $file = ajn_resume_upload($config);
        $secret = hex2bin($config['encryption_key'] ?? '');
        if (!is_string($secret) || strlen($secret) !== 32) ajn_json(['error' => 'Configuração de privacidade indisponível.'], 503);
        $cpfHash = hash_hmac('sha256', (string) $cpf, $secret);
        $candidate = ajn_fetch($db, 'SELECT * FROM candidates WHERE email=? AND cpf_hash=? LIMIT 1', [$email, $cpfHash]);
        $conflict = ajn_fetch($db, 'SELECT id,email FROM candidates WHERE email=? OR cpf_hash=? LIMIT 1', [$email, $cpfHash]);
        if ($conflict && !$candidate) {
            ajn_json(['error' => 'Já existe um cadastro associado a estes dados. Use o e-mail original para recuperar o acompanhamento.', 'verificationRequired' => true], 409);
        }
        $verificationToken = ajn_text($_POST['verificationToken'] ?? null, 6);
        if ($candidate && $verificationToken === '') {
            ajn_send_candidate_verification($db, $candidate, $config, 'ownership');
            ajn_json(['error' => 'Cadastro já existente. Um código de titularidade foi enviado ao seu e-mail.', 'verificationRequired' => true], 409);
        }
        if ($candidate) {
            ajn_verify_candidate_verification($db, $candidate, $verificationToken);
            if ($job && ajn_fetch($db, 'SELECT id FROM job_applications WHERE job_id=? AND candidate_id=? AND status IN (\'active\',\'hired\') LIMIT 1', [$job['id'], $candidate['id']])) {
                ajn_json(['error' => 'Já existe uma candidatura ativa para esta vaga.'], 409);
            }
        }
        $candidateId = $candidate['id'] ?? ajn_uuid();
        $resumeId = ajn_uuid();
        $applicationId = ajn_uuid();
        $key = $resumeId . '.' . $file['extension'];
        $destination = $file['directory'] . DIRECTORY_SEPARATOR . $key;
        if (!move_uploaded_file($file['temporary'], $destination)) ajn_json(['error' => 'Falha no armazenamento seguro do currículo.'], 502);
        @chmod($destination, 0600);
        $hash = hash_file('sha256', $destination);
        if (!is_string($hash)) {
            unlink($destination);
            ajn_json(['error' => 'Falha na verificação do currículo.'], 502);
        }
        $tracking = 'AJN-' . gmdate('Y') . '-' . strtoupper(substr(bin2hex(random_bytes(5)), 0, 10));
        $now = time();
        try {
            $db->beginTransaction();
            $candidateValues = [$name, $phone, $city, $state, ajn_text($_POST['linkedinUrl'] ?? null, 500) ?: null, ajn_text($_POST['portfolioUrl'] ?? null, 500) ?: null, ajn_text($_POST['currentTitle'] ?? null, 200) ?: null, ajn_text($_POST['summary'] ?? null, 5000) ?: null, (int) $consentRetention, $now, $candidateId];
            if ($candidate) {
                ajn_exec($db, 'UPDATE candidates SET full_name=?,phone=?,city=?,state=?,linkedin_url=?,portfolio_url=?,current_title=?,summary=?,is_talent_pool=?,updated_at=? WHERE id=?', $candidateValues);
            } else {
                ajn_exec($db,
                    'INSERT INTO candidates (id,full_name,email,phone,cpf_hash,cpf_masked,city,state,linkedin_url,portfolio_url,current_title,summary,is_talent_pool,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
                    [$candidateId, $name, $email, $phone, $cpfHash, '***.***.' . substr((string) $cpf, 6, 3) . '-' . substr((string) $cpf, 9), $city, $state,
                        ajn_text($_POST['linkedinUrl'] ?? null, 500) ?: null, ajn_text($_POST['portfolioUrl'] ?? null, 500) ?: null,
                        ajn_text($_POST['currentTitle'] ?? null, 200) ?: null, ajn_text($_POST['summary'] ?? null, 5000) ?: null,
                        (int) $consentRetention, $now, $now]
                );
            }
            // Garantir que apenas o currículo mais recente seja o atual, inclusive em recandidaturas.
            ajn_exec($db, 'UPDATE resumes SET is_current=0 WHERE candidate_id=? AND is_current=1', [$candidateId]);
            ajn_exec($db,
                'INSERT INTO resumes (id,candidate_id,file_key,original_filename,mime_type,file_size_bytes,file_sha256,is_current,uploaded_at) VALUES (?,?,?,?,?,?,?,1,?)',
                [$resumeId, $candidateId, $key, $file['name'], $file['mime'], $file['size'], $hash, $now]
            );
            ajn_exec($db,
                'INSERT INTO data_consents (id,candidate_id,consent_type,consent_version,granted,ip_address,user_agent,consented_at) VALUES (?,?,?,?,?,?,?,?)',
                [ajn_uuid(), $candidateId, $job ? 'recruitment_process' : 'talent_pool_opt_in', '1.0', 1, $_SERVER['REMOTE_ADDR'] ?? null, mb_substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 500), $now]
            );
            ajn_exec($db,
                'INSERT INTO data_consents (id,candidate_id,consent_type,consent_version,granted,ip_address,user_agent,consented_at) VALUES (?,?,?,?,?,?,?,?)',
                [ajn_uuid(), $candidateId, 'talent_pool_retention', '1.0', (int) $consentRetention, $_SERVER['REMOTE_ADDR'] ?? null, mb_substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 500), $now]
            );
            $stage = ajn_fetch($db, 'SELECT id FROM recruitment_stages WHERE job_id IS NULL AND stage_order=1 LIMIT 1');
            ajn_exec($db,
                'INSERT INTO job_applications (id,job_id,candidate_id,resume_id,current_stage_id,tracking_code,status,source,applied_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
                [$applicationId, $job['id'] ?? null, $candidateId, $resumeId, $stage['id'] ?? null, $tracking, 'active', $job ? 'portal' : 'talentos', $now, $now]
            );
            ajn_audit($db, 'candidate', $candidateId, $job ? 'APPLICATION_SUBMITTED' : 'TALENT_POOL_REGISTERED', 'application', $applicationId);
            $db->commit();
        } catch (Throwable $exception) {
            if ($db->inTransaction()) $db->rollBack();
            unlink($destination); // compensação de falha do banco: não deixar arquivo órfão
            throw $exception;
        }
        ajn_json(['success' => true, 'trackingCode' => $tracking, 'candidateId' => $candidateId,
            'message' => $job ? 'Candidatura enviada com sucesso! Guarde seu código de acompanhamento.' : 'Cadastro no Banco de Talentos realizado com sucesso! Guarde seu código de acompanhamento.'], 201);
    }
    ajn_json(['error' => 'Endpoint não encontrado.'], 404);
}

function ajn_admin_candidates(PDO $db, string $method, string $path, array $config): never
{
    if ($method !== 'GET') ajn_json(['error' => 'Método não permitido.'], 405);
    if ($path === '/api/admin/candidates' || $path === '/api/admin/candidates/') {
        ajn_auth($db, 'candidates:read');
        $rows = ajn_list($db, 'SELECT c.id,c.full_name,c.email,c.phone,c.city,c.state,c.current_title,c.created_at FROM candidates c ORDER BY c.created_at DESC LIMIT 200');
        $candidates = array_map(static fn(array $c): array => [
            'id' => $c['id'], 'fullName' => $c['full_name'], 'email' => $c['email'],
            'phone' => $c['phone'], 'city' => $c['city'], 'state' => $c['state'],
            'currentTitle' => $c['current_title'], 'createdAt' => gmdate('c', (int) $c['created_at']),
        ], $rows);
        ajn_json(['candidates' => $candidates, 'count' => count($candidates)]);
    }
    if (preg_match('~^/api/admin/candidates/([a-f0-9-]{36})/resume$~D', $path, $match)) {
        $admin = ajn_auth($db, 'resumes:read');
        $row = ajn_fetch($db, 'SELECT file_key,original_filename,mime_type FROM resumes WHERE candidate_id=? AND is_current=1 LIMIT 1', [$match[1]]);
        if (!$row) ajn_json(['error' => 'Currículo não encontrado.'], 404);
        $directory = realpath($config['resume_directory'] ?? '');
        $publicRoot = realpath($_SERVER['DOCUMENT_ROOT'] ?? '');
        if (!$directory || !$publicRoot || str_starts_with($directory . '/', $publicRoot . '/') || !preg_match('/^[a-f0-9-]{36}\.(pdf|doc|docx)$/D', $row['file_key'])) {
            ajn_json(['error' => 'Arquivo privado indisponível.'], 503);
        }
        $filename = $directory . DIRECTORY_SEPARATOR . $row['file_key'];
        if (!is_file($filename) || !is_readable($filename)) ajn_json(['error' => 'Arquivo não localizado.'], 404);
        ajn_audit($db, 'admin', $admin['id'], 'RESUME_DOWNLOADED', 'resume', $match[1]);
        header('Content-Type: ' . $row['mime_type']);
        header('Content-Disposition: attachment; filename="curriculo.' . pathinfo($filename, PATHINFO_EXTENSION) . '"');
        header('Content-Length: ' . filesize($filename));
        header('X-Content-Type-Options: nosniff');
        header('Cache-Control: private, no-store');
        readfile($filename);
        exit;
    }
    ajn_json(['error' => 'Endpoint não encontrado.'], 404);
}
