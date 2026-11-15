# Runbook Operacional de Deploy — AJN Carreiras (Hostinger)

Este documento define o procedimento oficial de publicação segura em **duas partes sequenciais e bloqueantes**:

- **PARTE A — STAGING:** subdomínio isolado (ex.: `https://staging.ajnengenharia.com.br`), banco MySQL próprio e **zero dados reais**. A Parte B é **proibida** enquanto qualquer item da Parte A falhar.
- **PARTE B — PRODUÇÃO:** domínio principal (`https://ajnengenharia.com.br`). Só inicia após **100% da Parte A verde** com a saída completa do `audit-live-hardening` de staging colada no registro de homologação.

---

## Mapa de Variáveis e Chaves (Build vs Servidor Privado)

1. **`PUBLIC_TURNSTILE_SITE_KEY` (variável pública de build Astro, local/CI antes do `npm run build`):**
   - Entra no HTML dos formulários de carreiras (`/carreiras/`, `/carreiras/vaga/`, `/carreiras/talentos/`, `/carreiras/acompanhamento/`).
   - **Staging:** use `PUBLIC_ALLOW_INDEXING=false` e a sitekey de teste oficial Cloudflare (`1x00000000000000000000AA`) ou a sitekey específica do hostname de staging.
   - **Produção:** exige `PUBLIC_ALLOW_INDEXING=true` e a `PUBLIC_TURNSTILE_SITE_KEY` real de produção (`npm run build` e `npm run pack:hostinger` falham fechados se vazia ou `1x`/`2x`/`3x`).
2. **`turnstile_secret_key` (segredo privado no servidor — `<DOMINIO_PRIVADO>/config.php`, chmod `0600`):**
   - Nome exato lido por `bootstrap.php`: **`turnstile_secret_key`** (nunca `turnstile_secret`; nome divergente retorna HTTP **503** fail-closed em `production`).
   - Em `environment => 'production'`, chave ausente, curta ou `1x`/`2x`/`3x` faz os endpoints públicos responderem **HTTP 503**.
3. **`security_alert_email` (unificado com `public/.well-known/security.txt`):**
   - Use **`faleconosco@ajnengenharia.com.br`** (mesmo endereço divulgado em `public/.well-known/security.txt` e `SECURITY.md`) em `config.php`, salvo criação formal de caixa dedicada.
4. **`AJN_CONFIG_PATH`:**
   - Aceito **exclusivamente quando `PHP_SAPI === 'cli'`** (via `ajn_cli_config_path()`). Requisições web/HTTP sempre ignoram `AJN_CONFIG_PATH` e usam apenas o `config.php` irmão de `bootstrap.php`.

---

## PARTE A — STAGING

Alvo padrão na Hostinger (subdomínio dedicado):
- Diretório base do subdomínio: `$SUB_BASE="$HOME/domains/staging.ajnengenharia.com.br"`
- Webroot público: `$SUB_BASE/public_html`
- Diretório privado (fora do webroot, irmão de `public_html`): `$SUB_BASE/ajn-carreiras-private`
- Flag de manutenção (fora do webroot): `$SUB_BASE/ajn-carreiras-private/maintenance.flag`

### Etapa A.0 — Pré-checagens no servidor (PHP CLI, extensões, binário de cron e disco)

Execute via SSH antes de mover qualquer arquivo:

```bash
export SUB_BASE="$HOME/domains/staging.ajnengenharia.com.br"
mkdir -p "$HOME/backups" "$HOME/deploy-stage/staging"

# 1. Versao e modulos do PHP CLI (comparar com versao selecionada no hPanel para a web)
PHP_BIN="$(command -v php)"
echo "PHP_BIN=$PHP_BIN"
"$PHP_BIN" -v
"$PHP_BIN" -m | grep -E '^(sodium|pdo_mysql|openssl|mbstring|json|curl)$'

# Confirme manualmente que sodium, pdo_mysql e openssl foram listados e que a
# versao principal (ex.: PHP 8.2 / 8.3) coincide com a versao web do subdominio.
"$PHP_BIN" -r 'foreach (["sodium","pdo_mysql","openssl"] as $ext) { if (!extension_loaded($ext)) { fwrite(STDERR, "Falta extensao: $ext\n"); exit(1); } } echo "CLI extensions OK\n";'

# 2. Espaco em disco disponivel (exigir margem segura antes de dump e upload)
df -h "$HOME"
```

### Etapa A.1 — Geração local e upload do pacote para `~/deploy-stage/staging`

Na sua máquina local (a partir de `astro-site/`):

```bash
# Build explicito de STAGING (noindex em 100% das paginas, robots Disallow: /, sitekey de teste)
PUBLIC_SITE_ORIGIN="https://staging.ajnengenharia.com.br" \
PUBLIC_ALLOW_INDEXING="false" \
PUBLIC_CONTACT_ENDPOINT="https://api.opengscgandra.tech/contact" \
PUBLIC_TURNSTILE_SITE_KEY="1x00000000000000000000AA" \
npm run build

# Gera pacote exclusivamente em output/hostinger-staging (nunca toca output/hostinger-deploy)
npm run pack:hostinger:staging
```

Verifique na saída do comando:
- `Modo: staging`
- `Indexação: false` e `HTML noindex: true (182)`
- `Turnstile no HTML: true`
- `SHA-256 CSP (.htaccess sincronizado): <hash>`

Envie o pacote gerado (`output/hostinger-staging/`) para **`~/deploy-stage/staging`** via SSH/`rsync`:

```bash
rsync -avz --delete output/hostinger-staging/ USUARIO@HOST_SSH:~/deploy-stage/staging/
```

No servidor, confira que `$HOME/deploy-stage/staging` contém exatamente `public_html/`, `ajn-carreiras-private/`, `database/` e `DEPLOY-CHECKLIST.md`.

### Etapa A.2 — Ligar Modo Manutenção (`503` + `Retry-After` em `/api/*` e `/admin/*`)

Se staging já estiver publicado, ative o arquivo-flag **fora do webroot** antes de alterar banco ou código:

```bash
mkdir -p "$SUB_BASE/ajn-carreiras-private"
date -u +"%Y-%m-%dT%H:%M:%SZ" > "$SUB_BASE/ajn-carreiras-private/maintenance.flag"
chmod 640 "$SUB_BASE/ajn-carreiras-private/maintenance.flag"
```

Se `.htaccess` e `api/index.php` já estiverem no ar, valide que `/api/*` e `/admin/*` devolvem **503** com `Retry-After` enquanto páginas institucionais seguem em **200** (ou após configurar `.htpasswd` no subdomínio):

```bash
curl -isS -u "staging_user:SENHA_STAGING" https://staging.ajnengenharia.com.br/api/health | head -n 15
curl -isS -u "staging_user:SENHA_STAGING" https://staging.ajnengenharia.com.br/admin/carreiras/ | head -n 15
curl -isS -u "staging_user:SENHA_STAGING" https://staging.ajnengenharia.com.br/ | head -n 8
```

### Etapa A.3 — Backup cifrado e cópia fora do servidor (Staging)

Execute o backup completo com `set -euo pipefail`, gravação do marcador em `~/backups/LAST_STAMP` e teste obrigatório de decifragem + descompactação antes de prosseguir:

```bash
bash -euo pipefail -c '
  SUB_BASE="$HOME/domains/staging.ajnengenharia.com.br"
  STAMP="staging-$(date -u +%Y%m%dT%H%M%SZ)"
  mkdir -p "$HOME/backups"
  printf "%s\n" "$STAMP" > "$HOME/backups/LAST_STAMP"

  # Backup de arquivos atuais do subdominio (se existentes)
  if [ -d "$SUB_BASE/public_html" ]; then
    tar -czf - -C "$SUB_BASE" public_html ajn-carreiras-private 2>/dev/null \
      | openssl enc -aes-256-cbc -pbkdf2 -iter 600000 -salt -out "$HOME/backups/files-$STAMP.tar.gz.enc"
    test -s "$HOME/backups/files-$STAMP.tar.gz.enc"
    openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 -in "$HOME/backups/files-$STAMP.tar.gz.enc" | gzip -t
  fi

  # Backup do banco de staging (se ja existir schema populado)
  mysqldump --defaults-extra-file="$HOME/.my-migrator.cnf" --single-transaction --routines --triggers DB_STAGING \
    | gzip -9 \
    | openssl enc -aes-256-cbc -pbkdf2 -iter 600000 -salt -out "$HOME/backups/db-$STAMP.sql.gz.enc"
  test -s "$HOME/backups/db-$STAMP.sql.gz.enc"
  openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 -in "$HOME/backups/db-$STAMP.sql.gz.enc" | gzip -t
  echo "BACKUP STAGING VERIFICADO: STAMP=$STAMP"
'
```

**Obrigatório — cópia fora do servidor antes da etapa seguinte:**

Na máquina local de operação, copie os artefatos cifrados para cofre/armazenamento offline:

```bash
mkdir -p ./backups-offsite/staging
scp USUARIO@HOST_SSH:~/backups/*-"$(ssh USUARIO@HOST_SSH cat ~/backups/LAST_STAMP)".* ./backups-offsite/staging/
ls -lh ./backups-offsite/staging/
```

### Etapa A.4 — Credenciais do `migrator` em arquivo separado (`$HOME/.my-migrator.cnf`)

Crie `$HOME/.my-migrator.cnf` **sempre usando `$HOME`** (evita falha de expansão literal de `~` em opções `--defaults-extra-file`) e com permissão `600`:

```bash
install -m 600 /dev/null "$HOME/.my-migrator.cnf"
cat <<'EOF' > "$HOME/.my-migrator.cnf"
[client]
host=127.0.0.1
port=3306
user=u000000000_stg_mig
password=SENHA_DO_MIGRATOR_STAGING
EOF
chmod 600 "$HOME/.my-migrator.cnf"
```

### Etapa A.5 — Configuração privada, proteções do staging (`.htpasswd` + `robots`), migrations, MFA, upload e auditoria

1. **Proteção do subdomínio de staging com HTTP Basic Auth fora do webroot + `robots.txt`:**
   - Crie o arquivo `.htpasswd-staging` **fora de `public_html`** (use `htpasswd` ou `"$PHP_BIN" -r` para gerar hash bcrypt):

```bash
"$PHP_BIN" -r '$u="staging_user"; $p=getenv("STG_PASS"); echo $u . ":" . password_hash($p, PASSWORD_BCRYPT) . "\n";' > "$SUB_BASE/.htpasswd-staging"
chmod 640 "$SUB_BASE/.htpasswd-staging"
```

   - Confirme que `dist/robots.txt` (`public_html/robots.txt`) contém exatamente `User-agent: *` + `Disallow: /` e **não** contém `Allow: /`.
   - Ative **"Diretórios protegidos por senha"** no hPanel apontando para `/` do subdomínio `staging.ajnengenharia.com.br` (ou adicione o bloco `AuthType Basic` com `AuthUserFile /home/USUARIO/domains/staging.ajnengenharia.com.br/.htpasswd-staging` diretamente no `public_html/.htaccess` do servidor de staging logo após o upload do `.htaccess`). **Nunca comite `AuthUserFile` no `public/.htaccess` compartilhado do repositório.**

2. **Publicar código privado e `public_html` a partir de `$HOME/deploy-stage/staging`:**

```bash
mkdir -p "$SUB_BASE/public_html" "$SUB_BASE/ajn-carreiras-private/resumes"
chmod 700 "$SUB_BASE/ajn-carreiras-private" "$SUB_BASE/ajn-carreiras-private/resumes"

# Preservar config.php e maintenance.flag existentes ao atualizar codigo privado
rsync -av --exclude='config.php' --exclude='maintenance.flag' --exclude='php-errors.log' --exclude='resumes/' \
  "$HOME/deploy-stage/staging/ajn-carreiras-private/" "$SUB_BASE/ajn-carreiras-private/"
cp -f "$HOME/deploy-stage/staging/ajn-carreiras-private/resumes/.htaccess" "$SUB_BASE/ajn-carreiras-private/resumes/.htaccess"

rsync -av --delete "$HOME/deploy-stage/staging/public_html/" "$SUB_BASE/public_html/"
```

3. **Instalar/conferir `config.php` de staging (`chmod 600`) fora do webroot:**

Copie `config.example.php` para `$SUB_BASE/ajn-carreiras-private/config.php` com `chmod 600`, ajustando:
- `'environment' => 'staging'`
- `'app_url' => 'https://staging.ajnengenharia.com.br'`
- `'allowed_origins' => ['https://staging.ajnengenharia.com.br']`
- `'encryption_key'` exclusiva de staging (64 hex chars via `php -r 'echo bin2hex(random_bytes(32)), PHP_EOL;'`)
- `'resume_directory' => __DIR__ . '/resumes'`
- `'error_log_path' => __DIR__ . '/php-errors.log'`
- `'maintenance_flag_path' => __DIR__ . '/maintenance.flag'`
- `'security_alert_email' => 'faleconosco@ajnengenharia.com.br'`
- `'turnstile_secret_key' => '1x0000000000000000000000000000000AA'` (ou secret do widget de staging)
- `'database'` apontando exclusivamente para o banco e usuário runtime de staging (`u000000000_stg_app`, somente `SELECT, INSERT, UPDATE, DELETE`)

4. **Aplicar migrations SQL (`001` -> `006`) e validar dados legados (`dry-run -> real -> dry-run`):**

```bash
for sql in \
  "$HOME/deploy-stage/staging/database/001_initial.sql" \
  "$HOME/deploy-stage/staging/database/002_hardening.sql" \
  "$HOME/deploy-stage/staging/database/003_least_privilege.sql" \
  "$HOME/deploy-stage/staging/database/004_indexes.sql" \
  "$HOME/deploy-stage/staging/database/005_security_hardening.sql" \
  "$HOME/deploy-stage/staging/database/006_security_alerts_and_ip_locks.sql"; do
  mysql --defaults-extra-file="$HOME/.my-migrator.cnf" DB_STAGING < "$sql"
done

"$PHP_BIN" -d extension=sodium "$SUB_BASE/ajn-carreiras-private/migrate-legacy-data.php" --dry-run
"$PHP_BIN" -d extension=sodium "$SUB_BASE/ajn-carreiras-private/migrate-legacy-data.php"
"$PHP_BIN" -d extension=sodium "$SUB_BASE/ajn-carreiras-private/migrate-legacy-data.php" --dry-run
```

Confirme no segundo `--dry-run` que `mfa_recifrados=0, telefones_cifrados=0, tracking_migrados=0` e nenhum admin ativo está listado em `ADMIN_WITHOUT_MFA`.

5. **Provisionar `super_admin` e MFA via SSH (nunca senha na linha de comando):**

```bash
AJN_ADMIN_EMAIL="admin@ajnengenharia.com.br" \
AJN_ADMIN_NAME="Administrador Staging" \
"$PHP_BIN" -d extension=sodium "$SUB_BASE/ajn-carreiras-private/seed-admin.php"

"$PHP_BIN" -d extension=sodium "$SUB_BASE/ajn-carreiras-private/verify-audit-chain.php"
```

### Etapa A.6 — Auditoria com manutenção desligada e limpeza de `.my-migrator.cnf`

Só remova `maintenance.flag` quando migrations, `migrate-legacy-data`, `seed-admin` e `verify-audit-chain` estiverem verdes. Em seguida rode o `audit-live-hardening` passando a Basic Auth **exclusivamente via variável de ambiente** (nunca por argumento CLI ou na URL):

```bash
# Remova modo manutencao e credencial temporaria de migrator
rm -f "$SUB_BASE/ajn-carreiras-private/maintenance.flag" "$HOME/.my-migrator.cnf"
```

Na máquina local (passando credenciais Basic Auth **apenas** via variáveis de ambiente):

```bash
export LIVE_AUDIT_BASIC_USER="staging_user"
export LIVE_AUDIT_BASIC_PASS="SENHA_STAGING"
node scripts/audit-live-hardening.mjs --url=https://staging.ajnengenharia.com.br
unset LIVE_AUDIT_BASIC_USER LIVE_AUDIT_BASIC_PASS
```

Verifique também proteção externa sem credenciais (`HTTP 401`), `robots.txt` (`Disallow: /`), meta `noindex`, e fluxo E2E no navegador (login + TOTP, step-up, vaga, candidatura com PDF, download privado, recuperação de protocolo e exclusão LGPD).

**PORTÃO OBRIGATÓRIO:** se qualquer item de `audit-live-hardening.mjs` ou E2E em staging falhar, **ABORTE** e corrija antes de tocar produção. Se o rollback for necessário em staging, siga o procedimento da seção **ROLLBACK Seguro por Troca Atômica (`mv`)**.

### Etapa A.7 — Crons de staging + envio e confirmação de alerta de teste

No hPanel (ou `crontab`), cadastre usando o **`PHP_BIN` real obtido na Etapa A.0** (ex.: `/opt/alt/php82/usr/bin/php` ou `/usr/bin/php` retornado por `command -v php`):

- Fila de alertas (a cada 2 minutos):
  `*/2 * * * * /CAMINHO/REAL/DO/php -d extension=sodium $HOME/domains/staging.ajnengenharia.com.br/ajn-carreiras-private/send-security-alerts.php >/dev/null 2>&1`
- Expurgo LGPD (diário 03:30):
  `30 3 * * * /CAMINHO/REAL/DO/php -d extension=sodium $HOME/domains/staging.ajnengenharia.com.br/ajn-carreiras-private/purge-expired-data.php >/dev/null 2>&1`

Execute agora o **alerta de teste operacional** e confirme o recebimento real na caixa **`faleconosco@ajnengenharia.com.br`** (e no log `audit_logs` como `SECURITY_ALERT` / `DEPLOY_TEST_ALERT`):

```bash
"$PHP_BIN" -d extension=sodium "$SUB_BASE/ajn-carreiras-private/send-security-alerts.php" --test-alert
```

Confirme `"ok":true,"testAlert":true,"recipient":"faleconosco@ajnengenharia.com.br","sent":1,"failed":0` e abra a caixa `faleconosco@ajnengenharia.com.br` para confirmar recebimento do e-mail `[ALERTA DE SEGURANCA AJN] DEPLOY_TEST_ALERT`.

---

## GATE DE PASSAGEM — SAÍDA DE STAGING OBRIGATÓRIA ANTES DE PRODUÇÃO

A **PARTE B — PRODUÇÃO** só pode ser executada após registrar abaixo a saída **24/24 PASS** do `audit-live-hardening` obtida na Parte A:

```text
PENDENTE: cole aqui a saida integral de:
node scripts/audit-live-hardening.mjs --url=https://staging.ajnengenharia.com.br
com resultado "[live-audit] PASS: 24/24 controles verificados..." antes de iniciar a Parte B.
```

---

## PARTE B — PRODUÇÃO

Alvo oficial na Hostinger (`ajnengenharia.com.br`):
- Diretório base: `$PROD_BASE="$HOME/domains/ajnengenharia.com.br"` (confirme se seu domínio raiz usa `$HOME/domains/ajnengenharia.com.br/public_html` ou `$HOME/public_html`; **jamais** misture caminhos com staging)
- Webroot público: `$PROD_BASE/public_html`
- Diretório privado (fora do webroot, irmão de `public_html`): `$PROD_BASE/ajn-carreiras-private`
- Flag de manutenção (fora do webroot): `$PROD_BASE/ajn-carreiras-private/maintenance.flag`

### Etapa B.0 — Pré-checagens no servidor de produção

```bash
export PROD_BASE="$HOME/domains/ajnengenharia.com.br"
mkdir -p "$HOME/backups" "$HOME/deploy-stage/prod"

PHP_BIN="$(command -v php)"
echo "PHP_BIN=$PHP_BIN"
"$PHP_BIN" -v
"$PHP_BIN" -m | grep -E '^(sodium|pdo_mysql|openssl|mbstring|json|curl)$'
"$PHP_BIN" -r 'foreach (["sodium","pdo_mysql","openssl"] as $ext) { if (!extension_loaded($ext)) { fwrite(STDERR, "Falta extensao: $ext\n"); exit(1); } } echo "CLI extensions OK\n";'
df -h "$HOME"
```

### Etapa B.1 — Geração local do pacote de produção e upload para `~/deploy-stage/prod`

Somente após o usuário fornecer a `PUBLIC_TURNSTILE_SITE_KEY` real de produção (`0x4...`, nunca `1x`/`2x`/`3x`):

```bash
PUBLIC_SITE_ORIGIN="https://ajnengenharia.com.br" \
PUBLIC_ALLOW_INDEXING="true" \
PUBLIC_CONTACT_ENDPOINT="https://api.opengscgandra.tech/contact" \
PUBLIC_TURNSTILE_SITE_KEY="COLE_AQUI_SITE_KEY_REAL_TURNSTILE" \
npm run validate

npm run pack:hostinger
```

Envie o pacote gerado (`output/hostinger-deploy/`) exclusivamente para **`~/deploy-stage/prod`**:

```bash
rsync -avz --delete output/hostinger-deploy/ USUARIO@HOST_SSH:~/deploy-stage/prod/
```

### Etapa B.2 — Ligar Modo Manutenção em Produção (`503` + `Retry-After`)

Antes de backup final, migrations ou troca de arquivos, ative o arquivo-flag fora do webroot:

```bash
mkdir -p "$PROD_BASE/ajn-carreiras-private"
date -u +"%Y-%m-%dT%H:%M:%SZ" > "$PROD_BASE/ajn-carreiras-private/maintenance.flag"
chmod 640 "$PROD_BASE/ajn-carreiras-private/maintenance.flag"

# Valide que /api/* e /admin/* devolvem 503 + Retry-After e a home / segue em 200
curl -isS https://ajnengenharia.com.br/api/health | head -n 15
curl -isS https://ajnengenharia.com.br/admin/carreiras/ | head -n 15
curl -isS https://ajnengenharia.com.br/ | head -n 8
```

### Etapa B.3 — Backup cifrado em Produção (`set -euo pipefail`, `LAST_STAMP`, verificação e cópia externa)

Crie `$HOME/.my-migrator.cnf` temporário (ou use usuário com permissão de dump) antes de executar:

```bash
bash -euo pipefail -c '
  PROD_BASE="$HOME/domains/ajnengenharia.com.br"
  STAMP="prod-$(date -u +%Y%m%dT%H%M%SZ)"
  mkdir -p "$HOME/backups"
  printf "%s\n" "$STAMP" > "$HOME/backups/LAST_STAMP"

  # 1. Backup completo dos arquivos de public_html e pasta privada
  tar -czf - -C "$PROD_BASE" public_html ajn-carreiras-private \
    | openssl enc -aes-256-cbc -pbkdf2 -iter 600000 -salt -out "$HOME/backups/files-$STAMP.tar.gz.enc"
  test -s "$HOME/backups/files-$STAMP.tar.gz.enc"
  openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 -in "$HOME/backups/files-$STAMP.tar.gz.enc" | gzip -t

  # 2. Backup cifrado do banco MySQL
  mysqldump --defaults-extra-file="$HOME/.my-migrator.cnf" --single-transaction --routines --triggers DB_PRODUCAO \
    | gzip -9 \
    | openssl enc -aes-256-cbc -pbkdf2 -iter 600000 -salt -out "$HOME/backups/db-$STAMP.sql.gz.enc"
  test -s "$HOME/backups/db-$STAMP.sql.gz.enc"
  openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 -in "$HOME/backups/db-$STAMP.sql.gz.enc" | gzip -t

  echo "BACKUP PRODUCAO VERIFICADO: STAMP=$STAMP"
'
```

**Obrigatório — copiar os backups cifrados para fora do servidor antes de continuar:**

```bash
mkdir -p ./backups-offsite/prod
scp USUARIO@HOST_SSH:~/backups/*-"$(ssh USUARIO@HOST_SSH cat ~/backups/LAST_STAMP)".* ./backups-offsite/prod/
ls -lh ./backups-offsite/prod/
```

### Etapa B.4 — Credenciais do `migrator` em arquivo separado (`$HOME/.my-migrator.cnf`)

```bash
install -m 600 /dev/null "$HOME/.my-migrator.cnf"
cat <<'EOF' > "$HOME/.my-migrator.cnf"
[client]
host=127.0.0.1
port=3306
user=u000000000_ajn_migrator
password=SENHA_EXCLUSIVA_DO_MIGRATOR_PRODUCAO
EOF
chmod 600 "$HOME/.my-migrator.cnf"
```

### Etapa B.5 — `config.php`, migrations, `migrate-legacy-data`, MFA, upload e verificação

1. **Configurar `$PROD_BASE/ajn-carreiras-private/config.php` (`chmod 600`)** a partir de `config.example.php`:
   - `'environment' => 'production'`
   - `'app_url' => 'https://ajnengenharia.com.br'`
   - `'allowed_origins' => ['https://ajnengenharia.com.br', 'https://www.ajnengenharia.com.br']`
   - `'encryption_key'`: nova chave de **produção** (64 hex chars CSPRNG, diferente da usada em staging)
   - `'previous_encryption_keys'`: preencher apenas durante rotação de chave
   - `'resume_directory' => __DIR__ . '/resumes'`
   - `'error_log_path' => __DIR__ . '/php-errors.log'`
   - `'maintenance_flag_path' => __DIR__ . '/maintenance.flag'`
   - `'security_alert_email' => 'faleconosco@ajnengenharia.com.br'`
   - `'turnstile_secret_key' => '<SECRET_KEY_REAL_DO_PAR_TURNSTILE_DE_PRODUCAO>'`
   - `'database'`: banco de produção e usuário runtime restrito (`u000000000_ajn_app_rw`: apenas `SELECT, INSERT, UPDATE, DELETE`)
   - `'smtp'`: credenciais SMTP reais

2. **Publicar arquivos privados e `public_html` com troca segura a partir de `~/deploy-stage/prod`:**

```bash
mkdir -p "$PROD_BASE/ajn-carreiras-private/resumes"
chmod 700 "$PROD_BASE/ajn-carreiras-private" "$PROD_BASE/ajn-carreiras-private/resumes"

rsync -av --exclude='config.php' --exclude='maintenance.flag' --exclude='php-errors.log' --exclude='resumes/' \
  "$HOME/deploy-stage/prod/ajn-carreiras-private/" "$PROD_BASE/ajn-carreiras-private/"
cp -f "$HOME/deploy-stage/prod/ajn-carreiras-private/resumes/.htaccess" "$PROD_BASE/ajn-carreiras-private/resumes/.htaccess"

# Staging de public_html antes do mv atomico (mantendo maintenance.flag ativa)
rm -rf "$PROD_BASE/public_html.next"
cp -a "$HOME/deploy-stage/prod/public_html" "$PROD_BASE/public_html.next"
if [ -d "$PROD_BASE/public_html" ]; then
  mv "$PROD_BASE/public_html" "$PROD_BASE/public_html.prev"
fi
mv "$PROD_BASE/public_html.next" "$PROD_BASE/public_html"
```

3. **Aplicar migrations SQL e migrar dados legados (`dry-run -> real -> dry-run`):**

```bash
for sql in \
  "$HOME/deploy-stage/prod/database/001_initial.sql" \
  "$HOME/deploy-stage/prod/database/002_hardening.sql" \
  "$HOME/deploy-stage/prod/database/003_least_privilege.sql" \
  "$HOME/deploy-stage/prod/database/004_indexes.sql" \
  "$HOME/deploy-stage/prod/database/005_security_hardening.sql" \
  "$HOME/deploy-stage/prod/database/006_security_alerts_and_ip_locks.sql"; do
  mysql --defaults-extra-file="$HOME/.my-migrator.cnf" DB_PRODUCAO < "$sql"
done

"$PHP_BIN" -d extension=sodium "$PROD_BASE/ajn-carreiras-private/migrate-legacy-data.php" --dry-run
"$PHP_BIN" -d extension=sodium "$PROD_BASE/ajn-carreiras-private/migrate-legacy-data.php"
"$PHP_BIN" -d extension=sodium "$PROD_BASE/ajn-carreiras-private/migrate-legacy-data.php" --dry-run
```

Se `migrate-legacy-data.php` reportar qualquer `ADMIN_WITHOUT_MFA`, provisione todos via SSH antes de liberar o painel:

```bash
AJN_ADMIN_EMAIL="operador@ajnengenharia.com.br" "$PHP_BIN" -d extension=sodium "$PROD_BASE/ajn-carreiras-private/provision-user-mfa.php"
```

Se for primeira implantação sem administradores, crie o `super_admin`:

```bash
AJN_ADMIN_EMAIL="admin@ajnengenharia.com.br" \
AJN_ADMIN_NAME="Administrador AJN" \
"$PHP_BIN" -d extension=sodium "$PROD_BASE/ajn-carreiras-private/seed-admin.php"
```

Valide a cadeia de auditoria e remova imediatamente o `.my-migrator.cnf`:

```bash
"$PHP_BIN" -d extension=sodium "$PROD_BASE/ajn-carreiras-private/verify-audit-chain.php"
rm -f "$HOME/.my-migrator.cnf"
```

### Etapa B.6 — Desligar Modo Manutenção e validar `audit-live-hardening` em Produção

1. Desligue o modo manutenção removendo o arquivo-flag fora do webroot:

```bash
rm -f "$PROD_BASE/ajn-carreiras-private/maintenance.flag"
```

2. Execute imediatamente a auditoria live contra produção:

```bash
node scripts/audit-live-hardening.mjs --url=https://ajnengenharia.com.br
```

Confirme:
- `[live-audit] PASS: 24/24 controles verificados em https://ajnengenharia.com.br.`
- `GET /api/health` responde `200` com `{"status":"ok",...}` **sem** campo `environment`.
- `npm run audit:live-security` retorna PASS (HSTS + CSP restrita enforced sem `unsafe-inline` / sem `Report-Only` obsoleta + redirecionamentos `www` e HTTP -> HTTPS `301`).
- Após estabilidade confirmada, remova a cópia antiga `rm -rf "$PROD_BASE/public_html.prev"`.

### Etapa B.7 — Crons de Produção e confirmação do alerta de teste

No hPanel (ou `crontab`), configure usando o **`PHP_BIN` real da Etapa B.0**:

- Fila de alertas de segurança (a cada 2 minutos):
  `*/2 * * * * /CAMINHO/REAL/DO/php -d extension=sodium $HOME/domains/ajnengenharia.com.br/ajn-carreiras-private/send-security-alerts.php >/dev/null 2>&1`
- Expurgo diário de retenção LGPD (03:30):
  `30 3 * * * /CAMINHO/REAL/DO/php -d extension=sodium $HOME/domains/ajnengenharia.com.br/ajn-carreiras-private/purge-expired-data.php >/dev/null 2>&1`

Envie um alerta de teste operacional e **confirme o recebimento na caixa `faleconosco@ajnengenharia.com.br`** (mesmo endereço do `public/.well-known/security.txt`):

```bash
"$PHP_BIN" -d extension=sodium "$PROD_BASE/ajn-carreiras-private/send-security-alerts.php" --test-alert
```

Confirme a chegada do e-mail `[ALERTA DE SEGURANCA AJN] DEPLOY_TEST_ALERT` em `faleconosco@ajnengenharia.com.br` antes de encerrar a janela de deploy.

---

## ROLLBACK Seguro por Troca Atômica (`mv`)

**REGRA INVIOLÁVEL:** **NUNCA** execute `rm -rf public_html` antes de extrair e validar integralmente o backup em diretório temporário.

1. Religue o modo manutenção imediatamente e identifique o `STAMP` em `~/backups/LAST_STAMP`:

```bash
export TARGET_BASE="$HOME/domains/ajnengenharia.com.br" # ou subdominio de staging
date -u +"%Y-%m-%dT%H:%M:%SZ" > "$TARGET_BASE/ajn-carreiras-private/maintenance.flag"
STAMP="$(cat "$HOME/backups/LAST_STAMP")"
echo "Usando STAMP=$STAMP"
```

2. Extraia e valide o backup de arquivos em diretório temporário **antes** de tocar no diretório ativo:

```bash
bash -euo pipefail -c '
  STAMP="$(cat "$HOME/backups/LAST_STAMP")"
  RESTORE_TMP="$HOME/restore-$STAMP"
  rm -rf "$RESTORE_TMP"
  mkdir -p "$RESTORE_TMP"

  # 1. Decifrar, extrair em diretorio temporario e conferir estrutura basica
  openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 -in "$HOME/backups/files-$STAMP.tar.gz.enc" \
    | tar -xzf - -C "$RESTORE_TMP"

  test -f "$RESTORE_TMP/public_html/.htaccess"
  test -f "$RESTORE_TMP/public_html/index.html"
  test -f "$RESTORE_TMP/public_html/api/index.php"
  test -f "$RESTORE_TMP/ajn-carreiras-private/bootstrap.php"
  echo "Arquivos restaurados verificados em $RESTORE_TMP"
'
```

3. Realize a troca **atômica por `mv`** (nunca `rm -rf` antecipado):

```bash
STAMP="$(cat "$HOME/backups/LAST_STAMP")"
RESTORE_TMP="$HOME/restore-$STAMP"

mv "$TARGET_BASE/public_html" "$TARGET_BASE/public_html.failed.$STAMP"
mv "$RESTORE_TMP/public_html" "$TARGET_BASE/public_html"

mv "$TARGET_BASE/ajn-carreiras-private" "$TARGET_BASE/ajn-carreiras-private.failed.$STAMP"
mv "$RESTORE_TMP/ajn-carreiras-private" "$TARGET_BASE/ajn-carreiras-private"

rm -rf "$RESTORE_TMP"
```

4. Se o schema/banco precisar ser revertido, decifre o dump e restaure com `$HOME/.my-migrator.cnf`, verificando em seguida:

```bash
bash -euo pipefail -c '
  STAMP="$(cat "$HOME/backups/LAST_STAMP")"
  test -s "$HOME/backups/db-$STAMP.sql.gz.enc"
  openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 -in "$HOME/backups/db-$STAMP.sql.gz.enc" | gzip -t
  openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 -in "$HOME/backups/db-$STAMP.sql.gz.enc" \
    | gunzip \
    | mysql --defaults-extra-file="$HOME/.my-migrator.cnf" DB_ALVO
'
rm -f "$HOME/.my-migrator.cnf" "$TARGET_BASE/ajn-carreiras-private/maintenance.flag"
```

5. Rode `audit-live-hardening.mjs` contra a URL restaurada e, apenas após confirmar estabilidade e preservação de evidências forenses se necessário, arquive ou remova `public_html.failed.$STAMP` e `ajn-carreiras-private.failed.$STAMP`.
