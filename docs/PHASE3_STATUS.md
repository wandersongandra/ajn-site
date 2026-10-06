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
| C — Marketing | Auditoria de 106 URLs + 73 páginas migradas | PASS WITH WARN | docs/MARKETING_CONTENT_AUDIT.md; check/build; browser 1440/768/390 |
| D — Informacional | URLs informacionais restantes | NOT STARTED | Após C |
| E — Blog | 19 artigos restantes | NOT STARTED | Após D |
| F — Contato/especiais | formulário e rotas especiais | WARN | Contrato de envio não autorizado/configurado |

## Gate da etapa

- npm run check: PASS, 0 erros, 0 warnings/hints, 131 arquivos analisados.
- npm run build: PASS, 90 páginas estáticas geradas.
- A duplicata física de asset permanece WARN/BLOCKED para remoção segura; nenhum arquivo legado foi apagado.
- As 44 páginas inicialmente REVIEW por similaridade lexical foram triadas como
  KEEP; 15 foram migradas no lote 8 e 29 seguem pendentes, sem redirect automático.
- Nenhuma ação foi feita no WordPress, banco legado, DNS ou produção.
