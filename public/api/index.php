<?php
declare(strict_types=1);

// Front controller público. O código e as credenciais ficam fora de public_html.
// No Hostinger: public_html/api/index.php -> ../ajn-carreiras-private/bootstrap.php
$bootstrap = getenv('AJN_CAREERS_BOOTSTRAP');
if (!is_string($bootstrap) || $bootstrap === '') {
    $bootstrap = dirname(__DIR__, 2) . '/ajn-carreiras-private/bootstrap.php';
}

if (!is_file($bootstrap)) {
    http_response_code(503);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo '{"error":"O módulo de carreiras ainda não está configurado."}';
    exit;
}

require $bootstrap;
