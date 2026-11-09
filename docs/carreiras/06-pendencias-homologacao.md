# AJN Carreiras — pendências reais para homologação

## Estado atual

| Área | Estado | Evidência/limite |
|---|---|---|
| Correção do init administrativo | `IMPLEMENTADO` | Listeners registrados antes de restaurar `/me`; guard contra duplicidade |
| Topologia same-origin | `IMPLEMENTADO NO CÓDIGO` | Worker canônico, origem derivada/confirmada e rotas Apache legadas fail-closed; publicação não verificada |
| CSP/CORS/CSRF | `IMPLEMENTADO NO CÓDIGO` | Origens exatas e validação de origem; headers live não verificados |
| SSR/SEO de vaga | `IMPLEMENTADO LOCALMENTE` | Worker retorna 200/404 e JSON-LD seguro em fixture local |
| Assets no Worker | `IMPLEMENTADO NO BUNDLE` | `ASSETS` + `postbuild`; Worker publicado não verificado |
| D1/R2/KV/DO reais | `BLOCKED` | IDs e recursos remotos de staging não fornecidos |
| Turnstile/e-mail/MFA remoto | `BLOCKED` | Chaves válidas, mailbox e usuário de homologação ausentes |
| DNS/Custom Domain | `BLOCKED` | Nenhuma alteração autorizada/executada; zona e plano Cloudflare não comprovados |
| E2E remoto | `BLOCKED` | Endpoint/credenciais de homologação não fornecidos |

## Gate remoto obrigatório

`npm run test:homologation-remote` produz evidência estruturada para quatro gates:

- **A — Infraestrutura e superfície pública:** endpoint HTTPS, Worker/health, SSR, assets, 404, D1, R2, Durable Object, Turnstile e e-mail;
- **B — Autenticação administrativa:** MFA, cookie seguro, refresh, logout, expiração, RBAC e CSRF;
- **C — Recrutamento:** ciclo de vida/status da vaga, candidatura PDF, persistência D1 e acompanhamento;
- **D — Segurança/LGPD:** recuperação de senha, Turnstile válido/inválido, rate limit, exclusão, auditoria e acessos não autorizados.

Os checks públicos A executam HTTP real quando um endpoint de staging é fornecido. Os demais exigem um manifesto externo de evidências, produzido por execução real em navegador/CLI remoto. `local`, `mock`, `fixture` e variáveis de autorização não são aceitos como prova. Check não executado é `BLOCKED`; qualquer falha é `FAIL`; o resultado global só é `PASS` quando todos os checks obrigatórios passam.

## Requisitos externos

1. Conta/zona Cloudflare confirmada e plano compatível com Custom Domain; não assumir Subdomain Setup sem Enterprise.
2. IDs reais de D1, R2, KV e configuração do Durable Object em staging.
3. Secrets e chaves Turnstile/e-mail armazenados no mecanismo de secrets da Cloudflare.
4. Usuário RH sintético com MFA, mailbox controlado e autorização para mutações de teste.
5. PDF sintético aprovado e procedimento de limpeza/retenção dos dados de homologação.
6. Inventário dos registros DNS atuais, incluindo A/AAAA/MX/TXT/SPF/DKIM/DMARC/CAA, antes de qualquer migração.
7. Execução do gate remoto e coleta de headers/cookies no navegador real.

Até esses itens existirem, a classificação correta é `BLOCKED`, não “pronto para produção”.
