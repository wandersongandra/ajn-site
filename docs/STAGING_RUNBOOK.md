# Preview / staging — Fase 5

O CI valida e gera `dist/` como artefato, sem deploy automático.

Para Cloudflare Pages:
- build: `npm ci && npm run build`
- output: `dist`
- Node 22
- `PUBLIC_SITE_ORIGIN=https://www.ajnengenharia.com.br`
- `PUBLIC_SITE_NOINDEX=true` em staging.

Produção permanece bloqueada até concluir rotas KEEP, links estritos, redirects, entrega do formulário e QA real.
