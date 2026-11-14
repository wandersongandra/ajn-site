<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') exit(1);

$root = dirname(__DIR__);
$repo = dirname($root);
$checks = [];

function check_contract(string $label, bool $result): void
{
    global $checks;
    $checks[$label] = $result;
}

function source_contract(string $path): string
{
    $source = file_get_contents($path);
    if (!is_string($source)) throw new RuntimeException('Não foi possível ler o artefato de contrato.');
    return $source;
}

$bootstrap = source_contract($root . '/bootstrap.php');
$app = source_contract($root . '/app.php');
$applications = source_contract($root . '/applications.php');
$admin = source_contract($root . '/admin.php');
$lgpd = source_contract($root . '/lgpd.php');
$schema = source_contract($root . '/migrations/001_initial.sql');
$api = source_contract($repo . '/public/api/index.php');
$htaccess = source_contract($repo . '/public/.htaccess');
$careerScript = source_contract($repo . '/public/scripts/carreiras.js');
$adminScript = source_contract($repo . '/public/scripts/admin-carreiras.js');
$talentPage = source_contract($repo . '/src/pages/carreiras/talentos.astro');
$jobApplicationPage = source_contract($repo . '/src/pages/carreiras/vaga.astro');
$frontendExecutable = preg_replace('/\/\/.*$/m', '', $careerScript . "\n" . $adminScript) ?? ($careerScript . $adminScript);

check_contract('front controller privado', str_contains($api, 'AJN_CAREERS_BOOTSTRAP') && str_contains($api, 'require $bootstrap'));
check_contract('PDO sem emulação', str_contains($bootstrap, 'PDO::ATTR_EMULATE_PREPARES => false'));
check_contract('cookie HttpOnly Secure SameSite Strict', str_contains($bootstrap, "'httponly' => true") && str_contains($bootstrap, "'secure' => true") && str_contains($bootstrap, "'samesite' => 'Strict'"));
check_contract('recuperação de senha implementada', str_contains($admin, '/api/admin/auth/forgot-password') && str_contains($admin, 'reset_token_hash') && str_contains($admin, 'ajn_send_email'));
check_contract('recuperação de protocolo implementada', str_contains($applications, '/api/applications/recover-tracking') && str_contains($applications, '/api/applications/verify-recovery'));
check_contract('titularidade implementada', str_contains($applications, 'verificationToken') && str_contains($applications, 'ajn_verify_candidate_verification'));
check_contract('tokens de recuperação consumidos atomicamente', str_contains($admin, 'reset_token_hash=? AND reset_expires_at>?') && str_contains($applications, 'email_verification_code_hash=? AND email_verification_expires_at>?'));
check_contract('LGPD pública e administrativa', str_contains($lgpd, '/api/lgpd/deletion-request') && str_contains($lgpd, '/api/admin/lgpd/requests') && str_contains($lgpd, 'LGPD_DATA_ERASURE'));
check_contract('storage privado fail-closed', str_contains($applications, "Armazenamento privado não configurado") && str_contains($applications, 'move_uploaded_file'));
check_contract('schema MySQL com InnoDB', substr_count($schema, 'ENGINE=InnoDB') >= 12 && str_contains($schema, 'request_rate_limits'));
check_contract('same-origin Apache routing', str_contains($htaccess, 'RewriteRule ^api(?:/.*)?$ api/index.php') && str_contains($htaccess, 'RewriteRule ^carreiras/'));
check_contract('frontend same-origin sem storage de tokens', !preg_match('/\b(?:localStorage|sessionStorage)\b/', $careerScript . $adminScript));
check_contract('frontend sem sinks proibidos', !preg_match('/\b(?:innerHTML|outerHTML|insertAdjacentHTML|document\.write|eval\s*\(|new Function\s*\()/', $frontendExecutable));
check_contract('SMTP fecha sockets em falha', str_contains($bootstrap, 'finally {') && str_contains($bootstrap, 'fclose($socket);'));
check_contract('retenção do banco de talentos exige aceite explícito', str_contains($applications, 'if (!$job && !$consentRetention)') && !str_contains($applications, '(!$job || $consentRetention) ? 1 : 0') && str_contains($talentPage, 'name="consentRetention" type="checkbox" value="true" required'));
check_contract('retenção opcional em candidatura inicia desmarcada', str_contains($jobApplicationPage, 'id="apply-consent-retention" name="consentRetention" type="checkbox" value="true" />'));
$schemaHardening = source_contract($root . '/migrations/002_hardening.sql');
check_contract('cookie de sessão com prefixo __Host-', str_contains($bootstrap, "const AJN_SESSION_COOKIE = '__Host-ajn_admin_session'") &&
    !preg_match("/'ajn_admin_session'/", $bootstrap . $admin));
check_contract('sessão com inatividade e teto absoluto', str_contains($bootstrap, 'AJN_SESSION_IDLE_SECONDS') &&
    str_contains($bootstrap, 'AJN_SESSION_ABSOLUTE_SECONDS') &&
    str_contains($bootstrap, 's.expires_at>? AND s.absolute_expires_at>?') &&
    str_contains($schemaHardening, 'absolute_expires_at'));
check_contract('código MFA não pode ser reapresentado', str_contains($bootstrap, 'function ajn_totp(string $secret, int $window = 1, ?string $code = null): ?int') &&
    str_contains($admin, 'mfa_last_counter < ?') && str_contains($admin, 'AUTH_MFA_REPLAY_BLOCKED') &&
    str_contains($schemaHardening, 'mfa_last_counter'));
check_contract('resposta da API isolada de outras origens', str_contains($bootstrap, "header('Cross-Origin-Resource-Policy: same-origin')") &&
    str_contains($bootstrap, "header('Vary: Origin')"));
check_contract('origem verificada antes de consumir cota de login', strpos($admin, 'ajn_require_origin($config);') < strpos($admin, "ajn_rate_limit(\$db, 'admin-login'"));
check_contract('janelas de rate limit expiradas são removidas', str_contains($bootstrap, 'DELETE FROM request_rate_limits WHERE expires_at <= ?'));
check_contract('health não revela ambiente de produção', str_contains($app, "\$environment !== 'production'") && str_contains($app, "ajn_rate_limit(\$db, 'health'"));
check_contract('senha mínima igual na criação e na redefinição', str_contains($admin, 'strlen($password) < 16') &&
    str_contains($admin, 'strlen($newPassword) < 16') && !str_contains($admin, '< 12'));
check_contract('diretório de currículos com negação explícita', str_contains(source_contract($root . '/resumes-directory.htaccess'), 'Require all denied'));
check_contract('download de currículo limitado por operador', str_contains($applications, "ajn_rate_limit(\$db, 'admin-resume-download', 40, 3600, (string) \$admin['id'])") &&
    str_contains($bootstrap, 'int $window, ?string $identity = null'));
check_contract('senha degenerada recusada nos dois fluxos', substr_count($admin, 'ajn_password_is_weak(') === 2 &&
    str_contains($bootstrap, 'function ajn_password_is_weak(string $password): bool'));
check_contract('recruiter sem leitura de auditoria', !str_contains($schema, "'recruiter','audit:read'") &&
    str_contains(source_contract($root . '/migrations/003_least_privilege.sql'), "role='recruiter' AND permission='audit:read'"));
check_contract('assunto de e-mail em encoded-word', str_contains($bootstrap, 'ajn_mime_header($subject)') &&
    str_contains($bootstrap, '=?UTF-8?B?'));
check_contract('logout limpa dados do navegador', str_contains($admin, 'Clear-Site-Data'));
// <If> dependeria de Apache 2.4 e o host roda LiteSpeed: exigir SetEnvIf evita
// reintroduzir uma diretiva que derrubaria o site caso nao fosse reconhecida.
check_contract('painel administrativo sem cache', str_contains($htaccess, 'no-store, max-age=0') &&
    str_contains($htaccess, 'SetEnvIf Request_URI "^/admin(/|$)" AJN_ADMIN_AREA=1') &&
    str_contains($htaccess, 'env=AJN_ADMIN_AREA') && !str_contains($htaccess, '<If '));
$functional = source_contract($root . '/tests/functional.php');
$smoke = source_contract($root . '/tests/smoke.php');
$seedAdmin = source_contract($root . '/seed-admin.php');
$provisionMfa = source_contract($root . '/provision-user-mfa.php');
$schemaIndexes = source_contract($root . '/migrations/004_indexes.sql');

$phpFilesToParse = [$bootstrap, $app, $applications, $admin, $lgpd, $api, $smoke, $functional, $seedAdmin, $provisionMfa];
$allPhpValid = true;
foreach ($phpFilesToParse as $phpSource) {
    try {
        token_get_all($phpSource, TOKEN_PARSE);
    } catch (ParseError) {
        $allPhpValid = false;
    }
}
check_contract('todos os scripts PHP compilam sem ParseError', $allPhpValid);
check_contract('storage privado normalizado entre sistemas e reutilizado em upload/download/LGPD',
    str_contains($bootstrap, 'function ajn_private_resume_dir(array $config, bool $requireWritable = false): ?string') &&
    str_contains($applications, 'ajn_private_resume_dir($config, true)') &&
    str_contains($applications, 'ajn_private_resume_dir($config, false)') &&
    str_contains($lgpd, 'ajn_private_resume_dir($config, false)'));
check_contract('URLs externas opcionais restritas a http/https sem credenciais',
    str_contains($bootstrap, 'function ajn_optional_http_url(') &&
    str_contains($applications, 'ajn_optional_http_url($_POST[\'linkedinUrl\']') &&
    str_contains($applications, 'ajn_optional_http_url($_POST[\'portfolioUrl\']'));
check_contract('curingas LIKE escapados nas consultas de vagas',
    str_contains($bootstrap, 'function ajn_escape_like(') &&
    str_contains($app, "ESCAPE '!'"));
check_contract('SMTP exige TLS >= 1.2 com validação de certificado e peer_name',
    str_contains($bootstrap, "'verify_peer' => true") &&
    str_contains($bootstrap, "'verify_peer_name' => true") &&
    str_contains($bootstrap, "'allow_self_signed' => false") &&
    str_contains($bootstrap, 'STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT'));
check_contract('página SSR de vaga envia CSP e Permissions-Policy',
    str_contains($app, "Content-Security-Policy:") &&
    str_contains($app, "Permissions-Policy:"));
check_contract('login equaliza tempo para usuário inexistente/inativo',
    substr_count($admin, 'password_verify($password,') >= 2);
check_contract('Apache/LiteSpeed desativa listagem e bloqueia dotfiles fora .well-known',
    str_contains($htaccess, 'Options -Indexes') &&
    str_contains($htaccess, 'RewriteRule (^|/)\.(?!well-known'));
check_contract('token de reset é removido da barra de endereço imediatamente após leitura',
    str_contains($adminScript, 'window.history.replaceState({}, document.title, window.location.pathname)'));
check_contract('módulo sem travessão ou reticência tipográfica', !preg_match('/[\x{2013}\x{2014}\x{2026}]/u',
    $bootstrap . $app . $admin . $applications . $lgpd . $functional . $seedAdmin . $provisionMfa . $careerScript . $adminScript));

$beginIndex = strpos($applications, '$db->beginTransaction();');
$demoteIndex = strpos($applications, 'UPDATE resumes SET is_current=0 WHERE candidate_id=? AND is_current=1');
$insertIndex = strpos($applications, 'INSERT INTO resumes (id,candidate_id,file_key');
check_contract('recandidatura desativa currículo antigo dentro da transação', $beginIndex !== false && $demoteIndex !== false && $insertIndex !== false && $beginIndex < $demoteIndex && $demoteIndex < $insertIndex);

preg_match('/recruiter:\s*\[[^\]]+\]/', $adminScript, $recruiterPermMatch);
$adminPageSource = source_contract(dirname($root) . '/src/pages/admin/carreiras/index.astro');
check_contract('painel oculta audit para recruiter conforme banco e exige 16 caracteres na UI',
    !str_contains($recruiterPermMatch[0] ?? 'audit:read', 'audit:read')
    && str_contains($adminPageSource, 'minlength="16"')
    && !str_contains($adminPageSource, 'value="super_admin"'));
check_contract('formulários públicos de carreiras reiniciam widget Turnstile após envio',
    str_contains($careerScript, 'function resetTurnstileWidget(')
    && substr_count($careerScript, 'resetTurnstileWidget(') >= 4);
check_contract('painel admin usa diálogo acessível em vez de alert/confirm e mapeia erasure LGPD',
    str_contains($adminScript, "erasure: 'Exclusão Definitiva'")
    && str_contains($adminPageSource, 'data-confirm-dialog')
    && !preg_match('/\b(?:alert|confirm)\s*\(/', $frontendExecutable)
    && !str_contains($adminScript, 'authToken')
    && !str_contains($adminScript, 'getAuthHeaders'));
check_contract('migration 004 cria índices compatíveis com MySQL 8+/MariaDB sem IF NOT EXISTS',
    !str_contains($schemaIndexes, 'IF NOT EXISTS')
    && str_contains($schemaIndexes, 'idx_jobs_status_published')
    && str_contains($schemaIndexes, 'idx_candidates_created_at')
    && str_contains($schemaIndexes, 'idx_data_subject_requests_requested_at')
    && str_contains($schemaIndexes, 'idx_applications_applied_at'));
check_contract('CLI seed e provisionamento MFA reutilizam bootstrap e validam força/rotação',
    str_contains($seedAdmin, "define('AJN_DISABLE_AUTO_DISPATCH', true)")
    && str_contains($seedAdmin, 'ajn_password_is_weak')
    && str_contains($provisionMfa, "define('AJN_DISABLE_AUTO_DISPATCH', true)")
    && str_contains($provisionMfa, 'AJN_MFA_ROTATE')
    && str_contains($provisionMfa, 'mfa_last_counter=NULL'));

foreach ($checks as $label => $pass) fwrite($pass ? STDOUT : STDERR, ($pass ? 'PASS' : 'FAIL') . ' - ' . $label . "\n");
if (in_array(false, $checks, true)) exit(1);
fwrite(STDOUT, count($checks) . " contratos PHP/Hostinger PASS. Não substitui banco, SMTP, navegador ou staging real.\n");
