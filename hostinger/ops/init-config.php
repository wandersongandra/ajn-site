<?php
declare(strict_types=1);

// Gera config.php privado a partir de config.example.php com entrada oculta e chmod 0600.
// Uso exclusivo via CLI; nunca expor pela web, nunca sobrescrever existente e nunca imprimir segredos.
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

function ajn_init_fn_enabled(string $functionName): bool
{
    if (!function_exists($functionName)) {
        return false;
    }
    if (!function_exists('ini_get')) {
        return true;
    }
    $disabled = (string) @ini_get('disable_functions');
    if (trim($disabled) === '') {
        return true;
    }
    $blocked = array_map(static fn (string $name): string => strtolower(trim($name)), explode(',', $disabled));
    return !in_array(strtolower($functionName), $blocked, true);
}

function ajn_init_is_tty(): bool
{
    if (function_exists('stream_isatty')) {
        return @stream_isatty(STDIN);
    }
    if (function_exists('posix_isatty')) {
        return @posix_isatty(STDIN);
    }
    return false;
}

function ajn_init_is_webroot_path(string $path): bool
{
    $normalized = rtrim(str_replace('\\', '/', $path), '/');
    return preg_match('/(?:^|\/)(?:public_html|htdocs|httpdocs|www)(?:\/|$)/i', $normalized) === 1;
}

function ajn_init_read_line(): string
{
    $line = fgets(STDIN);
    if (!is_string($line)) {
        throw new RuntimeException('Fim inesperado da entrada (STDIN).');
    }
    return rtrim($line, "\r\n");
}

function ajn_init_prompt_value(string $label, ?string $default, callable $validator, bool $isTty): string
{
    $attempts = $isTty ? 3 : 1;
    for ($i = 0; $i < $attempts; $i++) {
        $suffix = ($default !== null && $default !== '') ? " [{$default}]" : '';
        fwrite(STDERR, "{$label}{$suffix}: ");
        $raw = trim(ajn_init_read_line());
        $candidate = ($raw === '' && $default !== null) ? $default : $raw;
        $err = $validator($candidate);
        if ($err === null) {
            return $candidate;
        }
        fwrite(STDERR, "Valor inválido para {$label}: {$err}\n");
        if (!$isTty) {
            throw new RuntimeException("Entrada inválida em {$label}: {$err}");
        }
    }
    throw new RuntimeException("Número máximo de tentativas excedido para {$label}.");
}

function ajn_init_prompt_secret(string $label, callable $validator, bool $isTty, bool &$warnedAnsiFallback): string
{
    $attempts = $isTty ? 3 : 1;
    for ($i = 0; $i < $attempts; $i++) {
        $raw = '';
        if ($isTty && DIRECTORY_SEPARATOR === '/') {
            if (ajn_init_fn_enabled('exec')) {
                $sttyOut = [];
                $sttyRc = 1;
                @exec('stty -g </dev/tty 2>/dev/null', $sttyOut, $sttyRc);
                $savedMode = ($sttyRc === 0 && isset($sttyOut[0]) && $sttyOut[0] !== '') ? trim((string) $sttyOut[0]) : null;
                fwrite(STDERR, "{$label} (entrada oculta): ");
                @exec('stty -echo </dev/tty 2>/dev/null');
                try {
                    $raw = ajn_init_read_line();
                } finally {
                    if ($savedMode !== null && preg_match('/^[a-zA-Z0-9:=-]+$/', $savedMode) === 1) {
                        @exec('stty ' . $savedMode . ' </dev/tty 2>/dev/null');
                    } else {
                        @exec('stty echo </dev/tty 2>/dev/null');
                    }
                    fwrite(STDERR, "\n");
                }
            } elseif (ajn_init_fn_enabled('system')) {
                fwrite(STDERR, "{$label} (entrada oculta): ");
                @system('stty -echo </dev/tty 2>/dev/null');
                try {
                    $raw = ajn_init_read_line();
                } finally {
                    @system('stty echo </dev/tty 2>/dev/null');
                    fwrite(STDERR, "\n");
                }
            } elseif (ajn_init_fn_enabled('proc_open')) {
                $desc = [0 => ['file', '/dev/tty', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']];
                $procOff = @proc_open(['stty', '-echo'], $desc, $pipesOff);
                if (is_resource($procOff)) {
                    foreach ($pipesOff as $p) {
                        @fclose($p);
                    }
                    @proc_close($procOff);
                }
                fwrite(STDERR, "{$label} (entrada oculta): ");
                try {
                    $raw = ajn_init_read_line();
                } finally {
                    $procOn = @proc_open(['stty', 'echo'], $desc, $pipesOn);
                    if (is_resource($procOn)) {
                        foreach ($pipesOn as $p) {
                            @fclose($p);
                        }
                        @proc_close($procOn);
                    }
                    fwrite(STDERR, "\n");
                }
            } else {
                if (!$warnedAnsiFallback) {
                    fwrite(STDERR, "Aviso: stty -echo indisponível sob disable_functions; mascarando entrada no terminal via ANSI.\n");
                    $warnedAnsiFallback = true;
                }
                fwrite(STDERR, "{$label} (entrada oculta): \033[8m");
                try {
                    $raw = ajn_init_read_line();
                } finally {
                    fwrite(STDERR, "\033[0m\033[1A\r\033[2K{$label} (entrada oculta): [preenchido]\n");
                }
            }
        } elseif ($isTty && DIRECTORY_SEPARATOR === '\\') {
            if (function_exists('sapi_windows_vt100_support')) {
                @sapi_windows_vt100_support(STDERR, true);
            }
            fwrite(STDERR, "{$label} (entrada oculta): \033[8m");
            try {
                $raw = ajn_init_read_line();
            } finally {
                fwrite(STDERR, "\033[0m\033[1A\r\033[2K{$label} (entrada oculta): [preenchido]\n");
            }
        } else {
            fwrite(STDERR, "{$label} (entrada oculta): ");
            $raw = ajn_init_read_line();
        }

        $candidate = trim($raw);
        $err = $validator($candidate);
        if ($err === null) {
            return $candidate;
        }
        fwrite(STDERR, "Valor inválido para {$label}: {$err}\n");
        if (!$isTty) {
            throw new RuntimeException("Entrada inválida em {$label}: {$err}");
        }
    }
    throw new RuntimeException("Número máximo de tentativas excedido para {$label}.");
}

function ajn_init_render_config(array $cfg): string
{
    $export = static fn (mixed $v): string => var_export($v, true);
    $formatList = static function (array $items, string $indent = '        ') use ($export): string {
        if ($items === []) {
            return '[]';
        }
        $lines = array_map(static fn (string $it): string => $indent . $export($it) . ',', $items);
        return "[\n" . implode("\n", $lines) . "\n    ]";
    };

    $retention = $cfg['retention'] ?? ['candidate_days' => 365, 'talent_pool_days' => 730, 'audit_log_days' => 1825];

    return "<?php\n"
        . "declare(strict_types=1);\n\n"
        . "// Gerado por hostinger/ops/init-config.php (chmod 0600, fora de public_html).\n"
        . "return [\n"
        . "    'environment' => " . $export($cfg['environment']) . ",\n"
        . "    'app_url' => " . $export($cfg['app_url']) . ",\n"
        . "    'allowed_origins' => " . $formatList($cfg['allowed_origins']) . ",\n"
        . "    'encryption_key' => " . $export($cfg['encryption_key']) . ",\n"
        . "    'previous_encryption_keys' => [],\n"
        . "    'resume_directory' => __DIR__ . '/resumes',\n"
        . "    'known_webroots' => " . $formatList($cfg['known_webroots']) . ",\n"
        . "    'error_log_path' => __DIR__ . '/php-errors.log',\n"
        . "    'maintenance_flag_path' => __DIR__ . '/maintenance.flag',\n"
        . "    'maintenance_retry_after' => " . (int) ($cfg['maintenance_retry_after'] ?? 300) . ",\n"
        . "    'security_alert_email' => " . $export($cfg['security_alert_email']) . ",\n"
        . "    'retention' => [\n"
        . "        'candidate_days' => " . (int) ($retention['candidate_days'] ?? 365) . ",\n"
        . "        'talent_pool_days' => " . (int) ($retention['talent_pool_days'] ?? 730) . ",\n"
        . "        'audit_log_days' => " . (int) ($retention['audit_log_days'] ?? 1825) . ",\n"
        . "    ],\n"
        . "    'turnstile_secret_key' => " . $export($cfg['turnstile_secret_key']) . ",\n"
        . "    'database' => [\n"
        . "        'host' => " . $export($cfg['database']['host']) . ",\n"
        . "        'port' => " . (int) $cfg['database']['port'] . ",\n"
        . "        'name' => " . $export($cfg['database']['name']) . ",\n"
        . "        'username' => " . $export($cfg['database']['username']) . ",\n"
        . "        'password' => " . $export($cfg['database']['password']) . ",\n"
        . "    ],\n"
        . "    'smtp' => [\n"
        . "        'host' => " . $export($cfg['smtp']['host']) . ",\n"
        . "        'port' => " . (int) $cfg['smtp']['port'] . ",\n"
        . "        'encryption' => " . $export($cfg['smtp']['encryption']) . ",\n"
        . "        'username' => " . $export($cfg['smtp']['username']) . ",\n"
        . "        'password' => " . $export($cfg['smtp']['password']) . ",\n"
        . "        'from' => " . $export($cfg['smtp']['from']) . ",\n"
        . "    ],\n"
        . "];\n";
}

function ajn_init_main(array $argv): int
{
    foreach (['AJN_DB_PASSWORD', 'AJN_SMTP_PASSWORD', 'AJN_TURNSTILE_SECRET', 'AJN_ENCRYPTION_KEY', 'AJN_ADMIN_INITIAL_PASSWORD'] as $forbiddenEnv) {
        $val = getenv($forbiddenEnv);
        if (is_string($val) && $val !== '') {
            fwrite(STDERR, "RECUSADO: nao passe segredos via variavel de ambiente ({$forbiddenEnv}). Use apenas o prompt interativo.\n");
            return 1;
        }
    }

    $targetPath = null;
    $examplePath = null;
    $envHint = null;

    foreach (array_slice($argv, 1) as $arg) {
        if ($arg === '--help' || $arg === '-h') {
            fwrite(STDOUT, "Uso: php init-config.php --target=/caminho/privado/config.php [--example=/caminho/privado/config.example.php] [--env=staging|production]\n");
            return 0;
        }
        $lower = strtolower((string) $arg);
        if (preg_match('/^--(password|secret|encryption-key|turnstile|db-pass|smtp-pass)/', $lower) === 1) {
            fwrite(STDERR, "RECUSADO: nao passe segredos como argumento de linha de comando.\n");
            return 1;
        }
        if (str_starts_with($arg, '--target=')) {
            $targetPath = trim(substr($arg, strlen('--target=')));
        } elseif (str_starts_with($arg, '--output=')) {
            $targetPath = trim(substr($arg, strlen('--output=')));
        } elseif (str_starts_with($arg, '--example=')) {
            $examplePath = trim(substr($arg, strlen('--example=')));
        } elseif (str_starts_with($arg, '--env=')) {
            $envHint = strtolower(trim(substr($arg, strlen('--env='))));
        } else {
            fwrite(STDERR, "Argumento não reconhecido: {$arg}\n");
            return 1;
        }
    }

    if ($envHint !== null && !in_array($envHint, ['staging', 'production'], true)) {
        fwrite(STDERR, "Valor inválido para --env: use 'staging' ou 'production'.\n");
        return 1;
    }

    if ($targetPath === null || $targetPath === '') {
        if (is_file(__DIR__ . '/config.example.php') && is_file(__DIR__ . '/bootstrap.php')) {
            $targetPath = __DIR__ . '/config.php';
        } elseif ($examplePath !== null && $examplePath !== '') {
            $targetPath = dirname($examplePath) . '/config.php';
        } else {
            fwrite(STDERR, "ERRO: informe --target=/caminho/privado/config.php.\n");
            return 1;
        }
    }

    if (ajn_init_is_webroot_path($targetPath)) {
        fwrite(STDERR, "RECUSADO: config.php não pode ser gravado dentro de um webroot ({$targetPath}).\n");
        return 1;
    }

    if (file_exists($targetPath) || is_link($targetPath)) {
        fwrite(STDERR, "RECUSADO: arquivo destino já existe e não será sobrescrito: {$targetPath}\n");
        return 1;
    }

    $targetDir = dirname($targetPath);
    if (!is_dir($targetDir)) {
        fwrite(STDERR, "ERRO: diretório privado destino não existe: {$targetDir}\n");
        return 1;
    }

    if ($examplePath === null || $examplePath === '') {
        foreach ([
            $targetDir . '/config.example.php',
            dirname(__DIR__) . '/config.example.php',
            __DIR__ . '/config.example.php',
        ] as $candidate) {
            if (is_file($candidate)) {
                $examplePath = $candidate;
                break;
            }
        }
    }

    if ($examplePath === null || !is_file($examplePath)) {
        fwrite(STDERR, "ERRO: config.example.php não encontrado. Informe --example=/caminho/config.example.php.\n");
        return 1;
    }

    $baseConfig = require $examplePath;
    if (!is_array($baseConfig)) {
        fwrite(STDERR, "ERRO: config.example.php inválido (não retornou array).\n");
        return 1;
    }

    $isTty = ajn_init_is_tty();
    $warnedAnsiFallback = false;

    $notPlaceholder = static function (string $val): ?string {
        if ($val === '') {
            return 'valor obrigatório não pode ser vazio';
        }
        if (preg_match('/^(?:SUBSTITUA_|COLE_|TROCAR_)/i', $val) === 1) {
            return 'substitua o texto placeholder por um valor real';
        }
        if (preg_match('/[\r\n\0]/', $val) === 1) {
            return 'caracteres de controle não permitidos';
        }
        return null;
    };

    try {
        $defaultEnv = $envHint ?? ((string) ($baseConfig['environment'] ?? 'staging'));
        if (!in_array($defaultEnv, ['staging', 'production'], true)) {
            $defaultEnv = 'staging';
        }

        $environment = ajn_init_prompt_value(
            'Ambiente (staging ou production)',
            $defaultEnv,
            static fn (string $v): ?string => in_array($v, ['staging', 'production'], true) ? null : "informe 'staging' ou 'production'",
            $isTty
        );

        $defaultAppUrl = $environment === 'staging' ? 'https://staging.ajnengenharia.com.br' : 'https://ajnengenharia.com.br';
        $appUrl = rtrim(ajn_init_prompt_value(
            'app_url (URL HTTPS completa sem barra final)',
            $defaultAppUrl,
            static function (string $v): ?string {
                $clean = rtrim($v, '/');
                if (!filter_var($clean, FILTER_VALIDATE_URL) || !str_starts_with($clean, 'https://')) {
                    return 'deve ser URL https:// válida';
                }
                return null;
            },
            $isTty
        ), '/');

        $appHost = (string) parse_url($appUrl, PHP_URL_HOST);
        $defaultOrigins = $appUrl;
        if ($environment === 'production' && $appHost !== '' && !str_starts_with($appHost, 'www.')) {
            $defaultOrigins .= ',' . str_replace('://' . $appHost, '://www.' . $appHost, $appUrl);
        }

        $originsRaw = ajn_init_prompt_value(
            'allowed_origins (URLs https:// separadas por vírgula)',
            $defaultOrigins,
            static function (string $v): ?string {
                $parts = array_values(array_filter(array_map('trim', explode(',', $v)), static fn (string $p): bool => $p !== ''));
                if ($parts === []) {
                    return 'informe ao menos uma origem HTTPS';
                }
                foreach ($parts as $origin) {
                    if (!filter_var($origin, FILTER_VALIDATE_URL) || !str_starts_with($origin, 'https://')) {
                        return "origem inválida: {$origin}";
                    }
                }
                return null;
            },
            $isTty
        );
        $allowedOrigins = array_values(array_unique(array_map(
            static fn (string $p): string => rtrim(trim($p), '/'),
            array_filter(explode(',', $originsRaw), static fn (string $p): bool => trim($p) !== '')
        )));

        $defaultWebroots = '';
        foreach (['PROD_PUBLIC', 'STG_PUBLIC'] as $envRootVar) {
            $val = getenv($envRootVar);
            if (is_string($val) && trim($val) !== '') {
                $defaultWebroots .= ($defaultWebroots === '' ? '' : ',') . trim($val);
            }
        }
        $webrootsRaw = ajn_init_prompt_value(
            'known_webroots (caminhos absolutos separados por vírgula; deixe vazio para nenhum extra)',
            $defaultWebroots !== '' ? $defaultWebroots : null,
            static function (string $v): ?string {
                if (trim($v) === '') {
                    return null;
                }
                foreach (explode(',', $v) as $part) {
                    $p = trim($part);
                    if ($p === '') {
                        return 'caminho vazio após vírgula';
                    }
                    if (!str_starts_with($p, '/') && preg_match('/^[A-Za-z]:[\\\\\/]/', $p) !== 1) {
                        return "deve ser caminho absoluto: {$p}";
                    }
                }
                return null;
            },
            $isTty
        );
        $knownWebroots = $webrootsRaw === ''
            ? []
            : array_values(array_unique(array_filter(array_map('trim', explode(',', $webrootsRaw)), static fn (string $p): bool => $p !== '')));

        $securityAlertEmail = ajn_init_prompt_value(
            'security_alert_email',
            (string) ($baseConfig['security_alert_email'] ?? 'faleconosco@ajnengenharia.com.br'),
            static fn (string $v): ?string => filter_var($v, FILTER_VALIDATE_EMAIL) ? null : 'e-mail inválido',
            $isTty
        );

        $dbHost = ajn_init_prompt_value(
            'database.host',
            (string) ($baseConfig['database']['host'] ?? '127.0.0.1'),
            $notPlaceholder,
            $isTty
        );

        $dbPort = (int) ajn_init_prompt_value(
            'database.port',
            (string) ($baseConfig['database']['port'] ?? 3306),
            static fn (string $v): ?string => (ctype_digit($v) && (int) $v >= 1 && (int) $v <= 65535) ? null : 'porta deve estar entre 1 e 65535',
            $isTty
        );

        $dbName = ajn_init_prompt_value(
            'database.name (nome real do banco MySQL no hPanel)',
            null,
            $notPlaceholder,
            $isTty
        );

        $dbUser = ajn_init_prompt_value(
            'database.username (usuário runtime restrito, nunca migrator)',
            null,
            $notPlaceholder,
            $isTty
        );

        $dbPassword = ajn_init_prompt_secret(
            'database.password',
            $notPlaceholder,
            $isTty,
            $warnedAnsiFallback
        );

        $turnstileSecret = ajn_init_prompt_secret(
            'turnstile_secret_key',
            static function (string $v) use ($notPlaceholder, $environment): ?string {
                $err = $notPlaceholder($v);
                if ($err !== null) {
                    return $err;
                }
                if ($environment === 'production' && preg_match('/^[123]x/', $v) === 1) {
                    return 'chaves Turnstile de teste (1x/2x/3x) são proibidas em production';
                }
                return null;
            },
            $isTty,
            $warnedAnsiFallback
        );

        $smtpHost = ajn_init_prompt_value(
            'smtp.host',
            (string) ($baseConfig['smtp']['host'] ?? 'smtp.hostinger.com'),
            $notPlaceholder,
            $isTty
        );

        $smtpPort = (int) ajn_init_prompt_value(
            'smtp.port',
            (string) ($baseConfig['smtp']['port'] ?? 465),
            static fn (string $v): ?string => (ctype_digit($v) && (int) $v >= 1 && (int) $v <= 65535) ? null : 'porta deve estar entre 1 e 65535',
            $isTty
        );

        $smtpEncryption = ajn_init_prompt_value(
            'smtp.encryption (ssl, tls ou none)',
            (string) ($baseConfig['smtp']['encryption'] ?? 'ssl'),
            static fn (string $v): ?string => in_array($v, ['ssl', 'tls', 'none'], true) ? null : "use 'ssl', 'tls' ou 'none'",
            $isTty
        );

        $smtpUser = ajn_init_prompt_value(
            'smtp.username',
            (string) ($baseConfig['smtp']['username'] ?? 'carreiras@ajnengenharia.com.br'),
            $notPlaceholder,
            $isTty
        );

        $smtpFrom = ajn_init_prompt_value(
            'smtp.from',
            (string) ($smtpUser !== '' ? $smtpUser : ($baseConfig['smtp']['from'] ?? 'carreiras@ajnengenharia.com.br')),
            static fn (string $v): ?string => filter_var($v, FILTER_VALIDATE_EMAIL) ? null : 'e-mail inválido',
            $isTty
        );

        $smtpPassword = ajn_init_prompt_secret(
            'smtp.password',
            $notPlaceholder,
            $isTty,
            $warnedAnsiFallback
        );
    } catch (Throwable $e) {
        fwrite(STDERR, 'ERRO: ' . $e->getMessage() . "\n");
        return 1;
    }

    $encryptionKey = bin2hex(random_bytes(32));
    $rendered = ajn_init_render_config([
        'environment' => $environment,
        'app_url' => $appUrl,
        'allowed_origins' => $allowedOrigins,
        'encryption_key' => $encryptionKey,
        'known_webroots' => $knownWebroots,
        'maintenance_retry_after' => (int) ($baseConfig['maintenance_retry_after'] ?? 300),
        'security_alert_email' => $securityAlertEmail,
        'retention' => is_array($baseConfig['retention'] ?? null) ? $baseConfig['retention'] : [],
        'turnstile_secret_key' => $turnstileSecret,
        'database' => [
            'host' => $dbHost,
            'port' => $dbPort,
            'name' => $dbName,
            'username' => $dbUser,
            'password' => $dbPassword,
        ],
        'smtp' => [
            'host' => $smtpHost,
            'port' => $smtpPort,
            'encryption' => $smtpEncryption,
            'username' => $smtpUser,
            'password' => $smtpPassword,
            'from' => $smtpFrom,
        ],
    ]);

    $oldUmask = umask(0077);
    $created = false;
    try {
        $fh = @fopen($targetPath, 'xb');
        if ($fh === false) {
            fwrite(STDERR, "ERRO: não foi possível criar {$targetPath} (verifique permissões ou se o arquivo já existe).\n");
            return 1;
        }
        $created = true;
        $total = strlen($rendered);
        $written = fwrite($fh, $rendered);
        fflush($fh);
        fclose($fh);
        if (!is_int($written) || $written !== $total) {
            @unlink($targetPath);
            fwrite(STDERR, "ERRO: gravação incompleta em {$targetPath}; arquivo removido.\n");
            return 1;
        }
        if (!@chmod($targetPath, 0600)) {
            @unlink($targetPath);
            fwrite(STDERR, "ERRO: falha ao aplicar chmod 0600 em {$targetPath}; arquivo removido.\n");
            return 1;
        }
        if (DIRECTORY_SEPARATOR === '/') {
            clearstatcache(true, $targetPath);
            $mode = fileperms($targetPath) & 0777;
            if ($mode !== 0600) {
                @unlink($targetPath);
                fwrite(STDERR, sprintf("ERRO: permissão inesperada %04o em %s (esperado 0600); arquivo removido.\n", $mode, $targetPath));
                return 1;
            }
        }
    } catch (Throwable $e) {
        if ($created && is_file($targetPath)) {
            @unlink($targetPath);
        }
        fwrite(STDERR, 'ERRO ao gravar config.php: ' . $e->getMessage() . "\n");
        return 1;
    } finally {
        umask($oldUmask);
    }

    fwrite(STDOUT, json_encode([
        'ok' => true,
        'path' => $targetPath,
        'environment' => $environment,
        'app_url' => $appUrl,
        'database_name' => $dbName,
        'encryption_key_generated' => true,
        'encryption_key_bytes' => 32,
        'chmod' => DIRECTORY_SEPARATOR === '/' ? sprintf('%04o', fileperms($targetPath) & 0777) : '0600',
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n");

    return 0;
}

exit(ajn_init_main($argv ?? []));
