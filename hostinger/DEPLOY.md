# Runbook Operacional de Deploy — AJN Carreiras (Hostinger)

Este documento define o procedimento oficial de publicação segura em **duas partes sequenciais e bloqueantes**:

- **PARTE A — STAGING:** subdomínio isolado (`https://staging.ajnengenharia.com.br`), raiz web separada do `public_html` de produção, pasta privada isolada, banco MySQL próprio e **zero dados reais**. A Parte B é **proibida** enquanto qualquer item da Parte A falhar.
- **PARTE B — PRODUÇÃO:** domínio principal (`https://ajnengenharia.com.br`). Só inicia após **100% da Parte A verde** com o registro completo do **Ensaio de Rollback Real** e a saída integral do `audit-live-hardening` (`25/25`, incluindo `GET / sem credenciais = 401`) colados no **GATE DE PASSAGEM**.

Todos os comandos **`[LOCAL — PowerShell]`** foram escritos para **Windows PowerShell + OpenSSH nativo do Windows**, usando `$env:NOME="valor"` (com limpeza em `finally { Remove-Item Env:... }`) e o alias SSH `ajn-hostinger` definido em `$HOME\.ssh\config`.

Checklist enxuto e numerado exclusivo da Parte A: [`hostinger/CHECKLIST-STAGING.md`](CHECKLIST-STAGING.md).

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
4. **`hostinger/ops/env.sh` (`chmod 600` em `$HOME/ajn-ops/env.sh`, zero segredos) e `hostinger/ops/init-config.php`:**
   - `env.sh` define e valida `PROD_PUBLIC`, `STG_PUBLIC`, `PROD_PRIVATE`, `STG_PRIVATE`, `STG_HTPASSWD` e `PHP_BIN` (aborta com `exit != 0` se qualquer uma vier vazia). Todo bloco `[SERVIDOR]` neste runbook inicia com `source "$HOME/ajn-ops/env.sh"`.
   - `init-config.php` (somente CLI, testado sob `disable_functions`) gera `<PRIVATE_DIR>/config.php` a partir de `config.example.php`, solicita senhas e secrets por entrada oculta, gera `encryption_key` com `random_bytes(32)`, grava com `chmod 0600`, recusa sobrescrever `config.php` existente e nunca imprime segredos.
5. **Chave de banco de dados em `config.php` (`$cfg['database']['name']`):**
   - Confirmado em `hostinger/config.example.php` (`'database' => ['host' => ..., 'port' => ..., 'name' => ..., 'username' => ..., 'password' => ...]`), `hostinger/bootstrap.php` (`ajn_pdo()`) e `hostinger/migrate.php`: a chave canônica de banco usada em toda a aplicação e scripts CLI é **`database.name`** (`$cfg['database']['name']`).
6. **Separação de diretórios privados e `known_webroots` (`api/index.php` e `bootstrap.php`):**
   - Padrão recomendado: `$HOME/ajn-private/staging` e `$HOME/ajn-private/prod` (fora de **todas** as raízes web).
   - Tanto `public/api/index.php` quanto `ajn_private_resume_dir()` em `bootstrap.php` bloqueiam qualquer caminho dentro de `DOCUMENT_ROOT`, `AJN_KNOWN_WEBROOTS`, `config['known_webroots']` ou diretórios contendo segmentos de webroot (`public_html`, `htdocs`, `httpdocs`, `www`).
7. **Banco de dados e menor privilégio (usuários separados no hPanel):**
   - **`u000_ajn_migrator` (temporário / somente SSH via `$HOME/.my-migrator.cnf`):** recebe `SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, DROP` no hPanel apenas para rodar `migrate.php` e `backup.sh`/`rollback.sh`. Nunca vai em `config.php`.
   - **`u000_ajn_app_rw` (runtime em `config.php`):** restrito no **hPanel** exclusivamente a `SELECT, INSERT, UPDATE, DELETE` nas tabelas de carreiras (sem `DROP`, `ALTER`, `CREATE`, `TRUNCATE`, `GRANT OPTION` ou `ALL PRIVILEGES`).
   - A migration `003_least_privilege.sql` aplica restrições internas (`DELETE FROM admin_permissions`) e **não contém SQL `GRANT`/`REVOKE`**; qualquer migration futura contendo `GRANT`/`REVOKE` é bloqueada pelo `migrate.php`, que também consulta `SHOW GRANTS FOR CURRENT_USER()` no usuário de runtime e emite `[AVISO]` caso haja privilégios excessivos.
8. **`security_alert_email` e `AJN_CONFIG_PATH`:**
   - `security_alert_email` = **`faleconosco@ajnengenharia.com.br`** (alinhado com `public/.well-known/security.txt`).
   - `AJN_CONFIG_PATH` é aceito **exclusivamente quando `PHP_SAPI === 'cli'`**.

---

## Etapa 0 — Alias SSH no Windows (`~/.ssh/config`) e Layout de Webroots (`check-layout.sh`)

1. **[LOCAL — PowerShell]** Parametrize host, usuário e porta SSH da Hostinger (normalmente porta `65002`) criando o bloco abaixo em `$HOME\.ssh\config` no Windows antes de executar os passos seguintes:

```sshconfig
Host ajn-hostinger
  HostName HOST_SSH_DO_HPANEL
  User u000000000
  Port 65002
  ServerAliveInterval 60
```

Valide o alias e envie `hostinger/ops/` para `~/ajn-ops/` via OpenSSH do Windows (preservando `~/ajn-ops/env.sh` caso já exista no servidor):

```powershell
ssh ajn-hostinger "echo SSH_ALIAS_OK"
ssh ajn-hostinger "rm -rf ~/deploy-stage/ops-tmp && mkdir -p ~/ajn-ops ~/deploy-stage"
if ($LASTEXITCODE -eq 0) { scp -r hostinger/ops ajn-hostinger:~/deploy-stage/ops-tmp }
if ($LASTEXITCODE -eq 0) { ssh ajn-hostinger "[ -f ~/ajn-ops/env.sh ] || cp ~/deploy-stage/ops-tmp/env.sh ~/ajn-ops/env.sh; rm -f ~/deploy-stage/ops-tmp/env.sh; cp -f ~/deploy-stage/ops-tmp/* ~/ajn-ops/ && rm -rf ~/deploy-stage/ops-tmp" }
```

2. **[SERVIDOR]** Confira **por `realpath`** onde o hPanel aponta o `public_html` de produção e o webroot do subdomínio de staging.

**REGRA BLOQUEANTE:** na Hostinger compartilhada, alguns subdomínios antigos são criados como subpasta dentro do `public_html` principal (`.../domains/ajnengenharia.com.br/public_html/staging`). **Isso é proibido**, pois exporia o staging sem proteção pelo `.htaccess`/rotas de produção e violaria o isolamento. Se acontecer, altere a raiz do subdomínio no **hPanel -> Domínios/Subdomínios -> Pasta raiz** para `$HOME/domains/staging.ajnengenharia.com.br/public_html` **antes** de continuar.

Ajuste `$HOME/ajn-ops/env.sh` se os caminhos reais do hPanel diferirem do padrão e valide o layout:

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

### Etapa A.1 — `.htpasswd-staging`, Build PowerShell e Upload (`ssh` + `scp`)

1. **[SERVIDOR]** Crie o `.htpasswd-staging` **fora** de qualquer `public_html` lendo a senha via stdin sem gravá-la no histórico:

```bash
source "$HOME/ajn-ops/env.sh"
mkdir -p "$(dirname "$STG_HTPASSWD")"
printf 'Senha staging_user: ' && IFS= read -r -s STG_PASS && echo
"$PHP_BIN" -r '$u="staging_user"; $p=stream_get_contents(STDIN); $p=rtrim($p,"\r\n"); echo $u . ":" . password_hash($p, PASSWORD_BCRYPT) . "\n";' <<< "$STG_PASS" > "$STG_HTPASSWD"
unset STG_PASS
chmod 640 "$STG_HTPASSWD"
```

2. **[LOCAL — PowerShell]** Dentro de `astro-site\`, gere o build de **staging** e o pacote com `AuthType Basic` + `SetEnv AJN_PRIVATE_DIR` injetados **exclusivamente** em `output/hostinger-staging/public_html/.htaccess`, limpando as variáveis `$env:` no bloco `finally`:

```powershell
$env:PUBLIC_SITE_ORIGIN = "https://staging.ajnengenharia.com.br"
$env:PUBLIC_ALLOW_INDEXING = "false"
$env:PUBLIC_CONTACT_ENDPOINT = "https://api.opengscgandra.tech/contact"
$env:PUBLIC_TURNSTILE_SITE_KEY = "1x00000000000000000000AA"
try {
  npm run build
} finally {
  Remove-Item Env:PUBLIC_SITE_ORIGIN, Env:PUBLIC_ALLOW_INDEXING, Env:PUBLIC_CONTACT_ENDPOINT, Env:PUBLIC_TURNSTILE_SITE_KEY -ErrorAction SilentlyContinue
}

$env:STAGING_HTPASSWD_FILE = "/home/USUARIO_HOSTINGER/domains/staging.ajnengenharia.com.br/.htpasswd-staging"
$env:STAGING_PRIVATE_DIR = "/home/USUARIO_HOSTINGER/ajn-private/staging"
try {
  npm run pack:hostinger:staging
} finally {
  Remove-Item Env:STAGING_HTPASSWD_FILE, Env:STAGING_PRIVATE_DIR -ErrorAction SilentlyContinue
}
```

Confirme na saída:
- `[pack:hostinger:staging] Modo: staging | Origem: https://staging.ajnengenharia.com.br | Indexação: false | ... | Turnstile no HTML: true`
- `[pack:hostinger:staging] AuthType Basic injetado apenas em output/hostinger-staging/public_html/.htaccess`
- Mesmo SHA-256 CSP entre `public/.htaccess`, `dist/.htaccess` e `output/hostinger-staging/public_html/.htaccess`.

3. **[LOCAL — PowerShell]** Remova o diretório remoto anterior (pois `scp` não apaga arquivos obsoletos) e envie o pacote completo para `~/deploy-stage/staging`:

```powershell
ssh ajn-hostinger "rm -rf ~/deploy-stage/staging && mkdir -p ~/deploy-stage"
if ($LASTEXITCODE -eq 0) { scp -r output/hostinger-staging ajn-hostinger:~/deploy-stage/staging }
```

4. **[SERVIDOR]** Atualize os scripts de `$HOME/ajn-ops/` (incluindo `init-config.php`) preservando sua cópia configurada de `env.sh`:

```bash
source "$HOME/ajn-ops/env.sh"
cp -f "$HOME/deploy-stage/staging/ops/init-config.php" "$HOME/deploy-stage/staging/ops/backup.sh" "$HOME/deploy-stage/staging/ops/rollback.sh" "$HOME/deploy-stage/staging/ops/check-layout.sh" "$HOME/deploy-stage/staging/ops/check-public-diff.sh" "$HOME/deploy-stage/staging/ops/run-cron.sh" "$HOME/deploy-stage/staging/ops/seed-legacy-fixtures.php" "$HOME/ajn-ops/"
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
   Além de já ter criado `maintenance.flag` no passo anterior, **acrescente** temporariamente o bloco mínimo abaixo em `$STG_PUBLIC/.htaccess` (somente a regra `503` dentro de `<IfModule mod_rewrite.c>`, mantendo Basic Auth acima se já ativo); ele será substituído ao final pelo `.htaccess` definitivo do pacote:

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

2. **[LOCAL — PowerShell]** Cópia obrigatória fora do servidor (offsite) via `ssh` + `scp`:

```powershell
New-Item -ItemType Directory -Force -Path .\backups-offsite\staging | Out-Null
$stamp = (ssh ajn-hostinger "cat ~/backups/LAST_STAMP.staging").Trim()
if (-not $stamp) { throw "LAST_STAMP.staging vazio" }
scp "ajn-hostinger:~/backups/*-$stamp.*" .\backups-offsite\staging\
Get-ChildItem .\backups-offsite\staging\
```

### Etapa A.4 — Publicar Código Privado, Gerar `config.php` (`init-config.php`) e Publicar `public_html`

1. **[SERVIDOR]** Publique o código privado preservando `config.php`, `maintenance.flag`, `php-errors.log` e `resumes/`:

```bash
source "$HOME/ajn-ops/env.sh"
rsync -av --exclude='config.php' --exclude='maintenance.flag' --exclude='php-errors.log' --exclude='resumes/' \
  "$HOME/deploy-stage/staging/ajn-carreiras-private/" "$STG_PRIVATE/"
cp -f "$HOME/deploy-stage/staging/ajn-carreiras-private/resumes/.htaccess" "$STG_PRIVATE/resumes/.htaccess"
```

2. **[SERVIDOR — OBRIGATÓRIO ANTES DO `migrate.php`]** Se `$STG_PRIVATE/config.php` ainda não existir, gere-o interativamente com `$HOME/ajn-ops/init-config.php` (a partir de `config.example.php`, com entrada oculta, geração CSPRNG de `encryption_key` via `random_bytes(32)`, gravação `chmod 0600`, recusa de sobrescrita se já existir e zero impressão de segredos):

```bash
source "$HOME/ajn-ops/env.sh"
"$PHP_BIN" -d extension=sodium "$HOME/ajn-ops/init-config.php" \
  --target="$STG_PRIVATE/config.php" \
  --example="$STG_PRIVATE/config.example.php" \
  --env=staging
```

Valores esperados nos prompts de staging:
- `'environment'` = `'staging'`
- `'app_url'` = `'https://staging.ajnengenharia.com.br'`
- `'allowed_origins'` = `'https://staging.ajnengenharia.com.br'`
- `'known_webroots'` = `$PROD_PUBLIC,$STG_PUBLIC`
- `'security_alert_email'` = `'faleconosco@ajnengenharia.com.br'`
- `'database.name'` = `DB_STAGING`, `'database.username'` = usuário runtime restrito (`u000000000_stg_app`, apenas `SELECT, INSERT, UPDATE, DELETE` no hPanel), `'database.password'` = entrada oculta
- `'turnstile_secret_key'` = `'1x0000000000000000000000000000000AA'` (entrada oculta)
- `'smtp'` = dados SMTP reais de staging (senha via entrada oculta)
- Em redeploy (quando `$STG_PRIVATE/config.php` já existe): `init-config.php` recusa sobrescrever (`exit 1`), protegendo `encryption_key` e credenciais vigentes.

3. **[SERVIDOR]** Publique `public_html` definitivo de staging:

```bash
source "$HOME/ajn-ops/env.sh"
rsync -av --delete "$HOME/deploy-stage/staging/public_html/" "$STG_PUBLIC/"
```

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

> **Verificação da chave de banco:** `config.example.php` e `bootstrap.php:ajn_pdo()` leem **`$cfg['database']['name']`** (`database.name`). O trecho abaixo remove eventual `dsn`, sobrescreve `$cfg['database']['name']` com `DB_STAGING_UPG` e **aborta (`exit(1)`)** se `DB_STAGING_UPG` coincidir com o banco principal já gravado em `$STG_PRIVATE/config.php`.

**[SERVIDOR]**

```bash
source "$HOME/ajn-ops/env.sh"
mkdir -p "$HOME/deploy-stage/sql-004"
cp "$HOME/deploy-stage/staging/database"/00[1-4]_*.sql "$HOME/deploy-stage/sql-004/"

"$PHP_BIN" -r '
  $cfg = require $argv[1];
  $upgDb = $argv[3];
  $mainDb = (string) ($cfg["database"]["name"] ?? "");
  if ($upgDb === "" || $upgDb === $mainDb) {
    fwrite(STDERR, "RECUSADO: banco de upgrade deve diferir de database.name principal ({$mainDb}).\n");
    exit(1);
  }
  unset($cfg["database"]["dsn"]);
  $cfg["environment"] = "staging";
  $cfg["database"]["name"] = $upgDb;
  file_put_contents($argv[2], "<?php\nreturn " . var_export($cfg, true) . ";\n");
  chmod($argv[2], 0600);
' "$STG_PRIVATE/config.php" "$HOME/deploy-stage/stg-upg.config.php" "DB_STAGING_UPG"

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

### Etapa A.6 — Desligar Manutenção, Rodar `audit-live-hardening` e Roteiro Manual no Navegador

1. **[SERVIDOR]** Desligue a flag de manutenção e apague `.netrc-staging`:

```bash
source "$HOME/ajn-ops/env.sh"
rm -f "$STG_PRIVATE/maintenance.flag" "$HOME/.netrc-staging"
```

2. **[LOCAL — PowerShell]** Execute a auditoria live configurando `$env:LIVE_AUDIT_*` e limpando ao final:

```powershell
$env:LIVE_AUDIT_BASIC_USER = "staging_user"
$env:LIVE_AUDIT_BASIC_PASS = "SENHA_DO_STAGING"
try {
  node scripts/audit-live-hardening.mjs --url=https://staging.ajnengenharia.com.br --expect-basic-auth
} finally {
  Remove-Item Env:LIVE_AUDIT_BASIC_USER, Env:LIVE_AUDIT_BASIC_PASS -ErrorAction SilentlyContinue
}
```

Confirme:
- **`[live-audit] PASS: 25/25 controles verificados`** (inclui `GET / sem credenciais = 401 Basic Auth`).

3. **[LOCAL — Navegador]** Roteiro obrigatório de homologação manual ponta a ponta em `https://staging.ajnengenharia.com.br`:
   1. **Login + TOTP:** autenticar em `/admin/carreiras/` com usuário `staging_user` (Basic Auth), e-mail/senha de `seed-admin.php` e código TOTP de 6 dígitos;
   2. **Step-up:** acionar ação sensível no painel que solicita reautenticação (`step-up` com senha + novo código TOTP);
   3. **Criar vaga:** publicar vaga sintética e confirmar exibição em `/carreiras/` e `/carreiras/vaga/`;
   4. **Candidatura com PDF:** enviar candidatura sintética com currículo `.pdf` válido + Turnstile de teste e anotar o código de acompanhamento;
   5. **Download do currículo:** dentro do painel `/admin/carreiras/`, baixar o PDF enviado e validar abertura íntegra do arquivo;
   6. **Acompanhamento:** consultar `/carreiras/acompanhamento/` pelo código + CPF sintético (e validar fluxo de recuperação);
   7. **Pedido LGPD:** registrar solicitação sintética na aba LGPD e confirmar registro no painel admin.

### Etapa A.7 — 3 Crons de Staging com Wrapper de Log (Sem `/dev/null`), Alerta de Teste e Conferência de Logs

1. **[SERVIDOR -> hPanel]** Gere as 3 linhas exatas com seu `$HOME`, `$PHP_BIN` e `$STG_PRIVATE` reais e cadastre-as em **hPanel -> Avançado -> Cron Jobs**:

```bash
source "$HOME/ajn-ops/env.sh"
printf '*/2 * * * * %s/ajn-ops/run-cron.sh --log-dir=%s/ajn-logs/staging --name=alerts -- %s -d extension=sodium %s/send-security-alerts.php\n' "$HOME" "$HOME" "$PHP_BIN" "$STG_PRIVATE"
printf '30 3 * * * %s/ajn-ops/run-cron.sh --log-dir=%s/ajn-logs/staging --name=purge -- %s -d extension=sodium %s/purge-expired-data.php\n' "$HOME" "$HOME" "$PHP_BIN" "$STG_PRIVATE"
printf '0 4 * * * %s/ajn-ops/run-cron.sh --log-dir=%s/ajn-logs/staging --name=audit-chain -- %s -d extension=sodium %s/verify-audit-chain.php\n' "$HOME" "$HOME" "$PHP_BIN" "$STG_PRIVATE"
```

2. **[SERVIDOR]** Dispare e confirme a chegada real do e-mail `DEPLOY_TEST_ALERT` em `faleconosco@ajnengenharia.com.br`:

```bash
source "$HOME/ajn-ops/env.sh"
"$PHP_BIN" -d extension=sodium "$STG_PRIVATE/send-security-alerts.php" --test-alert
```

3. **[SERVIDOR]** Aguarde até 2 minutos o cron `alerts` (`*/2`) disparar no hPanel e confira os logs gravados fora do webroot em `~/ajn-logs/staging`:

```bash
source "$HOME/ajn-ops/env.sh"
ls -la "$HOME/ajn-logs/staging"
tail -n 30 "$HOME/ajn-logs/staging/"cron-*.log
```

### Etapa A.8 — Ensaio Obrigatório de Rollback Real em Staging (Antes do Gate)

Antes de liberar a Parte B, valide o ciclo completo **`backup -> drill arquivo + banco -> rollback.sh staging -> verificação real -> audit -> re-deploy`** em staging:

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

2. **[SERVIDOR] Alteração transitória em arquivo E NO BANCO (simulando deploy problemático com tabela extra e linha falsa em `schema_migrations`):**

```bash
source "$HOME/ajn-ops/env.sh"
printf '<!-- rollback-drill-%s -->\n' "$(cat "$HOME/backups/LAST_STAMP.staging")" >> "$STG_PUBLIC/robots.txt"
mysql --defaults-extra-file="$HOME/.my-migrator.cnf" DB_STAGING -e "CREATE TABLE rollback_drill_marker (id INT PRIMARY KEY, stamp VARCHAR(64) NOT NULL); INSERT INTO rollback_drill_marker (id, stamp) VALUES (1, 'drill'); INSERT INTO schema_migrations (name, checksum, applied_at) VALUES ('999_rollback_drill.sql', REPEAT('0', 64), UNIX_TIMESTAMP());"
```

3. **[SERVIDOR] Executar `rollback.sh staging` e confirmar reversão real em arquivo e banco (`rollback_drill_marker` ausente, `schema_migrations` no estado exato do backup e marcador removido de `robots.txt`):**

```bash
source "$HOME/ajn-ops/env.sh"
"$HOME/ajn-ops/rollback.sh" staging \
  --public-dir="$STG_PUBLIC" \
  --private-dir="$STG_PRIVATE" \
  --backups-dir="$HOME/backups" \
  --db-name=DB_STAGING \
  --my-cnf="$HOME/.my-migrator.cnf"

DRILL_TBL="$(mysql --defaults-extra-file="$HOME/.my-migrator.cnf" -N -B DB_STAGING -e "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'rollback_drill_marker';")"
FAKE_MIG="$(mysql --defaults-extra-file="$HOME/.my-migrator.cnf" -N -B DB_STAGING -e "SELECT COUNT(*) FROM schema_migrations WHERE name = '999_rollback_drill.sql';")"
TOTAL_MIG="$(mysql --defaults-extra-file="$HOME/.my-migrator.cnf" -N -B DB_STAGING -e "SELECT COUNT(*) FROM schema_migrations;")"
if [ "$DRILL_TBL" -ne 0 ] || [ "$FAKE_MIG" -ne 0 ] || [ "$TOTAL_MIG" -ne 6 ] || grep -q 'rollback-drill-' "$STG_PUBLIC/robots.txt"; then
  echo "FAIL: rollback drill nao reverteu banco ou robots.txt (DRILL_TBL=$DRILL_TBL FAKE_MIG=$FAKE_MIG TOTAL_MIG=$TOTAL_MIG)" >&2
  exit 1
fi
echo "ROLLBACK VERIFICADO: rollback_drill_marker=0 fake_migration=0 total_migrations=$TOTAL_MIG robots_clean=true"
"$PHP_BIN" -d extension=sodium "$STG_PRIVATE/verify-audit-chain.php"
```

4. **[LOCAL — PowerShell] Audit pós-rollback (`25/25` obrigatório):**

```powershell
$env:LIVE_AUDIT_BASIC_USER = "staging_user"
$env:LIVE_AUDIT_BASIC_PASS = "SENHA_DO_STAGING"
try {
  node scripts/audit-live-hardening.mjs --url=https://staging.ajnengenharia.com.br --expect-basic-auth
} finally {
  Remove-Item Env:LIVE_AUDIT_BASIC_USER, Env:LIVE_AUDIT_BASIC_PASS -ErrorAction SilentlyContinue
}
```

5. **[SERVIDOR] Re-deploy do pacote validado de staging e remoção das credenciais temporárias:**

```bash
source "$HOME/ajn-ops/env.sh"
rsync -av --delete "$HOME/deploy-stage/staging/public_html/" "$STG_PUBLIC/"
"$PHP_BIN" -d extension=sodium "$STG_PRIVATE/migrate.php" \
  --defaults-file="$HOME/.my-migrator.cnf" \
  --database=DB_STAGING
"$PHP_BIN" -d extension=sodium "$STG_PRIVATE/verify-audit-chain.php"
rm -f "$HOME/.my-migrator.cnf"
```

Rode novamente no **[LOCAL — PowerShell]** o passo 4 acima (`node scripts/audit-live-hardening.mjs --url=https://staging.ajnengenharia.com.br --expect-basic-auth` com `$env:LIVE_AUDIT_*` + limpeza `Remove-Item`) confirmando **`25/25`** após o re-deploy.

---

## GATE DE PASSAGEM — SAÍDA DE STAGING OBRIGATÓRIA ANTES DE PRODUÇÃO

A **PARTE B — PRODUÇÃO** é **PROIBIDA** até que sejam colados abaixo:
1. A saída integral do `audit-live-hardening` em staging com **`25/25`** (incluindo `GET / sem credenciais = 401 Basic Auth`); **e**
2. O registro completo do **Ensaio de Rollback** da Etapa A.8 (`backup -> drill banco/arquivo -> rollback.sh staging -> verificação rollback_drill_marker=0 & schema_migrations=6 -> audit 25/25 -> re-deploy`).

```text
PENDENTE GATE A -> B:
1) Cole aqui a saida integral de:
node scripts/audit-live-hardening.mjs --url=https://staging.ajnengenharia.com.br --expect-basic-auth
com resultado "[live-audit] PASS: 25/25 controles verificados..."

2) Cole aqui o registro do ENSAIO DE ROLLBACK REAL (Etapa A.8):
- STAMP do backup pre-ensaio (LAST_STAMP.staging)
- Saida de "ROLLBACK CONCLUIDO (staging)" + "ROLLBACK VERIFICADO: rollback_drill_marker=0 fake_migration=0..." + "verify-audit-chain.php"
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

### Etapa B.1 — Geração do Pacote de Produção e Upload via `ssh` + `scp` (PowerShell)

Somente após receber a `PUBLIC_TURNSTILE_SITE_KEY` real de produção (`0x4...`, nunca `1x`/`2x`/`3x`) e informando **`PROD_PRIVATE_DIR`** fora de webroot (o pacote falha fechado se estiver ausente ou em webroot; `pack:hostinger` injeta `SetEnv AJN_PRIVATE_DIR` e `RewriteCond ".../maintenance.flag" -f [OR]` apenas no `.htaccess` de produção empacotado):

**[LOCAL — PowerShell]**

```powershell
$env:PUBLIC_SITE_ORIGIN = "https://ajnengenharia.com.br"
$env:PUBLIC_ALLOW_INDEXING = "true"
$env:PUBLIC_CONTACT_ENDPOINT = "https://api.opengscgandra.tech/contact"
$env:PUBLIC_TURNSTILE_SITE_KEY = "COLE_AQUI_SITE_KEY_REAL_TURNSTILE"
try {
  npm run validate
} finally {
  Remove-Item Env:PUBLIC_SITE_ORIGIN, Env:PUBLIC_ALLOW_INDEXING, Env:PUBLIC_CONTACT_ENDPOINT, Env:PUBLIC_TURNSTILE_SITE_KEY -ErrorAction SilentlyContinue
}

$env:PROD_PRIVATE_DIR = "/home/USUARIO_HOSTINGER/ajn-private/prod"
try {
  npm run pack:hostinger
} finally {
  Remove-Item Env:PROD_PRIVATE_DIR -ErrorAction SilentlyContinue
}

ssh ajn-hostinger "rm -rf ~/deploy-stage/prod && mkdir -p ~/deploy-stage"
if ($LASTEXITCODE -eq 0) { scp -r output/hostinger-deploy ajn-hostinger:~/deploy-stage/prod }
```

**[SERVIDOR]** Atualize os scripts operacionais (incluindo `init-config.php`) preservando `env.sh` (`chmod 600`):

```bash
source "$HOME/ajn-ops/env.sh"
cp -f "$HOME/deploy-stage/prod/ops/init-config.php" "$HOME/deploy-stage/prod/ops/backup.sh" "$HOME/deploy-stage/prod/ops/rollback.sh" "$HOME/deploy-stage/prod/ops/check-layout.sh" "$HOME/deploy-stage/prod/ops/check-public-diff.sh" "$HOME/deploy-stage/prod/ops/run-cron.sh" "$HOME/ajn-ops/"
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

4. **[LOCAL — PowerShell]** Valide externamente com `curl.exe` que `/api/health` e `/admin/carreiras/` retornam `503` enquanto `/` permanece acessível:

```powershell
curl.exe -isS https://ajnengenharia.com.br/api/health | Select-Object -First 15
curl.exe -isS https://ajnengenharia.com.br/admin/carreiras/ | Select-Object -First 15
curl.exe -isS https://ajnengenharia.com.br/ | Select-Object -First 8
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

2. **[LOCAL — PowerShell]** Cópia obrigatória fora do servidor antes da troca:

```powershell
New-Item -ItemType Directory -Force -Path .\backups-offsite\prod | Out-Null
$stamp = (ssh ajn-hostinger "cat ~/backups/LAST_STAMP.prod").Trim()
if (-not $stamp) { throw "LAST_STAMP.prod vazio" }
scp "ajn-hostinger:~/backups/*-$stamp.*" .\backups-offsite\prod\
Get-ChildItem .\backups-offsite\prod\
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

### Etapa B.5 — `config.php` (`init-config.php`), Troca Atômica (`mv`), Migrations (`migrate.php`) e MFA

1. **[SERVIDOR]** Atualize `$PROD_PRIVATE` mantendo `config.php`, `maintenance.flag` e `resumes/`:

```bash
source "$HOME/ajn-ops/env.sh"
rsync -av --exclude='config.php' --exclude='maintenance.flag' --exclude='php-errors.log' --exclude='resumes/' \
  "$HOME/deploy-stage/prod/ajn-carreiras-private/" "$PROD_PRIVATE/"
cp -f "$HOME/deploy-stage/prod/ajn-carreiras-private/resumes/.htaccess" "$PROD_PRIVATE/resumes/.htaccess"
```

2. **[SERVIDOR — OBRIGATÓRIO ANTES DO `migrate.php`]** Caso `$PROD_PRIVATE/config.php` ainda não exista, gere-o com `$HOME/ajn-ops/init-config.php` (entrada oculta, `encryption_key` CSPRNG exclusiva de produção via `random_bytes`, `chmod 0600`, recusa de sobrescrita e rejeição de chaves `1x`/`2x`/`3x` do Turnstile em produção):

```bash
source "$HOME/ajn-ops/env.sh"
"$PHP_BIN" -d extension=sodium "$HOME/ajn-ops/init-config.php" \
  --target="$PROD_PRIVATE/config.php" \
  --example="$PROD_PRIVATE/config.example.php" \
  --env=production
```

Verifique na configuração:
- `'environment' => 'production'`, `'app_url' => 'https://ajnengenharia.com.br'`
- `'allowed_origins' => ['https://ajnengenharia.com.br', 'https://www.ajnengenharia.com.br']`
- `'known_webroots' => [$PROD_PUBLIC, $STG_PUBLIC]`
- `'security_alert_email' => 'faleconosco@ajnengenharia.com.br'`
- `'turnstile_secret_key'` real de produção e `'database'` apontando para `DB_PRODUCAO` + usuário runtime `u000000000_ajn_app_rw` (configurado no **hPanel** apenas com `SELECT, INSERT, UPDATE, DELETE`).

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

**[LOCAL — PowerShell]**

```powershell
node scripts/audit-live-hardening.mjs --url=https://ajnengenharia.com.br
npm run audit:live-security
```

Confirme:
- `[live-audit] PASS: 24/24 controles verificados em https://ajnengenharia.com.br.`
- `GET /api/health` responde `200` sem expor `environment`.
- Após validar estabilidade, remova `"${PROD_PUBLIC}.prev"`.

### Etapa B.7 — 3 Crons de Produção com Wrapper de Log (Sem `/dev/null`), Alerta de Teste e Conferência de Logs

1. **[SERVIDOR -> hPanel]** Gere os comandos exatos com seus caminhos reais e cadastre-os no hPanel (`$HOME/ajn-logs/prod`):

```bash
source "$HOME/ajn-ops/env.sh"
printf '*/2 * * * * %s/ajn-ops/run-cron.sh --log-dir=%s/ajn-logs/prod --name=alerts -- %s -d extension=sodium %s/send-security-alerts.php\n' "$HOME" "$HOME" "$PHP_BIN" "$PROD_PRIVATE"
printf '30 3 * * * %s/ajn-ops/run-cron.sh --log-dir=%s/ajn-logs/prod --name=purge -- %s -d extension=sodium %s/purge-expired-data.php\n' "$HOME" "$HOME" "$PHP_BIN" "$PROD_PRIVATE"
printf '0 4 * * * %s/ajn-ops/run-cron.sh --log-dir=%s/ajn-logs/prod --name=audit-chain -- %s -d extension=sodium %s/verify-audit-chain.php\n' "$HOME" "$HOME" "$PHP_BIN" "$PROD_PRIVATE"
```

2. **[SERVIDOR]** Dispare e **confirme a chegada real** do e-mail `[ALERTA DE SEGURANCA AJN] DEPLOY_TEST_ALERT` em **`faleconosco@ajnengenharia.com.br`** e confira os logs em `~/ajn-logs/prod`:

```bash
source "$HOME/ajn-ops/env.sh"
"$PHP_BIN" -d extension=sodium "$PROD_PRIVATE/send-security-alerts.php" --test-alert
sleep 125
ls -la "$HOME/ajn-logs/prod"
tail -n 30 "$HOME/ajn-logs/prod/"cron-*.log
```

---

## ROLLBACK Seguro por Script Versionado (`hostinger/ops/rollback.sh`)

**REGRA INVIOLÁVEL:** **NUNCA** apague o diretório ativo antes de extrair, validar e conferir o ambiente. O script `hostinger/ops/rollback.sh` lê **`LAST_STAMP.<staging|prod>`** específico do ambiente, **ABORTA** se o prefixo do `STAMP` ou os caminhos não baterem com o ambiente informado, **remove TODAS as tabelas/views existentes do banco alvo (`SET FOREIGN_KEY_CHECKS = 0` + `information_schema.TABLES`) antes de restaurar o dump** (impedindo sobra de `schema_migrations`, `rollback_drill_marker` ou tabelas de versões posteriores), e realiza troca atômica por `mv`.

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
