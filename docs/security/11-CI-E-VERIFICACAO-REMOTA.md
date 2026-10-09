# Terceira rodada — supply chain e validação HTTP de produção

**Data:** 2026-10-08. **Escopo:** GitHub Actions, auditoria pública somente leitura e prevenção de regressões. Não altera `public/.htaccess`, DNS, e-mails, WordPress ou configuração da Hostinger.

## Evidência e medidas

- As ações `actions/checkout@v7`, `actions/setup-node@v7`, `github/codeql-action@v4` e `actions/dependency-review-action@v5` estavam apontando para tags móveis. Esta rodada substitui as tags por SHAs obtidos dos respectivos repositórios oficiais em 2026-10-08. O `gitleaks/gitleaks-action` já estava fixado em SHA e foi preservado.
- Checkouts que não precisavam fazer push passam a usar `persist-credentials: false`. O `GITHUB_TOKEN` continua com permissões mínimas e o CodeQL mantém `security-events: write` apenas no job de análise.
- O job principal de qualidade recebe limite de 25 minutos.
- O novo `scripts/audit-live-security.mjs` consulta por **GET** o domínio público. Verifica HTTP 200, canonical apex e ausência de `noindex` em Home, Serviços, Contato e Blog; HSTS ativo (mínimo 300 s, sem preload/includeSubDomains); CSP enforced, CSP candidata Report-Only, X-Frame-Options, nosniff, Referrer-Policy e Permissions-Policy; www -> apex (302) e HTTP -> HTTPS, inclusive query string.
- Testes de fixtures via `npm run test:live-security` usam `fetch` simulado **sem rede**, integrados ao Quality Gate e `npm run validate`.
- `.github/workflows/live-security.yml` disponibiliza auditoria **manual**, via `workflow_dispatch`, sem segredos nem direitos de escrita. Ela não é gate de PR e não dispara automaticamente a cada commit, pois o deploy externo pode ter atraso.

## Uso após uma publicação aprovada

No GitHub > Actions > Live Security Smoke Test > Run workflow, usar `main` **depois** que a Hostinger publicar. A verificação pode falhar enquanto o deploy não estiver propagado.

Resultados satisfatórios no HTTP não comprovam ausência de vulnerabilidades nem substituem inspeção no browser, console CSP Report-Only, backup do host, LGPD ou correção das rotas legais em 404.

## Limitações e próximos passos

O teste de redirecionamento presume o status provisório `302`, conforme configuração da PR #51; qualquer promoção para `301` exige atualizar o teste na mesma PR do redirect. `HSTS max-age=300` é conservador e não deve ser aumentado sem revisão de TLS, homologação e recuperação. `Report-Only` não coleta relatórios centralizados enquanto não houver endpoint aprovado.

Textos de Política de Privacidade e Termos de Uso continuam dependentes de documentos reais, revisão e aprovação da AJN. Pinning de Actions deve ser renovado periodicamente, preferencialmente via Dependabot configurado após avaliação do volume de PRs.
