# Runbook de Deploy e Operação Segura — AJN Carreiras (Hostinger)

Este documento define a ordem exata de publicação do módulo **AJN Carreiras** (`public_html/` + `ajn-carreiras-private/`) na hospedagem compartilhada Hostinger e o procedimento de **ROLLBACK** de cada etapa.

> **Regra de ouro:** NUNCA passe senhas de banco de dados ou de administradores na linha de comando (`-pSENHA` ou variáveis inline). Utilize `~/.my.cnf` com `chmod 600` para o MySQL/MariaDB e prompt oculto (`STDIN`) para `seed-admin.php`.

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
- Caso o dump falhe ou gere arquivo vazio, **aborte o deploy imediatamente** antes de qualquer alteração em produção e remova arquivos parciais em `~/backups/`.

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
3. Crie `~/ajn-carreiras-private/config.php` (a partir de `config.example.php`, com `chmod 600`):
   - `environment => 'production'`
   - `app_url => 'https://ajnengenharia.com.br'`
   - `database.username => 'u000_ajn_app_rw'` (usuário de menor privilégio: apenas `SELECT, INSERT, UPDATE, DELETE`)
   - `encryption_key => '<64 hex chars>'`
   - `previous_encryption_keys => ['<chave_anterior_se_houver_rotacao>']`
   - `security_alert_email => 'seguranca@ajnengenharia.com.br'`

### Rollback da Etapa 2
```bash
openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 -pass file:$HOME/.backup_pass \
  -in ~/backups/private-pre-deploy-${STAMP}.tar.gz.enc \
  | tar -xzf - -C ~
```

---

## Etapa 3 — Migration `005_security_hardening.sql`

### Execução
1. Aplique a migration `005_security_hardening.sql` usando `~/.my.cnf` (sem senha na linha de comando):
   ```bash
   mysql --defaults-file=~/.my.cnf u000_ajn_carreiras < ~/deploy-stage/database/005_security_hardening.sql
   ```
2. Verifique as colunas e tabelas criadas:
   ```bash
   mysql --defaults-file=~/.my.cnf u000_ajn_carreiras -e "SHOW COLUMNS FROM admin_users LIKE 'known_ips_json'; SHOW TABLES LIKE 'admin_recovery_codes';"
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
1. Como `ajn_decrypt` mantém leitura retrocompatível com AES-256-GCM e `previous_encryption_keys`, em caso de falha na transação o próprio script executa `ROLLBACK`.
2. Caso seja necessário reverter após o commit, restaure o dump da Etapa 1:
   ```bash
   openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 -pass file:$HOME/.backup_pass \
     -in ~/backups/db-pre-deploy-${STAMP}.sql.gz.enc \
     | gunzip \
     | mysql --defaults-file=~/.my.cnf u000_ajn_carreiras
   ```

---

## Etapa 5 — Provisionamento de MFA (`seed-admin.php` e `provision-user-mfa.php`)

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

### Rollback da Etapa 5
- Caso o provisionamento de um operador precise ser desfeito ou refeito, reexecute `AJN_ADMIN_EMAIL="..." php provision-user-mfa.php` (gera novo segredo e invalida códigos anteriores) ou desative a conta no banco:
  ```bash
  mysql --defaults-file=~/.my.cnf u000_ajn_carreiras -e "UPDATE admin_users SET is_active=0 WHERE email='operador@ajnengenharia.com.br';"
  ```

---

## Etapa 6 — Upload de `public_html/` e `ajn-carreiras-private/`

### Execução
1. Sincronize `ajn-carreiras-private/` (sem sobrescrever `config.php` nem `resumes/`) e garanta `ajn-carreiras-private/resumes/.htaccess`.
2. Publique o conteúdo de `public_html/` (incluindo `.htaccess`, `.well-known/security.txt` e `api/index.php`).
3. Confirme que nenhum arquivo privado (`config.php`, `seed-admin.php`, `provision-user-mfa.php`, `migrate-legacy-data.php`, `tests/`, `migrations/`) existe dentro de `public_html/`.

### Rollback da Etapa 6
Restaure imediatamente o `public_html` e `ajn-carreiras-private` anteriores:
```bash
rm -rf ~/public_html/*
openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 -pass file:$HOME/.backup_pass \
  -in ~/backups/public_html-pre-deploy-${STAMP}.tar.gz.enc \
  | tar -xzf - -C ~
```

---

## Etapa 7 — Testes Pós-Deploy

### Execução
Execute a bateria de validação HTTP e CLI:
```bash
# 1. Healthcheck da API (esperado: HTTP 200 {"status":"ok"})
curl -fsS -i https://ajnengenharia.com.br/api/health

# 2. Bloqueio de dotfiles, SQL, Markdown e PHP fora de api/index.php (esperado: 403/404)
curl -s -o /dev/null -w "%{http_code}\n" https://ajnengenharia.com.br/.env
curl -s -o /dev/null -w "%{http_code}\n" https://ajnengenharia.com.br/.git/config
curl -s -o /dev/null -w "%{http_code}\n" https://ajnengenharia.com.br/005_security_hardening.sql
curl -s -o /dev/null -w "%{http_code}\n" https://ajnengenharia.com.br/README.md

# 3. Integridade da cadeia de auditoria
php ~/ajn-carreiras-private/verify-audit-chain.php
```

### Rollback da Etapa 7
Se qualquer verificação pós-deploy falhar (ex.: `500` por diretiva `.htaccess`, falha em `/api/health` ou falha de integridade da cadeia), execute os rollbacks das Etapas 6, 4 e 3 na ordem inversa.

---

## Etapa 8 — Crons de Retenção LGPD e Verificação de Auditoria

### Execução
1. Valide o expurgo em modo simulação (`--dry-run`) antes de habilitar o agendamento:
   ```bash
   php ~/ajn-carreiras-private/purge-expired-data.php --dry-run
   ```
2. Configure no hPanel (Cron Jobs):
   - **Diário (03:15 UTC) — Expurgo LGPD de dados e sessões expiradas:**
     ```bash
     /usr/bin/php /home/u000/ajn-carreiras-private/purge-expired-data.php >> /home/u000/ajn-carreiras-private/purge.log 2>&1
     ```
   - **Diário (03:45 UTC) — Verificação da cadeia de hash de auditoria:**
     ```bash
     /usr/bin/php /home/u000/ajn-carreiras-private/verify-audit-chain.php >> /home/u000/ajn-carreiras-private/audit-verify.log 2>&1
     ```

### Rollback da Etapa 8
- Desabilite ou remova a linha do Cron no hPanel e, se necessário restaurar registros expurgados indevidamente, restaure a partir do último backup diário cifrado em `~/backups/`.
