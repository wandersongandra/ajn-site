<?php
declare(strict_types=1);

// Exemplo: copie como config.php para a pasta privada fora de public_html.
// Nunca salve senhas, tokens de produção ou currículos no Git.
return [
    'app_url' => 'https://ajnengenharia.com.br',
    'environment' => 'staging',
    'database' => [
        'host' => 'localhost',
        'port' => 3306,
        'name' => 'SUBSTITUIR_BANCO_DE_CARREIRAS',
        'username' => 'SUBSTITUIR_USUARIO',
        'password' => 'SUBSTITUIR_SENHA',
    ],
    'resume_directory' => __DIR__ . '/resumes',
    // Preencha somente na cópia privada com: php -r 'echo bin2hex(random_bytes(32)), PHP_EOL;'
    'encryption_key' => '',
    // Chave privada Turnstile do hostname definido em app_url; nunca expor no Astro.
    'turnstile_secret_key' => 'SUBSTITUIR_CHAVE_PRIVADA_TURNSTILE',
    'smtp' => [
        'host' => 'SUBSTITUIR_HOST_SMTP',
        'port' => 465,
        'username' => 'SUBSTITUIR_EMAIL',
        'password' => 'SUBSTITUIR_SENHA_SMTP',
        'from' => 'SUBSTITUIR_REMETENTE',
    ],
];
