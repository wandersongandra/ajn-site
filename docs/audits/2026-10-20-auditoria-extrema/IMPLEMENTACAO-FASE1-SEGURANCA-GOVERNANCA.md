# Implementação da Fase 1 — Segurança e governança

Data da verificação: 20/10/2026
Repositório: `wandersongandra/ajn-site`
Base auditada: `origin/main` em `e9d82b28573f52aea341d879fde8c5474a6c4f23`
Branch de trabalho: `fix/ajn-auditoria-extrema-fase1-security-governance`
Produção observada: `https://ajnengenharia.com.br`

## Resumo executivo

A Fase 1 tratou os pontos implementáveis de AJN-011 e AJN-012 sem alterar a hospedagem, DNS, SSL, CSP, HSTS ou configurações administrativas externas do GitHub. A inspeção foi feita em uma worktree nova, criada a partir da `origin/main`; o checkout original com alterações do usuário permaneceu intacto.

Foram confirmados: `main` sem branch protection (`404 Branch not protected`), nenhum ruleset, Dependabot security updates desabilitado, permissões globais do Actions permitindo todas as ações e sem exigência administrativa de SHA, e dois alertas CodeQL históricos ainda abertos no filtro regex de `scripts/audit-engineering.mjs`. Secret scanning e push protection permanecem ativos; não foram retornados alertas de secret scanning.

As correções versionadas substituem a remoção de `<script>` por um scanner delimitado reutilizável, adicionam regressões adversariais, alinham o smoke público a redirects permanentes `301`, validam todos os saltos e introduzem auditoria preventiva dos workflows. A revisão corretiva desta PR também fechou os três apontamentos P2 do auditor de Actions com parsing YAML estrutural, validação de Docker por digest e política fail-closed para segredos. O `live-security` passou a ter agendamento semanal GET-only, sem qualquer passo de publicação.

As proteções administrativas da organização/repositório continuam pendentes de aprovação do proprietário. Portanto, o código está pronto para revisão, mas o estado de governança não deve ser classificado como protegido até que branch protection/rulesets e Dependabot security updates sejam efetivamente habilitados.

## Inventário de segurança

| Controle | Situação atual | Risco | Ação recomendada | Implementado |
|---|---|---|---|---|
| Visibilidade e branch padrão | CONFIRMADO: repositório público, `main` padrão, não arquivado | Alteração aprovada em `main` pode alcançar o mecanismo de publicação | Aplicar ruleset aprovado para `main` | Não; requer administração |
| Proteção da `main` | CONFIRMADO: `GET /branches/main/protection` retornou `404 Branch not protected` | Push/merge sem gates administrativos | PR obrigatória, checks, revisão e bloqueio de force push/exclusão | Não; proposta abaixo |
| Repository rulesets | CONFIRMADO: resposta vazia (`[]`) | Não há regra equivalente cobrindo a branch | Criar ruleset de branch padrão | Não; requer administração |
| Reviews/status checks | NÃO CONFIGURADO no nível administrativo; checks existem nos workflows | Checks verdes não impedem bypass sem proteção | Exigir PR, conversas resolvidas e checks publicados | Não; requer administração |
| `GITHUB_TOKEN` padrão | CONFIGURADO: `default_workflow_permissions=read`, sem aprovação de PR pelo workflow | Reduz escrita acidental; não substitui ruleset | Manter read-only e conceder escrita somente ao CodeQL | Sim, versão/workflow |
| GitHub Actions global | CONFIRMADO: `allowed_actions=all`, `sha_pinning_required=false` | Ação de terceiros nova ou não pinada pode entrar sem controle | Restringir origens e exigir SHA completo | Não; requer administração |
| Secret scanning | CONFIGURADO: habilitado; consulta retornou 0 alertas | Segredos futuros ainda exigem rotação e revisão | Manter ativo e revisar alertas periodicamente | Já existente |
| Push protection | CONFIGURADO: habilitado | Bloqueio pode ser contornado por credenciais já expostas | Manter e tratar qualquer alerta como incidente | Já existente |
| Dependabot alerts | NÃO CONFIGURADO: API respondeu `403 Dependabot alerts are disabled` | Vulnerabilidades de dependências podem não gerar alerta | Habilitar alertas e revisar permissões administrativas | Não; requer administração |
| Dependabot security updates | CONFIRMADO: `security_and_analysis.dependabot_security_updates=disabled`; `automated-security-fixes.enabled=false` | Não há PR automática de correção de segurança | Habilitar após validar política de revisão | Não; requer administração |
| Dependabot version updates | CONFIGURADO em `.github/dependabot.yml`: npm e github-actions semanais, limite 5 | PRs podem acumular sem triagem | Revisar PRs individualmente; não fazer merge automático | Sim, configuração versionada |
| CodeQL | CONFIGURADO: workflow ativo, matriz `javascript-typescript`/`actions`, `security-extended`, agenda semanal | Alertas históricos permanecem até correção/triagem | Corrigir causa e consultar alertas por PR | Sim, workflow e código |
| Publicação | NÃO VERIFICADO: não há workflow de deploy versionado em `.github/workflows`; Hostinger externa | Mecanismo real de cutover não é comprovado pelo CI | Confirmar webhook/integração Hostinger fora desta PR | Não; fora do escopo |

### Proposta administrativa para `main`

Não foi aplicada automaticamente. Após aprovação do proprietário, configurar um ruleset para `main` com PR obrigatória, bloqueio de force push e exclusão, commits atualizados antes do merge, conversas resolvidas e bypass administrativo restrito. Os nomes de checks observados no GitHub são `validate`, `browser-smoke`, `CodeQL (javascript-typescript)`, `CodeQL (actions)`, `Gitleaks` e `Dependency audit (high+)`. Recomenda-se uma aprovação quando houver segundo revisor disponível; em operação solo, o proprietário deve escolher conscientemente a política para não criar um gate impossível.

Também deve ser avaliada a restrição de Actions a origens aprovadas e a exigência global de SHA. A API atual mostra essas duas garantias administrativas desativadas; o auditor versionado cobre o estado dos seis workflows existentes, mas não substitui a configuração do repositório.

## AJN-011 — governança, Dependabot e CodeQL

### Estado verificado

- `main` sem proteção e sem rulesets: **CONFIRMADO**.
- Auto-merge desabilitado; merge commit, rebase e squash permitidos; exclusão automática de branch após merge desabilitada: **CONFIRMADO**.
- Permissões padrão de workflow somente leitura e sem aprovação de PR por workflow: **CONFIRMADO**.
- Alertas de Dependabot: **BLOQUEADO POR PERMISSÃO / NÃO CONFIGURADO**; o próprio GitHub informa que o recurso está desabilitado e o token também não possui o escopo administrativo necessário para consultar esse inventário.
- Atualizações de versão do Dependabot: **CONFIGURADO** no arquivo versionado, separado dos alertas/updates de segurança.
- PRs abertas do Dependabot, nenhuma mesclada por esta missão: #68 e #67 (CodeQL 4.39.0), #66 (Astro 7.4.0), #65 (zod 4.6.7), #64 (upload-artifact 7.0.2) e #63 (TypeScript 7.0.2).
- CodeQL: **CONFIRMADO** ativo e verde nos últimos runs consultados; isso não encerra os alertas históricos por si só.

### Correção dos alertas históricos

Os alertas #11 (`js/bad-tag-filter`) e #12 (`js/incomplete-multi-character-sanitization`) apontavam para a expressão `html.replace(/<script[\s\S]*?<\/script>/gi, '')` em `scripts/audit-engineering.mjs:17`. A rotina atuava somente sobre HTML estático gerado no build, mas podia parar em delimitadores incorretos e produzir auditoria incompleta.

`security-html.mjs` agora expõe `stripScriptElements()`, baseado no scanner existente de abertura/fechamento de tags: respeita maiúsculas/minúsculas, atributos com `>`, whitespace, texto parecido com `<script>` e preserva elementos incompletos em vez de descartá-los silenciosamente. O auditor de engenharia usa essa função; não houve dependência nova nem alteração de regra de consentimento ou carregamento do GA4.

Os testes cobrem tags normais e adversariais, incluindo atributo com `>`, `scripture` e abertura sem fechamento. O CodeQL da PR #75 passou para `actions` e `javascript-typescript`; a consulta dos alertas com `ref` da branch não retornou findings, enquanto os dois registros históricos continuam abertos somente na `main`. Nenhum alerta foi descartado manualmente.

## AJN-012 — redirecionamentos HTTP/HTTPS

### Comportamento observado

Requisições públicas GET com `redirect: manual` confirmaram:

| Origem | Resultado observado |
|---|---|
| `http://ajnengenharia.com.br/` | `301` → `https://ajnengenharia.com.br/` |
| `http://www.ajnengenharia.com.br/` | `301` → `https://www...` → `301` → apex HTTPS |
| `https://www.ajnengenharia.com.br/` | `301` → apex HTTPS |
| apex HTTPS | `200`, sem redirect desnecessário |
| `https://www.../contato/?utm=a%2Fb&next=%2Fblog` | `301` para apex preservando caminho e query |
| apex HTTPS com a mesma query | `200` |

Os headers públicos observados nas páginas HTTPS incluíram HSTS `max-age=300`, CSP enforced e Report-Only, `nosniff`, `DENY`, `Referrer-Policy` e `Permissions-Policy`. Não foi alterado `.htaccess` nem a política de HSTS/CSP.

### Implementação

O smoke anterior esperava `302` e verificava apenas um salto de `www`. `audit-live-security.mjs` agora exige `301` para cada salto, segue no máximo três redirects, rejeita hosts externos, loops e destinos que percam caminho/query, e valida o URL final canônico. As fixtures cobrem apex HTTP, `www` HTTP, `www` HTTPS, path/query, host externo, query perdida e loop implícito.

O workflow `live-security.yml` continua GET-only e manualmente acionável, mas também executa uma vez por semana (`cron: 17 8 * * 1`, horário UTC) com concorrência cancelável. Ele não publica arquivos, não usa segredos e não substitui o gate de deploy da Hostinger.

## CodeQL

| Alerta | Estado na auditoria da `main` | Evidência | Tratamento |
|---|---|---|---|
| #12 `js/incomplete-multi-character-sanitization` | CONFIRMADO aberto, linha 17 | `scripts/audit-engineering.mjs` | Regex removida; parser delimitado e regressões adicionadas |
| #11 `js/bad-tag-filter` | CONFIRMADO aberto, linha 17 | `scripts/audit-engineering.mjs` | Mesma causa corrigida sem desativar regra |
| #2 `js/incomplete-url-scheme-check` | CONFIRMADO fixed | `scripts/audit-seo.mjs:27` | Sem alteração nesta fase |
| #1 `actions/unpinned-tag` | CONFIRMADO fixed | `.github/workflows/gitleaks.yml:27` | Auditor preventivo mantém pinagem |

O workflow CodeQL permanece com `security-extended`, matriz para JavaScript/TypeScript e Actions, `security-events: write` apenas no job de análise e demais permissões read-only.

## Dependabot e dependências

`.github/dependabot.yml` monitora `npm` e `github-actions` semanalmente, segunda-feira às 09:00/09:30 em `America/Sao_Paulo`, com no máximo cinco PRs por ecossistema. Não foi feita atualização em massa nesta PR.

`npm audit --audit-level=high` e `npm audit --omit=dev --audit-level=high` retornaram `0 vulnerabilities`. `npm outdated` identificou apenas atualizações disponíveis (Astro 7.4.1, zod 4.6.7, TypeScript 7.0.2 e `@astrojs/check` 0.9.11); o comando termina com código 1 quando há itens desatualizados, o que foi registrado sem misturar upgrades à correção de segurança.

## CI/CD e GitHub Actions

Foram analisados os seis workflows versionados: Browser Smoke, CodeQL, Dependency Security, Secret Leak Scan, Live Security Smoke Test e Quality Gate. A auditoria `scripts/audit-workflows.mjs` é executada em `validate` e no Quality Gate e usa o parser YAML `yaml` para verificar:

- ausência de `pull_request_target`;
- `permissions` global e de cada job, inclusive mapas inline, com rejeição de writes fora da exceção CodeQL;
- Actions normais externas fixadas em SHA completo de 40 caracteres, Actions locais preservadas e imagens `docker://` exigindo digest SHA-256 de 64 caracteres;
- `timeout-minutes` para cada job;
- ausência de segredos além do `GITHUB_TOKEN` necessário ao Gitleaks, reconhecendo ponto, colchetes com aspas/espaços e rejeitando acessos dinâmicos sem classificação segura.

`scripts/test-audit-workflows.mjs` cobre regressões negativas para os três P2, a exceção CodeQL, referências `GITHUB_TOKEN` em ambas as notações e os seis workflows legítimos. O resultado local foi `PASS: 6 workflows`. Todos usam `npm ci`, Node 22, concorrência onde há execução repetível e `persist-credentials: false` nos checkouts. Não há workflow de deploy versionado nesta árvore; a integração real com Hostinger permanece **NÃO VERIFICADA** e não foi alterada.

### Revisão corretiva dos três comentários P2

Os comentários de revisão abertos na PR #75 foram tratados no código, sem alterar regras de consentimento, carregamento do GA4, conteúdo comercial, SEO, Hostinger, DNS ou redirecionamentos:

| Comentário | Lacuna | Correção e regressão | Estado remoto |
|---|---|---|
| `4330169071` | `docker://...` sem `@` era ignorado e tags mutáveis passavam | Parser estrutural coleta `uses`; Docker só passa com `@sha256:` + 64 hex; teste rejeita tag e aceita digest, Action SHA e Action local | RESOLVIDO após resposta `4330345738` |
| `4330169079` | mapa inline `permissions: { contents: write }` escapava da regex | `yaml` inspeciona permissões globais e de jobs; teste rejeita write inline e mantém `security-events: write` apenas no job CodeQL `analyze` | RESOLVIDO após resposta `4330346067` |
| `4330169082` | acesso `secrets[...]` escapava da notação de ponto | scanner de expressões aceita ponto/colchetes com aspas e espaços, permite somente `GITHUB_TOKEN` e falha fechado em acesso dinâmico; testes cobrem dot, aspas simples/duplas e dynamic | RESOLVIDO após resposta `4330346398` |

Foi adicionada a dependência direta de desenvolvimento `yaml@^2.9.1`, já presente transitivamente no lockfile, porque regex não consegue distinguir mapas YAML flow-style, jobs e valores escalares com segurança. O `package-lock.json` foi atualizado e as auditorias de dependências permaneceram sem vulnerabilidades.

## Matriz de resultados

| Item | Antes | Depois | Evidência | Situação |
|---|---|---|---|---|
| Branch protection | 404 / sem proteção | Inalterado externamente; proposta documentada | `gh api .../branches/main/protection` | REQUER APROVAÇÃO ADMINISTRATIVA |
| Rulesets | `[]` | Inalterado externamente | `gh api .../rulesets` | REQUER APROVAÇÃO ADMINISTRATIVA |
| Dependabot security | Desabilitado | Não alterado; procedimento documentado | `security_and_analysis`, API 403 | REQUER APROVAÇÃO ADMINISTRATIVA |
| Dependabot version | NPM/actions semanais | Mantido; PRs #63–#68 revisadas como pendentes | `.github/dependabot.yml`, `gh pr list` | CONFIGURADO |
| CodeQL | Dois alertas abertos na regex | Regex removida, scanner e testes adicionados | `audit:engineering`, `test:hosting-policy`, CodeQL PR #75 | CORRIGIDO; HISTÓRICO DA `main` PENDENTE DE TRIAGEM |
| Redirect | Fixture/produção divergiam (`302` vs `301`) | `301` por salto, cadeia e query verificadas | `test:live-security`, `audit:live-security` | CONFIRMADO |
| GitHub Actions | Pinagem/permissões apenas parcialmente garantidas | Auditor preventivo versionado; live smoke semanal | `audit:workflows`, diffs dos workflows | CONFIGURADO NO CÓDIGO; ADMIN EXTERNO PENDENTE |
| Headers públicos | HSTS/CSP e demais headers observados | Mantidos; auditor continua exigindo baseline | `audit:live-security` público | CONFIRMADO |

## Validação executada

- `npm ci` — concluído, 0 vulnerabilidades.
- `npm run check` — 0 erros; 1 hint preexistente (`stat` não usado em `scripts/audit-medicoes.mjs`).
- `npm run build` — concluído, 164 páginas estáticas.
- `npm run validate` com `PUBLIC_SITE_ORIGIN=https://sienna-mongoose-223157.hostingersite.com` e `PUBLIC_ALLOW_INDEXING=false` — concluído.
- `npm run test:hosting-policy` — 5/5.
- `npm run test:live-security` — 4/4.
- `npm run audit:workflows` — PASS, 6 workflows.
- `npm run test:audit-workflows` — 5/5 regressões PASS, incluindo os três P2 e os seis workflows legítimos.
- `npm run audit:engineering` — PASS.
- `npm run audit:live-security` — PASS contra produção, 13 observações GET, sem loop.
- `npm audit --audit-level=high` — 0 vulnerabilidades.
- `npm audit --omit=dev --audit-level=high` — 0 vulnerabilidades.
- Browser smoke local — 1.457 assertions; reduced motion 9 rotas × 10 larguras, default 4 × 2 e save-data 4 × 2.
- Browser regression Fase 0 — 84 assertions PASS.
- Testes de privacidade durante `validate` — 23/23 PASS.
- `npm run test:hosting-policy` — 5/5; `npm run test:live-security` — 4/4; `npm run audit:security` — PASS.
- `gh pr checks 74` — PR #74 já integrada; checks históricos verdes, sem confundir isso com proteção administrativa.
- `gh pr checks 75` — CodeQL, Dependency Security, Gitleaks, browser smoke e validate PASS; PR aberta, estado `CLEAN`, sem merge.

### Evidência remota desta revisão corretiva

- Commit publicado: `80c1912c1bc5dfa91be7fb91db625729dee1ce81` (`fix(security): close workflow audit review findings`).
- `gh pr checks 75` no commit acima: `validate`, `browser-smoke`, `Dependency audit (high+)`, `Gitleaks`, `CodeQL (actions)`, `CodeQL (javascript-typescript)` e `CodeQL` concluíram com `SUCCESS` (há execuções duplicadas push/PR, todas verdes).
- PR #75 permanece `OPEN`, `CLEAN`, base `main`; nenhum merge ou deploy foi executado.
- Os três review threads `PRRT_kwDOU-t_pM6uhQI1`, `PRRT_kwDOU-t_pM6uhQI5` e `PRRT_kwDOU-t_pM6uhQI6` foram respondidos com evidência e marcados `isResolved=true` somente após os checks verdes.

## Veredicto

**APPROVED FOR MERGE** para o código corretivo da PR #75.

Os três P2 foram corrigidos, os testes locais e checks remotos passaram, e os threads foram respondidos e resolvidos somente após a evidência. Branch protection/rulesets, Dependabot alerts/security updates, restrição global de Actions e mecanismo real de deploy continuam controles administrativos externos, preservados e fora desta correção; exigem acompanhamento separado, mas não criam pendência bloqueadora nova para o código da PR. Não houve merge, deploy, alteração de produção, alteração de DNS/SSL ou dismiss de alerta CodeQL.
