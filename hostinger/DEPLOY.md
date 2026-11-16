# Runbook Operacional de Deploy — AJN Carreiras (Hostinger)

Este documento define o procedimento oficial de publicação segura em **duas partes sequenciais e bloqueantes**:

- **PARTE A — STAGING:** subdomínio isolado (`https://staging.ajnengenharia.com.br`), raiz web separada do `public_html` de produção, pasta privada isolada, banco MySQL próprio e **zero dados reais**. A Parte B é **proibida** enquanto qualquer item da Parte A falhar.
- **PARTE B — PRODUÇÃO:** domínio principal (`https://ajnengenharia.com.br`). Só inicia após **100% da Parte A verde** com a saída completa do `audit-live-hardening` (incluindo `GET / sem credenciais = 401`) colada no gate de passagem.

---

## Mapa de Variáveis, Caminhos Privados e Menor Privilégio

1. **`PUBLIC_TURNSTILE_SITE_KEY` (variável pública de build Astro, local/CI antes do `npm run build`):**
   - Entra no HTML dos formulários de carreiras (`/carreiras/`, `/carreiras/vaga/`, `/carreiras/talentos/`, `/carreiras/acompanhamento/`).
   - **Staging:** use `PUBLIC_ALLOW_INDEXING=false`, `PUBLIC_SITE_ORIGIN=https://staging.ajnengenharia.com.br` e sitekey de teste Cloudflare (`1x00000000000000000000AA`) ou sitekey exclusiva de staging.
   - **Produção:** exige `PUBLIC_ALLOW_INDEXING=true`, `PUBLIC_SITE_ORIGIN=https://ajnengenharia.com.br` e `PUBLIC_TURNSTILE_SITE_KEY` real de produção (`npm run build` e `npm run pack:hostinger` falham fechados se vazia ou `1x`/`2x`/`3x`).
2. **`turnstile_secret_key` (segredo privado no servidor — `<PRIVATE_DIR>/config.php`, chmod `0600`):**
   - Nome exato lido por `bootstrap.php`: **`turnstile_secret_key`** (nunca `turnstile_secret`; nome divergente retorna HTTP **503** fail-closed em `production`).
3. **`STAGING_HTPASSWD_FILE` e `STAGING_PRIVATE_DIR` (empacotamento `pack:hostinger:staging`):**
   - `STAGING_HTPASSWD_FILE` informa o caminho absoluto fora de webroot do `.htpasswd-staging` no servidor; o empacotador injeta `AuthType Basic` + `AuthUserFile` **apenas** em `output/hostinger-staging/public_html/.htaccess`, mantendo `public/.htaccess` e `dist/.htaccess` limpos para produção (onde `AuthType`/`AuthUserFile` é bloqueado pelo `pack:hostinger`).
   - `STAGING_PRIVATE_DIR` (opcional no build, recomendado) injeta `SetEnv AJN_PRIVATE_DIR` e a condição extra de `maintenance.flag` no `.htaccess` de staging.
4. **Separação de diretórios privados e `known_webroots` (`api/index.php` e `bootstrap.php`):**
   - Recomendado: `$HOME/ajn-private/staging` e `$HOME/ajn-private/prod` (fora de **todas** as raízes web), configurando `AJN_PRIVATE_DIR` no ambiente/Apache (`SetEnv`) ou mantendo pasta irmã `../ajn-carreiras-private`.
   - Tanto `public/api/index.php` quanto `ajn_private_resume_dir()` em `bootstrap.php` bloqueiam qualquer caminho dentro de `DOCUMENT_ROOT`, `AJN_KNOWN_WEBROOTS`, `config['known_webroots']` ou diretórios contendo segmentos de webroot (`public_html`, `htdocs`, `httpdocs`, `www`).
5. **Banco de dados e menor privilégio (usuários separados no hPanel):**
   - **`u000_ajn_migrator` (temporário / somente SSH via `$HOME/.my-migrator*.cnf`):** recebe `SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, DROP` no hPanel apenas para rodar `migrate.php`. Nunca vai em `config.php`.
   - **`u000_ajn_app_rw` (runtime em `config.php`):** restrito no **hPanel** exclusivamente a `SELECT, INSERT, UPDATE, DELETE` nas tabelas de carreiras (sem `DROP`, `ALTER`, `CREATE`, `TRUNCATE`, `GRANT OPTION` ou `ALL PRIVILEGES`).
   - A migration `003_least_privilege.sql` aplica restrições internas de permissão (`DELETE FROM admin_permissions`) e **não contém SQL `GRANT`/`REVOKE`**; qualquer migration futura contendo `GRANT` ou `REVOKE` é bloqueada automaticamente pelo `migrate.php` e deve ser executada pelo **hPanel**. Sempre que o `migrate.php` conecta ao MySQL, ele consulta `SHOW GRANTS FOR CURRENT_USER()` no usuário de runtime e emite `[AVISO]` se detectar `DROP`, `ALTER`, `CREATE` ou `ALL PRIVILEGES`.
6. **`security_alert_email` e `AJN_CONFIG_PATH`:**
   - `security_alert_email` = **`faleconosco@ajnengenharia.com.br`** (alinhado com `public/.well-known/security.txt`).
   - `AJN_CONFIG_PATH` é aceito **exclusivamente quando `PHP_SAPI === 'cli'`**.

---

## Etapa 0 — Layout Obrigatório de Webroots e Diretórios Privados (`check-layout.sh`)

Antes de gerar builds, enviar arquivos ou configurar staging/produção, confira **por `realpath`** onde o hPanel aponta o `public_html` de produção e o webroot do subdomínio de staging.

**REGRA BLOQUEANTE:** na Hostinger compartilhada, alguns subdomínios antigos são criados como subpasta dentro do `public_html` principal (`.../domains/ajnengenharia.com.br/public_html/staging`). **Isso é proibido**, pois exporia o staging sem proteção pelo `.htaccess`/rotas de produção e violaria o isolamento. Se acontecer, altere a raiz do subdomínio no **hPanel -> Domínios/Subdomínios -> Pasta raiz** para `$HOME/domains/staging.ajnengenharia.com.br/public_html` **antes** de continuar.

Envie primeiro `hostinger/ops/` para `$HOME/ajn-ops` (`chmod +x $HOME/ajn-ops/*.sh`) e execute o validador:

```bash
chmod +x "$HOME/ajn-ops/"*.sh

export PROD_PUBLIC="$HOME/domains/ajnengenharia.com.br/public_html"
export STG_PUBLIC="$HOME/domains/staging.ajnengenharia.com.br/public_html"
export PROD_PRIVATE="$HOME/ajn-private/prod"
export STG_PRIVATE="$HOME/ajn-private/staging"

"$HOME/ajn-ops/check-layout.sh" \
  --prod-public="$PROD_PUBLIC" \
  --staging-public="$STG_PUBLIC" \
  --private-dir="$PROD_PRIVATE" \
  --private-dir="$STG_PRIVATE"
```

Se `check-layout.sh` retornar `exit != 0` (**ABORTAR**), ajuste os diretórios no hPanel antes de prosseguir.

---

## PARTE A — STAGING

Caminhos padrão recomendados:
- Webroot staging: `$STG_PUBLIC="$HOME/domains/staging.ajnengenharia.com.br/public_html"`
- Diretório privado staging (fora de webroots): `$STG_PRIVATE="$HOME/ajn-private/staging"`
- `.htpasswd` staging (fora de webroots): `$STG_HTPASSWD="$HOME/domains/staging.ajnengenharia.com.br/.htpasswd-staging"`
- Logs de cron (fora de webroots): `$HOME/ajn-logs/staging`

### Etapa A.0 — Pré-checagens no servidor (PHP CLI, extensões, layout e disco)

```bash
mkdir -p "$HOME/backups" "$HOME/deploy-stage/staging" "$HOME/ajn-ops" "$HOME/ajn-logs/staging" "$STG_PRIVATE/resumes"
chmod 700 "$HOME/backups" "$HOME/ajn-ops" "$HOME/ajn-logs" "$HOME/ajn-logs/staging" "$STG_PRIVATE" "$STG_PRIVATE/resumes"

PHP_BIN="$(command -v php)"
echo "PHP_BIN=$PHP_BIN"
"$PHP_BIN" -v
"$PHP_BIN" -m | grep -E '^(sodium|pdo_mysql|openssl|mbstring|json|curl)$'
"$PHP_BIN" -r 'foreach (["sodium","pdo_mysql","openssl"] as $ext) { if (!extension_loaded($ext)) { fwrite(STDERR, "Falta extensao: $ext\n"); exit(1); } } echo "CLI extensions OK\n";'
df -h "$HOME"

"$HOME/ajn-ops/check-layout.sh" \
  --prod-public="$PROD_PUBLIC" \
  --staging-public="$STG_PUBLIC" \
  --private-dir="$STG_PRIVATE"
```

### Etapa A.1 — `.htpasswd-staging`, Build local e Upload de `output/hostinger-staging`

1. No servidor SSH, crie o `.htpasswd-staging` **fora** de qualquer `public_html` (nunca grave a senha no repositório ou comando em log permanente; leia a senha via stdin se preferir):

```bash
printf 'Senha staging_user: ' && IFS= read -r -s STG_PASS && echo
"$PHP_BIN" -r '$u="staging_user"; $p=stream_get_contents(STDIN); $p=rtrim($p,"\r\n"); echo $u . ":" . password_hash($p, PASSWORD_BCRYPT) . "\n";' <<< "$STG_PASS" > "$STG_HTPASSWD"
unset STG_PASS
chmod 640 "$STG_HTPASSWD"
```

2. Na máquina local (dentro de `astro-site/`), gere o build de **staging** e o pacote com `AuthType Basic` injetado **exclusivamente** no `.htaccess` de `output/hostinger-staging/public_html/`:

```bash
PUBLIC_SITE_ORIGIN="https://staging.ajnengenharia.com.br" \
PUBLIC_ALLOW_INDEXING="false" \
PUBLIC_CONTACT_ENDPOINT="https://api.opengscgandra.tech/contact" \
PUBLIC_TURNSTILE_SITE_KEY="1x00000000000000000000AA" \
npm run build

STAGING_HTPASSWD_FILE="/home/USUARIO_HOSTINGER/domains/staging.ajnengenharia.com.br/.htpasswd-staging" \
STAGING_PRIVATE_DIR="/home/USUARIO_HOSTINGER/ajn-private/staging" \
npm run pack:hostinger:staging
```

Confirme na saída:
- `[pack:hostinger:staging] Modo: staging | Origem: https://staging.ajnengenharia.com.br | Indexação: false | ... | Turnstile no HTML: true`
- `[pack:hostinger:staging] AuthType Basic injetado apenas em output/hostinger-staging/public_html/.htaccess`
- Mesmo SHA-256 CSP entre `public/.htaccess`, `dist/.htaccess` e `output/hostinger-staging/public_html/.htaccess`.

3. Envie o pacote completo para `~/deploy-stage/staging/` (inclui `public_html/`, `ajn-carreiras-private/`, `database/`, `ops/`):

```bash
rsync -avz --delete output/hostinger-staging/ USUARIO@HOST_SSH:~/deploy-stage/staging/
```

No servidor, sincronize `$HOME/ajn-ops/`:

```bash
cp -f "$HOME/deploy-stage/staging/ops/"* "$HOME/ajn-ops/"
chmod +x "$HOME/ajn-ops/"*.sh
```

### Etapa A.2 — Modo Manutenção (`503` + `Retry-After`) — 1ª Implantação ou Redeploy

Escolha **um** dos dois caminhos abaixo antes de tocar banco ou código:

- **Caminho 1 — Primeira implantação (staging novo ainda sem `public_html` publicado):**
  Publique um `.htaccess` mínimo de bloqueio temporário em `$STG_PUBLIC/.htaccess` (com Basic Auth se já ativo) antes de enviar/migrar o banco; esse arquivo será substituído ao final pelo `.htaccess` definitivo do pacote:

```apacheconf
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteRule ^(api|admin)(/|$) - [R=503,L]
</IfModule>
<IfModule mod_headers.c>
  Header always set Retry-After "300" "expr=%{REQUEST_STATUS} == 503"
</IfModule>
```

- **Caminho 2 — Staging já implantado (redeploy):**
  Ative o arquivo-flag fora do webroot:

```bash
date -u +"%Y-%m-%dT%H:%M:%SZ" > "$STG_PRIVATE/maintenance.flag"
chmod 640 "$STG_PRIVATE/maintenance.flag"
```

Valide com `--netrc-file` (`chmod 600`, nunca passe usuário e senha em linha de comando) que `/api/health` e `/admin/carreiras/` devolvem `503` + `Retry-After` (o mesmo comando valida ambos os caminhos):

```bash
install -m 600 /dev/null "$HOME/.netrc-staging"
cat <<'EOF' > "$HOME/.netrc-staging"
machine staging.ajnengenharia.com.br
login staging_user
password SENHA_DO_STAGING
EOF

curl -isS --netrc-file "$HOME/.netrc-staging" https://staging.ajnengenharia.com.br/api/health | head -n 15
curl -isS --netrc-file "$HOME/.netrc-staging" https://staging.ajnengenharia.com.br/admin/carreiras/ | head -n 15
curl -isS --netrc-file "$HOME/.netrc-staging" https://staging.ajnengenharia.com.br/ | head -n 8
```

### Etapa A.3 — Credenciais Temporárias (`$HOME/.my-migrator.cnf`) e Backup Cifrado (`backup.sh`)

1. Crie `$HOME/.my-migrator.cnf` (`chmod 600`) com o usuário migrator do banco de staging:

```bash
install -m 600 /dev/null "$HOME/.my-migrator.cnf"
cat <<'EOF' > "$HOME/.my-migrator.cnf"
[client]
host=127.0.0.1
port=3306
user=u000000000_stg_mig
password=SENHA_DO_MIGRATOR_STAGING
EOF
```

2. Execute o script versionado `hostinger/ops/backup.sh` (`--env=staging`). Se já houver publicação anterior de staging, o script cifra `public_html`, `$STG_PRIVATE` e dump MySQL com OpenSSL AES-256-CBC PBKDF2 (`-iter 600000`), valida `gzip -t` e grava **`$HOME/backups/LAST_STAMP.staging`** sem gravar a senha em disco (você digita a senha **uma vez** via prompt `read -s` e guarda apenas no seu gerenciador de senhas; passe `--skip-db` apenas na primeira criação antes do schema inicial):

```bash
"$HOME/ajn-ops/backup.sh" \
  --env=staging \
  --public-dir="$STG_PUBLIC" \
  --private-dir="$STG_PRIVATE" \
  --db-name=DB_STAGING \
  --my-cnf="$HOME/.my-migrator.cnf"
```

3. **Cópia obrigatória fora do servidor (offsite):**

```bash
mkdir -p ./backups-offsite/staging
scp USUARIO@HOST_SSH:~/backups/*-"$(ssh USUARIO@HOST_SSH cat ~/backups/LAST_STAMP.staging)".* ./backups-offsite/staging/
ls -lh ./backups-offsite/staging/
```

### Etapa A.4 — Publicar Código Privado, `config.php` (`chmod 600`) e `public_html`

```bash
rsync -av --exclude='config.php' --exclude='maintenance.flag' --exclude='php-errors.log' --exclude='resumes/' \
  "$HOME/deploy-stage/staging/ajn-carreiras-private/" "$STG_PRIVATE/"
cp -f "$HOME/deploy-stage/staging/ajn-carreiras-private/resumes/.htaccess" "$STG_PRIVATE/resumes/.htaccess"

rsync -av --delete "$HOME/deploy-stage/staging/public_html/" "$STG_PUBLIC/"
```

Crie/confira `$STG_PRIVATE/config.php` (`chmod 600`) a partir de `config.example.php`:
- `'environment' => 'staging'`
- `'app_url' => 'https://staging.ajnengenharia.com.br'`
- `'allowed_origins' => ['https://staging.ajnengenharia.com.br']`
- `'known_webroots' => ['/home/USUARIO_HOSTINGER/domains/ajnengenharia.com.br/public_html', '/home/USUARIO_HOSTINGER/domains/staging.ajnengenharia.com.br/public_html']`
- `'encryption_key'` exclusiva de staging (`64` hex chars CSPRNG)
- `'resume_directory' => __DIR__ . '/resumes'`
- `'error_log_path' => __DIR__ . '/php-errors.log'`
- `'maintenance_flag_path' => __DIR__ . '/maintenance.flag'`
- `'security_alert_email' => 'faleconosco@ajnengenharia.com.br'`
- `'turnstile_secret_key' => '1x0000000000000000000000000000000AA'`
- `'database'` apontando exclusivamente para `DB_STAGING` + usuário runtime restrito (`u000000000_stg_app`: apenas `SELECT, INSERT, UPDATE, DELETE` configurados no hPanel).

### Etapa A.5 — Dois Ciclos Obrigatórios de Teste de Banco no Staging

No staging, valide obrigatoriamente os **dois cenários** antes de homologar:

#### Ciclo A.1 — Banco Novo (`migrate.php` de 001 a 006)

```bash
# 1. Dry-run mostra exatamente 001..006 pendentes e consulta SHOW GRANTS do usuario de runtime
"$PHP_BIN" -d extension=sodium "$STG_PRIVATE/migrate.php" \
  --defaults-file="$HOME/.my-migrator.cnf" \
  --database=DB_STAGING \
  --dry-run

# 2. Aplicar migrations em ordem com registro de SHA-256 em schema_migrations
"$PHP_BIN" -d extension=sodium "$STG_PRIVATE/migrate.php" \
  --defaults-file="$HOME/.my-migrator.cnf" \
  --database=DB_STAGING

# 3. Conferir status e reexecucao idempotente (0 aplicadas na segunda passada)
"$PHP_BIN" -d extension=sodium "$STG_PRIVATE/migrate.php" \
  --defaults-file="$HOME/.my-migrator.cnf" \
  --database=DB_STAGING \
  --status

"$PHP_BIN" -d extension=sodium "$STG_PRIVATE/migrate.php" \
  --defaults-file="$HOME/.my-migrator.cnf" \
  --database=DB_STAGING
```

#### Ciclo A.2 — Banco Existente no Estado 004 + Fixtures Legadas -> Upgrade `005..006` + `migrate-legacy-data.php`

Em um segundo banco de staging (`DB_STAGING_UPG`, isolado do banco de E2E), aplique apenas `001`..`004` via `migrate.php`, simule o estado pré-migrator (`DROP TABLE schema_migrations`), gere fixtures artificiais legadas (AES-GCM TOTP, admin sem MFA, telefone em texto claro e protocolo 40 bits), valide `--baseline=004`, aplique `005..006` e execute `migrate-legacy-data.php`:

```bash
mkdir -p "$HOME/deploy-stage/sql-004"
cp "$HOME/deploy-stage/staging/database"/00[1-4]_*.sql "$HOME/deploy-stage/sql-004/"

# Config temporario (CLI-only via AJN_CONFIG_PATH) apontando para DB_STAGING_UPG
"$PHP_BIN" -r '
  $cfg = require $argv[1];
  $cfg["environment"] = "staging";
  $cfg["database"]["name"] = "DB_STAGING_UPG";
  file_put_contents($argv[2], "<?php\nreturn " . var_export($cfg, true) . ";\n");
  chmod($argv[2], 0600);
' "$STG_PRIVATE/config.php" "$HOME/deploy-stage/stg-upg.config.php"

AJN_CONFIG_PATH="$HOME/deploy-stage/stg-upg.config.php" \
"$PHP_BIN" -d extension=sodium "$STG_PRIVATE/migrate.php" \
  --defaults-file="$HOME/.my-migrator.cnf" \
  --database=DB_STAGING_UPG \
  --migrations-dir="$HOME/deploy-stage/sql-004"

# Simular banco herdado na versao 004 (sem tabela schema_migrations)
mysql --defaults-extra-file="$HOME/.my-migrator.cnf" DB_STAGING_UPG -e "DROP TABLE schema_migrations;"

# Popular fixtures sinteticas (script bloqueado em production e bloqueado se schema >= 005)
AJN_CONFIG_PATH="$HOME/deploy-stage/stg-upg.config.php" \
"$PHP_BIN" -d extension=sodium "$HOME/ajn-ops/seed-legacy-fixtures.php"

# Baseline 004 verifica todas as tabelas/indices esperados, depois aplica somente 005 e 006
AJN_CONFIG_PATH="$HOME/deploy-stage/stg-upg.config.php" \
"$PHP_BIN" -d extension=sodium "$STG_PRIVATE/migrate.php" \
  --defaults-file="$HOME/.my-migrator.cnf" \
  --database=DB_STAGING_UPG \
  --baseline=004

AJN_CONFIG_PATH="$HOME/deploy-stage/stg-upg.config.php" \
"$PHP_BIN" -d extension=sodium "$STG_PRIVATE/migrate.php" \
  --defaults-file="$HOME/.my-migrator.cnf" \
  --database=DB_STAGING_UPG

# Migrar dados legados (dry-run -> real -> dry-run confirmando 0 pendencias)
AJN_CONFIG_PATH="$HOME/deploy-stage/stg-upg.config.php" \
"$PHP_BIN" -d extension=sodium "$STG_PRIVATE/migrate-legacy-data.php" --dry-run
AJN_CONFIG_PATH="$HOME/deploy-stage/stg-upg.config.php" \
"$PHP_BIN" -d extension=sodium "$STG_PRIVATE/migrate-legacy-data.php"
AJN_CONFIG_PATH="$HOME/deploy-stage/stg-upg.config.php" \
"$PHP_BIN" -d extension=sodium "$STG_PRIVATE/migrate-legacy-data.php" --dry-run

rm -rf "$HOME/deploy-stage/sql-004" "$HOME/deploy-stage/stg-upg.config.php"
```

Após validar o Ciclo A.2, aponte `config.php` de volta para o banco limpo do Ciclo A.1 e provisione o superadmin de staging:

```bash
AJN_ADMIN_EMAIL="admin@ajnengenharia.com.br" \
AJN_ADMIN_NAME="Administrador Staging" \
"$PHP_BIN" -d extension=sodium "$STG_PRIVATE/seed-admin.php"

"$PHP_BIN" -d extension=sodium "$STG_PRIVATE/verify-audit-chain.php"
```

### Etapa A.6 — Desligar Manutenção, Limpar Temporários e Rodar `audit-live-hardening`

```bash
rm -f "$STG_PRIVATE/maintenance.flag" "$HOME/.my-migrator.cnf" "$HOME/.netrc-staging"
```

Na máquina local, execute a auditoria live passando credenciais exclusivamente por variáveis de ambiente:

```bash
export LIVE_AUDIT_BASIC_USER="staging_user"
export LIVE_AUDIT_BASIC_PASS="SENHA_DO_STAGING"
node scripts/audit-live-hardening.mjs --url=https://staging.ajnengenharia.com.br --expect-basic-auth
unset LIVE_AUDIT_BASIC_USER LIVE_AUDIT_BASIC_PASS
```

Confirme:
- **`[live-audit] PASS: 25/25 controles verificados`** (inclui explicitamente `GET / sem credenciais = 401 Basic Auth`).
- Fluxo E2E completo validado no navegador (login + TOTP, step-up, vaga, candidatura com PDF, download privado, recuperação e LGPD).

**PORTÃO OBRIGATÓRIO:** se qualquer item falhar, **ABORTE** ou execute `rollback.sh staging`. Nunca avance para Produção com pendência em Staging.

### Etapa A.7 — 3 Crons de Staging com Wrapper de Log (Sem `/dev/null`) + Alerta de Teste

Cadastre no hPanel os **3 jobs** usando `$HOME/ajn-ops/run-cron.sh` e logs fora do webroot (`$HOME/ajn-logs/staging/`, rotação automática):

- Envio da fila de alertas (a cada 2 minutos):
  `*/2 * * * * /home/USUARIO/ajn-ops/run-cron.sh --log-dir=/home/USUARIO/ajn-logs/staging --name=alerts -- /CAMINHO/REAL/DO/php -d extension=sodium /home/USUARIO/ajn-private/staging/send-security-alerts.php`
- Expurgo diário LGPD (03:30 — falha enfileira `DATA_RETENTION_PURGE_FAILED` e sai != 0):
  `30 3 * * * /home/USUARIO/ajn-ops/run-cron.sh --log-dir=/home/USUARIO/ajn-logs/staging --name=purge -- /CAMINHO/REAL/DO/php -d extension=sodium /home/USUARIO/ajn-private/staging/purge-expired-data.php`
- Verificação diária da cadeia de auditoria (04:00 — falha enfileira `AUDIT_CHAIN_INTEGRITY_FAILED` e sai != 0):
  `0 4 * * * /home/USUARIO/ajn-ops/run-cron.sh --log-dir=/home/USUARIO/ajn-logs/staging --name=audit-chain -- /CAMINHO/REAL/DO/php -d extension=sodium /home/USUARIO/ajn-private/staging/verify-audit-chain.php`

Dispare e confirme o recebimento real do alerta operacional de teste em `faleconosco@ajnengenharia.com.br`:

```bash
"$PHP_BIN" -d extension=sodium "$STG_PRIVATE/send-security-alerts.php" --test-alert
```

---

## GATE DE PASSAGEM — SAÍDA DE STAGING OBRIGATÓRIA ANTES DE PRODUÇÃO

A **PARTE B — PRODUÇÃO** só pode ser iniciada após colar abaixo a saída integral de staging com **`25/25`** (incluindo `GET / sem credenciais = 401 Basic Auth`):

```text
PENDENTE: cole aqui a saida integral de:
node scripts/audit-live-hardening.mjs --url=https://staging.ajnengenharia.com.br --expect-basic-auth
com resultado "[live-audit] PASS: 25/25 controles verificados..." antes de iniciar a Parte B.
```

---

## PARTE B — PRODUÇÃO

Caminhos padrão de produção:
- Webroot produção: `$PROD_PUBLIC="$HOME/domains/ajnengenharia.com.br/public_html"`
- Diretório privado produção (fora de todas as raízes web): `$PROD_PRIVATE="$HOME/ajn-private/prod"`
- Logs de cron produção: `$HOME/ajn-logs/prod`

### Etapa B.0 — Pré-checagens e Isolamento de Diretórios em Produção

```bash
mkdir -p "$HOME/backups" "$HOME/deploy-stage/prod" "$HOME/ajn-ops" "$HOME/ajn-logs/prod" "$PROD_PRIVATE/resumes"
chmod 700 "$HOME/backups" "$HOME/ajn-ops" "$HOME/ajn-logs" "$HOME/ajn-logs/prod" "$PROD_PRIVATE" "$PROD_PRIVATE/resumes"

PHP_BIN="$(command -v php)"
echo "PHP_BIN=$PHP_BIN"
"$PHP_BIN" -v
"$PHP_BIN" -m | grep -E '^(sodium|pdo_mysql|openssl|mbstring|json|curl)$'
"$PHP_BIN" -r 'foreach (["sodium","pdo_mysql","openssl"] as $ext) { if (!extension_loaded($ext)) { fwrite(STDERR, "Falta extensao: $ext\n"); exit(1); } } echo "CLI extensions OK\n";'
df -h "$HOME"

"$HOME/ajn-ops/check-layout.sh" \
  --prod-public="$PROD_PUBLIC" \
  --staging-public="$STG_PUBLIC" \
  --private-dir="$PROD_PRIVATE" \
  --private-dir="$STG_PRIVATE"
```

### Etapa B.1 — Geração do Pacote de Produção e Upload para `~/deploy-stage/prod`

Somente após receber a `PUBLIC_TURNSTILE_SITE_KEY` real de produção (`0x4...`, nunca `1x`/`2x`/`3x`):

```bash
PUBLIC_SITE_ORIGIN="https://ajnengenharia.com.br" \
PUBLIC_ALLOW_INDEXING="true" \
PUBLIC_CONTACT_ENDPOINT="https://api.opengscgandra.tech/contact" \
PUBLIC_TURNSTILE_SITE_KEY="COLE_AQUI_SITE_KEY_REAL_TURNSTILE" \
npm run validate

npm run pack:hostinger
rsync -avz --delete output/hostinger-deploy/ USUARIO@HOST_SSH:~/deploy-stage/prod/
```

No servidor, atualize os scripts operacionais:

```bash
cp -f "$HOME/deploy-stage/prod/ops/"* "$HOME/ajn-ops/"
chmod +x "$HOME/ajn-ops/"*.sh
```

### Etapa B.2 — Ligar Modo Manutenção em Produção (`503` + `Retry-After`) — ANTES do Backup Final

- **Caminho 1 — Primeira implantação em `public_html` novo:** aplique o bloco temporário `.htaccess` de 503 em `/api/*` e `/admin/*` antes de migrar banco/arquivos.
- **Caminho 2 — Produção já no ar:** crie a flag fora do webroot:

```bash
date -u +"%Y-%m-%dT%H:%M:%SZ" > "$PROD_PRIVATE/maintenance.flag"
chmod 640 "$PROD_PRIVATE/maintenance.flag"
```

Valide ambos com os mesmos comandos de checagem `503` + `Retry-After`:

```bash
curl -isS https://ajnengenharia.com.br/api/health | head -n 15
curl -isS https://ajnengenharia.com.br/admin/carreiras/ | head -n 15
curl -isS https://ajnengenharia.com.br/ | head -n 8
```

### Etapa B.3 — Credenciais Temporárias + Backup Cifrado em Produção (`backup.sh --env=prod`)

1. Crie `$HOME/.my-migrator.cnf` (`chmod 600`):

```bash
install -m 600 /dev/null "$HOME/.my-migrator.cnf"
cat <<'EOF' > "$HOME/.my-migrator.cnf"
[client]
host=127.0.0.1
port=3306
user=u000000000_ajn_migrator
password=SENHA_EXCLUSIVA_DO_MIGRATOR_PRODUCAO
EOF
```

2. Execute `backup.sh --env=prod` (lê a senha via `read -s` sem salvá-la no servidor e grava **`$HOME/backups/LAST_STAMP.prod`**; na primeira criação sem schema, use `--skip-db`):

```bash
"$HOME/ajn-ops/backup.sh" \
  --env=prod \
  --public-dir="$PROD_PUBLIC" \
  --private-dir="$PROD_PRIVATE" \
  --db-name=DB_PRODUCAO \
  --my-cnf="$HOME/.my-migrator.cnf"
```

3. **Cópia obrigatória fora do servidor antes da troca:**

```bash
mkdir -p ./backups-offsite/prod
scp USUARIO@HOST_SSH:~/backups/*-"$(ssh USUARIO@HOST_SSH cat ~/backups/LAST_STAMP.prod)".* ./backups-offsite/prod/
ls -lh ./backups-offsite/prod/
```

### Etapa B.4 — Auditoria de Diferença em `public_html` (OBRIGATÓRIA ANTES DO `mv`)

**REGRA INVIOLÁVEL:** o `public_html` atual pode conter arquivos de verificação DNS/Search Console/Meta, `.well-known/acme-challenge/*` de SSL ou pastas de subdomínios/sistemas legados que **não** estão no pacote. Rode `check-public-diff.sh` antes de preparar a troca:

```bash
"$HOME/ajn-ops/check-public-diff.sh" \
  --current-public="$PROD_PUBLIC" \
  --package-public="$HOME/deploy-stage/prod/public_html"
```

- Se sair com código `2` (há itens extras no servidor), **PARE IMEDIATAMENTE**, apresente a lista ao responsável e confirme explicitamente o que deve ser copiado para `"${PROD_PUBLIC}.next"` antes do `mv`. **Nunca descarte itens silenciosamente.**

### Etapa B.5 — `config.php`, Troca Atômica (`mv`), Migrations (`migrate.php`) e MFA

1. Atualize `$PROD_PRIVATE` mantendo `config.php`, `maintenance.flag` e `resumes/`:

```bash
rsync -av --exclude='config.php' --exclude='maintenance.flag' --exclude='php-errors.log' --exclude='resumes/' \
  "$HOME/deploy-stage/prod/ajn-carreiras-private/" "$PROD_PRIVATE/"
cp -f "$HOME/deploy-stage/prod/ajn-carreiras-private/resumes/.htaccess" "$PROD_PRIVATE/resumes/.htaccess"
```

2. Confira `$PROD_PRIVATE/config.php` (`chmod 600`):
   - `'environment' => 'production'`
   - `'app_url' => 'https://ajnengenharia.com.br'`
   - `'allowed_origins' => ['https://ajnengenharia.com.br', 'https://www.ajnengenharia.com.br']`
   - `'known_webroots' => ['/home/USUARIO_HOSTINGER/domains/ajnengenharia.com.br/public_html', '/home/USUARIO_HOSTINGER/domains/staging.ajnengenharia.com.br/public_html']`
   - `'encryption_key'` exclusiva de produção (`64` hex chars CSPRNG, diferente da de staging)
   - `'previous_encryption_keys'` apenas durante rotação de chave
   - `'resume_directory' => __DIR__ . '/resumes'`
   - `'error_log_path' => __DIR__ . '/php-errors.log'`
   - `'maintenance_flag_path' => __DIR__ . '/maintenance.flag'`
   - `'security_alert_email' => 'faleconosco@ajnengenharia.com.br'`
   - `'turnstile_secret_key' => '<SECRET_KEY_REAL_DO_PAR_TURNSTILE_DE_PRODUCAO>'`
   - `'database'`: banco e usuário runtime `u000000000_ajn_app_rw` (configurado no **hPanel** apenas com `SELECT, INSERT, UPDATE, DELETE`)

3. Prepare `"${PROD_PUBLIC}.next"`, copie **somente os extras aprovados na Etapa B.4**, garanta `SetEnv AJN_PRIVATE_DIR` (se usando `$HOME/ajn-private/prod` em vez de `../ajn-carreiras-private`), e realize a troca atômica:

```bash
rm -rf "${PROD_PUBLIC}.next"
cp -a "$HOME/deploy-stage/prod/public_html" "${PROD_PUBLIC}.next"
# Exemplo caso existam itens aprovados na Etapa B.4:
# cp -a "$PROD_PUBLIC/googleXXXXXXXX.html" "${PROD_PUBLIC}.next/"

if [ -d "$PROD_PUBLIC" ]; then
  mv "$PROD_PUBLIC" "${PROD_PUBLIC}.prev"
fi
mv "${PROD_PUBLIC}.next" "$PROD_PUBLIC"
```

4. Aplique migrations de forma rastreável com `migrate.php`:
   - **Se o banco de produção já existir sem `schema_migrations` (no estado 004):** valide e registre o baseline primeiro, depois aplique somente `005` e `006`:

```bash
"$PHP_BIN" -d extension=sodium "$PROD_PRIVATE/migrate.php" \
  --defaults-file="$HOME/.my-migrator.cnf" \
  --database=DB_PRODUCAO \
  --baseline=004

"$PHP_BIN" -d extension=sodium "$PROD_PRIVATE/migrate.php" \
  --defaults-file="$HOME/.my-migrator.cnf" \
  --database=DB_PRODUCAO
```

   - **Se for banco novo (primeira implantação):**

```bash
"$PHP_BIN" -d extension=sodium "$PROD_PRIVATE/migrate.php" \
  --defaults-file="$HOME/.my-migrator.cnf" \
  --database=DB_PRODUCAO \
  --dry-run

"$PHP_BIN" -d extension=sodium "$PROD_PRIVATE/migrate.php" \
  --defaults-file="$HOME/.my-migrator.cnf" \
  --database=DB_PRODUCAO
```

   - Confira que o `[AVISO]` de privilégios excessivos em runtime **não** foi emitido (`u000_ajn_app_rw` só tem `SELECT, INSERT, UPDATE, DELETE`) e finalize migração de dados legados + MFA + cadeia de auditoria:

```bash
"$PHP_BIN" -d extension=sodium "$PROD_PRIVATE/migrate.php" \
  --defaults-file="$HOME/.my-migrator.cnf" \
  --database=DB_PRODUCAO \
  --status

"$PHP_BIN" -d extension=sodium "$PROD_PRIVATE/migrate-legacy-data.php" --dry-run
"$PHP_BIN" -d extension=sodium "$PROD_PRIVATE/migrate-legacy-data.php"
"$PHP_BIN" -d extension=sodium "$PROD_PRIVATE/migrate-legacy-data.php" --dry-run
```

   - Se houver qualquer `ADMIN_WITHOUT_MFA`, provisione via SSH (`provision-user-mfa.php`), ou em primeira implantação crie o `super_admin` (`seed-admin.php`):

```bash
AJN_ADMIN_EMAIL="admin@ajnengenharia.com.br" \
AJN_ADMIN_NAME="Administrador AJN" \
"$PHP_BIN" -d extension=sodium "$PROD_PRIVATE/seed-admin.php"

"$PHP_BIN" -d extension=sodium "$PROD_PRIVATE/verify-audit-chain.php"
rm -f "$HOME/.my-migrator.cnf"
```

### Etapa B.6 — Desligar Manutenção e Validar Produção

```bash
rm -f "$PROD_PRIVATE/maintenance.flag"
```

Na máquina local:

```bash
node scripts/audit-live-hardening.mjs --url=https://ajnengenharia.com.br
npm run audit:live-security
```

Confirme:
- `[live-audit] PASS: 24/24 controles verificados em https://ajnengenharia.com.br.`
- `GET /api/health` responde `200` sem expor `environment`.
- Após validar estabilidade, arquive/remova `"${PROD_PUBLIC}.prev"`.

### Etapa B.7 — 3 Crons de Produção com Wrapper de Log (Sem `/dev/null`) + Alerta de Teste

Cadastre no hPanel (ou `crontab`) usando o **`PHP_BIN` real da Etapa B.0** e logs rotacionados **fora de webroot** (`$HOME/ajn-logs/prod`):

- Fila de alertas de segurança (a cada 2 minutos):
  `*/2 * * * * /home/USUARIO/ajn-ops/run-cron.sh --log-dir=/home/USUARIO/ajn-logs/prod --name=alerts -- /CAMINHO/REAL/DO/php -d extension=sodium /home/USUARIO/ajn-private/prod/send-security-alerts.php`
- Expurgo diário de retenção LGPD (03:30 — falha sai != 0 e enfileira `DATA_RETENTION_PURGE_FAILED`):
  `30 3 * * * /home/USUARIO/ajn-ops/run-cron.sh --log-dir=/home/USUARIO/ajn-logs/prod --name=purge -- /CAMINHO/REAL/DO/php -d extension=sodium /home/USUARIO/ajn-private/prod/purge-expired-data.php`
- Verificação diária de integridade da cadeia de auditoria (04:00 — falha sai != 0 e enfileira `AUDIT_CHAIN_INTEGRITY_FAILED`):
  `0 4 * * * /home/USUARIO/ajn-ops/run-cron.sh --log-dir=/home/USUARIO/ajn-logs/prod --name=audit-chain -- /CAMINHO/REAL/DO/php -d extension=sodium /home/USUARIO/ajn-private/prod/verify-audit-chain.php`

Dispare o teste operacional e **confirme a chegada real** do e-mail `[ALERTA DE SEGURANCA AJN] DEPLOY_TEST_ALERT` em **`faleconosco@ajnengenharia.com.br`**:

```bash
"$PHP_BIN" -d extension=sodium "$PROD_PRIVATE/send-security-alerts.php" --test-alert
```

---

## ROLLBACK Seguro por Script Versionado (`hostinger/ops/rollback.sh`)

**REGRA INVIOLÁVEL:** **NUNCA** apague o diretório ativo antes de extrair, validar e conferir o ambiente. O script `hostinger/ops/rollback.sh` lê **`LAST_STAMP.<staging|prod>`** específico do ambiente, **ABORTA** se o prefixo do `STAMP` ou os caminhos não baterem com o ambiente informado, pede a passphrase via `read -s`, extrai/verifica em diretório temporário e realiza troca atômica por `mv`.

Exemplo para **Produção**:

```bash
# Crie $HOME/.my-migrator.cnf temporariamente se for restaurar tambem o dump MySQL
"$HOME/ajn-ops/rollback.sh" prod \
  --public-dir="$PROD_PUBLIC" \
  --private-dir="$PROD_PRIVATE" \
  --backups-dir="$HOME/backups" \
  --db-name=DB_PRODUCAO \
  --my-cnf="$HOME/.my-migrator.cnf"

rm -f "$HOME/.my-migrator.cnf"
```

Exemplo para **Staging**:

```bash
"$HOME/ajn-ops/rollback.sh" staging \
  --public-dir="$STG_PUBLIC" \
  --private-dir="$STG_PRIVATE" \
  --backups-dir="$HOME/backups" \
  --db-name=DB_STAGING \
  --my-cnf="$HOME/.my-migrator.cnf"

rm -f "$HOME/.my-migrator.cnf"
```

Após o rollback, execute `audit-live-hardening.mjs` contra a URL restaurada e, somente após confirmar estabilidade e preservar evidências se necessário, remova `public_html.failed.*` e `prod.failed.*`/`staging.failed.*`.
