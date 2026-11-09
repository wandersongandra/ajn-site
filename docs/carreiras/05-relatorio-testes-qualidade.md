# AJN Carreiras — matriz de evidências de QA

Este relatório separa testes locais, contrato, navegador e homologação remota. Fixtures SQLite, Map de R2 e Durable Object stub não são infraestrutura Cloudflare real.

## Classificação

| Camada | Comando/artefato | O que comprova | Estado |
|---|---|---|---|
| Backend local | `npm run test:backend` (5 arquivos Vitest) | Regras de segurança, autorização e contratos locais | `PASS — 61 testes` |
| Integração local | `tests/backend/integration-gate.test.ts` | Fluxos com SQLite em memória, Map R2, DO stub e contrato ASSETS | `PASS — 9 testes; não remoto` |
| Contrato | `scripts/audit-hosting-config.mjs`, `scripts/test-hosting-redirect.mjs` | CSP, redirects, assets e invariantes do artefato | `PASS — 170 HTML/CSS; 5 testes` |
| E2E navegador local | `npm run test:browser-carreiras` | HTML, responsividade, navegação, F5, CRUD e erros JS no Astro local | `PASS — 102 asserções mobile/desktop` |
| Homologação remota | `npm run test:homologation-remote` | Worker/Custom Domain, status real e assets publicados | `BLOCKED sem endpoint e recursos` |

## Cobertura local existente

Os nove cenários do arquivo de integração local cobrem login MFA, cookie, refresh `/me`, logout/revogação, candidatura e persistência nos adaptadores locais, criação de vaga, SSR/JSON-LD, 404/noindex, CORS/cookie/CSRF de staging, fallback de assets do Worker e falhas de Turnstile/R2/bloqueio.

Essa cobertura é útil para regressão, mas não demonstra:

- cookie real em navegador contra um Worker publicado;
- D1, R2, KV/DO, e-mail ou Turnstile Cloudflare reais;
- recuperação de senha por mailbox;
- execução remota dos direitos LGPD;
- comportamento do Custom Domain, DNS, preflight e cache na borda.

## Gate remoto

O script remoto não usa localhost nem fixtures. Sem `AJN_CARREIRAS_REMOTE_ORIGIN`, ele termina com `BLOCKED` e lista os requisitos ausentes. Mesmo com uma URL pública, autenticação MFA, upload PDF, R2, e-mail, Turnstile, LGPD, expiração e revogação só podem ser classificados após execução em recursos de staging controlados e credenciais fornecidas fora do repositório.

## Regra de veredito

- `PASS`: evidência executada no ambiente indicado e assertions relevantes aprovadas;
- `FAIL`: comportamento incorreto reproduzido;
- `BLOCKED`: dependência externa ausente, sem converter fixture/local em prova remota.
