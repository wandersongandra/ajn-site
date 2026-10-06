# Auditoria SEO — Fase 3
Data: 2026-10-06

## Implementado
- canonical absoluto por página;
- robots meta com noindex por ambiente;
- Open Graph e Twitter Card;
- robots.txt e sitemap.xml estáticos;
- 404 noindex;
- npm run audit:site;
- headers de segurança para hosts compatíveis com _headers.

O sitemap inclui somente as rotas realmente implementadas para não anunciar 404s. Links para rotas futuras ficam como WARN até a migração terminar. Structured data não foi inventado porque não ficou comprovado no legado.

Antes do corte, executar: `AUDIT_STRICT_LINKS=1 npm run audit:site`.
