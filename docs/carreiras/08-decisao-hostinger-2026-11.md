# AJN Carreiras — decisão de arquitetura para Hostinger

**Data da investigação:** 2026-11-09
**Branch:** `feat/ajn-carreiras`
**Commit auditado:** `b35c1f5f787a9533e8961a533e561b28fa1ccd74`
**Estado:** `BLOCKED — HOMOLOGAÇÃO HOSTINGER AUSENTE`

## Resumo executivo

O requisito arquitetural foi definido como PHP 8.2+, MySQL/MariaDB e
armazenamento privado local na Hostinger Premium. O nível do plano foi
informado pelo responsável, mas não existe conexão hPanel nesta execução para
confirmar os limites e recursos efetivamente habilitados na conta.

O pacote PHP/MySQL foi recebido, inspecionado e importado no checkout. A
implementação nativa foi validada por lint, testes de contrato e smoke local,
mas ainda não existe evidência do runtime PHP, MySQL/MariaDB, SMTP, storage
privado ou configuração efetiva no hPanel desta conta.

O que foi comprovado é suficiente para orientar a próxima etapa, mas não para
iniciar a migração:

- o site público atual responde por LiteSpeed e expõe marcadores `Hostinger` /
  `hPanel`;
- o DNS público atual aponta o apex para a Hostinger e os registros MX/SPF
  observados são da Hostinger;
- o repositório possui frontend Astro estático e uma API Hono executada como
  Cloudflare Worker;
- a API atual depende de D1/SQLite, R2 privado e Durable Object/KV;
- o pacote recebido não usa Composer/Laravel e traz entrypoint PHP nativo,
  schema MySQL/MariaDB, configuração por ambiente, storage privado e testes
  locais;
- os artefatos locais `ajnengenharia.com.br.zip`, o backup `.tar.gz` e o dump
  `.sql.gz` são backups do WordPress institucional e permanecem fora do escopo;
- no domínio público observado, `/carreiras/`, `/admin/carreiras/`,
  `/api/health`, `/styles/carreiras.css` e `/scripts/carreiras.js` responderam
  `404`.

Portanto, o estado atual pode ser classificado como funcional apenas no nível
de código e validação local; ainda não pode ser classificado como funcional na
Hostinger.

## Evidências confirmadas no checkout

| Área | Evidência | Estado |
|---|---|---|
| Frontend | `package.json`, `astro.config.mjs`, `src/pages/**` | `CONFIRMED` — build Astro estático |
| Backend | `worker/index.ts` e `worker/routes/**` | `CONFIRMED` — Hono/Workers |
| Banco | `worker/db/schema.ts`, `drizzle.config.ts`, migrations | `CONFIRMED` — SQLite/D1 |
| Arquivos | `RESUMES_BUCKET` em `worker/types.ts` e rotas administrativas | `CONFIRMED` — R2 privado |
| Rate limit | `worker/middleware/rate-limit.ts`, `worker/wrangler.toml` | `CONFIRMED` — Durable Object/KV |
| Node server | `package.json` não possui script `start` nem adapter HTTP | `CONFIRMED` — inexistente |
| MySQL/MariaDB | dependências e configuração do projeto | `CONFIRMED` — não configurado |
| PHP/Laravel | `hostinger/*.php`, `hostinger/migrations/001_initial.sql` | `CONFIRMED` — PHP nativo sem Composer/Laravel |
| Roteamento atual | `public/.htaccess` linhas de carreiras | `CONFIRMED` — redireciona o apex para `carreiras.ajnengenharia.com.br` |
| Vaga dinâmica | `src/pages/carreiras/vaga.astro` | `CONFIRMED` — shell genérico e dados reais dependentes de JavaScript/API |
| Testes PHP | `hostinger/tests/smoke.php`, `hostinger/tests/contract.php` | `CONFIRMED` — smoke e contratos locais aprovados |
| Worktree | `git status --short --branch` | `CONFIRMED` — alterações da implementação preservadas na `feat/ajn-carreiras` |

Os testes locais existentes continuam úteis, mas exercitam SQLite em memória,
Map de R2 e stubs de Durable Object. Eles não comprovam MySQL/MariaDB,
filesystem privado, processo Node/PHP, e-mail Hostinger ou o runtime público.

## Evidência passiva do domínio público

Consulta somente `HEAD`, sem POST, login, upload, mutação ou alteração de DNS:

| URL | Resultado observado |
|---|---|
| `https://ajnengenharia.com.br/` | `200`, LiteSpeed, marcadores Hostinger/hPanel |
| `https://www.ajnengenharia.com.br/` | `301` para o apex |
| `https://ajnengenharia.com.br/carreiras/` | `404` |
| `https://ajnengenharia.com.br/admin/carreiras/` | `404` |
| `https://ajnengenharia.com.br/api/health` | `404` |
| `https://ajnengenharia.com.br/styles/carreiras.css` | `404` |
| `https://ajnengenharia.com.br/scripts/carreiras.js` | `404` |

DNS observado sem alteração: A `45.152.44.193`, NS `solar.dns-parking.com` e
`lunar.dns-parking.com`, MX `mx1.hostinger.com`/`mx2.hostinger.com` e SPF
Hostinger. Isso comprova o estado público observado, não o plano contratado,
nem autoriza qualquer mudança de DNS.

## Capacidades Hostinger: evidência documental e confirmação pendente

A documentação oficial consultada confirma que MySQL, `mysqli`, PDO e
`pdo_mysql` são suportados nos planos Web/Cloud, e que SSH está disponível no
Web Premium ou superior. A documentação também orienta verificar a versão,
extensões e limites reais na tela PHP Info do site. Isso torna a arquitetura
PHP/MySQL tecnicamente plausível, mas não comprova que esta conta possui todos
os limites necessários para upload, cron, backup, staging isolado e diretório
privado.

Também há uma distinção importante: “banco MySQL dedicado” pode significar um
database/schema e usuário exclusivos para carreiras, que é compatível com Web
Premium, ou um servidor de banco dedicado, que não foi comprovado e não deve ser
assumido em hospedagem Web compartilhada. A homologação deve registrar qual
dessas duas interpretações foi contratada.

Referências oficiais consultadas em 2026-11-09:

- [Opções de Node.js na Hostinger](https://www.hostinger.com/support/node-js-hosting-options-at-hostinger/)
- [Como adicionar um app Node.js](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/)
- [SSH na Hostinger](https://support.hostinger.com/en/articles/1583645-how-to-enable-ssh-access)
- [Cron na Hostinger](https://support.hostinger.com/en/articles/1583465-how-to-set-up-a-cron-job-at-hostinger)
- [phpMyAdmin na Hostinger](https://support.hostinger.com/en/articles/1583545-how-to-access-phpmyadmin-at-hostinger)
- [File Manager na Hostinger](https://support.hostinger.com/en/articles/4548688-basic-actions-in-the-file-manager)

São pré-requisitos objetivos para liberar a implementação:

1. confirmação no hPanel de que o produto é Web Premium (não Website Builder)
   e dos limites contratados;
2. versão PHP 8.2+, Composer/CLI se necessário, extensões PDO, pdo_mysql,
   mbstring, fileinfo, openssl, hash e curl, além dos limites de memória,
   timeout e upload;
3. banco MySQL/MariaDB criado exclusivamente para staging, versão, limites,
   usuário separado,
   acesso SSL e procedimento de backup/restore;
5. diretório privado gravável fora de `public_html`, com backup e sem exposição
   por URL direta;
6. cron disponível para limpeza de sessões, expiração de tokens e retenção
   LGPD, ou alternativa comprovada no runtime;
7. mailbox/SMTP Hostinger, limites e remetente autorizado para OTP, recuperação
   de senha e confirmação de candidatura;
8. endereço de staging no mesmo site da aplicação, TLS válido e forma de
   publicar `/api/*` sem CORS cross-site;
9. acesso a logs, health check e rollback de arquivos, banco e processo.

## Decisão arquitetural PHP/MariaDB

### Opção A — Node.js gerenciado no mesmo site

É a opção de menor reescrita se o plano confirmar app Node gerenciado e
roteamento das URLs. O objetivo seria servir tudo pela mesma origem:

```text
https://<staging-host>/carreiras/*
https://<staging-host>/admin/carreiras/*
https://<staging-host>/api/*
```

O frontend Astro continuaria preservando a identidade institucional. A API
Hono precisaria de um adapter Node real, banco MySQL/MariaDB, storage local
privado e rate limit persistente. O cookie poderia permanecer
`HttpOnly; Secure; SameSite=Strict`, sem CORS entre sites. A proteção CSRF deve
continuar validando `Origin`/`Referer` e o método HTTP.

Essa opção é **INFERRED/CONDITIONAL**, não aprovada: o código atual ainda não
possui o adapter, o driver, as migrations MySQL nem a prova de roteamento do
hPanel.

### Opção B — VPS Hostinger com processo Node

É tecnicamente viável e oferece controle de processo, filesystem privado,
proxy, logs e jobs. Exige confirmação de SSH/root, gerenciamento de processo,
backup, firewall e operação de patching. É a opção mais previsível para manter o
backend TypeScript, mas aumenta a responsabilidade operacional.

### Implementação exigida — PHP 8.2+ + MySQL/MariaDB

É a arquitetura escolhida para esta missão e é compatível em princípio com Web
Premium. O pacote recebido traz entrypoint PHP, configuração sem segredos,
migration/schema MySQL, contratos de rota, testes backend, política de
armazenamento privado e instruções de rollback. Esses artefatos já foram
inspecionados e corrigidos onde necessário.

A ausência de um runtime Hostinger acessível ainda impede validar autenticação,
MFA, recuperação, LGPD, upload, permissões, SMTP e integridade de dados contra
MySQL/storage reais. O Worker existente não é prova de funcionamento do runtime
PHP e não será tratado como tal.

### Opção D — hospedagem somente estática/Website Builder

`BLOCKED`: não atende API autenticada, sessão, MFA, persistência, upload
privado, rate limiting, e-mail transacional e LGPD.

## Topologia recomendada, depois da confirmação

1. manter o site institucional no apex Hostinger e preservar o conteúdo já
   publicado;
2. usar o mesmo host/site para frontend, `/api` e painel, evitando o problema
   de cookie `SameSite=Strict` cross-site;
3. substituir D1 por MySQL/MariaDB com migrations versionadas e constraints
   equivalentes;
4. substituir R2 por filesystem privado fora de `public_html`, com nomes
   aleatórios, validação de MIME/magic bytes, autorização por candidato e
   resposta `private, no-store`;
5. substituir Durable Object/KV por rate limit atômico no banco ou mecanismo
   persistente comprovado no Hostinger, com fail-closed;
6. usar SMTP Hostinger ou provedor explicitamente homologado para OTP e
   recuperação, sem segredo no frontend;
7. entregar página de vaga com dados e status HTTP no servidor, sem depender de
   JavaScript para título, descrição, canonical, `JobPosting` ou 404;
8. manter Turnstile apenas como integração externa de antispam, com validação
   server-side e política CSP explícita.

## Plano de migração e rollback

### Fase 1 — desbloqueio de infraestrutura

- confirmar plano e recursos no hPanel;
- criar apenas recursos de staging, sem tocar DNS ou produção;
- exportar/configurar backup antes de qualquer carga;
- definir origem única de staging e testar TLS, cookies, upload, logs e
  rollback.

### Fase 2 — implementação do runtime PHP

- preservar o pacote PHP recebido, confirmar seu entrypoint, dependências e
  contrato antes de publicar;
- introduzir camada de persistência MySQL/MariaDB sem alterar o banco
  WordPress nem reutilizar migrations SQLite sem revisão;
- introduzir storage privado local com teste de traversal e exposição direta;
- migrar rate limit, e-mail e tarefas de expiração;
- manter contratos HTTP do frontend e criar testes de contrato.

### Fase 3 — SEO, navegador e segurança

- servir páginas reais de vaga com 200/404 no servidor;
- validar canonical, `JobPosting`, `noindex` e ausência de candidatura para
  draft/closed;
- testar login MFA, F5, abas, logout, expiração, revogação, upload e LGPD em
  navegador real;
- revisar CSP publicada pela Hostinger e headers efetivos.

### Rollback

- não alterar a publicação atual antes do gate de staging;
- manter artefatos e configuração anterior versionados;
- voltar o Document Root/entrypoint ao artefato institucional anterior;
- restaurar o dump MySQL/MariaDB somente em staging durante os ensaios;
- remover o backend de staging apenas após preservar logs e evidências.

## Veredito atual

**BLOCKED — HOMOLOGAÇÃO HOSTINGER AUSENTE**

O plano Premium foi informado, e a documentação oficial torna PHP/MySQL
plausível. O pacote foi importado e validado localmente, mas não há evidência de
hPanel/runtime desta conta. O próximo passo indispensável é confirmar no hPanel
as extensões, limites, banco de staging, diretório privado, SMTP e cron. Nenhum
deploy, migration, DNS, e-mail ou alteração de produção foi realizado.
