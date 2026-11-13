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

$beginIndex = strpos($applications, '$db->beginTransaction();');
$demoteIndex = strpos($applications, 'UPDATE resumes SET is_current=0 WHERE candidate_id=? AND is_current=1');
$insertIndex = strpos($applications, 'INSERT INTO resumes (id,candidate_id,file_key');
check_contract('recandidatura desativa currículo antigo dentro da transação', $beginIndex !== false && $demoteIndex !== false && $insertIndex !== false && $beginIndex < $demoteIndex && $demoteIndex < $insertIndex);

foreach ($checks as $label => $pass) fwrite($pass ? STDOUT : STDERR, ($pass ? 'PASS' : 'FAIL') . ' — ' . $label . "\n");
if (in_array(false, $checks, true)) exit(1);
fwrite(STDOUT, count($checks) . " contratos PHP/Hostinger PASS. Não substitui banco, SMTP, navegador ou staging real.\n");
