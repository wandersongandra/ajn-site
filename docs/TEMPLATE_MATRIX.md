# Matriz de templates — Fase 3 / Família C

Data: 2026-10-06
Fonte: auditoria das 143 URLs públicas, arquivos locais recuperados e
`docs/MARKETING_CONTENT_AUDIT.md`.

| Template/família | URLs no legado | Implementadas no Astro | Restantes | Estrutura |
|---|---:|---:|---:|---|
| HOME | 1 | 1 | 0 | Hero, apresentação, clientes, missão/visão/valores, soluções, portfólio, diferenciais, destaques, popup e footer |
| INSTITUTIONAL | 3 | 3 | 0 | Sobre nós, informações e mapa do site |
| MARKETING_GALLERY_STANDARD | 100 | 70 | 30 | Galeria de 3 imagens, conteúdo editorial com H2/H3, listas quando presentes e CTA |
| MARKETING_GALLERY_RICH | 7 | 3 | 4 | Mesmo template, com 4–6 imagens e maior densidade de conteúdo/listas |
| SERVICE_DETAIL | 9 | 9 | 0 | Template único com imagem, informações e conteúdo técnico por arquivo |
| SERVICES_INDEX | 1 | 1 | 0 | Catálogo dos serviços com título, resumo e link |
| BLOG_INDEX | 1 | 1 | 0 | Últimas postagens, arquivo visual e links |
| BLOG_ARTICLE | 20 | 1 | 19 | Template editorial com imagem, autoria/data e seções |
| CONTACT | 1 | 1 | 0 | Contato público recuperado; contrato funcional do formulário ainda pendente |
| **Total** | **143** | **90** | **53** | — |

## Totais e decisões

- URLs públicas auditadas: 143.
- Rotas Astro implementadas antes da Família C: 18.
- Rotas ainda não implementadas: 53.
- A Família C auditou 106 páginas de marketing restantes; `/emissao-laudos` já
  é a primeira representante da família standard.
- A auditoria de conteúdo classificou inicialmente 62 páginas como KEEP e 44
  como REVIEW por alta similaridade lexical. A triagem final reclassificou as
  44 como KEEP; não houve REDIRECT ou REMOVE nesta fase.
- Famílias de layout estruturado: 9.
- A decisão de rota anterior permanece: 141 KEEP, 0 REDIRECT, 0 REMOVE, 2 REVIEW
  na auditoria geral de URLs; isso não substitui a classificação de conteúdo da
  Família C.
- `/contato` está implementada visualmente, mas permanece
  `functional_status=NEEDS_USER_DECISION`.
- `/mapa-site` está implementada como índice de links, mas permanece REVIEW para
  confirmação SEO/UX.
- O conteúdo anteriormente concentrado em `src/data/representatives.ts` foi
  separado em `src/content/marketing`, `src/content/blog` e
  `src/content/services`.
