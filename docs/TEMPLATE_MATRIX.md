# Matriz de templates — Fase 3

Data: 2026-10-06
Fonte: auditoria das 143 URLs públicas e conteúdo local recuperado.

| Template | URLs no legado | Implementadas no Astro | Restantes | Estrutura |
|---|---:|---:|---:|---|
| HOME | 1 | 1 | 0 | Hero, apresentação, clientes, missão/visão/valores, soluções, portfólio, diferenciais, destaques, popup e footer |
| INSTITUTIONAL | 3 | 3 | 0 | Sobre nós, informações e mapa do site |
| MARKETING_DETAIL | 107 | 1 | 106 | Galeria/hero, seções editoriais, conteúdo técnico e CTA |
| SERVICE_DETAIL | 9 | 9 | 0 | Template único com imagem, informações e conteúdo técnico por arquivo |
| SERVICES_INDEX | 1 | 1 | 0 | Catálogo dos dez serviços com título, resumo e link |
| BLOG_INDEX | 1 | 1 | 0 | Últimas postagens, arquivo visual e links |
| BLOG_ARTICLE | 20 | 1 | 19 | Template editorial com imagem, autoria/data e seções |
| CONTACT | 1 | 1 | 0 | Contato público recuperado; contrato funcional do formulário ainda pendente |

## Totais

- URLs públicas auditadas: 143.
- Rotas Astro implementadas: 18.
- Rotas ainda não implementadas: 125.
- Famílias de layout: 8.
- Decisão de rota da auditoria: 141 KEEP, 0 REDIRECT, 0 REMOVE, 2 REVIEW.
- /contato está implementada visualmente, mas permanece functional_status=NEEDS_USER_DECISION.
- /mapa-site está implementada como índice de links, mas permanece REVIEW para confirmação SEO/UX.
- O conteúdo anteriormente concentrado em src/data/representatives.ts foi separado em src/content/marketing, src/content/blog e src/content/services. O arquivo legado de representação foi removido do app Astro.
