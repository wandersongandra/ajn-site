# Auditoria SEO — preparação final

Data: 2026-10-06

## Implementado

- Origem canônica configurável por `PUBLIC_SITE_ORIGIN`.
- Política de indexação configurável por `PUBLIC_ALLOW_INDEXING`.
- Canonical normalizado por página.
- Robots meta por ambiente.
- Open Graph e Twitter Cards por página, com imagem padrão.
- Schema `Organization` com dados públicos da AJN.
- Geração automática de `sitemap.xml` a partir dos HTML efetivamente produzidos no `dist`.
- Geração automática de `robots.txt`.
- Auditoria local `npm run audit:seo` para title, description, canonical, robots e exatamente um H1.
- CI executa check, build, audit SEO e npm audit.

## Decisões

- O sitemap não usa o inventário legado como fonte; ele contém apenas rotas realmente geradas. Isso evita publicar URLs ainda não migradas.
- Preview/staging deve usar `PUBLIC_ALLOW_INDEXING=false`.
- Produção deve usar `PUBLIC_ALLOW_INDEXING=true`.
- Nenhum redirect novo foi inventado nesta rodada. `docs/REDIRECTS.md` continua sendo a fonte de decisão editorial.

## Pendências reais

- Fechar a decisão das páginas `REVIEW` antes da troca de produção.
- Migrar as rotas KEEP restantes.
- Revalidar titles/descriptions duplicados após a migração completa.
- Validar redirects somente quando houver destino equivalente comprovado.
- Rodar o audit SEO no build completo antes da produção.

## Status

`WARN` enquanto a migração de rotas não estiver completa. A infraestrutura SEO está preparada sem afirmar que o inventário editorial final está resolvido.
