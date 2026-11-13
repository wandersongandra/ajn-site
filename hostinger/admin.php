<?php
declare(strict_types=1);

function ajn_admin_auth(PDO $db, string $method, string $path, array $config): never
{
    if ($path === '/api/admin/auth/login' && $method === 'POST') {
        ajn_rate_limit($db, 'admin-login', 10, 900);
        ajn_require_origin($config);
        $body = ajn_body();
        $email = mb_strtolower(ajn_text($body['email'] ?? null, 254));
        $password = $body['password'] ?? null;
        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || !is_string($password) || strlen($password) > 1024) {
            ajn_json(['error' => 'E-mail ou senha inválidos.'], 400);
        }
        $user = ajn_fetch($db, 'SELECT * FROM admin_users WHERE email=? LIMIT 1', [$email]);
        if (!$user || !(int) $user['is_active']) {
            ajn_json(['error' => 'Credenciais inválidas.'], 401);
        }
        if ($user['locked_until'] && (int) $user['locked_until'] > time()) {
            ajn_json(['error' => 'Conta bloqueada temporariamente.'], 423);
        }
        if (!password_verify($password, $user['password_hash'])) {
            $attempts = ((int) $user['failed_attempts']) + 1;
            ajn_exec($db, 'UPDATE admin_users SET failed_attempts=?,locked_until=?,updated_at=? WHERE id=?', [
                $attempts >= 5 ? 0 : $attempts,
                $attempts >= 5 ? time() + 900 : null,
                time(), $user['id'],
            ]);
            ajn_audit($db, 'admin', $user['id'], 'AUTH_LOGIN_FAILED', 'auth');
            ajn_json(['error' => 'Credenciais inválidas.'], 401);
        }
        if ((int) $user['mfa_required'] || (int) $user['mfa_enabled']) {
            $mfa = $body['mfaCode'] ?? null;
            if (!is_string($mfa) || !preg_match('/^\d{6}$/D', $mfa)) {
                ajn_json(['mfaRequired' => true, 'message' => 'Código MFA necessário.'], 401);
            }
            $secret = ajn_decrypt((string) $user['mfa_secret'], $config);
            if ($secret === '' || !ajn_totp($secret, 1, $mfa)) {
                $attempts = ((int) $user['failed_attempts']) + 1;
                ajn_exec($db, 'UPDATE admin_users SET failed_attempts=?,locked_until=?,updated_at=? WHERE id=?', [
                    $attempts >= 5 ? 0 : $attempts,
                    $attempts >= 5 ? time() + 900 : null,
                    time(), $user['id'],
                ]);
                ajn_audit($db, 'admin', $user['id'], 'AUTH_MFA_FAILED', 'auth');
                ajn_json(['error' => 'Código MFA inválido.'], 401);
            }
        }
        ajn_exec($db, 'UPDATE admin_users SET failed_attempts=0,locked_until=NULL,updated_at=? WHERE id=?', [time(), $user['id']]);
        ajn_issue_session($db, $user);
        ajn_audit($db, 'admin', $user['id'], 'AUTH_LOGIN_SUCCESS', 'auth');
        ajn_json(['success' => true, 'user' => ajn_user_public($user)]);
    }
    if ($path === '/api/admin/auth/me' && $method === 'GET') {
        $user = ajn_auth($db);
        ajn_json(['user' => ajn_user_public($user)]);
    }
    if ($path === '/api/admin/auth/logout' && $method === 'POST') {
        ajn_require_origin($config);
        $token = $_COOKIE['ajn_admin_session'] ?? '';
        if (is_string($token) && preg_match('/^[a-f0-9]{64}$/D', $token)) {
            ajn_exec($db, 'DELETE FROM admin_sessions WHERE session_token_hash=?', [hash('sha256', $token)]);
        }
        setcookie('ajn_admin_session', '', ['expires' => 1, 'path' => '/', 'secure' => true, 'httponly' => true, 'samesite' => 'Strict']);
        ajn_json(['success' => true, 'message' => 'Sessão encerrada com sucesso.']);
    }
    if ($path === '/api/admin/auth/forgot-password' && $method === 'POST') {
        ajn_require_origin($config);
        ajn_rate_limit($db, 'admin-password-recovery', 5, 900);
        if (!ajn_email_configured($config)) ajn_json(['error' => 'Serviço de recuperação temporariamente indisponível.'], 503);
        $body = ajn_body();
        $email = mb_strtolower(ajn_text($body['email'] ?? null, 254));
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) ajn_json(['error' => 'E-mail inválido.'], 400);
        $generic = 'Se houver uma conta ativa para este e-mail, enviaremos instruções de recuperação.';
        $user = ajn_fetch($db, 'SELECT id,email FROM admin_users WHERE email=? AND is_active=1 LIMIT 1', [$email]);
        if (!$user) ajn_json(['success' => true, 'message' => $generic], 202);
        $token = bin2hex(random_bytes(32));
        $expires = time() + 1800;
        ajn_exec($db, 'UPDATE admin_users SET reset_token_hash=?,reset_expires_at=?,reset_attempts=0,updated_at=? WHERE id=? AND is_active=1', [hash('sha256', $token), $expires, time(), $user['id']]);
        $link = rtrim($config['app_url'], '/') . '/admin/carreiras/?resetToken=' . rawurlencode($token);
        $sent = ajn_send_email($config, $user['email'], 'Recuperação de acesso — AJN Carreiras', "Recebemos uma solicitação de recuperação de acesso.\n\nUse este link em até 30 minutos:\n$link\n\nSe você não solicitou a recuperação, ignore esta mensagem.");
        if (!$sent) {
            ajn_exec($db, 'UPDATE admin_users SET reset_token_hash=NULL,reset_expires_at=NULL,reset_attempts=0,updated_at=? WHERE id=?', [time(), $user['id']]);
            error_log('[AJN_CAREERS] password recovery email delivery failed');
            ajn_json(['error' => 'Serviço de e-mail temporariamente indisponível.'], 503);
        }
        ajn_audit($db, 'admin', $user['id'], 'AUTH_PASSWORD_RECOVERY_REQUESTED', 'auth', $user['id']);
        ajn_json(['success' => true, 'message' => $generic], 202);
    }
    if ($path === '/api/admin/auth/reset-password' && $method === 'POST') {
        ajn_require_origin($config);
        ajn_rate_limit($db, 'admin-password-reset', 10, 900);
        $body = ajn_body();
        $token = $body['token'] ?? null;
        $newPassword = $body['newPassword'] ?? null;
        if (!is_string($token) || !preg_match('/^[a-f0-9]{64}$/D', $token) || !is_string($newPassword) || strlen($newPassword) < 16 || strlen($newPassword) > 1024) {
            ajn_json(['error' => 'Token ou senha inválidos.'], 400);
        }
        $user = ajn_fetch($db, 'SELECT id FROM admin_users WHERE reset_token_hash=? AND reset_expires_at>? AND reset_attempts<5 AND is_active=1 LIMIT 1', [hash('sha256', $token), time()]);
        if (!$user) ajn_json(['error' => 'Token inválido, expirado ou já utilizado.'], 400);
        $db->beginTransaction();
        try {
            $updated = ajn_exec($db, 'UPDATE admin_users SET password_hash=?,reset_token_hash=NULL,reset_expires_at=NULL,reset_attempts=0,failed_attempts=0,locked_until=NULL,updated_at=? WHERE id=? AND reset_token_hash=? AND reset_expires_at>?', [password_hash($newPassword, PASSWORD_DEFAULT), time(), $user['id'], hash('sha256', $token), time()]);
            if ($updated !== 1) throw new RuntimeException('Password reset token already consumed.');
            ajn_exec($db, 'DELETE FROM admin_sessions WHERE user_id=?', [$user['id']]);
            ajn_audit($db, 'admin', $user['id'], 'AUTH_PASSWORD_RESET', 'auth', $user['id']);
            $db->commit();
        } catch (Throwable $error) {
            if ($db->inTransaction()) $db->rollBack();
            throw $error;
        }
        ajn_json(['success' => true, 'message' => 'Senha redefinida. Faça login novamente com MFA.']);
    }
    if (in_array($path, ['/api/admin/auth/mfa/setup', '/api/admin/auth/mfa/activate'], true)) {
        ajn_auth($db);
        ajn_json(['error' => 'Ativação MFA por este endpoint aguarda revisão do fluxo de provisionamento.'], 503);
    }
    ajn_json(['error' => 'Endpoint não encontrado.'], 404);
}

function ajn_validate_job(array $payload, bool $partial = false): array
{
    $mapping = [
        'title' => 'title', 'slug' => 'slug', 'department' => 'department',
        'location' => 'location', 'employmentType' => 'employment_type',
        'experienceLevel' => 'experience_level', 'description' => 'description',
        'requirements' => 'requirements', 'differentials' => 'differentials',
        'benefits' => 'benefits', 'salaryMin' => 'salary_min',
        'salaryMax' => 'salary_max', 'salaryIsDisclosed' => 'salary_is_disclosed',
        'status' => 'status', 'openingsCount' => 'openings_count',
    ];
    $mandatory = ['title', 'slug', 'department', 'location', 'employmentType', 'experienceLevel', 'description', 'requirements', 'status'];
    if (!$partial) foreach ($mandatory as $key) {
        if (!array_key_exists($key, $payload) || $payload[$key] === '' || $payload[$key] === null) {
            ajn_json(['error' => 'Dados da vaga inválidos.', 'field' => $key], 400);
        }
    }
    if (isset($payload['status']) && !in_array($payload['status'], ['draft', 'published', 'paused', 'closed', 'archived'], true)) {
        ajn_json(['error' => 'Status da vaga inválido.'], 400);
    }
    if (isset($payload['slug']) && (!is_string($payload['slug']) || !preg_match('/^[a-z0-9][a-z0-9-]{0,198}$/D', $payload['slug']))) {
        ajn_json(['error' => 'Slug inválido.'], 400);
    }
    $values = [];
    foreach ($mapping as $key => $column) {
        if (!array_key_exists($key, $payload)) continue;
        $value = $payload[$key];
        if ($key === 'requirements') $value = is_array($value) ? json_encode($value, JSON_UNESCAPED_UNICODE) : $value;
        if (in_array($key, ['salaryMin', 'salaryMax', 'openingsCount'], true)) {
            if ($value !== null && (!is_int($value) || $value < 0 || $value > 100000000)) {
                ajn_json(['error' => 'Valor numérico inválido.', 'field' => $key], 400);
            }
        } elseif ($key === 'salaryIsDisclosed') {
            if (!is_bool($value)) ajn_json(['error' => 'Indicador salarial inválido.'], 400);
            $value = (int) $value;
        } elseif ($value !== null) {
            if (!is_string($value) || strlen($value) > (in_array($key, ['description', 'requirements', 'benefits', 'differentials'], true) ? 20000 : 300)) {
                ajn_json(['error' => 'Texto inválido.', 'field' => $key], 400);
            }
            $value = trim($value);
        }
        $values[$column] = $value;
    }
    return $values;
}

function ajn_admin_jobs(PDO $db, string $method, string $path, array $config): never
{
    if ($path === '/api/admin/jobs' || $path === '/api/admin/jobs/') {
        if ($method === 'GET') {
            ajn_auth($db, 'jobs:read');
            $rows = ajn_list($db, 'SELECT j.*, (SELECT COUNT(*) FROM job_applications a WHERE a.job_id=j.id) AS applications_count FROM job_postings j ORDER BY j.created_at DESC LIMIT 500');
            $jobs = array_map(static function (array $row): array {
                $job = ajn_job($row, true);
                $job['requirements'] = $row['requirements'];
                $job['applicationsCount'] = (int) $row['applications_count'];
                $job['createdAt'] = gmdate('c', (int) $row['created_at']);
                return $job;
            }, $rows);
            ajn_json(['jobs' => $jobs]);
        }
        if ($method === 'POST') {
            $user = ajn_auth($db, 'jobs:write');
            ajn_require_origin($config);
            $values = ajn_validate_job(ajn_body());
            if (ajn_fetch($db, 'SELECT id FROM job_postings WHERE slug=?', [$values['slug']])) {
                ajn_json(['error' => 'Já existe uma vaga com este slug.'], 409);
            }
            $id = ajn_uuid();
            $now = time();
            $values += ['salary_min' => null, 'salary_max' => null, 'salary_is_disclosed' => 0, 'openings_count' => 1, 'differentials' => null, 'benefits' => null];
            $values += ['id' => $id, 'published_at' => $values['status'] === 'published' ? $now : null, 'closed_at' => null, 'created_at' => $now, 'updated_at' => $now];
            $columns = array_keys($values);
            ajn_exec($db, 'INSERT INTO job_postings (' . implode(',', $columns) . ') VALUES (' . implode(',', array_fill(0, count($columns), '?')) . ')', array_values($values));
            ajn_audit($db, 'admin', $user['id'], 'JOB_CREATED', 'job', $id);
            ajn_json(['success' => true, 'jobId' => $id, 'message' => 'Vaga cadastrada com sucesso.'], 201);
        }
    }
    if ($method === 'PUT' && preg_match('~^/api/admin/jobs/([a-f0-9-]{36})$~D', $path, $match)) {
        $user = ajn_auth($db, 'jobs:write');
        ajn_require_origin($config);
        $job = ajn_fetch($db, 'SELECT * FROM job_postings WHERE id=?', [$match[1]]);
        if (!$job) ajn_json(['error' => 'Vaga não encontrada.'], 404);
        $values = ajn_validate_job(ajn_body(), true);
        unset($values['slug']); // Slug é identidade pública imutável após criação.
        if (($values['status'] ?? null) === 'published' && !$job['published_at']) $values['published_at'] = time();
        if (($values['status'] ?? null) === 'closed') $values['closed_at'] = time();
        $values['updated_at'] = time();
        $updates = [];
        foreach ($values as $column => $_) $updates[] = $column . '=?';
        ajn_exec($db, 'UPDATE job_postings SET ' . implode(',', $updates) . ' WHERE id=?', [...array_values($values), $job['id']]);
        ajn_audit($db, 'admin', $user['id'], 'JOB_UPDATED', 'job', $job['id']);
        ajn_json(['success' => true, 'message' => 'Vaga atualizada com sucesso.']);
    }
    ajn_json(['error' => 'Endpoint não encontrado.'], 404);
}

function ajn_admin_users(PDO $db, string $method, string $path, array $config): never
{
    $admin = ajn_auth($db);
    if ($admin['role'] !== 'super_admin') ajn_json(['error' => 'Apenas administradores podem gerenciar operadores.'], 403);
    if ($method === 'GET' && ($path === '/api/admin/users' || $path === '/api/admin/users/')) {
        $rows = ajn_list($db, 'SELECT id,name,email,role,is_active,mfa_enabled,created_at FROM admin_users ORDER BY created_at DESC LIMIT 200');
        $users = array_map(static fn(array $r): array => [
            'id' => $r['id'], 'name' => $r['name'], 'email' => $r['email'],
            'role' => $r['role'], 'isActive' => (bool) $r['is_active'],
            'mfaEnabled' => (bool) $r['mfa_enabled'], 'createdAt' => gmdate('c', (int) $r['created_at']),
        ], $rows);
        ajn_json(['users' => $users, 'count' => count($users)]);
    }
    ajn_require_origin($config);
    if ($method === 'POST' && ($path === '/api/admin/users' || $path === '/api/admin/users/')) {
        $data = ajn_body();
        $name = ajn_text($data['name'] ?? null, 200);
        $email = mb_strtolower(ajn_text($data['email'] ?? null, 254));
        $password = $data['password'] ?? null;
        $role = $data['role'] ?? 'recruiter';
        if (mb_strlen($name) < 3 || !filter_var($email, FILTER_VALIDATE_EMAIL) || !is_string($password) || strlen($password) < 12 || strlen($password) > 1024 || !in_array($role, ['recruiter', 'viewer', 'dpo'], true)) {
            ajn_json(['error' => 'Dados inválidos. Exija senha com pelo menos 12 caracteres.'], 400);
        }
        if (ajn_fetch($db, 'SELECT id FROM admin_users WHERE email=?', [$email])) ajn_json(['error' => 'E-mail já cadastrado.'], 409);
        $id = ajn_uuid();
        // Novos operadores exigem provisionamento MFA antes de receber acesso.
        // Nunca criar uma conta ativa sem segundo fator apenas para facilitar homologação.
        ajn_exec($db, 'INSERT INTO admin_users (id,name,email,password_hash,role,is_active,mfa_enabled,mfa_required,created_at,updated_at) VALUES (?,?,?,?,?,0,0,1,?,?)',
            [$id, $name, $email, password_hash($password, PASSWORD_DEFAULT), $role, time(), time()]);
        ajn_audit($db, 'admin', $admin['id'], 'ADMIN_USER_CREATED', 'admin', $id);
        ajn_json(['success' => true, 'userId' => $id, 'message' => 'Operador cadastrado como pendente: exija provisionamento MFA antes da ativação.'], 201);
    }
    if ($method === 'PUT' && preg_match('~^/api/admin/users/([a-f0-9-]{36})/status$~D', $path, $match)) {
        if ($match[1] === $admin['id']) ajn_json(['error' => 'Não é permitido desativar a própria conta.'], 400);
        $data = ajn_body();
        if (!isset($data['isActive']) || !is_bool($data['isActive'])) ajn_json(['error' => 'Status inválido.'], 400);
        $target = ajn_fetch($db, 'SELECT id FROM admin_users WHERE id=?', [$match[1]]);
        if (!$target) ajn_json(['error' => 'Operador não encontrado.'], 404);
        if ($data['isActive']) {
            $ready = ajn_fetch($db, 'SELECT mfa_enabled,mfa_secret FROM admin_users WHERE id=?', [$match[1]]);
            if (!$ready || !(int) $ready['mfa_enabled'] || empty($ready['mfa_secret'])) {
                ajn_json(['error' => 'Ativação bloqueada: é obrigatório provisionar MFA antes de liberar a conta.'], 409);
            }
        }
        $db->beginTransaction();
        try {
            ajn_exec($db, 'UPDATE admin_users SET is_active=?,updated_at=? WHERE id=?', [(int) $data['isActive'], time(), $match[1]]);
            if (!$data['isActive']) ajn_exec($db, 'DELETE FROM admin_sessions WHERE user_id=?', [$match[1]]);
            ajn_audit($db, 'admin', $admin['id'], 'ADMIN_USER_STATUS_CHANGED', 'admin', $match[1]);
            $db->commit();
        } catch (Throwable $error) { $db->rollBack(); throw $error; }
        ajn_json(['success' => true, 'message' => 'Operador atualizado com sucesso.']);
    }
    ajn_json(['error' => 'Endpoint não encontrado.'], 404);
}

function ajn_admin_pipeline(PDO $db, string $method, string $path, array $config): never
{
    if ($method === 'GET' && preg_match('~^/api/admin/pipeline/([a-f0-9-]{36})$~D', $path, $match)) {
        ajn_auth($db, 'applications:read');
        $stages = ajn_list($db, 'SELECT * FROM recruitment_stages WHERE job_id IS NULL OR job_id=? ORDER BY stage_order', [$match[1]]);
        $apps = ajn_list($db,
            'SELECT a.id,a.candidate_id,a.tracking_code,a.current_stage_id,a.status,a.recruiter_rating,a.recruiter_notes,a.applied_at,c.full_name,c.email,c.phone,c.city,c.state,c.current_title FROM job_applications a JOIN candidates c ON c.id=a.candidate_id WHERE a.job_id=?', [$match[1]]);
        $result = [];
        foreach ($stages as $stage) {
            $stageApps = [];
            foreach ($apps as $app) {
                if ($app['current_stage_id'] !== $stage['id']) continue;
                $stageApps[] = [
                    'id' => $app['id'], 'candidateId' => $app['candidate_id'], 'trackingCode' => $app['tracking_code'],
                    'currentStageId' => $app['current_stage_id'], 'status' => $app['status'],
                    'rating' => $app['recruiter_rating'] === null ? null : (int) $app['recruiter_rating'],
                    'notes' => $app['recruiter_notes'], 'appliedAt' => gmdate('c', (int) $app['applied_at']),
                    'fullName' => $app['full_name'], 'email' => $app['email'], 'phone' => $app['phone'],
                    'city' => $app['city'], 'state' => $app['state'], 'currentTitle' => $app['current_title'],
                ];
            }
            $result[] = [
                'id' => $stage['id'], 'jobId' => $stage['job_id'], 'name' => $stage['name'],
                'stageOrder' => (int) $stage['stage_order'],
                'isTerminalHired' => (bool) $stage['is_terminal_hired'],
                'isTerminalRejected' => (bool) $stage['is_terminal_rejected'],
                'candidates' => $stageApps,
            ];
        }
        ajn_json(['stages' => $result]);
    }
    if ($method === 'POST' && $path === '/api/admin/pipeline/move-stage') {
        $admin = ajn_auth($db, 'applications:stage_move');
        ajn_require_origin($config);
        $data = ajn_body();
        $applicationId = $data['applicationId'] ?? null;
        $stageId = $data['targetStageId'] ?? null;
        if (!is_string($applicationId) || !is_string($stageId)) ajn_json(['error' => 'Dados inválidos.'], 400);
        $app = ajn_fetch($db, 'SELECT id,job_id FROM job_applications WHERE id=?', [$applicationId]);
        $stage = ajn_fetch($db, 'SELECT id,job_id,is_terminal_hired,is_terminal_rejected FROM recruitment_stages WHERE id=?', [$stageId]);
        if (!$app || !$stage || ($stage['job_id'] !== null && $stage['job_id'] !== $app['job_id'])) ajn_json(['error' => 'Candidatura ou etapa não encontrada.'], 404);
        $status = (int) $stage['is_terminal_hired'] ? 'hired' : ((int) $stage['is_terminal_rejected'] ? 'rejected' : 'active');
        $rating = $data['rating'] ?? null;
        if ($rating !== null && (!is_int($rating) || $rating < 1 || $rating > 5)) ajn_json(['error' => 'Avaliação inválida.'], 400);
        $notes = ajn_text($data['notes'] ?? null, 4000);
        $reason = ajn_text($data['rejectionReason'] ?? null, 2000);
        $db->beginTransaction();
        try {
            ajn_exec($db, 'UPDATE job_applications SET current_stage_id=?,status=?,recruiter_rating=?,recruiter_notes=?,rejection_reason=?,updated_at=? WHERE id=?',
                [$stageId, $status, $rating, $notes ?: null, $reason ?: null, time(), $applicationId]);
            ajn_audit($db, 'admin', $admin['id'], 'STAGE_MOVED', 'application', $applicationId);
            $db->commit();
        } catch (Throwable $error) { $db->rollBack(); throw $error; }
        ajn_json(['success' => true, 'message' => 'Candidato movimentado com sucesso no pipeline.']);
    }
    ajn_json(['error' => 'Endpoint não encontrado.'], 404);
}

function ajn_admin_audit(PDO $db, string $method, string $path): never
{
    if ($method !== 'GET' || !in_array($path, ['/api/admin/audit', '/api/admin/audit/'], true)) ajn_json(['error' => 'Endpoint não encontrado.'], 404);
    ajn_auth($db, 'audit:read');
    $limit = max(1, min(100, (int) ($_GET['limit'] ?? 50)));
    $offset = max(0, min(10000, (int) ($_GET['offset'] ?? 0)));
    $filters = [];
    $args = [];
    foreach (['action' => 'action', 'resource' => 'resource', 'actorType' => 'actor_type'] as $param => $col) {
        if (isset($_GET[$param]) && is_string($_GET[$param])) {
            $filters[] = $col . '=?';
            $args[] = mb_substr($_GET[$param], 0, 100);
        }
    }
    $sql = 'SELECT id,actor_id,actor_type,action,resource,resource_id,details_json,timestamp FROM audit_logs';
    if ($filters) $sql .= ' WHERE ' . implode(' AND ', $filters);
    $sql .= ' ORDER BY timestamp DESC LIMIT ' . $limit . ' OFFSET ' . $offset;
    $rows = ajn_list($db, $sql, $args);
    $logs = array_map(static fn(array $r): array => [
        'id' => $r['id'], 'actorId' => $r['actor_id'], 'actorType' => $r['actor_type'],
        'action' => $r['action'], 'resource' => $r['resource'], 'resourceId' => $r['resource_id'],
        'detailsJson' => $r['details_json'], 'timestamp' => gmdate('c', (int) $r['timestamp']),
    ], $rows);
    ajn_json(['logs' => $logs, 'count' => count($logs), 'limit' => $limit, 'offset' => $offset]);
}
