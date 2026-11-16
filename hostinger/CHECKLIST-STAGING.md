# Checklist Operacional — PARTE A (STAGING) — AJN Carreiras

Guia enxuto e numerado exclusivo da **Parte A — Staging**. **UM comando por passo**; pare imediatamente se qualquer passo marcar `[ ] FALHA`. Conclua todos os passos e registre as saídas no Gate de [`hostinger/DEPLOY.md`](DEPLOY.md) antes de iniciar a Parte B.

1. **[LOCAL] Enviar wrappers `hostinger/ops/` para `~/ajn-ops/`**
```bash
rsync -avz astro-site/hostinger/ops/ USUARIO@HOST_SSH:~/ajn-ops/
```
- Saída esperada: envio de `env.sh`, `check-layout.sh`, `backup.sh`, `rollback.sh`, `check-public-diff.sh`, `run-cron.sh` e `seed-legacy-fixtures.php`.
- `[ ] OK / [ ] FALHA`

2. **[SERVIDOR] Proteger `env.sh` (`chmod 600`) e wrappers (`chmod +x`)**
```bash
source "$HOME/ajn-ops/env.sh" && chmod 600 "$HOME/ajn-ops/env.sh" && chmod +x "$HOME/ajn-ops/"*.sh
```
- Saída esperada: `exit 0` (ajuste antes `$HOME/ajn-ops/env.sh` se algum caminho real do hPanel diferir).
- `[ ] OK / [ ] FALHA`

3. **[SERVIDOR] Validar layout isolado dos webroots e diretórios privados**
```bash
source "$HOME/ajn-ops/env.sh" && "$HOME/ajn-ops/check-layout.sh" --prod-public="$PROD_PUBLIC" --staging-public="$STG_PUBLIC" --private-dir="$PROD_PRIVATE" --private-dir="$STG_PRIVATE"
```
- Saída esperada: `LAYOUT OK: prod_public=... | staging_public=...`.
- `[ ] OK / [ ] FALHA`

4. **[SERVIDOR] Criar diretórios operacionais e privados de staging (`chmod 700`)**
```bash
source "$HOME/ajn-ops/env.sh" && mkdir -p "$HOME/backups" "$HOME/deploy-stage/staging" "$HOME/ajn-logs/staging" "$STG_PRIVATE/resumes" && chmod 700 "$HOME/backups" "$HOME/ajn-ops" "$HOME/ajn-logs" "$HOME/ajn-logs/staging" "$STG_PRIVATE" "$STG_PRIVATE/resumes"
```
- Saída esperada: `exit 0` sem erros de permissão.
- `[ ] OK / [ ] FALHA`

5. **[SERVIDOR] Conferir PHP CLI e extensões (`sodium`, `pdo_mysql`, `openssl`)**
```bash
source "$HOME/ajn-ops/env.sh" && "$PHP_BIN" -r 'foreach (["sodium","pdo_mysql","openssl"] as $ext) { if (!extension_loaded($ext)) { fwrite(STDERR, "Falta extensao: $ext\n"); exit(1); } } echo "CLI extensions OK (" . PHP_VERSION . ")\n";'
```
- Saída esperada: `CLI extensions OK (8.2...)`.
- `[ ] OK / [ ] FALHA`

6. **[SERVIDOR] Criar `.htpasswd-staging` fora dos webroots (senha via prompt oculto)**
```bash
source "$HOME/ajn-ops/env.sh" && mkdir -p "$(dirname "$STG_HTPASSWD")" && printf 'Senha staging_user: ' && IFS= read -r -s STG_PASS && echo && "$PHP_BIN" -r '$u="staging_user"; $p=rtrim(stream_get_contents(STDIN),"\r\n"); echo $u . ":" . password_hash($p, PASSWORD_BCRYPT) . "\n";' <<< "$STG_PASS" > "$STG_HTPASSWD" && unset STG_PASS && chmod 640 "$STG_HTPASSWD"
```
- Saída esperada: `exit 0` e `$STG_HTPASSWD` gravado com permissão `640`.
- `[ ] OK / [ ] FALHA`

7. **[LOCAL] Compilar build de staging (`noindex` + Turnstile de teste `1x`)**
```bash
PUBLIC_SITE_ORIGIN="https://staging.ajnengenharia.com.br" PUBLIC_ALLOW_INDEXING="false" PUBLIC_CONTACT_ENDPOINT="https://api.opengscgandra.tech/contact" PUBLIC_TURNSTILE_SITE_KEY="1x00000000000000000000AA" npm run build
```
- Saída esperada: build Astro + `[sync-csp]` + `[sync-worker]` concluídos com `exit 0`.
- `[ ] OK / [ ] FALHA`

8. **[LOCAL] Empacotar `output/hostinger-staging` com `STAGING_HTPASSWD_FILE` e `STAGING_PRIVATE_DIR`**
```bash
STAGING_HTPASSWD_FILE="/home/USUARIO_HOSTINGER/domains/staging.ajnengenharia.com.br/.htpasswd-staging" STAGING_PRIVATE_DIR="/home/USUARIO_HOSTINGER/ajn-private/staging" npm run pack:hostinger:staging
```
- Saída esperada: `[pack:hostinger:staging] AuthType Basic injetado apenas em output/hostinger-staging/public_html/.htaccess` e `SHA-256 CSP (.htaccess sincronizado)`.
- `[ ] OK / [ ] FALHA`

9. **[LOCAL] Enviar pacote `output/hostinger-staging/` para `~/deploy-stage/staging/`**
```bash
rsync -avz --delete output/hostinger-staging/ USUARIO@HOST_SSH:~/deploy-stage/staging/
```
- Saída esperada: arquivos sincronizados sem erros em `~/deploy-stage/staging/`.
- `[ ] OK / [ ] FALHA`

10. **[SERVIDOR] Ativar SEMPRE `$STG_PRIVATE/maintenance.flag` antes de alterar banco/arquivos**
```bash
source "$HOME/ajn-ops/env.sh" && date -u +"%Y-%m-%dT%H:%M:%SZ" > "$STG_PRIVATE/maintenance.flag" && chmod 640 "$STG_PRIVATE/maintenance.flag"
```
- Saída esperada: `$STG_PRIVATE/maintenance.flag` criado (na 1ª implantação sem `.htaccess` do pacote, acrescente também a regra mínima `<IfModule mod_rewrite.c> ... RewriteRule ^(?:api|admin)(?:/.*)?$ - [R=503,L] </IfModule>` em `$STG_PUBLIC/.htaccess`).
- `[ ] OK / [ ] FALHA`

11. **[SERVIDOR] Criar `$HOME/.netrc-staging` (`chmod 600`) e checar `503` em `/admin/carreiras/`**
```bash
source "$HOME/ajn-ops/env.sh" && printf 'Senha staging_user para curl: ' && IFS= read -r -s STG_CURL_PASS && echo && install -m 600 /dev/null "$HOME/.netrc-staging" && printf 'machine staging.ajnengenharia.com.br\nlogin staging_user\npassword %s\n' "$STG_CURL_PASS" > "$HOME/.netrc-staging" && unset STG_CURL_PASS && curl -isS --netrc-file "$HOME/.netrc-staging" https://staging.ajnengenharia.com.br/admin/carreiras/ | head -n 10
```
- Saída esperada: cabeçalho HTTP `503`.
- `[ ] OK / [ ] FALHA`

12. **[SERVIDOR] Criar `$HOME/.my-migrator.cnf` (`chmod 600`) com credencial migrator de staging**
```bash
source "$HOME/ajn-ops/env.sh" && printf 'Senha migrator staging: ' && IFS= read -r -s MIG_PASS && echo && install -m 600 /dev/null "$HOME/.my-migrator.cnf" && printf '[client]\nhost=127.0.0.1\nport=3306\nuser=u000000000_stg_mig\npassword=%s\n' "$MIG_PASS" > "$HOME/.my-migrator.cnf" && unset MIG_PASS
```
- Saída esperada: `$HOME/.my-migrator.cnf` gravado com permissão `600`.
- `[ ] OK / [ ] FALHA`

13. **[SERVIDOR] Executar backup cifrado inicial pré-deploy (`LAST_STAMP.staging`)**
```bash
source "$HOME/ajn-ops/env.sh" && mkdir -p "$STG_PUBLIC" && "$HOME/ajn-ops/backup.sh" --env=staging --public-dir="$STG_PUBLIC" --private-dir="$STG_PRIVATE" --db-name=DB_STAGING --my-cnf="$HOME/.my-migrator.cnf"
```
- Saída esperada: `BACKUP VERIFICADO (staging): STAMP=staging-...` (use `--skip-db` somente antes da criação inicial das tabelas).
- `[ ] OK / [ ] FALHA`

14. **[LOCAL] Baixar cópia offsite do backup de staging**
```bash
mkdir -p ./backups-offsite/staging && scp USUARIO@HOST_SSH:~/backups/*-"$(ssh USUARIO@HOST_SSH cat ~/backups/LAST_STAMP.staging)".* ./backups-offsite/staging/
```
- Saída esperada: arquivos `.enc` e `meta-*.env` copiados localmente em `./backups-offsite/staging/`.
- `[ ] OK / [ ] FALHA`

15. **[SERVIDOR] Publicar código privado em `$STG_PRIVATE` (preservando `config.php`, `maintenance.flag` e `resumes/`)**
```bash
source "$HOME/ajn-ops/env.sh" && rsync -av --exclude='config.php' --exclude='maintenance.flag' --exclude='php-errors.log' --exclude='resumes/' "$HOME/deploy-stage/staging/ajn-carreiras-private/" "$STG_PRIVATE/" && cp -f "$HOME/deploy-stage/staging/ajn-carreiras-private/resumes/.htaccess" "$STG_PRIVATE/resumes/.htaccess"
```
- Saída esperada: scripts/PHP atualizados e `$STG_PRIVATE/config.php` conferido (`chmod 600`, `environment => 'staging'`).
- `[ ] OK / [ ] FALHA`

16. **[SERVIDOR] Publicar `public_html` definitivo de staging**
```bash
source "$HOME/ajn-ops/env.sh" && rsync -av --delete "$HOME/deploy-stage/staging/public_html/" "$STG_PUBLIC/"
```
- Saída esperada: `$STG_PUBLIC` sincronizado com `.htaccess` definitivo de staging (`AuthType Basic` + `SetEnv AJN_PRIVATE_DIR`).
- `[ ] OK / [ ] FALHA`

17. **[SERVIDOR] Ciclo A.1 — Dry-run de migrations e checagem `SHOW GRANTS` no `DB_STAGING`**
```bash
source "$HOME/ajn-ops/env.sh" && "$PHP_BIN" -d extension=sodium "$STG_PRIVATE/migrate.php" --defaults-file="$HOME/.my-migrator.cnf" --database=DB_STAGING --dry-run
```
- Saída esperada: `001`..`006` listadas como pendentes e usuário runtime sem `[AVISO]` de privilégios excessivos.
- `[ ] OK / [ ] FALHA`

18. **[SERVIDOR] Ciclo A.1 — Aplicar migrations `001`..`006` e confirmar idempotência**
```bash
source "$HOME/ajn-ops/env.sh" && "$PHP_BIN" -d extension=sodium "$STG_PRIVATE/migrate.php" --defaults-file="$HOME/.my-migrator.cnf" --database=DB_STAGING && "$PHP_BIN" -d extension=sodium "$STG_PRIVATE/migrate.php" --defaults-file="$HOME/.my-migrator.cnf" --database=DB_STAGING --status && "$PHP_BIN" -d extension=sodium "$STG_PRIVATE/migrate.php" --defaults-file="$HOME/.my-migrator.cnf" --database=DB_STAGING
```
- Saída esperada: `aplicadas=6`, `--status` exibindo `APPLIED` para `001`..`006` e segunda passada com `Nenhuma migration pendente`.
- `[ ] OK / [ ] FALHA`

19. **[SERVIDOR] Ciclo A.2 — Testar upgrade `004 -> 006` + `seed-legacy-fixtures.php` + `migrate-legacy-data.php` em `DB_STAGING_UPG`**
```bash
source "$HOME/ajn-ops/env.sh" && mkdir -p "$HOME/deploy-stage/sql-004" && cp "$HOME/deploy-stage/staging/database"/00[1-4]_*.sql "$HOME/deploy-stage/sql-004/" && "$PHP_BIN" -r '$cfg=require $argv[1]; $cfg["environment"]="staging"; $cfg["database"]["name"]="DB_STAGING_UPG"; file_put_contents($argv[2], "<?php\nreturn ".var_export($cfg,true).";\n"); chmod($argv[2],0600);' "$STG_PRIVATE/config.php" "$HOME/deploy-stage/stg-upg.config.php" && AJN_CONFIG_PATH="$HOME/deploy-stage/stg-upg.config.php" "$PHP_BIN" -d extension=sodium "$STG_PRIVATE/migrate.php" --defaults-file="$HOME/.my-migrator.cnf" --database=DB_STAGING_UPG --migrations-dir="$HOME/deploy-stage/sql-004" && mysql --defaults-extra-file="$HOME/.my-migrator.cnf" DB_STAGING_UPG -e "DROP TABLE schema_migrations;" && AJN_CONFIG_PATH="$HOME/deploy-stage/stg-upg.config.php" "$PHP_BIN" -d extension=sodium "$HOME/ajn-ops/seed-legacy-fixtures.php" && AJN_CONFIG_PATH="$HOME/deploy-stage/stg-upg.config.php" "$PHP_BIN" -d extension=sodium "$STG_PRIVATE/migrate.php" --defaults-file="$HOME/.my-migrator.cnf" --database=DB_STAGING_UPG --baseline=004 && AJN_CONFIG_PATH="$HOME/deploy-stage/stg-upg.config.php" "$PHP_BIN" -d extension=sodium "$STG_PRIVATE/migrate.php" --defaults-file="$HOME/.my-migrator.cnf" --database=DB_STAGING_UPG && AJN_CONFIG_PATH="$HOME/deploy-stage/stg-upg.config.php" "$PHP_BIN" -d extension=sodium "$STG_PRIVATE/migrate-legacy-data.php" && AJN_CONFIG_PATH="$HOME/deploy-stage/stg-upg.config.php" "$PHP_BIN" -d extension=sodium "$STG_PRIVATE/migrate-legacy-data.php" --dry-run && rm -rf "$HOME/deploy-stage/sql-004" "$HOME/deploy-stage/stg-upg.config.php"
```
- Saída esperada: `[APPLIED] mfa_recifrados=..., telefones_cifrados=..., tracking_migrados=...` e última checagem `--dry-run` sem pendências.
- `[ ] OK / [ ] FALHA`

20. **[SERVIDOR] Provisionar superadmin de staging e verificar cadeia de auditoria**
```bash
source "$HOME/ajn-ops/env.sh" && AJN_ADMIN_EMAIL="admin@ajnengenharia.com.br" AJN_ADMIN_NAME="Administrador Staging" "$PHP_BIN" -d extension=sodium "$STG_PRIVATE/seed-admin.php" && "$PHP_BIN" -d extension=sodium "$STG_PRIVATE/verify-audit-chain.php"
```
- Saída esperada: URI/segredo TOTP + códigos de recuperação exibidos e `verify-audit-chain.php` terminando com `exit 0`.
- `[ ] OK / [ ] FALHA`

21. **[SERVIDOR] Remover `maintenance.flag` e `.netrc-staging`**
```bash
source "$HOME/ajn-ops/env.sh" && rm -f "$STG_PRIVATE/maintenance.flag" "$HOME/.netrc-staging"
```
- Saída esperada: `exit 0` (endpoints liberados em staging atrás do Basic Auth).
- `[ ] OK / [ ] FALHA`

22. **[LOCAL] Rodar `audit-live-hardening` em staging (`25/25`)**
```bash
LIVE_AUDIT_BASIC_USER="staging_user" LIVE_AUDIT_BASIC_PASS="SENHA_DO_STAGING" node scripts/audit-live-hardening.mjs --url=https://staging.ajnengenharia.com.br --expect-basic-auth
```
- Saída esperada: `[live-audit] PASS: 25/25 controles verificados em https://staging.ajnengenharia.com.br.` (salve a saída para colar no Gate).
- `[ ] OK / [ ] FALHA`

23. **[SERVIDOR] Disparar e confirmar e-mail de alerta de teste (`DEPLOY_TEST_ALERT`)**
```bash
source "$HOME/ajn-ops/env.sh" && "$PHP_BIN" -d extension=sodium "$STG_PRIVATE/send-security-alerts.php" --test-alert
```
- Saída esperada: `exit 0` e recebimento do e-mail `[ALERTA DE SEGURANCA AJN] DEPLOY_TEST_ALERT` em `faleconosco@ajnengenharia.com.br` (cadastre também os 3 crons com `run-cron.sh` da Etapa A.7).
- `[ ] OK / [ ] FALHA`

24. **[SERVIDOR — Ensaio de Rollback 1/5] Backup completo do staging homologado**
```bash
source "$HOME/ajn-ops/env.sh" && "$HOME/ajn-ops/backup.sh" --env=staging --public-dir="$STG_PUBLIC" --private-dir="$STG_PRIVATE" --db-name=DB_STAGING --my-cnf="$HOME/.my-migrator.cnf"
```
- Saída esperada: `BACKUP VERIFICADO (staging): STAMP=staging-...`.
- `[ ] OK / [ ] FALHA`

25. **[SERVIDOR — Ensaio de Rollback 2/5] Aplicar alteração transitória simulando novo deploy**
```bash
source "$HOME/ajn-ops/env.sh" && printf '<!-- rollback-drill-%s -->\n' "$(cat "$HOME/backups/LAST_STAMP.staging")" >> "$STG_PUBLIC/robots.txt"
```
- Saída esperada: `exit 0` com comentário de ensaio gravado em `$STG_PUBLIC/robots.txt`.
- `[ ] OK / [ ] FALHA`

26. **[SERVIDOR — Ensaio de Rollback 3/5] Executar `rollback.sh staging` e checar cadeia de auditoria**
```bash
source "$HOME/ajn-ops/env.sh" && "$HOME/ajn-ops/rollback.sh" staging --public-dir="$STG_PUBLIC" --private-dir="$STG_PRIVATE" --backups-dir="$HOME/backups" --db-name=DB_STAGING --my-cnf="$HOME/.my-migrator.cnf" && "$PHP_BIN" -d extension=sodium "$STG_PRIVATE/verify-audit-chain.php"
```
- Saída esperada: `ROLLBACK CONCLUIDO (staging): STAMP=staging-...`, marcador ausente em `robots.txt` e `verify-audit-chain.php` com `exit 0`.
- `[ ] OK / [ ] FALHA`

27. **[LOCAL — Ensaio de Rollback 4/5] Executar auditoria live pós-rollback**
```bash
LIVE_AUDIT_BASIC_USER="staging_user" LIVE_AUDIT_BASIC_PASS="SENHA_DO_STAGING" node scripts/audit-live-hardening.mjs --url=https://staging.ajnengenharia.com.br --expect-basic-auth
```
- Saída esperada: `[live-audit] PASS: 25/25 controles verificados em https://staging.ajnengenharia.com.br.`
- `[ ] OK / [ ] FALHA`

28. **[SERVIDOR — Ensaio de Rollback 5/5] Re-deployar staging limpo, confirmar migrations e remover `.my-migrator.cnf`**
```bash
source "$HOME/ajn-ops/env.sh" && rsync -av --delete "$HOME/deploy-stage/staging/public_html/" "$STG_PUBLIC/" && "$PHP_BIN" -d extension=sodium "$STG_PRIVATE/migrate.php" --defaults-file="$HOME/.my-migrator.cnf" --database=DB_STAGING && "$PHP_BIN" -d extension=sodium "$STG_PRIVATE/verify-audit-chain.php" && rm -f "$HOME/.my-migrator.cnf"
```
- Saída esperada: `Nenhuma migration pendente`, auditoria verde e `.my-migrator.cnf` removido; rode o passo 27 uma última vez e cole o registro no **GATE DE PASSAGEM** de `DEPLOY.md`.
- `[ ] OK / [ ] FALHA`
