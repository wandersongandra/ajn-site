# Staging / preview — preparação

Data: 2026-10-06

## Estado

Nenhum deploy foi executado nesta rodada.

O projeto está preparado para preview estático com:

- Node 22;
- `npm ci`;
- `npm run validate`;
- build em `dist/`;
- `PUBLIC_SITE_ORIGIN` configurado para a URL do preview quando aplicável;
- `PUBLIC_ALLOW_INDEXING=false` obrigatoriamente em preview/staging.

## Opção recomendada

Para este projeto estático, prefira um provedor de páginas estáticas com integração Git e preview por branch. Cloudflare Pages é compatível com o modelo atual, mas a publicação só deve ocorrer após autorização do destino.

Configuração esperada:

- Build command: `npm run build`
- Output directory: `dist`
- Node: 22
- Env preview: `PUBLIC_ALLOW_INDEXING=false`
- Env production: `PUBLIC_ALLOW_INDEXING=true`

## Gate antes de produção

1. CI verde.
2. Todas as rotas KEEP migradas ou justificadas.
3. QA visual sem CRITICAL/MAJOR.
4. SEO audit sem FAIL.
5. Preview com `noindex`.
6. Formulário/contato aprovado.
7. Redirects finais definidos.
8. Backup WordPress preservado.
9. Troca de DNS/domínio somente mediante autorização explícita.

## Status

`PRODUCTION_BLOCKED` — a preparação de staging está pronta, mas migração, QA e decisões editoriais ainda não terminaram.
