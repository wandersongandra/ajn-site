# Runbook de Deploy e Operação Segura — AJN Carreiras (Hostinger)

Este documento define a ordem exata de publicação do módulo **AJN Carreiras** (`public_html/` + `ajn-carreiras-private/`) na hospedagem compartilhada Hostinger e o procedimento de **ROLLBACK** de cada etapa.

> **Regra de ouro:** NUNCA passe senhas de banco de dados ou de administradores na linha de comando (`-pSENHA` ou variáveis inline). Utilize `~/.my.cnf` com `chmod 600` para o MySQL/MariaDB e prompt oculto (`STDIN`) para `seed-admin.php`. Nunca grave segredos no repositório git, em `dist/` nem em `.env.production`.

---

## Onde entram as chaves do Turnstile (Construção vs Servidor Privado)

1. **`PUBLIC_TURNSTILE_SITE_KEY` (Chave pública — variável de ambiente no BUILD Astro):**
   - Entra **exclusivamente no momento do build** (`npm run build`), antes do `npm run pack:hostinger`:
     ```bash
     PUBLIC_SITE_ORIGIN="https://ajnengenharia.com.br" \
     PUBLIC_ALLOW_INDEXING="true" \
     PUBLIC_TURNSTILE_SITE_KEY="<COLE_A_SITEKEY_DE_PRODUCAO_AQUI>" \
     npm run build
     npm run pack:hostinger
     ```
   - Para **staging/homologação**, use `PUBLIC_ALLOW_INDEXING="false"` (ou chave de staging distinta); se `PUBLIC_TURNSTILE_SITE_KEY` for omitida com `PUBLIC_ALLOW_INDEXING=false`, o build usa a chave oficial de teste da Cloudflare (`1x00000000000000000000AA`). Em **produção** (`PUBLIC_ALLOW_INDEXING=true`), `src/data/carreiras.ts` e `scripts/prepare-hostinger-deploy.mjs` **falham fechados** se a sitekey estiver vazia ou for chave de teste (`1x`/`2x`/`3x`).
2. **`turnstile_secret_key` (Chave secreta — `~/ajn-carreiras-private/config.php` no servidor):**
   - Entra **exclusivamente no arquivo privado do servidor** `~/ajn-carreiras-private/config.php` (fora de `public_html/`, permissão `0600`), preenchida manualmente no host antes de abrir o tráfego:
     ```php
     'environment' => 'production', // em homologação use 'staging'
     'turnstile_secret_key' => '<COLE_A_SECRET_KEY_DE_PRODUCAO_AQUI>',
     ```
   - Em `environment => 'production'`, se `turnstile_secret_key` estiver vazia ou for chave de teste Cloudflare (`1x`/`2x`/`3x`), os formulários públicos respondem **HTTP 503** (fail-closed) e tokens dummy (`XXXX.DUMMY.TOKEN.XXXX`) recebem **HTTP 400**.

---

## Etapa 1 — Backup Cifrado Pré-Deploy (Banco + Currículos + Código Atual)

### Execução
1. Configure as credenciais do banco em `~/.my.cnf` com permissão restrita ao usuário SSH:
   ```bash
   cat > ~/.my.cnf <<'EOF'
   [client]
   host=127.0.0.1
   port=3306
   user=u000_ajn_migrator
   password=PREENCHER_SENHA_MIGRATOR_NO_ARQUIVO
   EOF
   chmod 600 ~/.my.cnf
   ```
2. Gere a chave de backup em arquivo protegido (`chmod 600 ~/.backup_pass`) e execute o dump cifrado (AES-256-CBC + PBKDF2 600.000 iterações) fora de `public_html`:
   ```bash
   mkdir -p ~/backups
   chmod 700 ~/backups
   STAMP=$(date +%Y%m%d-%H%M%S)

   mysqldump --defaults-file=~/.my.cnf --single-transaction --routines --triggers u000_ajn_carreiras \
     | gzip -9 \
     | openssl enc -aes-256-cbc -pbkdf2 -iter 600000 -salt -pass file:$HOME/.backup_pass \
       -out ~/backups/db-pre-deploy-${STAMP}.sql.gz.enc

   if [ -d ~/ajn-carreiras-private ]; then
     tar -czf - -C ~ ajn-carreiras-private \
       | openssl enc -aes-256-cbc -pbkdf2 -iter 600000 -salt -pass file:$HOME/.backup_pass \
         -out ~/backups/private-pre-deploy-${STAMP}.tar.gz.enc
   fi

   tar -czf - -C ~ public_html \
     | openssl enc -aes-256-cbc -pbkdf2 -iter 600000 -salt -pass file:$HOME/.backup_pass \
       -out ~/backups/public_html-pre-deploy-${STAMP}.tar.gz.enc
   ```

### Rollback da Etapa 1
- Caso o dump falhe ou gere arquivo vazio, **aborte o deploy imediatamente** antes de qualquer alteração e remova arquivos parciais em `~/backups/`.

---

## Etapa 2 — `config.php` e Chaves Criptográficas (`ajn-carreiras-private/`)

### Execução
1. Crie a estrutura privada fora de `public_html`:
   ```bash
   mkdir -p ~/ajn-carreiras-private/resumes
   chmod 700 ~/ajn-carreiras-private ~/ajn-carreiras-private/resumes
   ```
2. Gere a chave de 256 bits (libsodium secretbox / HMAC):
   ```bash
   php -r 'echo bin2hex(random_bytes(32)), PHP_EOL;'
   ```
3. Crie `~/ajn-carreiras-private/config.php` a partir de `config.example.php` (`chmod 600 ~/ajn-carreiras-private/config.php`):
   - `environment => 'staging'` na homologação e `'production'` em produção;
   - `app_url => 'https://staging.ajnengenharia.com.br'` (homologação) ou `'https://ajnengenharia.com.br'` (produção);
   - `database.username => 'u000_ajn_app_rw'` (usuário de menor privilégio: apenas `SELECT, INSERT, UPDATE, DELETE`);
   - `encryption_key => '<64 hex chars>'`;
   - `previous_encryption_keys => ['<chave_anterior_se_houver_rotacao>']`;
   - `turnstile_secret_key => '<secret real do par Turnstile>'`;
   - `security_alert_email => 'seguranca@ajnengenharia.com.br'`.

### Rollback da Etapa 2
```bash
openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 -pass file:$HOME/.backup_pass \
  -in ~/backups/private-pre-deploy-${STAMP}.tar.gz.enc \
  | tar -xzf - -C ~
```

---

## Etapa 3 — Migrations `005_security_hardening.sql` e `006_security_alerts_and_ip_locks.sql`

### Execução
1. Aplique as migrations em ordem numérica (`001` a `006` em banco novo; `005` e `006` em upgrade):
   ```bash
   mysql --defaults-file=~/.my.cnf u000_ajn_carreiras < ~/deploy-stage/database/005_security_hardening.sql
   mysql --defaults-file=~/.my.cnf u000_ajn_carreiras < ~/deploy-stage/database/006_security_alerts_and_ip_locks.sql
   ```
2. Verifique as colunas e tabelas criadas:
   ```bash
   mysql --defaults-file=~/.my.cnf u000_ajn_carreiras -e "SHOW COLUMNS FROM admin_users LIKE 'known_ips_json'; SHOW TABLES LIKE 'admin_recovery_codes'; SHOW TABLES LIKE 'admin_login_locks'; SHOW TABLES LIKE 'security_alert_queue';"
   ```

### Rollback da Etapa 3
Restaure o snapshot do banco pré-migration:
```bash
openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 -pass file:$HOME/.backup_pass \
  -in ~/backups/db-pre-deploy-${STAMP}.sql.gz.enc \
  | gunzip \
  | mysql --defaults-file=~/.my.cnf u000_ajn_carreiras
```

---

## Etapa 4 — Migração de Dados Legados (`migrate-legacy-data.php --dry-run` e Real)

### Execução
1. Copie os scripts privados da versão nova para `~/ajn-carreiras-private/` (preservando `config.php` e `resumes/`).
2. Execute primeiro em modo simulação (`--dry-run`):
   ```bash
   cd ~/ajn-carreiras-private
   php migrate-legacy-data.php --dry-run
   ```
3. Confira a saída (`mfa_recifrados`, `telefones_cifrados`, `tracking_migrados`, `admins_sem_mfa`) e execute a migração real:
   ```bash
   php migrate-legacy-data.php
   ```
4. Execute novamente `php migrate-legacy-data.php --dry-run` e confirme que todos os contadores de pendências de recifragem estão em `0` (idempotência).

### Rollback da Etapa 4
1. Em caso de falha dentro da transação, o próprio script executa `ROLLBACK`. `ajn_decrypt` mantém leitura retrocompatível com AES-256-GCM e `previous_encryption_keys`.
2. Para reverter após commit, restaure o dump da Etapa 1 com o comando da Etapa 3.

---

## Etapa 5 — Provisionamento de MFA e Desbloqueio CLI

### Execução
1. Para criar o primeiro `super_admin` (senha lida via prompt oculto `STDIN`, nunca na linha de comando):
   ```bash
   cd ~/ajn-carreiras-private
   AJN_ADMIN_EMAIL="admin@ajnengenharia.com.br" \
   AJN_ADMIN_NAME="Administrador AJN" \
   php seed-admin.php
   ```
2. Para cada conta listada como `ADMIN_WITHOUT_MFA` na Etapa 4, provisione o TOTP e os 8 códigos de recuperação de uso único via CLI:
   ```bash
   AJN_ADMIN_EMAIL="operador@ajnengenharia.com.br" php provision-user-mfa.php
   ```
3. Em caso de bloqueio legítimo de IP por excesso de falhas, o operador pode redefinir a senha pelo fluxo autenticado de recuperação (limpa `failed_attempts` e todos os registros em `admin_login_locks`) ou o administrador pode executar via SSH:
   ```bash
   php ~/ajn-carreiras-private/unlock-admin.php --email="operador@ajnengenharia.com.br" --reason="Chamado interno verificado"
   ```

### Rollback da Etapa 5
- Caso o provisionamento precise ser refeito, reexecute `AJN_ADMIN_EMAIL="..." AJN_MFA_ROTATE=1 php provision-user-mfa.php` ou desative a conta no banco:
  ```bash
  mysql --defaults-file=~/.my.cnf u000_ajn_carreiras -e "UPDATE admin_users SET is_active=0 WHERE email='operador@ajnengenharia.com.br';"
  ```

---

## Etapa 6 — Homologação Obrigatória em Subdomínio Staging (com MySQL Real) ANTES de Produção

1. Gere o build e o pacote de **staging** (sem indexação) apontando para o subdomínio de homologação com banco MySQL real dedicado (com migrations `001` a `006` aplicadas):
   ```bash
   PUBLIC_SITE_ORIGIN="https://staging.ajnengenharia.com.br" \
   PUBLIC_ALLOW_INDEXING="false" \
   PUBLIC_TURNSTILE_SITE_KEY="1x00000000000000000000AA" \
   npm run build
   ```
2. Faça o upload em staging (`public_html/` + `ajn-carreiras-private/`) e configure no `config.php` de staging `'environment' => 'staging'`.
3. Execute **obrigatoriamente** a auditoria live contra o subdomínio de staging (bloqueia publicação em produção se qualquer item falhar):
   ```bash
   node scripts/audit-live-hardening.mjs --url=https://staging.ajnengenharia.com.br
   ```
4. Confirme também em staging: login MFA + step-up, candidatura com PDF + Turnstile, worker de fila de alertas (`php ~/ajn-carreiras-private/send-security-alerts.php --dry-run`), download privado de currículo e exclusão LGPD.

---

## Etapa 7 — Upload de Produção (`public_html/` e `ajn-carreiras-private/`)

### Execução
1. Gere o pacote de produção (falha automaticamente se `Indexação: false` ou se `PUBLIC_TURNSTILE_SITE_KEY` estiver vazia/de teste):
   ```bash
   PUBLIC_SITE_ORIGIN="https://ajnengenharia.com.br" \
   PUBLIC_ALLOW_INDEXING="true" \
   PUBLIC_TURNSTILE_SITE_KEY="<COLE_A_SITEKEY_DE_PRODUCAO_AQUI>" \
   npm run build
   npm run pack:hostinger
   ```
2. Sincronize `ajn-carreiras-private/` (sem sobrescrever `config.php` nem `resumes/`) e garanta `ajn-carreiras-private/resumes/.htaccess`.
3. Publique o conteúdo de `output/hostinger-deploy/public_html/` (incluindo `.htaccess`, `.well-known/security.txt` e `api/index.php`).
4. Confirme que nenhum arquivo privado (`config.php`, `seed-admin.php`, `provision-user-mfa.php`, `migrate-legacy-data.php`, `unlock-admin.php`, `send-security-alerts.php`, `tests/`, `migrations/`) existe dentro de `public_html/`.

### Rollback da Etapa 7
Restaure imediatamente o `public_html` e `ajn-carreiras-private` anteriores:
```bash
rm -rf ~/public_html/*
openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 -pass file:$HOME/.backup_pass \
  -in ~/backups/public_html-pre-deploy-${STAMP}.tar.gz.enc \
  | tar -xzf - -C ~
```

---

## Etapa 8 — Testes Pós-Deploy em Produção

### Execução
```bash
# 1. Auditoria HTTP completa contra produção (health, bloqueio .php/.env/.git/.sql/.md, headers, 401 genérico, 403 CSRF, redirects 301 legados)
node scripts/audit-live-hardening.mjs --url=https://ajnengenharia.com.br

# 2. Integridade da cadeia de auditoria e fila de alertas
php ~/ajn-carreiras-private/verify-audit-chain.php
php ~/ajn-carreiras-private/send-security-alerts.php --dry-run
```

### Rollback da Etapa 8
Se qualquer verificação pós-deploy falhar (ex.: `500` por diretiva `.htaccess`, falha em `/api/health`, falha de CSP ou quebra de redirect 301), execute os rollbacks das Etapas 7, 4 e 3 na ordem inversa.

---

## Etapa 9 — Crons (Alertas Assíncronos, Retenção LGPD e Cadeia de Auditoria)

### Execução
1. Valide o expurgo e o dispatcher em modo simulação (`--dry-run`) antes de habilitar o agendamento:
   ```bash
   php ~/ajn-carreiras-private/purge-expired-data.php --dry-run
   php ~/ajn-carreiras-private/send-security-alerts.php --dry-run
   ```
2. Configure no hPanel (Cron Jobs):
   - **A cada 5 minutos (`*/5 * * * *`) — Envio assíncrono da fila de alertas de segurança (fora do caminho crítico de login/admin):**
     ```bash
     /usr/bin/php /home/u000/ajn-carreiras-private/send-security-alerts.php >> /home/u000/ajn-carreiras-private/alerts-cron.log 2>&1
     ```
   - **Diário (`15 3 * * *` UTC) — Expurgo LGPD de dados e sessões expiradas:**
     ```bash
     /usr/bin/php /home/u000/ajn-carreiras-private/purge-expired-data.php >> /home/u000/ajn-carreiras-private/purge.log 2>&1
     ```
   - **Diário (`45 3 * * *` UTC) — Verificação da cadeia de hash de auditoria:**
     ```bash
     /usr/bin/php /home/u000/ajn-carreiras-private/verify-audit-chain.php >> /home/u000/ajn-carreiras-private/audit-verify.log 2>&1
     ```

### Rollback da Etapa 9
- Desabilite ou remova a linha do Cron no hPanel; alertas pendentes permanecem gravados em `security_alert_queue` até nova execução. Para restaurar registros expurgados indevidamente, utilize o último backup diário cifrado em `~/backups/`.
