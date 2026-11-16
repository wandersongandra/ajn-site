# Runbook Operacional de Deploy — AJN Carreiras (Hostinger)

Este documento define o procedimento oficial de publicação segura em **duas partes sequenciais e bloqueantes**:

- **PARTE A — STAGING:** subdomínio isolado (`https://staging.ajnengenharia.com.br`), raiz web separada do `public_html` de produção, pasta privada isolada, banco MySQL próprio e **zero dados reais**. A Parte B é **proibida** enquanto qualquer item da Parte A falhar.
- **PARTE B — PRODUÇÃO:** domínio principal (`https://ajnengenharia.com.br`). Só inicia após **100% da Parte A verde** com o registro completo do **Ensaio de Rollback** e a saída integral do `audit-live-hardening` (`25/25`, incluindo `GET / sem credenciais = 401`) colados no **GATE DE PASSAGEM**.

Checklist enxuto de execução passo a passo da Parte A: [`hostinger/CHECKLIST-STAGING.md`](CHECKLIST-STAGING.md).

---

## Mapa de Variáveis, Caminhos Privados e Menor Privilégio

1. **`PUBLIC_TURNSTILE_SITE_KEY` (variável pública de build Astro, local/CI antes do `npm run build`):**
   - Entra no HTML dos formulários de carreiras (`/carreiras/`, `/carreiras/vaga/`, `/carreiras/talentos/`, `/carreiras/acompanhamento/`).
   - **Staging:** use `PUBLIC_ALLOW_INDEXING=false`, `PUBLIC_SITE_ORIGIN=https://staging.ajnengenharia.com.br` e sitekey de teste Cloudflare (`1x00000000000000000000AA`) ou sitekey exclusiva de staging.
   - **Produção:** exige `PUBLIC_ALLOW_INDEXING=true`, `PUBLIC_SITE_ORIGIN=https://ajnengenharia.com.br` e `PUBLIC_TURNSTILE_SITE_KEY` real de produção (`npm run build` e `npm run pack:hostinger` falham fechados se vazia ou `1x`/`2x`/`3x`).
2. **`turnstile_secret_key` (segredo privado no servidor — `<PRIVATE_DIR>/config.php`, chmod `0600`):**
   - Nome exato lido por `bootstrap.php`: **`turnstile_secret_key`** (nunca `turnstile_secret`; nome divergente retorna HTTP **503** fail-closed em `production`).
3. **`STAGING_HTPASSWD_FILE`, `STAGING_PRIVATE_DIR` e `PROD_PRIVATE_DIR` (empacotamento):**
   - `STAGING_HTPASSWD_FILE` informa o caminho absoluto fora de webroot do `.htpasswd-staging` no servidor; `pack:hostinger:staging` injeta `AuthType Basic` + `AuthUserFile` **apenas** em `output/hostinger-staging/public_html/.htaccess`.
   - `STAGING_PRIVATE_DIR` (opcional/recomendado em `pack:hostinger:staging`) e **`PROD_PRIVATE_DIR` (obrigatório em `pack:hostinger`)** injetam `SetEnv AJN_PRIVATE_DIR`, `SetEnvIf Request_URI "^" AJN_PRIVATE_DIR=...` e a condição `RewriteCond "<PRIVATE_DIR>/maintenance.flag" -f [OR]` exclusivamente no `.htaccess` do pacote gerado (`output/hostinger-staging/public_html/.htaccess` ou `output/hostinger-deploy/public_html/.htaccess`). O `pack:hostinger` de produção **falha fechado** se `PROD_PRIVATE_DIR` estiver ausente ou apontar para dentro de um webroot, mantendo `public/.htaccess` e `dist/.htaccess` limpos e com SHA-256 de CSP sincronizado.
4. **`hostinger/ops/env.sh` (`chmod 600` em `$HOME/ajn-ops/env.sh`, zero segredos):**
   - Define e valida `PROD_PUBLIC`, `STG_PUBLIC`, `PROD_PRIVATE`, `STG_PRIVATE`, `STG_HTPASSWD` e `PHP_BIN` (aborta com `exit != 0` se qualquer uma vier vazia). Todo bloco de comandos de servidor neste runbook inicia com `source "$HOME/ajn-ops/env.sh"`, e os wrappers `hostinger/ops/*.sh` aceitam e validam essas variáveis.
5. **Separação de diretórios privados e `known_webroots` (`api/index.php` e `bootstrap.php`):**
   - Padrão recomendado: `$HOME/ajn-private/staging` e `$HOME/ajn-private/prod` (fora de **todas** as raízes web).
   - Tanto `public/api/index.php` quanto `ajn_private_resume_dir()` em `bootstrap.php` bloqueiam qualquer caminho dentro de `DOCUMENT_ROOT`, `AJN_KNOWN_WEBROOTS`, `config['known_webroots']` ou diretórios contendo segmentos de webroot (`public_html`, `htdocs`, `httpdocs`, `www`).
6. **Banco de dados e menor privilégio (usuários separados no hPanel):**
   - **`u000_ajn_migrator` (temporário / somente SSH via `$HOME/.my-migrator.cnf`):** recebe `SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, DROP` no hPanel apenas para rodar `migrate.php` e `backup.sh`/`rollback.sh`. Nunca vai em `config.php`.
   - **`u000_ajn_app_rw` (runtime em `config.php`):** restrito no **hPanel** exclusivamente a `SELECT, INSERT, UPDATE, DELETE` nas tabelas de carreiras (sem `DROP`, `ALTER`, `CREATE`, `TRUNCATE`, `GRANT OPTION` ou `ALL PRIVILEGES`).
   - A migration `003_least_privilege.sql` aplica restrições internas (`DELETE FROM admin_permissions`) e **não contém SQL `GRANT`/`REVOKE`**; qualquer migration futura contendo `GRANT`/`REVOKE` é bloqueada pelo `migrate.php`, que também consulta `SHOW GRANTS FOR CURRENT_USER()` no usuário de runtime e emite `[AVISO]` caso haja privilégios excessivos.
7. **`security_alert_email` e `AJN_CONFIG_PATH`:**
   - `security_alert_email` = **`faleconosco@ajnengenharia.com.br`** (alinhado com `public/.well-known/security.txt`).
   - `AJN_CONFIG_PATH` é aceito **exclusivamente quando `PHP_SAPI === 'cli'`**.

---

## Etapa 0 — Layout Obrigatório de Webroots e Diretórios Privados (`check-layout.sh`)

Antes de gerar builds, enviar arquivos ou configurar staging/produção, confira **por `realpath`** onde o hPanel aponta o `public_html` de produção e o webroot do subdomínio de staging.

**REGRA BLOQUEANTE:** na Hostinger compartilhada, alguns subdomínios antigos são criados como subpasta dentro do `public_html` principal (`.../domains/ajnengenharia.com.br/public_html/staging`). **Isso é proibido**, pois exporia o staging sem proteção pelo `.htaccess`/rotas de produção e violaria o isolamento. Se acontecer, altere a raiz do subdomínio no **hPanel -> Domínios/Subdomínios -> Pasta raiz** para `$HOME/domains/staging.ajnengenharia.com.br/public_html` **antes** de continuar.

**[LOCAL]** Envie primeiro `hostinger/ops/` para `~/ajn-ops/`:

```bash
rsync -avz astro-site/hostinger/ops/ USUARIO@HOST_SSH:~/ajn-ops/
```

**[SERVIDOR]** Ajuste `$HOME/ajn-ops/env.sh` se os caminhos reais do hPanel diferirem do padrão e valide o layout:

```bash
source "$HOME/ajn-ops/env.sh"
chmod 600 "$HOME/ajn-ops/env.sh"
chmod +x "$HOME/ajn-ops/"*.sh

"$HOME/ajn-ops/check-layout.sh" \
  --prod-public="$PROD_PUBLIC" \
  --staging-public="$STG_PUBLIC" \
  --private-dir="$PROD_PRIVATE" \
  --private-dir="$STG_PRIVATE"
```

Se `check-layout.sh` retornar `exit != 0` (**ABORTAR**), ajuste os diretórios no hPanel ou em `$HOME/ajn-ops/env.sh` antes de prosseguir.

---

## PARTE A — STAGING

Caminhos padrão definidos em `hostinger/ops/env.sh`:
- `$PROD_PUBLIC` = `"$HOME/domains/ajnengenharia.com.br/public_html"`
- `$STG_PUBLIC` = `"$HOME/domains/staging.ajnengenharia.com.br/public_html"`
- `$PROD_PRIVATE` = `"$HOME/ajn-private/prod"`
- `$STG_PRIVATE` = `"$HOME/ajn-private/staging"`
- `$STG_HTPASSWD` = `"$HOME/domains/staging.ajnengenharia.com.br/.htpasswd-staging"`
- `$PHP_BIN` = `"$(command -v php)"`

### Etapa A.0 — Pré-checagens no servidor (PHP CLI, extensões, layout e disco)

**[SERVIDOR]**

```bash
source "$HOME/ajn-ops/env.sh"
mkdir -p "$HOME/backups" "$HOME/deploy-stage/staging" "$HOME/ajn-ops" "$HOME/ajn-logs/staging" "$STG_PRIVATE/resumes"
chmod 700 "$HOME/backups" "$HOME/ajn-ops" "$HOME/ajn-logs" "$HOME/ajn-logs/staging" "$STG_PRIVATE" "$STG_PRIVATE/resumes"

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

1. **[SERVIDOR]** Crie o `.htpasswd-staging` **fora** de qualquer `public_html` lendo a senha via stdin sem gravá-la no histórico:

```bash
source "$HOME/ajn-ops/env.sh"
mkdir -p "$(dirname "$STG_HTPASSWD")"
printf 'Senha staging_user: ' && IFS= read -r -s STG_PASS && echo
"$PHP_BIN" -r '$u="staging_user"; $p=stream_get_contents(STDIN); $p=rtrim($p,"\r\n"); echo $u . ":" . password_hash($p, PASSWORD_BCRYPT) . "\n";' <<< "$STG_PASS" > "$STG_HTPASSWD"
unset STG_PASS
chmod 640 "$STG_HTPASSWD"
```

2. **[LOCAL]** Dentro de `astro-site/`, gere o build de **staging** e o pacote com `AuthType Basic` + `SetEnv AJN_PRIVATE_DIR` injetados **exclusivamente** em `output/hostinger-staging/public_html/.htaccess`:

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

3. **[LOCAL]** Envie o pacote completo para `~/deploy-stage/staging/`:

```bash
rsync -avz --delete output/hostinger-staging/ USUARIO@HOST_SSH:~/deploy-stage/staging/
```

4. **[SERVIDOR]** Atualize scripts de `$HOME/ajn-ops/` preservando sua cópia configurada de `env.sh`:

```bash
source "$HOME/ajn-ops/env.sh"
cp -f "$HOME/deploy-stage/staging/ops/backup.sh" "$HOME/deploy-stage/staging/ops/rollback.sh" "$HOME/deploy-stage/staging/ops/check-layout.sh" "$HOME/deploy-stage/staging/ops/check-public-diff.sh" "$HOME/deploy-stage/staging/ops/run-cron.sh" "$HOME/deploy-stage/staging/ops/seed-legacy-fixtures.php" "$HOME/ajn-ops/"
chmod +x "$HOME/ajn-ops/"*.sh
chmod 600 "$HOME/ajn-ops/env.sh"
```

### Etapa A.2 — Modo Manutenção (`503`) — 1ª Implantação ou Redeploy

**REGRA INVIOLÁVEL:** em **ambos** os caminhos (primeira implantação ou redeploy), crie **SEMPRE** `$STG_PRIVATE/maintenance.flag` **antes** de qualquer troca de arquivos ou operação de banco.

1. **[SERVIDOR — Sempre: Caminho 1 e Caminho 2]** Crie a flag de manutenção fora do webroot:

```bash
source "$HOME/ajn-ops/env.sh"
date -u +"%Y-%m-%dT%H:%M:%SZ" > "$STG_PRIVATE/maintenance.flag"
chmod 640 "$STG_PRIVATE/maintenance.flag"
```

2. **Caminho 1 — Primeira implantação (staging novo ainda sem `.htaccess` publicado do pacote):**
   Além de já ter criado `maintenance.flag` no passo anterior, **acrescente** temporariamente o bloco mínimo abaixo no webroot `$STG_PUBLIC/.htaccess` (somente a regra `503` dentro de `<IfModule mod_rewrite.c>`, mantendo Basic Auth acima se já ativo); ele será substituído ao final pelo `.htaccess` definitivo do pacote:

```apacheconf
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteRule ^(?:api|admin)(?:/.*)?$ - [R=503,L]
</IfModule>
```

3. **Caminho 2 — Staging já implantado (redeploy):**
   O arquivo definitivo `.htaccess` + `$STG_PRIVATE/maintenance.flag` já direciona `/api/*` e `/admin/*` para `api/index.php`, devolvendo `503` + `Retry-After: 300`.

4. **[SERVIDOR]** Configure `.netrc-staging` (`chmod 600`, nunca passe usuário/senha em linha de comando) e valide o `503` antes de alterar banco ou código:

```bash
source "$HOME/ajn-ops/env.sh"
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

1. **[SERVIDOR]** Crie `$HOME/.my-migrator.cnf` (`chmod 600`) com o usuário migrator do banco de staging e execute `backup.sh --env=staging` (em primeira implantação antes do schema inicial, adicione `--skip-db`):

```bash
source "$HOME/ajn-ops/env.sh"
install -m 600 /dev/null "$HOME/.my-migrator.cnf"
cat <<'EOF' > "$HOME/.my-migrator.cnf"
[client]
host=127.0.0.1
port=3306
user=u000000000_stg_mig
password=SENHA_DO_MIGRATOR_STAGING
EOF

mkdir -p "$STG_PUBLIC"
"$HOME/ajn-ops/backup.sh" \
  --env=staging \
  --public-dir="$STG_PUBLIC" \
  --private-dir="$STG_PRIVATE" \
  --db-name=DB_STAGING \
  --my-cnf="$HOME/.my-migrator.cnf"
```

2. **[LOCAL]** Cópia obrigatória fora do servidor (offsite):

```bash
mkdir -p ./backups-offsite/staging
scp USUARIO@HOST_SSH:~/backups/*-"$(ssh USUARIO@HOST_SSH cat ~/backups/LAST_STAMP.staging)".* ./backups-offsite/staging/
ls -lh ./backups-offsite/staging/
```

### Etapa A.4 — Publicar Código Privado, `config.php` (`chmod 600`) e `public_html`

**[SERVIDOR]**

```bash
source "$HOME/ajn-ops/env.sh"
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

**[SERVIDOR]**

```bash
source "$HOME/ajn-ops/env.sh"
"$PHP_BIN" -d extension=sodium "$STG_PRIVATE/migrate.php" \
  --defaults-file="$HOME/.my-migrator.cnf" \
  --database=DB_STAGING \
  --dry-run

"$PHP_BIN" -d extension=sodium "$STG_PRIVATE/migrate.php" \
  --defaults-file="$HOME/.my-migrator.cnf" \
  --database=DB_STAGING

"$PHP_BIN" -d extension=sodium "$STG_PRIVATE/migrate.php" \
  --defaults-file="$HOME/.my-migrator.cnf" \
  --database=DB_STAGING \
  --status

"$PHP_BIN" -d extension=sodium "$STG_PRIVATE/migrate.php" \
  --defaults-file="$HOME/.my-migrator.cnf" \
  --database=DB_STAGING
```

#### Ciclo A.2 — Banco Existente no Estado 004 + Fixtures Legadas -> Upgrade `005..006` + `migrate-legacy-data.php`

**[SERVIDOR]**

```bash
source "$HOME/ajn-ops/env.sh"
mkdir -p "$HOME/deploy-stage/sql-004"
cp "$HOME/deploy-stage/staging/database"/00[1-4]_*.sql "$HOME/deploy-stage/sql-004/"

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

mysql --defaults-extra-file="$HOME/.my-migrator.cnf" DB_STAGING_UPG -e "DROP TABLE schema_migrations;"

AJN_CONFIG_PATH="$HOME/deploy-stage/stg-upg.config.php" \
"$PHP_BIN" -d extension=sodium "$HOME/ajn-ops/seed-legacy-fixtures.php"

AJN_CONFIG_PATH="$HOME/deploy-stage/stg-upg.config.php" \
"$PHP_BIN" -d extension=sodium "$STG_PRIVATE/migrate.php" \
  --defaults-file="$HOME/.my-migrator.cnf" \
  --database=DB_STAGING_UPG \
  --baseline=004

AJN_CONFIG_PATH="$HOME/deploy-stage/stg-upg.config.php" \
"$PHP_BIN" -d extension=sodium "$STG_PRIVATE/migrate.php" \
  --defaults-file="$HOME/.my-migrator.cnf" \
  --database=DB_STAGING_UPG

AJN_CONFIG_PATH="$HOME/deploy-stage/stg-upg.config.php" \
"$PHP_BIN" -d extension=sodium "$STG_PRIVATE/migrate-legacy-data.php" --dry-run

AJN_CONFIG_PATH="$HOME/deploy-stage/stg-upg.config.php" \
"$PHP_BIN" -d extension=sodium "$STG_PRIVATE/migrate-legacy-data.php"

AJN_CONFIG_PATH="$HOME/deploy-stage/stg-upg.config.php" \
"$PHP_BIN" -d extension=sodium "$STG_PRIVATE/migrate-legacy-data.php" --dry-run

rm -rf "$HOME/deploy-stage/sql-004" "$HOME/deploy-stage/stg-upg.config.php"
```

Provisione o superadmin de staging no banco principal do Ciclo A.1 e verifique a cadeia de auditoria:

**[SERVIDOR]**

```bash
source "$HOME/ajn-ops/env.sh"
AJN_ADMIN_EMAIL="admin@ajnengenharia.com.br" \
AJN_ADMIN_NAME="Administrador Staging" \
"$PHP_BIN" -d extension=sodium "$STG_PRIVATE/seed-admin.php"

"$PHP_BIN" -d extension=sodium "$STG_PRIVATE/verify-audit-chain.php"
```

### Etapa A.6 — Desligar Manutenção, Limpar Credenciais e Rodar `audit-live-hardening`

**[SERVIDOR]**

```bash
source "$HOME/ajn-ops/env.sh"
rm -f "$STG_PRIVATE/maintenance.flag" "$HOME/.netrc-staging"
```

**[LOCAL]** Execute a auditoria live passando credenciais exclusivamente por variáveis de ambiente:

```bash
export LIVE_AUDIT_BASIC_USER="staging_user"
export LIVE_AUDIT_BASIC_PASS="SENHA_DO_STAGING"
node scripts/audit-live-hardening.mjs --url=https://staging.ajnengenharia.com.br --expect-basic-auth
unset LIVE_AUDIT_BASIC_USER LIVE_AUDIT_BASIC_PASS
```

Confirme:
- **`[live-audit] PASS: 25/25 controles verificados`** (inclui `GET / sem credenciais = 401 Basic Auth`).
- Fluxo E2E completo validado no navegador (login + TOTP, step-up, vaga, candidatura com PDF, download privado, recuperação e LGPD).

### Etapa A.7 — 3 Crons de Staging com Wrapper de Log (Sem `/dev/null`) + Alerta de Teste

Cadastre no hPanel os **3 jobs** usando `$HOME/ajn-ops/run-cron.sh` e logs fora do webroot (`$HOME/ajn-logs/staging/`, rotação automática):
- `*/2 * * * * /home/USUARIO/ajn-ops/run-cron.sh --log-dir=/home/USUARIO/ajn-logs/staging --name=alerts -- /CAMINHO/REAL/DO/php -d extension=sodium /home/USUARIO/ajn-private/staging/send-security-alerts.php`
- `30 3 * * * /home/USUARIO/ajn-ops/run-cron.sh --log-dir=/home/USUARIO/ajn-logs/staging --name=purge -- /CAMINHO/REAL/DO/php -d extension=sodium /home/USUARIO/ajn-private/staging/purge-expired-data.php`
- `0 4 * * * /home/USUARIO/ajn-ops/run-cron.sh --log-dir=/home/USUARIO/ajn-logs/staging --name=audit-chain -- /CAMINHO/REAL/DO/php -d extension=sodium /home/USUARIO/ajn-private/staging/verify-audit-chain.php`

**[SERVIDOR]** Dispare e confirme a chegada real do alerta de teste em `faleconosco@ajnengenharia.com.br`:

```bash
source "$HOME/ajn-ops/env.sh"
"$PHP_BIN" -d extension=sodium "$STG_PRIVATE/send-security-alerts.php" --test-alert
```

### Etapa A.8 — Ensaio Obrigatório de Rollback em Staging (Antes do Gate)

Antes de liberar a Parte B, valide o ciclo completo **`backup -> deploy -> rollback.sh staging -> audit -> re-deploy`** em ambiente real de staging:

1. **[SERVIDOR] Backup completo da versão homologada de staging:**

```bash
source "$HOME/ajn-ops/env.sh"
"$HOME/ajn-ops/backup.sh" \
  --env=staging \
  --public-dir="$STG_PUBLIC" \
  --private-dir="$STG_PRIVATE" \
  --db-name=DB_STAGING \
  --my-cnf="$HOME/.my-migrator.cnf"
```

2. **[SERVIDOR] Deploy simulado controlado (marca transitória para comprovar reversão completa):**

```bash
source "$HOME/ajn-ops/env.sh"
printf '<!-- rollback-drill-%s -->\n' "$(cat "$HOME/backups/LAST_STAMP.staging")" >> "$STG_PUBLIC/robots.txt"
```

3. **[SERVIDOR] Executar `rollback.sh staging` (remove todas as tabelas antes de restaurar o dump e devolve exatamente o snapshot anterior):**

```bash
source "$HOME/ajn-ops/env.sh"
"$HOME/ajn-ops/rollback.sh" staging \
  --public-dir="$STG_PUBLIC" \
  --private-dir="$STG_PRIVATE" \
  --backups-dir="$HOME/backups" \
  --db-name=DB_STAGING \
  --my-cnf="$HOME/.my-migrator.cnf"

"$PHP_BIN" -d extension=sodium "$STG_PRIVATE/verify-audit-chain.php"
```

4. **[LOCAL] Audit pós-rollback (`25/25` obrigatório):**

```bash
export LIVE_AUDIT_BASIC_USER="staging_user"
export LIVE_AUDIT_BASIC_PASS="SENHA_DO_STAGING"
node scripts/audit-live-hardening.mjs --url=https://staging.ajnengenharia.com.br --expect-basic-auth
unset LIVE_AUDIT_BASIC_USER LIVE_AUDIT_BASIC_PASS
```

5. **[SERVIDOR + LOCAL] Re-deploy do pacote validado de staging e remoção das credenciais temporárias:**

```bash
source "$HOME/ajn-ops/env.sh"
rsync -av --delete "$HOME/deploy-stage/staging/public_html/" "$STG_PUBLIC/"
"$PHP_BIN" -d extension=sodium "$STG_PRIVATE/migrate.php" \
  --defaults-file="$HOME/.my-migrator.cnf" \
  --database=DB_STAGING
"$PHP_BIN" -d extension=sodium "$STG_PRIVATE/verify-audit-chain.php"
rm -f "$HOME/.my-migrator.cnf"
```

Rode novamente no **[LOCAL]** `node scripts/audit-live-hardening.mjs --url=https://staging.ajnengenharia.com.br --expect-basic-auth` confirmando **`25/25`** após o re-deploy.

---

## GATE DE PASSAGEM — SAÍDA DE STAGING OBRIGATÓRIA ANTES DE PRODUÇÃO

A **PARTE B — PRODUÇÃO** é **PROIBIDA** até que sejam colados abaixo:
1. A saída integral do `audit-live-hardening` em staging com **`25/25`** (incluindo `GET / sem credenciais = 401 Basic Auth`); **e**
2. O registro completo do **Ensaio de Rollback** da Etapa A.8 (`backup -> deploy -> rollback.sh staging -> audit 25/25 -> re-deploy`).

```text
PENDENTE GATE A -> B:
1) Cole aqui a saida integral de:
node scripts/audit-live-hardening.mjs --url=https://staging.ajnengenharia.com.br --expect-basic-auth
com resultado "[live-audit] PASS: 25/25 controles verificados..."

2) Cole aqui o registro do ENSAIO DE ROLLBACK (Etapa A.8):
- STAMP do backup pre-ensaio (LAST_STAMP.staging)
- Saida de "ROLLBACK CONCLUIDO (staging)" + "verify-audit-chain.php"
- Saida "[live-audit] PASS: 25/25..." apos rollback.sh staging e apos re-deploy final
```

---

## PARTE B — PRODUÇÃO

Caminhos padrão em `hostinger/ops/env.sh`:
- `$PROD_PUBLIC` = `"$HOME/domains/ajnengenharia.com.br/public_html"`
- `$PROD_PRIVATE` = `"$HOME/ajn-private/prod"`
- Logs de cron produção: `$HOME/ajn-logs/prod`

### Etapa B.0 — Pré-checagens e Isolamento de Diretórios em Produção

**[SERVIDOR]**

```bash
source "$HOME/ajn-ops/env.sh"
mkdir -p "$HOME/backups" "$HOME/deploy-stage/prod" "$HOME/ajn-ops" "$HOME/ajn-logs/prod" "$PROD_PRIVATE/resumes"
chmod 700 "$HOME/backups" "$HOME/ajn-ops" "$HOME/ajn-logs" "$HOME/ajn-logs/prod" "$PROD_PRIVATE" "$PROD_PRIVATE/resumes"

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

Somente após receber a `PUBLIC_TURNSTILE_SITE_KEY` real de produção (`0x4...`, nunca `1x`/`2x`/`3x`) e informando **`PROD_PRIVATE_DIR`** fora de webroot (o pacote falha fechado se estiver ausente ou em webroot; `pack:hostinger` injeta `SetEnv AJN_PRIVATE_DIR` e `RewriteCond ".../maintenance.flag" -f [OR]` apenas no `.htaccess` de produção empacotado):

**[LOCAL]**

```bash
PUBLIC_SITE_ORIGIN="https://ajnengenharia.com.br" \
PUBLIC_ALLOW_INDEXING="true" \
PUBLIC_CONTACT_ENDPOINT="https://api.opengscgandra.tech/contact" \
PUBLIC_TURNSTILE_SITE_KEY="COLE_AQUI_SITE_KEY_REAL_TURNSTILE" \
npm run validate

PROD_PRIVATE_DIR="/home/USUARIO_HOSTINGER/ajn-private/prod" \
npm run pack:hostinger

rsync -avz --delete output/hostinger-deploy/ USUARIO@HOST_SSH:~/deploy-stage/prod/
```

**[SERVIDOR]** Atualize os scripts operacionais preservando `env.sh` (`chmod 600`):

```bash
source "$HOME/ajn-ops/env.sh"
cp -f "$HOME/deploy-stage/prod/ops/backup.sh" "$HOME/deploy-stage/prod/ops/rollback.sh" "$HOME/deploy-stage/prod/ops/check-layout.sh" "$HOME/deploy-stage/prod/ops/check-public-diff.sh" "$HOME/deploy-stage/prod/ops/run-cron.sh" "$HOME/ajn-ops/"
chmod +x "$HOME/ajn-ops/"*.sh
chmod 600 "$HOME/ajn-ops/env.sh"
```

### Etapa B.2 — Ligar Modo Manutenção em Produção (`503`) — ANTES do Backup Final

**REGRA INVIOLÁVEL:** nos dois caminhos (primeira implantação ou produção já no ar), crie **SEMPRE** `$PROD_PRIVATE/maintenance.flag` antes de qualquer backup/troca de arquivos ou migration.

1. **[SERVIDOR — Sempre: Caminho 1 e Caminho 2]** Crie a flag de manutenção fora do webroot:

```bash
source "$HOME/ajn-ops/env.sh"
date -u +"%Y-%m-%dT%H:%M:%SZ" > "$PROD_PRIVATE/maintenance.flag"
chmod 640 "$PROD_PRIVATE/maintenance.flag"
```

2. **Caminho 1 — Primeira implantação em `public_html` novo:**
   Além de já ter criado `$PROD_PRIVATE/maintenance.flag` acima, **acrescente** temporariamente o bloco mínimo abaixo em `$PROD_PUBLIC/.htaccess` (somente a regra `503` dentro de `<IfModule mod_rewrite.c>`), que será substituído ao final pelo `.htaccess` definitivo do pacote:

```apacheconf
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteRule ^(?:api|admin)(?:/.*)?$ - [R=503,L]
</IfModule>
```

3. **Caminho 2 — Produção já no ar (redeploy):**
   O `.htaccess` definitivo (com `SetEnv AJN_PRIVATE_DIR` e `RewriteCond "<PROD_PRIVATE_DIR>/maintenance.flag" -f [OR]`) + `$PROD_PRIVATE/maintenance.flag` devolve `503` + `Retry-After: 300`.

4. **[LOCAL]** Valide externamente que `/api/health` e `/admin/carreiras/` retornam `503` enquanto `/` permanece acessível:

```bash
curl -isS https://ajnengenharia.com.br/api/health | head -n 15
curl -isS https://ajnengenharia.com.br/admin/carreiras/ | head -n 15
curl -isS https://ajnengenharia.com.br/ | head -n 8
```

### Etapa B.3 — Credenciais Temporárias + Backup Cifrado em Produção (`backup.sh --env=prod`)

1. **[SERVIDOR]** Crie `$HOME/.my-migrator.cnf` (`chmod 600`) e execute `backup.sh --env=prod` (na primeira criação sem schema, use `--skip-db`):

```bash
source "$HOME/ajn-ops/env.sh"
install -m 600 /dev/null "$HOME/.my-migrator.cnf"
cat <<'EOF' > "$HOME/.my-migrator.cnf"
[client]
host=127.0.0.1
port=3306
user=u000000000_ajn_migrator
password=SENHA_EXCLUSIVA_DO_MIGRATOR_PRODUCAO
EOF

mkdir -p "$PROD_PUBLIC"
"$HOME/ajn-ops/backup.sh" \
  --env=prod \
  --public-dir="$PROD_PUBLIC" \
  --private-dir="$PROD_PRIVATE" \
  --db-name=DB_PRODUCAO \
  --my-cnf="$HOME/.my-migrator.cnf"
```

2. **[LOCAL]** Cópia obrigatória fora do servidor antes da troca:

```bash
mkdir -p ./backups-offsite/prod
scp USUARIO@HOST_SSH:~/backups/*-"$(ssh USUARIO@HOST_SSH cat ~/backups/LAST_STAMP.prod)".* ./backups-offsite/prod/
ls -lh ./backups-offsite/prod/
```

### Etapa B.4 — Auditoria de Diferença em `public_html` (OBRIGATÓRIA ANTES DO `mv`)

**REGRA INVIOLÁVEL:** o `public_html` atual pode conter arquivos de verificação DNS/Search Console/Meta, `.well-known/acme-challenge/*` de SSL ou pastas de subdomínios/sistemas legados que **não** estão no pacote.

**[SERVIDOR]**

```bash
source "$HOME/ajn-ops/env.sh"
"$HOME/ajn-ops/check-public-diff.sh" \
  --current-public="$PROD_PUBLIC" \
  --package-public="$HOME/deploy-stage/prod/public_html"
```

- Se sair com código `2` (há itens extras no servidor), **PARE IMEDIATAMENTE**, apresente a lista ao responsável e confirme explicitamente o que deve ser copiado para `"${PROD_PUBLIC}.next"` antes do `mv`. **Nunca descarte itens silenciosamente.**

### Etapa B.5 — `config.php`, Troca Atômica (`mv`), Migrations (`migrate.php`) e MFA

1. **[SERVIDOR]** Atualize `$PROD_PRIVATE` mantendo `config.php`, `maintenance.flag` e `resumes/`:

```bash
source "$HOME/ajn-ops/env.sh"
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

3. **[SERVIDOR]** Prepare `"${PROD_PUBLIC}.next"`, copie **somente os extras aprovados na Etapa B.4** (`SetEnv AJN_PRIVATE_DIR` e a condição `maintenance.flag` já foram injetados automaticamente pelo `pack:hostinger` em `output/hostinger-deploy/public_html/.htaccess`), e realize a troca atômica:

```bash
source "$HOME/ajn-ops/env.sh"
rm -rf "${PROD_PUBLIC}.next"
cp -a "$HOME/deploy-stage/prod/public_html" "${PROD_PUBLIC}.next"
# Copiar somente itens extras aprovados na Etapa B.4 antes do mv, quando houver.

if [ -d "$PROD_PUBLIC" ]; then
  mv "$PROD_PUBLIC" "${PROD_PUBLIC}.prev"
fi
mv "${PROD_PUBLIC}.next" "$PROD_PUBLIC"
```

4. **[SERVIDOR]** Aplique migrations de forma rastreável com `migrate.php`:
   - **Se o banco de produção já existir sem `schema_migrations` (no estado 004):**

```bash
source "$HOME/ajn-ops/env.sh"
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
source "$HOME/ajn-ops/env.sh"
"$PHP_BIN" -d extension=sodium "$PROD_PRIVATE/migrate.php" \
  --defaults-file="$HOME/.my-migrator.cnf" \
  --database=DB_PRODUCAO \
  --dry-run

"$PHP_BIN" -d extension=sodium "$PROD_PRIVATE/migrate.php" \
  --defaults-file="$HOME/.my-migrator.cnf" \
  --database=DB_PRODUCAO
```

   - Confira ausência de `[AVISO]` de privilégios excessivos (`u000_ajn_app_rw`), valide dados legados e provisione MFA + auditoria:

```bash
source "$HOME/ajn-ops/env.sh"
"$PHP_BIN" -d extension=sodium "$PROD_PRIVATE/migrate.php" \
  --defaults-file="$HOME/.my-migrator.cnf" \
  --database=DB_PRODUCAO \
  --status

"$PHP_BIN" -d extension=sodium "$PROD_PRIVATE/migrate-legacy-data.php" --dry-run
"$PHP_BIN" -d extension=sodium "$PROD_PRIVATE/migrate-legacy-data.php"
"$PHP_BIN" -d extension=sodium "$PROD_PRIVATE/migrate-legacy-data.php" --dry-run

AJN_ADMIN_EMAIL="admin@ajnengenharia.com.br" \
AJN_ADMIN_NAME="Administrador AJN" \
"$PHP_BIN" -d extension=sodium "$PROD_PRIVATE/seed-admin.php"

"$PHP_BIN" -d extension=sodium "$PROD_PRIVATE/verify-audit-chain.php"
rm -f "$HOME/.my-migrator.cnf"
```

### Etapa B.6 — Desligar Manutenção e Validar Produção

**[SERVIDOR]**

```bash
source "$HOME/ajn-ops/env.sh"
rm -f "$PROD_PRIVATE/maintenance.flag"
```

**[LOCAL]**

```bash
node scripts/audit-live-hardening.mjs --url=https://ajnengenharia.com.br
npm run audit:live-security
```

Confirme:
- `[live-audit] PASS: 24/24 controles verificados em https://ajnengenharia.com.br.`
- `GET /api/health` responde `200` sem expor `environment`.
- Após validar estabilidade, remova `"${PROD_PUBLIC}.prev"`.

### Etapa B.7 — 3 Crons de Produção com Wrapper de Log (Sem `/dev/null`) + Alerta de Teste

Cadastre no hPanel (ou `crontab`) usando o **`PHP_BIN` real da Etapa B.0** e logs rotacionados **fora de webroot** (`$HOME/ajn-logs/prod`):
- `*/2 * * * * /home/USUARIO/ajn-ops/run-cron.sh --log-dir=/home/USUARIO/ajn-logs/prod --name=alerts -- /CAMINHO/REAL/DO/php -d extension=sodium /home/USUARIO/ajn-private/prod/send-security-alerts.php`
- `30 3 * * * /home/USUARIO/ajn-ops/run-cron.sh --log-dir=/home/USUARIO/ajn-logs/prod --name=purge -- /CAMINHO/REAL/DO/php -d extension=sodium /home/USUARIO/ajn-private/prod/purge-expired-data.php`
- `0 4 * * * /home/USUARIO/ajn-ops/run-cron.sh --log-dir=/home/USUARIO/ajn-logs/prod --name=audit-chain -- /CAMINHO/REAL/DO/php -d extension=sodium /home/USUARIO/ajn-private/prod/verify-audit-chain.php`

**[SERVIDOR]** Dispare e **confirme a chegada real** do e-mail `[ALERTA DE SEGURANCA AJN] DEPLOY_TEST_ALERT` em **`faleconosco@ajnengenharia.com.br`**:

```bash
source "$HOME/ajn-ops/env.sh"
"$PHP_BIN" -d extension=sodium "$PROD_PRIVATE/send-security-alerts.php" --test-alert
```

---

## ROLLBACK Seguro por Script Versionado (`hostinger/ops/rollback.sh`)

**REGRA INVIOLÁVEL:** **NUNCA** apague o diretório ativo antes de extrair, validar e conferir o ambiente. O script `hostinger/ops/rollback.sh` lê **`LAST_STAMP.<staging|prod>`** específico do ambiente, **ABORTA** se o prefixo do `STAMP` ou os caminhos não baterem com o ambiente informado, **remove TODAS as tabelas/views existentes do banco alvo (`SET FOREIGN_KEY_CHECKS = 0` + `information_schema.TABLES`) antes de restaurar o dump** (impedindo sobra de `schema_migrations` ou tabelas de versões posteriores), e realiza troca atômica por `mv`.

**[SERVIDOR — Produção]**

```bash
source "$HOME/ajn-ops/env.sh"
"$HOME/ajn-ops/rollback.sh" prod \
  --public-dir="$PROD_PUBLIC" \
  --private-dir="$PROD_PRIVATE" \
  --backups-dir="$HOME/backups" \
  --db-name=DB_PRODUCAO \
  --my-cnf="$HOME/.my-migrator.cnf"

rm -f "$HOME/.my-migrator.cnf"
```

**[SERVIDOR — Staging]**

```bash
source "$HOME/ajn-ops/env.sh"
"$HOME/ajn-ops/rollback.sh" staging \
  --public-dir="$STG_PUBLIC" \
  --private-dir="$STG_PRIVATE" \
  --backups-dir="$HOME/backups" \
  --db-name=DB_STAGING \
  --my-cnf="$HOME/.my-migrator.cnf"

rm -f "$HOME/.my-migrator.cnf"
```

Após o rollback, execute `audit-live-hardening.mjs` contra a URL restaurada e, somente após confirmar estabilidade e preservar evidências se necessário, remova `public_html.failed.*` e `prod.failed.*`/`staging.failed.*`.
