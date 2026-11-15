<?php
declare(strict_types=1);

/**
 * Copie este arquivo para FORA de public_html:
 *   /home/SEU_USUARIO/ajn-carreiras-config.php
 * e defina permissao 0600 (chmod 600).
 * NUNCA versione ajn-carreiras-config.php com segredos reais.
 */
return [
    'app_url' => 'https://ajnsolucoes.com',
    'allowed_origins' => [
        'https://ajnsolucoes.com',
        'https://www.ajnsolucoes.com',
    ],
    // Chave primaria de 32 bytes em hex (64 caracteres hexadecimais) usada para:
    // - libsodium crypto_secretbox (segredo MFA TOTP, CPF e telefone em repouso)
    // - HMAC-SHA256 de busca por CPF
    // Gere com: php -r "echo bin2hex(random_bytes(32)), PHP_EOL;"
    'encryption_key' => 'SUBSTITUA_POR_64_CARACTERES_HEXADECIMAIS_CSPRNG',
    // Chaves anteriores para rotacao sem perda de leitura (opcional):
    'previous_encryption_keys' => [],
    'private_storage_dir' => dirname(__DIR__) . '/ajn-carreiras-private',
    'error_log_path' => dirname(__DIR__) . '/ajn-carreiras-private/php-errors.log',
    'security_alert_email' => 'seguranca@ajnsolucoes.com',
    'retention' => [
        'candidate_days' => 365,
        'talent_pool_days' => 730,
        'audit_log_days' => 1825,
    ],
    // Cloudflare Turnstile (obrigatorio em producao)
    'turnstile_secret' => 'SUBSTITUA_PELO_TURNSTILE_SECRET_KEY',
    'turnstile_expected_hostnames' => [
        'ajnsolucoes.com',
        'www.ajnsolucoes.com',
    ],
    // Banco de dados MySQL (usuario de runtime apenas com SELECT, INSERT, UPDATE, DELETE)
    'database' => [
        'host' => '127.0.0.1',
        'port' => 3306,
        'name' => 'u000000000_ajn_carreiras',
        'username' => 'u000000000_ajn_app',
        'password' => 'SUBSTITUA_PELA_SENHA_DO_USUARIO_DE_RUNTIME',
    ],
    // SMTP para verificacao de candidatos e alertas de seguranca
    'smtp' => [
        'host' => 'smtp.hostinger.com',
        'port' => 465,
        'encryption' => 'ssl',
        'username' => 'carreiras@ajnsolucoes.com',
        'password' => 'SUBSTITUA_PELA_SENHA_SMTP',
        'from_email' => 'carreiras@ajnsolucoes.com',
        'from_name' => 'AJN Carreiras',
    ],
];
