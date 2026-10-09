# GitHub e CI/CD

**Data:** 2026-10-08 · **Escopo:** workflows e configuração versionada; sem alterar settings administrativos.

## Fluxo confirmado

- `.github/workflows/quality.yml` executa em `push` e `pull_request` direcionados a `main`. Faz `npm ci`, check/build, auditorias, audit de dependências e build separado com indexação pública.
- `.github/workflows/gitleaks.yml` executa em push/PR para `main`, semanalmente e por dispatch manual. Checkout integral desabilita persistência de credenciais; Gitleaks recebe `GITHUB_TOKEN`.
- `.github/workflows/codeql.yml` executa em push/PR/agendamento; permissões específicas por job incluem `security-events: write`.
- `.github/workflows/dependency-review.yml` analisa PRs; a ação nativa só roda se `ENABLE_DEPENDENCY_REVIEW=true`, pois o comentário do repositório registra Dependency Graph desabilitado.
- `.github/dependabot.yml` agenda atualizações de npm e Actions semanalmente.
- Os workflows usam tags de versão major (`actions/checkout@v7`, `setup-node@v7`, `github/codeql-action@v4`, entre outras), não SHA imutável.
- Não há workflow de deploy, uso de FTP/SSH, publicação de artefato, nem credencial de deploy no YAML consultado.

## Controles confirmados

- Quality Gate declara `permissions: contents: read` no nível do workflow.
- CodeQL concede `actions: read`, `contents: read` e `security-events: write` apenas ao job de análise.
- Gitleaks usa checkout com `persist-credentials: false`.
- O workflow de qualidade constrói preview com `noindex` e realiza build indexável separado, sem publicar o artefato. Ambos executam `audit:editorial` e `audit:sst-seo` no mesmo contexto de origin/indexação do build.
- Ações de terceiros não são pinadas por SHA; isso é risco residual de supply chain, não prova de comprometimento.

## Não verificável pelo checkout

Proteção de branch, checks obrigatórios, bloqueio de force-push, revisão mínima, secret scanning/push protection, alertas Dependabot, Dependency Graph, lista de Actions permitidas e configurações de ambiente dependem de GitHub Settings/admin. **NÃO VERIFICADO** nesta execução.

## Estado da PR #50 nesta revisão

No commit remoto `4974469`, Quality Gate (`validate`), os dois jobs da análise CodeQL, Secret Leak Scan e Dependency Security passaram. A primeira anotação inline sobre `</script >` foi respondida; após o novo scan, CodeQL revelou que o regex ainda não cobria uma tag final com whitespace e atributos inesperados. O parser foi substituído por um scanner delimitado de tags, com cobertura automatizada das variantes. Também foi corrigida a checagem incompleta de esquemas em `scripts/audit-seo.mjs` e a Action Gitleaks foi fixada ao SHA do tag v3 (`e0c47f4f8be36e29cdc102c57e68cb5cbf0e8d1e`). As últimas mudanças locais exigem novo push/scan. CodeRabbit pulou a revisão automática por a PR estar em draft.

A PR #51, baseada diretamente na `main`, mantém a configuração Hostinger isolada e draft. Seu Quality Gate falha porque a `main` ainda tem o título PGR de 23 caracteres, corrigido apenas na PR #50; os demais workflows observados passaram. Não se deve tratar esse resultado como validado nem mesclar a PR de infraestrutura antes da dependência ser resolvida e dos checks serem repetidos. Nenhuma PR foi mesclada e nenhum deploy foi executado.

## Recomendação

Administrador deve confirmar branch protection e secret scanning. Avaliar pin de Actions por SHA com atualização automatizada e revisão do SHA upstream. O deploy Hostinger permanece fora da CI versionada e seu gatilho operacional não está confirmado.
