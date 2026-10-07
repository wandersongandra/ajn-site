# Plano horário de melhoria — AJN Astro

Início: 2026-10-06  
Staging: https://sienna-mongoose-223157.hostingersite.com  
Branch de deploy do staging: `main`

## Regras

- Uma fase por execução, com duração-alvo de aproximadamente 1 hora.
- Cada fase deve ler o estado atual antes de alterar qualquer arquivo.
- Não alterar DNS, WordPress legado, banco ou domínio oficial.
- O staging deve permanecer `noindex` enquanto usar o domínio temporário.
- Só atualizar `main` quando o lote da fase estiver coerente e o gate técnico estiver saudável.
- Nunca inventar conteúdo, equipe, certificações, avaliações ou métricas.
- Respeitar `prefers-reduced-motion` e acessibilidade.
- Atualizar este arquivo ao final de cada fase com status, commit e pendências reais.

## Fases

| Hora | Fase | Escopo principal | Status |
|---|---|---|---|
| 1 | Design system e tipografia | Fonte, escala tipográfica, rendering, ritmo, tokens, movimento-base e quality gate | DONE |
| 2 | Home e conversão | Hero, ordem das seções, densidade, clientes, soluções, portfólio, diferenciais e CTAs | TODO |
| 3 | Páginas internas | Legibilidade, largura de leitura, headings, galerias, sidebars, serviços e marketing | TODO |
| 4 | Motion e microinterações | Entradas sutis, hover/focus, menus, cards, feedback e redução de movimento | TODO |
| 5 | SEO técnico | Titles, descriptions, canonicals, robots, sitemap, schema, breadcrumbs, 404 e redirects | TODO |
| 6 | Performance e mídia | Imagens, carregamento, formatos, fontes, CSS/JS, cache e desperdícios | TODO |
| 7 | Acessibilidade e mobile | Teclado, foco, contraste, labels, touch targets, 360/390/768/1024 | TODO |
| 8 | QA final e polimento | Staging completo, consistência visual, links, imagens, regressões e relatório final | TODO |

## Fase 1 — resultado

Implementado:

- migração tipográfica de Poppins para Manrope;
- melhoria de legibilidade e suavização de fonte;
- hierarquia de títulos mais consistente;
- escala básica de espaçamento;
- animação de entrada sutil no hero;
- estados de hover/focus nos principais cards;
- preservação de `prefers-reduced-motion`;
- workflow de qualidade no GitHub para `npm ci`, `astro check`, build e audit de dependências.

Critério de continuidade:

- manter o site totalmente estático;
- não adicionar bibliotecas de animação sem necessidade;
- priorizar percepção de qualidade, legibilidade e performance.
