# AJN — homologação pós-merge

Data: 21/10/2026 (America/Sao_Paulo)  
Repositório: `wandersongandra/ajn-site`  
Commit de referência auditado: `9684b2943f3a92ae29d68fe26dbe72f08576948e`  
Escopo: integração das Fases 3 (#82), 4 (#81) e 5 (#80).

## Parecer executivo

O estado pós-merge foi reproduzido a partir da `origin/main` no commit de referência. Não foi encontrado defeito de código reproduzível que justificasse alteração funcional. A homologação está aprovada para a revisão do proprietário, condicionada às limitações operacionais listadas abaixo.

Nenhum merge, deploy manual, alteração de DNS, alteração administrativa do GitHub ou envio de formulário foi realizado.

## Auditoria do GitHub e CI/CD

- `main` confirmado em `9684b2943f3a92ae29d68fe26dbe72f08576948e`.
- PRs #80, #81 e #82: integradas; as PRs anteriores #78 e #79 permanecem preservadas no histórico e não devem ser integradas novamente em paralelo com #82.
- `npm run audit:workflows`: PASS — seis workflows, YAML estruturado, permissões mínimas, ações pinadas, timeout por job e sem `pull_request_target`.
- `npm run test:audit-workflows`: PASS — 6 testes, incluindo cenários negativos.
- `npm run audit:governance`: PASS — CODEOWNERS, SECURITY.md, Dependabot e identidade dos workflows obrigatórios.
- `npm run test:audit-governance`: PASS — 2 testes, incluindo remoção/renomeação de CodeQL, Gitleaks e Dependency Review e fixtures inválidas do Dependabot.
- O endpoint de runs por SHA que filtra somente eventos de pull request não retornou runs para o commit de merge; isso foi tratado como limitação do endpoint, não como CI aprovado por ausência de dados. O histórico das PRs integradas registrava Quality Gate, Browser Smoke, CodeQL, Dependency Security e Secret Leak Scan concluídos com sucesso.

## Auditoria real de produção

Alvo: `https://ajnengenharia.com.br/`.

Evidências passivas coletadas em 21/10/2026:

- HTTPS apex: HTTP 200; HTTP sem TLS: 301 para HTTPS apex; `www`: 301 para apex.
- Headers observados: CSP enforced e Report-Only, HSTS `max-age=300`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, Referrer-Policy e Permissions-Policy.
- `robots.txt`: 200; `sitemap-index.xml`: 200; `sitemap-0.xml`: 200.
- Rotas públicas verificadas: Home, Sobre Nós, Serviços, Blog, Contato, políticas legais, Termos, Mapa do site e `/informacoes/` (301). Uma rota inexistente controlada respondeu 404.
- Navegação real em Chromium: Serviços e Contato carregaram com H1, canonical, `<main>` e sem overflow horizontal.
- A produção expôs os assets locais e a estrutura de conteúdo esperada do build pós-merge. A correspondência temporal (`Last-Modified` após o merge) e o conteúdo são consistentes com o commit, mas não constituem prova criptográfica do mecanismo de deploy.
- Os únicos erros de console observados no navegador foram mensagens da extensão de instrumentação `chrome-extension://...`; não foram erros JavaScript do domínio. Os testes de browser locais também não observaram exceções da aplicação.

## Validação local reproduzível

Ambiente: `npm ci`, Node 24, Chromium Playwright 1.56.1. A telemetria do Astro foi desabilitada explicitamente para evitar qualquer envio externo durante os checks.

- `npm ci`: PASS.
- `ASTRO_TELEMETRY_DISABLED=1 npm run check`: PASS — 0 erros, 0 warnings, 0 hints.
- `ASTRO_TELEMETRY_DISABLED=1 npm run build`: PASS — 164 páginas.
- `PUBLIC_SITE_ORIGIN=https://ajnengenharia.com.br PUBLIC_ALLOW_INDEXING=false ASTRO_TELEMETRY_DISABLED=1 npm run validate`: PASS integral.
- Browser performance budget: PASS — 54 assertions.
- Performance lab: PASS — 46 assertions e 12 amostras laboratoriais.
- Mobile navigation: PASS — 182 assertions em 6 larguras e quatro rotas.
- Phase 0: PASS — 84 assertions.
- Phase 2: PASS — 66 assertions em mobile/desktop, reduced-motion, save-data e no-JS.
- Acessibilidade: PASS — 214 assertions em no-JS, reduced-motion e teclado.
- Route matrix: PASS — 164 rotas × 2 viewports, 1.635 assertions.
- Browser Smoke: PASS — 1.457 assertions; reduced-motion em 9 rotas × 10 viewports, default/save-data nas matrizes previstas.

## Achados e severidade

### P2 — HSTS curto, dependente de decisão operacional

**Status:** confirmado e não corrigido nesta PR. Produção e `public/.htaccess` usam `max-age=300`, sem `includeSubDomains` ou `preload`. A configuração é conservadora e coerente com os testes versionados; aumentar o prazo exige validar todos os subdomínios, TLS, Hostinger e rollback. A correção correta é operacional, não uma alteração arbitrária no código.

### P2 — Governança administrativa não comprovada por código

**Status:** pendente de verificação do proprietário. Branch protection/ruleset, revisão obrigatória, force-push, Private Vulnerability Reporting, Secret Scanning/Push Protection e status operacional do Dependabot dependem da conta GitHub. Os controles versionados e os testes negativos estão aprovados.

### P3 — Safari/iOS, leitores de tela físicos e p75 de campo

**Status:** não testado nesta infraestrutura. Chromium headless, matrizes estáticas e laboratório não substituem dispositivos reais, VoiceOver/TalkBack, dados de campo ou p75 de Core Web Vitals.

## Arquivos alterados nesta homologação

Somente este relatório foi adicionado. Nenhum componente, asset, workflow, dependência ou configuração de produção foi alterado.

## Veredito

**APPROVED FOR MERGE** para esta PR de homologação, mantendo-a aberta para revisão do proprietário. O veredito não autoriza deploy nem substitui a confirmação manual das configurações do GitHub, do Hostinger e de Safari/iOS.
