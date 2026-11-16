# Checklist Operacional — PARTE A (STAGING) — AJN Carreiras

Guia enxuto e numerado exclusivo da **Parte A — Staging**, com passos locais em **Windows PowerShell + OpenSSH do Windows**. **UM comando por passo**; pare imediatamente se qualquer passo marcar `[ ] FALHA`. Conclua todos os passos e registre as saídas no Gate de [`hostinger/DEPLOY.md`](DEPLOY.md) antes de iniciar a Parte B.

> **Pré-requisito único no Windows (`$HOME\.ssh\config`):** adicione o alias abaixo antes do Passo 1 (parametrizando host, usuário e porta SSH da Hostinger):
> ```sshconfig
> Host ajn-hostinger
>   HostName HOST_SSH_DO_HPANEL
>   User u000000000
>   Port 65002
>   ServerAliveInterval 60
> ```

1. **[LOCAL — PowerShell] Testar alias SSH `ajn-hostinger` (`~/.ssh/config`)**
```powershell
ssh ajn-hostinger "echo SSH_ALIAS_OK"
```
- Saída esperada: `SSH_ALIAS_OK` sem solicitar host/porta extras.
- `[ ] OK / [ ] FALHA`

2. **[LOCAL — PowerShell] Enviar wrappers `hostinger/ops/` para `~/ajn-ops/` via OpenSSH (preservando `env.sh`)**
```powershell
ssh ajn-hostinger "rm -rf ~/deploy-stage/ops-tmp && mkdir -p ~/ajn-ops ~/deploy-stage"; if ($LASTEXITCODE -eq 0) { scp -r hostinger/ops ajn-hostinger:~/deploy-stage/ops-tmp }; if ($LASTEXITCODE -eq 0) { ssh ajn-hostinger "[ -f ~/ajn-ops/env.sh ] || cp ~/deploy-stage/ops-tmp/env.sh ~/ajn-ops/env.sh; rm -f ~/deploy-stage/ops-tmp/env.sh; cp -f ~/deploy-stage/ops-tmp/* ~/ajn-ops/ && rm -rf ~/deploy-stage/ops-tmp" }
```
- Saída esperada: envio de `env.sh`, `init-config.php`, `check-layout.sh`, `backup.sh`, `rollback.sh`, `check-public-diff.sh`, `run-cron.sh` e `seed-legacy-fixtures.php`.
- `[ ] OK / [ ] FALHA`

3. **[SERVIDOR] Proteger `env.sh` (`chmod 600`) e wrappers (`chmod +x`)**
```bash
source "$HOME/ajn-ops/env.sh" && chmod 600 "$HOME/ajn-ops/env.sh" && chmod +x "$HOME/ajn-ops/"*.sh
```
- Saída esperada: `exit 0` (ajuste antes `$HOME/ajn-ops/env.sh` se algum caminho real do hPanel diferir).
- `[ ] OK / [ ] FALHA`

4. **[SERVIDOR] Validar layout isolado dos webroots e diretórios privados**
```bash
source "$HOME/ajn-ops/env.sh" && "$HOME/ajn-ops/check-layout.sh" --prod-public="$PROD_PUBLIC" --staging-public="$STG_PUBLIC" --private-dir="$PROD_PRIVATE" --private-dir="$STG_PRIVATE"
```
- Saída esperada: `LAYOUT OK: prod_public=... | staging_public=...`.
- `[ ] OK / [ ] FALHA`

5. **[SERVIDOR] Criar diretórios operacionais e privados de staging (`chmod 700`)**
```bash
source "$HOME/ajn-ops/env.sh" && mkdir -p "$HOME/backups" "$HOME/deploy-stage/staging" "$HOME/ajn-logs/staging" "$STG_PRIVATE/resumes" && chmod 700 "$HOME/backups" "$HOME/ajn-ops" "$HOME/ajn-logs" "$HOME/ajn-logs/staging" "$STG_PRIVATE" "$STG_PRIVATE/resumes"
```
- Saída esperada: `exit 0` sem erros de permissão.
- `[ ] OK / [ ] FALHA`

6. **[SERVIDOR] Conferir PHP CLI e extensões (`sodium`, `pdo_mysql`, `openssl`)**
```bash
source "$HOME/ajn-ops/env.sh" && "$PHP_BIN" -r 'foreach (["sodium","pdo_mysql","openssl"] as $ext) { if (!extension_loaded($ext)) { fwrite(STDERR, "Falta extensao: $ext\n"); exit(1); } } echo "CLI extensions OK (" . PHP_VERSION . ")\n";'
```
- Saída esperada: `CLI extensions OK (8.2...)`.
- `[ ] OK / [ ] FALHA`

7. **[SERVIDOR] Criar `.htpasswd-staging` fora dos webroots (senha via prompt oculto)**
```bash
source "$HOME/ajn-ops/env.sh" && mkdir -p "$(dirname "$STG_HTPASSWD")" && printf 'Senha staging_user: ' && IFS= read -r -s STG_PASS && echo && "$PHP_BIN" -r '$u="staging_user"; $p=rtrim(stream_get_contents(STDIN),"\r\n"); echo $u . ":" . password_hash($p, PASSWORD_BCRYPT) . "\n";' <<< "$STG_PASS" > "$STG_HTPASSWD" && unset STG_PASS && chmod 640 "$STG_HTPASSWD"
```
- Saída esperada: `exit 0` e `$STG_HTPASSWD` gravado com permissão `640`.
- `[ ] OK / [ ] FALHA`

8. **[LOCAL — PowerShell] Compilar build de staging (`$env:` + limpeza no `finally`)**
```powershell
$env:PUBLIC_SITE_ORIGIN="https://staging.ajnengenharia.com.br"; $env:PUBLIC_ALLOW_INDEXING="false"; $env:PUBLIC_CONTACT_ENDPOINT="https://api.opengscgandra.tech/contact"; $env:PUBLIC_TURNSTILE_SITE_KEY="1x00000000000000000000AA"; try { npm run build } finally { Remove-Item Env:PUBLIC_SITE_ORIGIN,Env:PUBLIC_ALLOW_INDEXING,Env:PUBLIC_CONTACT_ENDPOINT,Env:PUBLIC_TURNSTILE_SITE_KEY -ErrorAction SilentlyContinue }
```
- Saída esperada: build Astro + `[csp-sync]` + `[worker-assets]` concluídos com `exit 0`.
- `[ ] OK / [ ] FALHA`

9. **[LOCAL — PowerShell] Empacotar `output/hostinger-staging` (`$env:` + limpeza no `finally`)**
```powershell
$env:STAGING_HTPASSWD_FILE="/home/USUARIO_HOSTINGER/domains/staging.ajnengenharia.com.br/.htpasswd-staging"; $env:STAGING_PRIVATE_DIR="/home/USUARIO_HOSTINGER/ajn-private/staging"; try { npm run pack:hostinger:staging } finally { Remove-Item Env:STAGING_HTPASSWD_FILE,Env:STAGING_PRIVATE_DIR -ErrorAction SilentlyContinue }
```
- Saída esperada: `[pack:hostinger:staging] AuthType Basic injetado apenas em output/hostinger-staging/public_html/.htaccess` e `SHA-256 CSP (.htaccess sincronizado)`.
- `[ ] OK / [ ] FALHA`

10. **[LOCAL — PowerShell] Limpar `~/deploy-stage/staging` e enviar pacote via OpenSSH `scp`**
```powershell
ssh ajn-hostinger "rm -rf ~/deploy-stage/staging && mkdir -p ~/deploy-stage"; if ($LASTEXITCODE -eq 0) { scp -r output/hostinger-staging ajn-hostinger:~/deploy-stage/staging }
```
- Saída esperada: transferência limpa via `scp -r` sem arquivos antigos residuais.
- `[ ] OK / [ ] FALHA`

11. **[SERVIDOR] Atualizar scripts em `$HOME/ajn-ops/` preservando `env.sh`**
```bash
source "$HOME/ajn-ops/env.sh" && cp -f "$HOME/deploy-stage/staging/ops/init-config.php" "$HOME/deploy-stage/staging/ops/backup.sh" "$HOME/deploy-stage/staging/ops/rollback.sh" "$HOME/deploy-stage/staging/ops/check-layout.sh" "$HOME/deploy-stage/staging/ops/check-public-diff.sh" "$HOME/deploy-stage/staging/ops/run-cron.sh" "$HOME/deploy-stage/staging/ops/seed-legacy-fixtures.php" "$HOME/ajn-ops/" && chmod +x "$HOME/ajn-ops/"*.sh && chmod 600 "$HOME/ajn-ops/env.sh"
```
- Saída esperada: scripts atualizados (incluindo `init-config.php`) e `env.sh` mantido em `600`.
- `[ ] OK / [ ] FALHA`

12. **[SERVIDOR] Ativar SEMPRE `$STG_PRIVATE/maintenance.flag` antes de alterar banco/arquivos**
```bash
source "$HOME/ajn-ops/env.sh" && date -u +"%Y-%m-%dT%H:%M:%SZ" > "$STG_PRIVATE/maintenance.flag" && chmod 640 "$STG_PRIVATE/maintenance.flag"
```
- Saída esperada: `$STG_PRIVATE/maintenance.flag` criado (na 1ª implantação sem `.htaccess` do pacote, acrescente também a regra mínima `<IfModule mod_rewrite.c> ... RewriteRule ^(?:api|admin)(?:/.*)?$ - [R=503,L] </IfModule>` em `$STG_PUBLIC/.htaccess`).
- `[ ] OK / [ ] FALHA`

13. **[SERVIDOR] Criar `$HOME/.netrc-staging` (`chmod 600`) e checar `503` em `/admin/carreiras/`**
```bash
source "$HOME/ajn-ops/env.sh" && printf 'Senha staging_user para curl: ' && IFS= read -r -s STG_CURL_PASS && echo && install -m 600 /dev/null "$HOME/.netrc-staging" && printf 'machine staging.ajnengenharia.com.br\nlogin staging_user\npassword %s\n' "$STG_CURL_PASS" > "$HOME/.netrc-staging" && unset STG_CURL_PASS && curl -isS --netrc-file "$HOME/.netrc-staging" https://staging.ajnengenharia.com.br/admin/carreiras/ | head -n 10
```
- Saída esperada: cabeçalho HTTP `503`.
- `[ ] OK / [ ] FALHA`

14. **[SERVIDOR] Criar `$HOME/.my-migrator.cnf` (`chmod 600`) com credencial migrator de staging**
```bash
source "$HOME/ajn-ops/env.sh" && printf 'Senha migrator staging: ' && IFS= read -r -s MIG_PASS && echo && install -m 600 /dev/null "$HOME/.my-migrator.cnf" && printf '[client]\nhost=127.0.0.1\nport=3306\nuser=u000000000_stg_mig\npassword=%s\n' "$MIG_PASS" > "$HOME/.my-migrator.cnf" && unset MIG_PASS
```
- Saída esperada: `$HOME/.my-migrator.cnf` gravado com permissão `600`.
- `[ ] OK / [ ] FALHA`

15. **[SERVIDOR] Executar backup cifrado inicial pré-deploy (`LAST_STAMP.staging`)**
```bash
source "$HOME/ajn-ops/env.sh" && mkdir -p "$STG_PUBLIC" && "$HOME/ajn-ops/backup.sh" --env=staging --public-dir="$STG_PUBLIC" --private-dir="$STG_PRIVATE" --db-name=DB_STAGING --my-cnf="$HOME/.my-migrator.cnf"
```
- Saída esperada: `BACKUP VERIFICADO (staging): STAMP=staging-...` (use `--skip-db` somente antes da criação inicial das tabelas).
- `[ ] OK / [ ] FALHA`

16. **[LOCAL — PowerShell] Baixar cópia offsite do backup de staging via `ssh` + `scp`**
```powershell
New-Item -ItemType Directory -Force -Path .\backups-offsite\staging | Out-Null; $stamp = (ssh ajn-hostinger "cat ~/backups/LAST_STAMP.staging").Trim(); if (-not $stamp) { throw "LAST_STAMP.staging vazio" }; scp "ajn-hostinger:~/backups/*-$stamp.*" .\backups-offsite\staging\
```
- Saída esperada: arquivos `.enc` e `meta-*.env` copiados localmente em `.\backups-offsite\staging\`.
- `[ ] OK / [ ] FALHA`

17. **[SERVIDOR] Publicar código privado em `$STG_PRIVATE` (preservando `config.php`, `maintenance.flag` e `resumes/`)**
```bash
source "$HOME/ajn-ops/env.sh" && rsync -av --exclude='config.php' --exclude='maintenance.flag' --exclude='php-errors.log' --exclude='resumes/' "$HOME/deploy-stage/staging/ajn-carreiras-private/" "$STG_PRIVATE/" && cp -f "$HOME/deploy-stage/staging/ajn-carreiras-private/resumes/.htaccess" "$STG_PRIVATE/resumes/.htaccess"
```
- Saída esperada: PHP/migrations privados e `config.example.php` sincronizados em `$STG_PRIVATE`.
- `[ ] OK / [ ] FALHA`

18. **[SERVIDOR — ANTES do `migrate`] Gerar `$STG_PRIVATE/config.php` com `init-config.php` (`chmod 0600`, `random_bytes`, recusa sobrescrita)**
```bash
source "$HOME/ajn-ops/env.sh" && "$PHP_BIN" -d extension=sodium "$HOME/ajn-ops/init-config.php" --target="$STG_PRIVATE/config.php" --example="$STG_PRIVATE/config.example.php" --env=staging
```
- Saída esperada: JSON `"ok":true,"environment":"staging","encryption_key_generated":true,"chmod":"0600"` sem imprimir segredos (se `config.php` já existir de deploy anterior, recusa sobrescrever com `exit 1` para preservar chaves existentes).
- `[ ] OK / [ ] FALHA`

19. **[SERVIDOR] Publicar `public_html` definitivo de staging**
```bash
source "$HOME/ajn-ops/env.sh" && rsync -av --delete "$HOME/deploy-stage/staging/public_html/" "$STG_PUBLIC/"
```
- Saída esperada: `$STG_PUBLIC` sincronizado com `.htaccess` definitivo de staging (`AuthType Basic` + `SetEnv AJN_PRIVATE_DIR`).
- `[ ] OK / [ ] FALHA`

20. **[SERVIDOR] Ciclo A.1 — Dry-run de migrations e checagem `SHOW GRANTS` no `DB_STAGING`**
```bash
source "$HOME/ajn-ops/env.sh" && "$PHP_BIN" -d extension=sodium "$STG_PRIVATE/migrate.php" --defaults-file="$HOME/.my-migrator.cnf" --database=DB_STAGING --dry-run
```
- Saída esperada: `001`..`006` listadas como pendentes e usuário runtime sem `[AVISO]` de privilégios excessivos.
- `[ ] OK / [ ] FALHA`

21. **[SERVIDOR] Ciclo A.1 — Aplicar migrations `001`..`006` e confirmar idempotência**
```bash
source "$HOME/ajn-ops/env.sh" && "$PHP_BIN" -d extension=sodium "$STG_PRIVATE/migrate.php" --defaults-file="$HOME/.my-migrator.cnf" --database=DB_STAGING && "$PHP_BIN" -d extension=sodium "$STG_PRIVATE/migrate.php" --defaults-file="$HOME/.my-migrator.cnf" --database=DB_STAGING --status && "$PHP_BIN" -d extension=sodium "$STG_PRIVATE/migrate.php" --defaults-file="$HOME/.my-migrator.cnf" --database=DB_STAGING
```
- Saída esperada: `aplicadas=6`, `--status` exibindo `APPLIED` para `001`..`006` e segunda passada com `Nenhuma migration pendente`.
- `[ ] OK / [ ] FALHA`

22. **[SERVIDOR] Ciclo A.2 — Testar upgrade `004 -> 006` em `DB_STAGING_UPG` (chave `$cfg["database"]["name"]` protegida contra banco principal)**
```bash
source "$HOME/ajn-ops/env.sh" && mkdir -p "$HOME/deploy-stage/sql-004" && cp "$HOME/deploy-stage/staging/database"/00[1-4]_*.sql "$HOME/deploy-stage/sql-004/" && "$PHP_BIN" -r '$cfg=require $argv[1]; $upg=$argv[3]; $main=(string)($cfg["database"]["name"]??""); if($upg===""||$upg===$main){fwrite(STDERR,"RECUSADO: banco de upgrade deve diferir de database.name principal ({$main}).\n"); exit(1);} unset($cfg["database"]["dsn"]); $cfg["environment"]="staging"; $cfg["database"]["name"]=$upg; file_put_contents($argv[2], "<?php\nreturn ".var_export($cfg,true).";\n"); chmod($argv[2],0600);' "$STG_PRIVATE/config.php" "$HOME/deploy-stage/stg-upg.config.php" "DB_STAGING_UPG" && AJN_CONFIG_PATH="$HOME/deploy-stage/stg-upg.config.php" "$PHP_BIN" -d extension=sodium "$STG_PRIVATE/migrate.php" --defaults-file="$HOME/.my-migrator.cnf" --database=DB_STAGING_UPG --migrations-dir="$HOME/deploy-stage/sql-004" && mysql --defaults-extra-file="$HOME/.my-migrator.cnf" DB_STAGING_UPG -e "DROP TABLE schema_migrations;" && AJN_CONFIG_PATH="$HOME/deploy-stage/stg-upg.config.php" "$PHP_BIN" -d extension=sodium "$HOME/ajn-ops/seed-legacy-fixtures.php" && AJN_CONFIG_PATH="$HOME/deploy-stage/stg-upg.config.php" "$PHP_BIN" -d extension=sodium "$STG_PRIVATE/migrate.php" --defaults-file="$HOME/.my-migrator.cnf" --database=DB_STAGING_UPG --baseline=004 && AJN_CONFIG_PATH="$HOME/deploy-stage/stg-upg.config.php" "$PHP_BIN" -d extension=sodium "$STG_PRIVATE/migrate.php" --defaults-file="$HOME/.my-migrator.cnf" --database=DB_STAGING_UPG && AJN_CONFIG_PATH="$HOME/deploy-stage/stg-upg.config.php" "$PHP_BIN" -d extension=sodium "$STG_PRIVATE/migrate-legacy-data.php" && AJN_CONFIG_PATH="$HOME/deploy-stage/stg-upg.config.php" "$PHP_BIN" -d extension=sodium "$STG_PRIVATE/migrate-legacy-data.php" --dry-run && rm -rf "$HOME/deploy-stage/sql-004" "$HOME/deploy-stage/stg-upg.config.php"
```
- Saída esperada: `[APPLIED] mfa_recifrados=..., telefones_cifrados=..., tracking_migrados=...` e última checagem `--dry-run` sem pendências (alterando explicitamente `$cfg["database"]["name"]`).
- `[ ] OK / [ ] FALHA`

23. **[SERVIDOR] Provisionar superadmin de staging e verificar cadeia de auditoria**
```bash
source "$HOME/ajn-ops/env.sh" && AJN_ADMIN_EMAIL="admin@ajnengenharia.com.br" AJN_ADMIN_NAME="Administrador Staging" "$PHP_BIN" -d extension=sodium "$STG_PRIVATE/seed-admin.php" && "$PHP_BIN" -d extension=sodium "$STG_PRIVATE/verify-audit-chain.php"
```
- Saída esperada: URI/segredo TOTP + códigos de recuperação exibidos e `verify-audit-chain.php` terminando com `exit 0`.
- `[ ] OK / [ ] FALHA`

24. **[SERVIDOR] Remover `maintenance.flag` e `.netrc-staging`**
```bash
source "$HOME/ajn-ops/env.sh" && rm -f "$STG_PRIVATE/maintenance.flag" "$HOME/.netrc-staging"
```
- Saída esperada: `exit 0` (endpoints liberados em staging atrás do Basic Auth).
- `[ ] OK / [ ] FALHA`

25. **[LOCAL — PowerShell] Rodar `audit-live-hardening` em staging (`25/25` com limpeza `$env:`)**
```powershell
$env:LIVE_AUDIT_BASIC_USER="staging_user"; $env:LIVE_AUDIT_BASIC_PASS="SENHA_DO_STAGING"; try { node scripts/audit-live-hardening.mjs --url=https://staging.ajnengenharia.com.br --expect-basic-auth } finally { Remove-Item Env:LIVE_AUDIT_BASIC_USER,Env:LIVE_AUDIT_BASIC_PASS -ErrorAction SilentlyContinue }
```
- Saída esperada: `[live-audit] PASS: 25/25 controles verificados em https://staging.ajnengenharia.com.br.` (salve a saída para colar no Gate).
- `[ ] OK / [ ] FALHA`

26. **[LOCAL — Navegador] Executar roteiro completo de homologação manual em `https://staging.ajnengenharia.com.br`**
- Roteiro obrigatório (7 validações no navegador):
  1. **Login + TOTP:** entrar em `/admin/carreiras/` com Basic Auth + senha admin + código TOTP;
  2. **Step-up:** confirmar reautenticação (`step-up` com senha + TOTP) em ação sensível do painel;
  3. **Criar vaga:** publicar vaga sintética e confirmar aparição em `/carreiras/` e `/carreiras/vaga/`;
  4. **Candidatura com PDF:** submeter candidatura sintética com arquivo `.pdf` válido + Turnstile teste e salvar código de acompanhamento;
  5. **Download do currículo:** no painel admin, baixar o `.pdf` anexado e confirmar abertura íntegra;
  6. **Acompanhamento:** consultar status e testar recuperação em `/carreiras/acompanhamento/` com código + CPF sintético;
  7. **Pedido LGPD:** registrar solicitação sintética LGPD e confirmar protocolo listado no painel admin.
- Saída esperada: todos os 7 fluxos operando sem erros HTTP 4xx/5xx inesperados ou erros no console.
- `[ ] OK / [ ] FALHA`

27. **[SERVIDOR -> hPanel] Imprimir comandos exatos e cadastrar os 3 crons de staging no hPanel**
```bash
source "$HOME/ajn-ops/env.sh" && printf '*/2 * * * * %s/ajn-ops/run-cron.sh --log-dir=%s/ajn-logs/staging --name=alerts -- %s -d extension=sodium %s/send-security-alerts.php\n30 3 * * * %s/ajn-ops/run-cron.sh --log-dir=%s/ajn-logs/staging --name=purge -- %s -d extension=sodium %s/purge-expired-data.php\n0 4 * * * %s/ajn-ops/run-cron.sh --log-dir=%s/ajn-logs/staging --name=audit-chain -- %s -d extension=sodium %s/verify-audit-chain.php\n' "$HOME" "$HOME" "$PHP_BIN" "$STG_PRIVATE" "$HOME" "$HOME" "$PHP_BIN" "$STG_PRIVATE" "$HOME" "$HOME" "$PHP_BIN" "$STG_PRIVATE"
```
- Saída esperada: 3 linhas exatas (`alerts`, `purge`, `audit-chain`) impressas e cadastradas em **hPanel -> Avançado -> Cron Jobs**.
- `[ ] OK / [ ] FALHA`

28. **[SERVIDOR] Disparar e confirmar e-mail de alerta de teste (`DEPLOY_TEST_ALERT`)**
```bash
source "$HOME/ajn-ops/env.sh" && "$PHP_BIN" -d extension=sodium "$STG_PRIVATE/send-security-alerts.php" --test-alert
```
- Saída esperada: `exit 0` e recebimento do e-mail `[ALERTA DE SEGURANCA AJN] DEPLOY_TEST_ALERT` em `faleconosco@ajnengenharia.com.br`.
- `[ ] OK / [ ] FALHA`

29. **[SERVIDOR] Aguardar disparo do cron `alerts` (`*/2`) e conferir logs reais em `~/ajn-logs/staging`**
```bash
source "$HOME/ajn-ops/env.sh" && sleep 125 && ls -lh "$HOME/ajn-logs/staging" && tail -n 30 "$HOME/ajn-logs/staging/"cron-*.log
```
- Saída esperada: arquivo `cron-alerts.log` presente em `$HOME/ajn-logs/staging` com registro recente de execução `exit=0`.
- `[ ] OK / [ ] FALHA`

30. **[SERVIDOR — Ensaio de Rollback 1/6] Backup completo do staging homologado**
```bash
source "$HOME/ajn-ops/env.sh" && "$HOME/ajn-ops/backup.sh" --env=staging --public-dir="$STG_PUBLIC" --private-dir="$STG_PRIVATE" --db-name=DB_STAGING --my-cnf="$HOME/.my-migrator.cnf"
```
- Saída esperada: `BACKUP VERIFICADO (staging): STAMP=staging-...`.
- `[ ] OK / [ ] FALHA`

31. **[SERVIDOR — Ensaio de Rollback 2/6] Alterar arquivo (`robots.txt`) e banco (`rollback_drill_marker` + linha falsa em `schema_migrations`)**
```bash
source "$HOME/ajn-ops/env.sh" && printf '<!-- rollback-drill-%s -->\n' "$(cat "$HOME/backups/LAST_STAMP.staging")" >> "$STG_PUBLIC/robots.txt" && mysql --defaults-extra-file="$HOME/.my-migrator.cnf" DB_STAGING -e "CREATE TABLE rollback_drill_marker (id INT PRIMARY KEY, stamp VARCHAR(64) NOT NULL); INSERT INTO rollback_drill_marker (id, stamp) VALUES (1, 'drill'); INSERT INTO schema_migrations (name, checksum, applied_at) VALUES ('999_rollback_drill.sql', REPEAT('0', 64), UNIX_TIMESTAMP());"
```
- Saída esperada: `exit 0` com marcador gravado em `robots.txt`, tabela `rollback_drill_marker` criada e linha `999_rollback_drill.sql` inserida em `schema_migrations`.
- `[ ] OK / [ ] FALHA`

32. **[SERVIDOR — Ensaio de Rollback 3/6] Executar `rollback.sh staging`**
```bash
source "$HOME/ajn-ops/env.sh" && "$HOME/ajn-ops/rollback.sh" staging --public-dir="$STG_PUBLIC" --private-dir="$STG_PRIVATE" --backups-dir="$HOME/backups" --db-name=DB_STAGING --my-cnf="$HOME/.my-migrator.cnf"
```
- Saída esperada: `ROLLBACK CONCLUIDO (staging): STAMP=staging-...`.
- `[ ] OK / [ ] FALHA`

33. **[SERVIDOR — Ensaio de Rollback 4/6] Verificar reversão completa no banco (`rollback_drill_marker`, `schema_migrations`) e em `robots.txt` + auditoria**
```bash
source "$HOME/ajn-ops/env.sh" && DRILL_TBL="$(mysql --defaults-extra-file="$HOME/.my-migrator.cnf" -N -B DB_STAGING -e "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'rollback_drill_marker';")" && FAKE_MIG="$(mysql --defaults-extra-file="$HOME/.my-migrator.cnf" -N -B DB_STAGING -e "SELECT COUNT(*) FROM schema_migrations WHERE name = '999_rollback_drill.sql';")" && TOTAL_MIG="$(mysql --defaults-extra-file="$HOME/.my-migrator.cnf" -N -B DB_STAGING -e "SELECT COUNT(*) FROM schema_migrations;")" && test "$DRILL_TBL" -eq 0 && test "$FAKE_MIG" -eq 0 && test "$TOTAL_MIG" -eq 6 && ! grep -q 'rollback-drill-' "$STG_PUBLIC/robots.txt" && "$PHP_BIN" -d extension=sodium "$STG_PRIVATE/verify-audit-chain.php" && echo "ROLLBACK VERIFICADO: rollback_drill_marker=0 fake_migration=0 total_migrations=$TOTAL_MIG robots_clean=true"
```
- Saída esperada: `ROLLBACK VERIFICADO: rollback_drill_marker=0 fake_migration=0 total_migrations=6 robots_clean=true`.
- `[ ] OK / [ ] FALHA`

34. **[LOCAL — PowerShell — Ensaio de Rollback 5/6] Executar auditoria live pós-rollback (`25/25`)**
```powershell
$env:LIVE_AUDIT_BASIC_USER="staging_user"; $env:LIVE_AUDIT_BASIC_PASS="SENHA_DO_STAGING"; try { node scripts/audit-live-hardening.mjs --url=https://staging.ajnengenharia.com.br --expect-basic-auth } finally { Remove-Item Env:LIVE_AUDIT_BASIC_USER,Env:LIVE_AUDIT_BASIC_PASS -ErrorAction SilentlyContinue }
```
- Saída esperada: `[live-audit] PASS: 25/25 controles verificados em https://staging.ajnengenharia.com.br.`
- `[ ] OK / [ ] FALHA`

35. **[SERVIDOR — Ensaio de Rollback 6/6] Re-deployar staging limpo, confirmar migrations e remover `.my-migrator.cnf`**
```bash
source "$HOME/ajn-ops/env.sh" && rsync -av --delete "$HOME/deploy-stage/staging/public_html/" "$STG_PUBLIC/" && "$PHP_BIN" -d extension=sodium "$STG_PRIVATE/migrate.php" --defaults-file="$HOME/.my-migrator.cnf" --database=DB_STAGING && "$PHP_BIN" -d extension=sodium "$STG_PRIVATE/verify-audit-chain.php" && rm -f "$HOME/.my-migrator.cnf"
```
- Saída esperada: `Nenhuma migration pendente`, auditoria verde e `.my-migrator.cnf` removido; rode o passo 34 uma última vez e cole os registros no **GATE DE PASSAGEM** de [`DEPLOY.md`](DEPLOY.md).
- `[ ] OK / [ ] FALHA`
