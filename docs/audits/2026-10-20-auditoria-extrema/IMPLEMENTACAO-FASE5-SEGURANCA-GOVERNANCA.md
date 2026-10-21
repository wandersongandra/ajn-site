# AJN — Fase 5: segurança e governança versionadas

Data de execução: 21/10/2026. Base: `main` em `7691507f75dc5a0a5fc18a3e3b1176633f33a8c6`.
Branch: `security/ajn-fase5-governanca`.

## Entregas em código

- `.github/CODEOWNERS` atribui revisão por padrão ao proprietário conhecido do repositório (`@wandersongandra`). Isso só tem efeito operacional quando a proteção de branch exigir review.
- `scripts/audit-governance.mjs` verifica CODEOWNERS, as instruções existentes em `SECURITY.md`, `version: 2`, alvos, diretórios, agendas, fusos, duplicidades e limites do Dependabot, Node mínimo e a identidade dos workflows de segurança obrigatórios (`codeql.yml`, `gitleaks.yml` e `dependency-review.yml`).
- `scripts/test-audit-governance.mjs` contém fixtures negativas para remoção/renomeação de cada workflow obrigatório e para campos inválidos do Dependabot.
- O Quality Gate passa a executar essa auditoria de governança.

## Validação

| Evidência | Resultado |
| --- | --- |
| `npm run check` | PASS — 0 erros, 0 warnings, 0 hints |
| `npm run audit:governance` | PASS — controles do repositório, Dependabot estruturado e 6 workflows identificados |
| `npm run audit:workflows` | PASS — YAML estruturado, permissões mínimas, ações pinadas, timeout e sem `pull_request_target` |
| `npm run test:audit-workflows` | PASS — fixtures negativos e positivos |
| `npm run test:audit-governance` | PASS — 2 testes, incluindo remoção/renomeação dos 3 workflows obrigatórios e fixtures negativas do Dependabot |

## Pendências que exigem ação do proprietário

- Configurar branch protection/ruleset em `main` com PR obrigatória, checks obrigatórios e bloqueio de force-push; CODEOWNERS não substitui essa configuração.
- Habilitar ou confirmar GitHub Private Vulnerability Reporting e Security Advisories.
- Revisar e integrar manualmente os PRs de Dependabot já abertos (#63–#68), observando compatibilidade do Astro/TypeScript e os checks da CI.
- Confirmar na conta GitHub o status efetivo de Dependabot security updates, secret scanning/push protection e alertas CodeQL históricos.

Não houve acesso administrativo, alteração de regras remotas, merge ou deploy.
