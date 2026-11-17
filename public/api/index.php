<?php
declare(strict_types=1);

// Front controller público. O código e as credenciais ficam fora de TODOS os webroots.
// Ordem de resolução: AJN_CAREERS_BOOTSTRAP -> AJN_PRIVATE_DIR/bootstrap.php -> ../ajn-carreiras-private/bootstrap.php
$bootstrap = null;
foreach ([$_SERVER['AJN_CAREERS_BOOTSTRAP'] ?? null, getenv('AJN_CAREERS_BOOTSTRAP')] as $candidateBootstrap) {
    if (is_string($candidateBootstrap) && trim($candidateBootstrap) !== '') {
        $bootstrap = trim($candidateBootstrap);
        break;
    }
}
if ($bootstrap === null) {
    foreach ([$_SERVER['AJN_PRIVATE_DIR'] ?? null, getenv('AJN_PRIVATE_DIR')] as $candidatePrivateDir) {
        if (is_string($candidatePrivateDir) && trim($candidatePrivateDir) !== '') {
            $bootstrap = rtrim(trim($candidatePrivateDir), "/\\") . '/bootstrap.php';
            break;
        }
    }
}
if ($bootstrap === null) {
    $bootstrap = dirname(__DIR__, 2) . '/ajn-carreiras-private/bootstrap.php';
}

$normalizeApiPath = static function (string $path): string {
    $norm = rtrim(str_replace('\\', '/', $path), '/');
    return DIRECTORY_SEPARATOR === '\\' ? strtolower($norm) : $norm;
};

$webrootCandidates = [dirname(__DIR__)];
if (!empty($_SERVER['DOCUMENT_ROOT']) && is_string($_SERVER['DOCUMENT_ROOT'])) {
    $webrootCandidates[] = $_SERVER['DOCUMENT_ROOT'];
}
foreach ([$_SERVER['AJN_KNOWN_WEBROOTS'] ?? null, getenv('AJN_KNOWN_WEBROOTS')] as $envRoots) {
    if (is_string($envRoots) && trim($envRoots) !== '') {
        foreach (preg_split('/[' . preg_quote(PATH_SEPARATOR, '/') . ',;]/', $envRoots) ?: [] as $item) {
            if (trim($item) !== '') {
                $webrootCandidates[] = trim($item);
            }
        }
    }
}

$knownWebroots = [];
foreach ($webrootCandidates as $candidateRoot) {
    $rootReal = realpath($candidateRoot);
    if ($rootReal !== false && is_dir($rootReal)) {
        $knownWebroots[] = $normalizeApiPath($rootReal);
    }
}

$failClosed = static function (string $message): never {
    http_response_code(503);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode(['error' => $message], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
};

if (!is_file($bootstrap)) {
    $failClosed('O módulo de carreiras ainda não está configurado.');
}

$bootstrapReal = realpath($bootstrap);
if ($bootstrapReal === false || !is_file($bootstrapReal)) {
    $failClosed('O módulo de carreiras ainda não está configurado.');
}

$normBootstrap = $normalizeApiPath($bootstrapReal);
$normBootstrapDir = $normalizeApiPath(dirname($bootstrapReal));
if (preg_match('/(?:^|\/)(?:public_html|htdocs|httpdocs|www)(?:\/|$)/i', $normBootstrapDir) === 1) {
    $failClosed('Diretório privado inválido: localizado dentro de um webroot público.');
}
foreach ($knownWebroots as $normRoot) {
    if ($normBootstrapDir === $normRoot
        || str_starts_with($normBootstrapDir . '/', $normRoot . '/')
        || str_starts_with($normBootstrap . '/', $normRoot . '/')) {
        $failClosed('Diretório privado inválido: localizado dentro de um webroot público.');
    }
}

require $bootstrapReal;
