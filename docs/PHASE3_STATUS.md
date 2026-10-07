# Status da Fase 3

Data: 2026-10-06

| Lote | Escopo | Status | Evidência |
|---|---|---|---|
| Reauditoria | 143 URLs, duplicidades, anexos e páginas técnicas | PASS | docs/ROUTES_AUDIT.md |
| Segurança Git | Worktree e checkpoint local | PASS | docs/GIT_SAFETY_AUDIT.md; checkpoint local 07202e1 |
| A — Institucional | 3 rotas | PASS | check, build, browser em 3 viewports |
| B — Serviços | índice + 9 detalhes | PASS | check, build, HTTP e amostra visual |
| Assets do lote B | 9 imagens de serviço copiadas sob demanda | WARN | 0 referências quebradas; 1 duplicata física não removida por bloqueio do mecanismo local |
| Estrutura de conteúdo | conteúdo representativo separado por domínio | PASS | src/content/institutional, marketing, services, blog |
| C — Marketing | Auditoria de 106 URLs + 107 páginas migradas | PASS WITH WARN | docs/MARKETING_CONTENT_AUDIT.md; check/build; browser 1440/768/390 |
| D — Informacional | URLs informacionais restantes | NOT STARTED | Após C |
| E — Blog | 20 artigos KEEP; 20 migrados | PASS | Collection tipada, template dedicado e getStaticPaths |
| F — Contato/especiais | formulário e rotas especiais | WARN | Contrato de envio não autorizado/configurado |

## Gate da etapa

- npm run check: PASS, 0 erros, 0 warnings/hints, 187 arquivos analisados.
- npm run build: PASS, 143 páginas estáticas geradas.
- A duplicata física de asset permanece WARN/BLOCKED para remoção segura; nenhum arquivo legado foi apagado.
- As 44 páginas inicialmente REVIEW por similaridade lexical foram triadas como
  KEEP e as 44 foram migradas, sem redirect automático.
- A família Marketing está sem backlog pendente; a auditoria global confirma 142
  URLs `KEEP` implementadas e nenhuma pendente. A URL `/mapa-site` permanece
  `REVIEW` por decisão de SEO/UX, mas também possui rota estática gerada.
- O Blog adicionou schema Zod estrito, template editorial com
  `<article>`/`<time>`, rota dinâmica `/blog/[slug]/` e 43 assets locais
  únicos em `src/assets/blog/`.
- A Fase 1 de extração de conteúdo está tecnicamente completa; o relatório
  formal está em `docs/MIGRATION_FINAL_STATUS.md`.
- Nenhuma ação foi feita no WordPress, banco legado, DNS ou produção.
