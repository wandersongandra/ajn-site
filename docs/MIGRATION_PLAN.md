# Plano de migração AJN

Status geral: `WARN` — o shell moderno e a cobertura inicial de rotas foram implementados; a migração fiel de cada conteúdo interno ainda está em andamento.

## Princípios

1. WordPress, uploads, caches e SQL permanecem read-only.
2. `new-site/` é a única aplicação editável.
3. A publicação pública atual é a referência visual e de conteúdo quando divergir do backup local.
4. Nenhum texto, número, cliente, case, depoimento ou integração será inventado.
5. Elementor é fonte de auditoria, não dependência do runtime.
6. Commit, push, PR, deploy, DNS, SMTP real e produção permanecem fora desta execução.

## Fases

| Fase | Status | Evidência |
|---|---|---|
| Segurança do workspace | `PASS` | `.gitignore` reforçado; segredos redigidos; nenhuma exclusão |
| Auditoria local/publicada | `PASS/WARN` | cópias comparadas; divergência documentada |
| Inventário de URLs | `PASS` | 143 rotas do sitemap; títulos/meta coletados |
| Elementor/banco/leads | `WARN/BLOCKED` | CSS e resíduos identificados; banco atual/formulários não confirmados |
| Design system | `PASS inicial` | tokens Poppins/verde e medidas públicas aplicados |
| Scaffold | `PASS` | Next.js App Router, TypeScript strict, lint, testes e env example |
| Implementação visual | `WARN` | home e shell atualizados; corpo editorial das 143 URLs extraído e renderizado server-side; equivalência visual página a página ainda requer QA |
| SEO | `WARN` | metadata por rota e sitemap novo; canonical/structured data completo pendente |
| QA | `PASS técnico / WARN visual` | typecheck, lint, testes, build e browser local passaram; comparação visual completa ainda pendente |
| Staging | `BLOCKED` | nenhum deploy autorizado |

## Próximos incrementos seguros

1. Comparar home em browser real nos breakpoints 320–1920px com a publicação.
2. Comparar visualmente home, páginas institucionais, listagens e artigos com a publicação, mantendo cada slug.
3. Reconciliar imagens por rota e alt text; os 429 assets extraídos devem passar por revisão de duplicidade/uso.
4. Fechar SEO por URL: canonical, OG/Twitter, robots, schema, links internos e redirects.
5. Confirmar formulário/anti-spam com fixture anônima e adapter de entrega desabilitado.
6. Rodar build, testes, links, accessibility smoke e auditoria visual antes de preparar preview.

## Não migrar automaticamente

`wp-config.php`, salts, usuários, logs, WAF, cache, transients, backups, SQL, SMTP, tokens, submissions e dados pessoais. Esses artefatos ficam somente no perímetro legado e fora do Git.
