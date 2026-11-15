<?php
declare(strict_types=1);

/**
 * AJN Carreiras: entrada de API para PHP/PDO na Hostinger Premium.
 * Este codigo depende de um banco dedicado e de configuracao privada.
 */

function ajn_job(array $row, bool $withDetails = false): array
{
    $job = [
        'id' => $row['id'], 'title' => $row['title'], 'slug' => $row['slug'],
        'department' => $row['department'], 'location' => $row['location'],
        'employmentType' => $row['employment_type'], 'experienceLevel' => $row['experience_level'],
        'description' => $row['description'],
        'salaryMin' => (int) $row['salary_is_disclosed'] ? ($row['salary_min'] === null ? null : (int) $row['salary_min']) : null,
        'salaryMax' => (int) $row['salary_is_disclosed'] ? ($row['salary_max'] === null ? null : (int) $row['salary_max']) : null,
        'salaryIsDisclosed' => (bool) $row['salary_is_disclosed'],
        'openingsCount' => (int) $row['openings_count'],
        'publishedAt' => $row['published_at'] ? gmdate('c', (int) $row['published_at']) : null,
        'status' => $row['status'],
    ];
    if ($withDetails) {
        $requirements = json_decode($row['requirements'], true);
        $job += [
            'requirements' => is_array($requirements) ? $requirements : [$row['requirements']],
            'differentials' => $row['differentials'], 'benefits' => $row['benefits'],
        ];
    }
    return $job;
}

function ajn_job_jsonld(array $job): array
{
    $location = trim((string) ($job['location'] ?? 'Brasil'));
    $region = null;
    if (preg_match('/(?:^|[\s,\/-])([A-Z]{2})(?:$|[\s,\/-])/i', $location, $match)) $region = strtoupper($match[1]);
    $address = ['@type' => 'PostalAddress', 'addressLocality' => $location, 'addressCountry' => 'BR'];
    if ($region !== null) $address['addressRegion'] = $region;
    $data = [
        '@context' => 'https://schema.org', '@type' => 'JobPosting',
        'title' => $job['title'], 'description' => $job['description'],
        'datePosted' => $job['publishedAt'],
        'employmentType' => $job['employmentType'] === 'CLT' ? 'FULL_TIME' : ($job['employmentType'] === 'Estágio' ? 'INTERN' : 'CONTRACTOR'),
        'hiringOrganization' => [
            '@type' => 'Organization', 'name' => 'AJN Consultoria e Engenharia',
            'sameAs' => 'https://ajnengenharia.com.br',
            'logo' => 'https://ajnengenharia.com.br/images/branding/ajn-logo-hd.webp',
        ],
        'jobLocation' => ['@type' => 'Place', 'address' => $address],
    ];
    if ($job['salaryIsDisclosed'] && $job['salaryMin'] !== null) {
        $data['baseSalary'] = ['@type' => 'MonetaryAmount', 'currency' => 'BRL', 'value' => [
            '@type' => 'QuantitativeValue', 'minValue' => $job['salaryMin'],
            'maxValue' => $job['salaryMax'] ?? $job['salaryMin'], 'unitText' => 'MONTH',
        ]];
    }
    return $data;
}

function ajn_html_escape(mixed $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function ajn_job_page(?array $job, array $config): never
{
    $found = $job !== null;
    http_response_code($found ? 200 : 404);
    if (function_exists('header_remove')) {
        @header_remove('X-Powered-By');
    }
    header('Content-Type: text/html; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header('Cross-Origin-Opener-Policy: same-origin');
    header('Cross-Origin-Resource-Policy: same-origin');
    header('Strict-Transport-Security: max-age=63072000; includeSubDomains; preload');
    header("Content-Security-Policy: default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; style-src 'self'; font-src 'self'; img-src 'self'");
    header("Permissions-Policy: accelerometer=(), autoplay=(), camera=(), clipboard-read=(), clipboard-write=(), geolocation=(), microphone=(), payment=(), usb=()");
    if (!$found) {
        header('X-Robots-Tag: noindex, follow');
        header('Cache-Control: no-store');
    }
    $title = $found ? $job['title'] . ' | Carreiras AJN' : 'Vaga não encontrada | AJN Carreiras';
    $canonical = $found ? rtrim($config['app_url'], '/') . '/carreiras/' . rawurlencode($job['slug']) . '/' : '';
    $description = $found ? 'Vaga de ' . $job['title'] . ' na AJN Consultoria e Engenharia.' : 'Esta oportunidade não está disponível.';
    $jsonLd = $found ? json_encode(ajn_job_jsonld($job), JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE) : '';
    echo '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">';
    echo '<title>' . ajn_html_escape($title) . '</title><meta name="description" content="' . ajn_html_escape($description) . '">';
    if ($found) echo '<link rel="canonical" href="' . ajn_html_escape($canonical) . '"><script type="application/ld+json">' . $jsonLd . '</script>';
    else echo '<meta name="robots" content="noindex, follow">';
    echo '<link rel="stylesheet" href="/styles/global.css"><link rel="stylesheet" href="/styles/carreiras.css"></head><body class="carreiras-page"><main class="site-shell">';
    echo '<nav class="carreiras-nav-bar" aria-label="Navegação"><a class="carreiras-nav-link" href="/carreiras/">← Voltar para vagas</a><a class="carreiras-nav-link" href="/carreiras/talentos/">Banco de talentos</a></nav>';
    if (!$found) {
        echo '<h1 class="carreiras-title">Esta oportunidade não está disponível</h1><p class="carreiras-lead">Consulte as vagas abertas ou cadastre seu currículo.</p>';
    } else {
        echo '<header class="carreiras-header"><p class="carreiras-eyebrow">Oportunidade profissional</p><h1 class="carreiras-title">' . ajn_html_escape($job['title']) . '</h1><p class="carreiras-lead">' . ajn_html_escape($job['department']) . ' · ' . ajn_html_escape($job['location']) . ' · ' . ajn_html_escape($job['employmentType']) . '</p></header>';
        echo '<section aria-labelledby="job-description"><h2 id="job-description">Descrição da oportunidade</h2><p>' . nl2br(ajn_html_escape($job['description'])) . '</p></section>';
        echo '<section aria-labelledby="job-requirements"><h2 id="job-requirements">Requisitos</h2><ul>';
        foreach ($job['requirements'] as $requirement) {
            if (is_string($requirement)) echo '<li>' . ajn_html_escape($requirement) . '</li>';
        }
        echo '</ul></section>';
        if ($job['differentials']) echo '<section><h2>Diferenciais</h2><p>' . ajn_html_escape($job['differentials']) . '</p></section>';
        if ($job['benefits']) echo '<section><h2>Benefícios</h2><p>' . ajn_html_escape($job['benefits']) . '</p></section>';
        echo '<section id="candidatura" class="carreiras-form-container"><h2>Candidate-se</h2><p>Inscrições para esta vaga estão disponíveis pelo nosso portal de carreiras.</p><a class="carreiras-button carreiras-button--primary" href="/carreiras/vaga/?slug=' . rawurlencode($job['slug']) . '">Abrir formulário de candidatura</a></section>';
    }
    echo '</main></body></html>';
    exit;
}

function ajn_public_jobs(PDO $db, string $method, string $path, array $config): never
{
    if ($method !== 'GET') ajn_json(['error' => 'Método não permitido.'], 405);
    ajn_rate_limit($db, 'jobs', 120, 60);
    if ($path === '/api/jobs' || $path === '/api/jobs/' || $path === '/carreiras' || $path === '/carreiras/') {
        $where = ['status = ?'];
        $values = ['published'];
        foreach (['department' => 'department', 'type' => 'employment_type', 'level' => 'experience_level'] as $param => $column) {
            if (!empty($_GET[$param]) && is_string($_GET[$param])) {
                $where[] = $column . ' = ?';
                $values[] = mb_substr($_GET[$param], 0, 120);
            }
        }
        if (!empty($_GET['location']) && is_string($_GET['location'])) {
            $where[] = "location LIKE ? ESCAPE '!'";
            $values[] = '%' . ajn_escape_like(mb_substr(trim($_GET['location']), 0, 100)) . '%';
        }
        if (!empty($_GET['q']) && is_string($_GET['q'])) {
            $where[] = "(title LIKE ? ESCAPE '!' OR description LIKE ? ESCAPE '!')";
            $term = '%' . ajn_escape_like(mb_substr(trim($_GET['q']), 0, 100)) . '%';
            array_push($values, $term, $term);
        }
        $rows = ajn_list($db, 'SELECT * FROM job_postings WHERE ' . implode(' AND ', $where) . ' ORDER BY published_at DESC, created_at DESC LIMIT ?', [...$values, 200]);
        $jobs = array_map(static fn(array $row): array => ajn_job($row), $rows);
        ajn_json(['jobs' => $jobs, 'count' => count($jobs)]);
    }
    if (preg_match('~^/(?:api/jobs|carreiras)/([a-z0-9][a-z0-9-]{0,198})/?$~D', $path, $match)) {
        $row = ajn_fetch($db, 'SELECT * FROM job_postings WHERE slug=? AND status=? LIMIT 1', [$match[1], 'published']);
        $job = $row ? ajn_job($row, true) : null;
        if (str_starts_with($path, '/carreiras/')) ajn_job_page($job, $config);
        if (!$job) {
            header('X-Robots-Tag: noindex, follow');
            ajn_json(['error' => 'Vaga não encontrada ou não está mais aberta.'], 404);
        }
        $jsonLd = ajn_job_jsonld($job);
        ajn_json(['job' => $job + ['jsonLd' => $jsonLd], 'jsonLd' => $jsonLd]);
    }
    ajn_json(['error' => 'Endpoint não encontrado.'], 404);
}

/**
 * Tabela centralizada de RBAC e metodos HTTP para /api/admin/* (deny-by-default).
 * Qualquer rota em /api/admin/* sem declaracao explicita nesta tabela falha fechada.
 */
function ajn_admin_route_policy(): array
{
    return [
        ['pattern' => '~^/api/admin/auth/login$~D', 'methods' => ['POST' => '__public_auth__']],
        ['pattern' => '~^/api/admin/auth/logout$~D', 'methods' => ['POST' => '__public_auth__']],
        ['pattern' => '~^/api/admin/auth/forgot-password$~D', 'methods' => ['POST' => '__public_auth__']],
        ['pattern' => '~^/api/admin/auth/reset-password$~D', 'methods' => ['POST' => '__public_auth__']],
        ['pattern' => '~^/api/admin/auth/me$~D', 'methods' => ['GET' => '__authenticated__']],
        ['pattern' => '~^/api/admin/auth/step-up$~D', 'methods' => ['POST' => '__authenticated__']],
        ['pattern' => '~^/api/admin/auth/mfa/(?:setup|activate)$~D', 'methods' => ['POST' => '__authenticated__']],
        ['pattern' => '~^/api/admin/jobs/?$~D', 'methods' => ['GET' => 'jobs:read', 'POST' => 'jobs:write']],
        ['pattern' => '~^/api/admin/jobs/[a-f0-9-]{36}$~D', 'methods' => ['PUT' => 'jobs:write']],
        ['pattern' => '~^/api/admin/users/?$~D', 'methods' => ['GET' => 'super_admin', 'POST' => 'super_admin']],
        ['pattern' => '~^/api/admin/users/[a-f0-9-]{36}/status$~D', 'methods' => ['PUT' => 'super_admin']],
        ['pattern' => '~^/api/admin/users/[a-f0-9-]{36}/role$~D', 'methods' => ['PUT' => 'super_admin']],
        ['pattern' => '~^/api/admin/users/[a-f0-9-]{36}/rotate-mfa$~D', 'methods' => ['POST' => 'super_admin']],
        ['pattern' => '~^/api/admin/candidates/?$~D', 'methods' => ['GET' => 'candidates:read']],
        ['pattern' => '~^/api/admin/candidates/export$~D', 'methods' => ['GET' => 'candidates:export']],
        ['pattern' => '~^/api/admin/candidates/[a-f0-9-]{36}/resume$~D', 'methods' => ['GET' => 'resumes:read']],
        ['pattern' => '~^/api/admin/pipeline/[a-f0-9-]{36}$~D', 'methods' => ['GET' => 'applications:read']],
        ['pattern' => '~^/api/admin/pipeline/move-stage$~D', 'methods' => ['POST' => 'applications:stage_move']],
        ['pattern' => '~^/api/admin/audit/?$~D', 'methods' => ['GET' => 'audit:read']],
        ['pattern' => '~^/api/admin/lgpd/requests/?$~D', 'methods' => ['GET' => 'lgpd:read']],
        ['pattern' => '~^/api/admin/lgpd/requests/[a-f0-9-]{36}/execute$~D', 'methods' => ['POST' => 'lgpd:execute']],
    ];
}

function ajn_public_route_policy(): array
{
    return [
        ['pattern' => '~^/api/health$~D', 'methods' => ['GET']],
        ['pattern' => '~^/api/applications/track/AJN-[0-9]{4}-[A-Z0-9]{6,64}$~D', 'methods' => ['GET']],
        ['pattern' => '~^/api/applications/recover-tracking$~D', 'methods' => ['POST']],
        ['pattern' => '~^/api/applications/verify-recovery$~D', 'methods' => ['POST']],
        ['pattern' => '~^/api/applications/talent-pool$~D', 'methods' => ['POST']],
        ['pattern' => '~^/api/applications/jobs/[a-z0-9-]+/apply$~D', 'methods' => ['POST']],
        ['pattern' => '~^/api/lgpd/(?:requests|deletion-request)$~D', 'methods' => ['POST']],
    ];
}

function ajn_enforce_central_gate(PDO $db, string $method, string $path, array $config): void
{
    $GLOBALS['__ajn_active_config'] = $config;
    if (str_starts_with($path, '/api/admin/')) {
        foreach (ajn_admin_route_policy() as $route) {
            if (preg_match($route['pattern'], $path) === 1) {
                $methods = $route['methods'] ?? [];
                if (!is_array($methods) || !array_key_exists($method, $methods)) {
                    header('Allow: ' . implode(', ', array_keys(is_array($methods) ? $methods : [])));
                    ajn_json(['error' => 'Método não permitido.'], 405);
                }
                $permission = trim((string) $methods[$method]);
                if ($permission === '') {
                    ajn_json(['error' => 'Rota administrativa sem permissão declarada (deny-by-default).'], 403);
                }
                if ($permission === '__public_auth__') {
                    return;
                }
                $user = ajn_auth($db, ($permission === '__authenticated__' || $permission === 'super_admin') ? null : $permission);
                if ($permission === 'super_admin' && $user['role'] !== 'super_admin') {
                    ajn_json(['error' => 'Apenas administradores podem gerenciar operadores.'], 403);
                }
                if (in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
                    ajn_require_origin($config);
                    ajn_require_csrf($user, $config);
                }
                $GLOBALS['__ajn_authorized_user'] = $user;
                $GLOBALS['__ajn_authorized_perm'] = $permission;
                return;
            }
        }
        ajn_json(['error' => 'Endpoint não encontrado.'], 404);
    }

    foreach (ajn_public_route_policy() as $route) {
        if (preg_match($route['pattern'], $path) === 1) {
            $allowed = $route['methods'] ?? [];
            if (!in_array($method, $allowed, true)) {
                header('Allow: ' . implode(', ', $allowed));
                ajn_json(['error' => 'Método não permitido.'], 405);
            }
            return;
        }
    }
}

require_once __DIR__ . '/admin.php';
require_once __DIR__ . '/applications.php';
require_once __DIR__ . '/lgpd.php';

function ajn_dispatch(PDO $db, array $config): never
{
    $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    if (!is_string($path) || strlen($path) > 1024) ajn_json(['error' => 'Caminho inválido.'], 400);

    ajn_enforce_maintenance_mode($config, $path);
    ajn_enforce_central_gate($db, $method, $path, $config);

    if ($path === '/api/health' && $method === 'GET') {
        // Endpoint anonimo: limitar antes de tocar o banco.
        ajn_rate_limit($db, 'health', 30, 60);
        $db->query('SELECT 1')->fetch();
        $payload = ['status' => 'ok', 'service' => 'ajn-carreiras-api', 'timestamp' => gmdate('c')];
        // O marcador de ambiente so aparece fora de producao. Em staging ele permite
        // que a homologacao remota confirme que nao esta apontando para producao;
        // em producao sua ausencia evita entregar essa distincao a quem sonda a API.
        $environment = (string) ($config['environment'] ?? '');
        if ($environment !== '' && $environment !== 'production') $payload['environment'] = $environment;
        ajn_json($payload);
    }
    if (str_starts_with($path, '/api/jobs') || preg_match('~^/carreiras/(?!talentos/?$|acompanhamento/?$|vaga/?$)[a-z0-9-]+/?$~D', $path)) {
        ajn_public_jobs($db, $method, $path, $config);
    }
    if (str_starts_with($path, '/api/admin/auth/')) {
        ajn_admin_auth($db, $method, $path, $config);
    }
    if (str_starts_with($path, '/api/admin/jobs')) {
        ajn_admin_jobs($db, $method, $path, $config);
    }
    if (str_starts_with($path, '/api/admin/users')) {
        ajn_admin_users($db, $method, $path, $config);
    }
    if (str_starts_with($path, '/api/admin/candidates')) {
        ajn_admin_candidates($db, $method, $path, $config);
    }
    if (str_starts_with($path, '/api/admin/pipeline/')) {
        ajn_admin_pipeline($db, $method, $path, $config);
    }
    if (str_starts_with($path, '/api/admin/audit')) {
        ajn_admin_audit($db, $method, $path);
    }
    if (str_starts_with($path, '/api/admin/lgpd/')) {
        ajn_admin_lgpd($db, $method, $path, $config);
    }
    if (str_starts_with($path, '/api/applications/')) {
        ajn_public_applications($db, $method, $path, $config);
    }
    if (str_starts_with($path, '/api/lgpd/')) {
        ajn_public_lgpd($db, $method, $path, $config);
    }
    ajn_json(['error' => 'Endpoint não encontrado.'], 404);
}

if (!defined('AJN_DISABLE_AUTO_DISPATCH')) {
    ajn_dispatch($db, $config);
}
