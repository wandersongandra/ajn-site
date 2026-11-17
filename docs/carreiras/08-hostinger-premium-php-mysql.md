# AJN Carreiras — instalação na Hostinger Premium (PHP + MySQL/MariaDB)

> **Status:** implementação em branch para revisão. Sem deploy, sem migração aplicada, sem homologação HTTP/SQL real. Nunca interpretar os testes de D1/Worker da PR #107 como testes deste backend PHP.

## Decisão e limites

- O site institucional continua Astro estático na **Hostinger Premium**.
- APIs, autenticação e páginas dinâmicas de vagas são processadas por **PHP 8.2+** na **mesma hospedagem e origem HTTP**. O banco é **MySQL/MariaDB** exclusivo, gerenciado no hPanel/phpMyAdmin.
- Currículos ficam em diretório **fora de `public_html`**, com download autenticado via PHP. E-mails SMTP e o desafio Turnstile são **serviços auxiliares externos**, não hospedagem do backend.
- Não criar Workers, D1, R2, KV, Durable Objects, VPS, CNAME ou zona Cloudflare. **Não alterar DNS nem registros de e-mail.**
- O novo backend não importa dados automaticamente do antigo D1. Não alegar migração sem extração, validação e autorização próprias.

## Layout esperado no servidor

```
dominio-da-ajn/
  public_html/
    .htaccess
    api/index.php          # incluído no build Astro
    carreiras/             # páginas estáticas Astro
    styles/, scripts/, ... # site existente
  ajn-carreiras-private/
    bootstrap.php
    app.php
    admin.php
    applications.php
    config.php             # criado a partir do exemplo; não versionado
    resumes/              # diretório privado de anexos
```

O `public/api/index.php` resolve `ajn-carreiras-private/bootstrap.php` como **irmão** de `public_html`. Verificar a estrutura real do domínio no hPanel antes de copiar; alternativamente, usar `AJN_CAREERS_BOOTSTRAP` apontando para o caminho absoluto privado.

## Checklist de homologação isolada

1. Confirmar no hPanel do domínio quais versões PHP, extensões `pdo_mysql`, `openssl`, `mbstring`, `fileinfo`, `curl`, regras `.htaccess`, `mod_rewrite`, limites de upload e SSH/CLI estão realmente habilitados. Não assumir suporte só pela página comercial do plano.
2. Criar backup recuperável **do site e banco atuais**; confirmar método e teste de restauração, sem mexer no WordPress legado.
3. Criar subdomínio/site **de teste** na mesma conta Premium com **MySQL/MariaDB próprio**. Não sobrescrever `public_html` de produção para experimentar.
4. Em banco **vazio e dedicado**, importar `hostinger/migrations/001_initial.sql` via phpMyAdmin. Inspecionar tabelas, chaves estrangeiras e charset. O SQL **não modifica** o banco WordPress.
5. Publicar `dist/` do Astro no diretório web desse site isolado, preservando `.htaccess`. Publicar os arquivos PHP de `hostinger/` **fora da pasta pública**, sem incluir `config.example.php`, migrações nem scripts CLI dentro de `public_html`.
6. Criar diretório privado de currículos (`0700` preferencial, conforme grupo/permissões do PHP) e `config.php` fora da raiz web. Configurar `app_url` com a URL **HTTPS do staging**, credenciais PDO, `resume_directory`, chave AES-256-GCM hex de 64 dígitos, segredo Turnstile e SMTP somente por canal seguro. A chave pública Turnstile precisa ser injetada em `PUBLIC_TURNSTILE_SITE_KEY` **no build específico do staging**, com hostname correspondente.
7. Iniciar o superadmin **por SSH/CLI**, com env vars `AJN_ADMIN_EMAIL`, `AJN_ADMIN_NAME`, `AJN_ADMIN_INITIAL_PASSWORD`, executando `php hostinger/seed-admin.php` no diretório privado. O URI TOTP é emitido apenas uma vez; entregar e guardar em canal seguro. Não gravar senha/URI em logs ou screenshots.
8. Criar recrutadores no painel: são **inativos** até receber TOTP. Por SSH/CLI, definir `AJN_ADMIN_EMAIL` e executar `php hostinger/provision-user-mfa.php`; entregar URI TOTP diretamente ao operador. Não reativar sem MFA.
9. Executar **testes reais**: health, criação/publicação/encerramento de vaga, 200/404 com HTML sem JS, login MFA, refresh, logout/401, bloqueio de conta, pipeline, upload de PDF sintético, download autorizado, arquivo inacessível por URL direta, consentimentos, rate limiting, CSP e robots. Usar mailbox de teste e verificar cabeçalhos. Fazer os negativos (PDF falso, Turnstile ausente/inválido, CPF inválido, origem cruzada, login errado, storage sem permissão).
10. Revisar uso real e gestão de LGPD antes da produção. Os fluxos de recuperação de senha, recuperação de protocolo, verificação de titularidade e solicitações LGPD agora possuem implementação local, mas continuam **não homologados** até serem exercitados com SMTP, banco MySQL/MariaDB, storage privado e navegador no staging.

## Pontos de interrupção (fail closed)

| Falta | Resultado esperado |
| --- | --- |
| `config.php`, PDO ou banco inexistente | API 503; nunca simular sucesso |
| Chave Turnstile ausente, cURL indisponível ou provedor indisponível | Candidatura bloqueada com 503 |
| Token Turnstile inválido, expirado ou hostname diferente | Candidatura bloqueada com 400 |
| Arquivos privados configurados em `public_html` | Upload e download bloqueados |
| Operador novo sem TOTP provisionado | Conta administrativa permanece inativa |
| E-mail/verificação e LGPD ainda não homologados | Homologação permanece bloqueada; falhas de configuração devolvem 503 explícito |

## Rollback

- Para homologação, destruir apenas o **site/subdomínio e banco de teste dedicados**, após inventariar os recursos; nenhum dado de produção deve ter sido alterado.
- Em produção futura, preservar uma cópia verificada do `public_html` anterior, versão PHP, `.htaccess` e backup consistente do banco de carreiras. Planejar reversão e janela de manutenção **antes** de qualquer deploy.
- Não remover nem reconfigurar DNS, MX, SPF, DKIM ou DMARC.

## Evidências exigidas antes do aceite

- URL de staging, HTTP status/headers/corpo, versão de PHP/MariaDB, resultado de criação de tabelas, hashes ou prints sem segredos.
- Testes e logs de backend **PHP em execução**, não apenas Vitest do Worker, AST lint ou dry-run de empacotamento.
- Evidência de persistência e exclusão dos anexos em falha, validação Turnstile, MFA e recuperação de acesso.
- Resultado separado por `PASS real`, `PASS local`, `BLOCKED`; sem usar `PASS` para funcionalidades não executadas em servidor real.

Smoke local sem banco: `php hostinger/tests/smoke.php`. Verificar sintaxe de cada arquivo PHP com `php -l arquivo.php` (PHP 8.2+).
