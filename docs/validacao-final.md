# Validação final — modernização AJN

## Ambiente

- Data: 2026-10-09.
- Branch: `modernization/ajn-site-2026-10-09`, baseada em `origin/main` `c96f446`.
- Ambiente: build estático local, `PUBLIC_SITE_ORIGIN=https://ajnengenharia.com.br`, `PUBLIC_ALLOW_INDEXING=true`.
- Última validação integral executada após tipagem do mock de consentimento e inclusão de teste funcional de busca/filtro/paginação do Blog.

## Evidência concluída

- `npm run validate`: cadeia completa terminou com sucesso.
- Astro check: 238 arquivos; zero erros, zero warnings e zero hints.
- Astro build: 155 páginas estáticas.
- SEO: 156 HTML auditados; fragments: 156 páginas e 320 referências locais.
- Deploy/indexação, segurança, links, contato, setores, workflow, hero, serviços da home, rodapé, Sobre, sitemap (151 rotas), auditorias editoriais/legais, consentimento, blog (28 artigos/cards/descrições/srcsets), SEO SST, catálogo (10 ofertas) e CSS morto passaram.
- Testes: links seguros 12/12; live security 4/4; privacidade/GA4 10/10; testes de auditoria de fragmentos passaram; busca/filtro do Blog cobre acentos, categoria/URL, estado vazio, expansão e reset/foco.
- `npm audit --omit=dev --audit-level=high`: zero vulnerabilidades.
- Browser real: Home e Blog no domínio oficial e no preview local, viewports CSS 320, 375, 390, 430, 768, 1024, 1440, 1920. `scrollWidth <= innerWidth` nas medições. Comparativos CSS 390×844 em `output/playwright/live-cdp-home-390x844.png`, `live-cdp-blog-390x844.png`, `local-cdp-home-390x844.png` e `local-cdp-blog-390x844.png` (artefatos locais ignorados pelo Git).

## Não medido/não confirmado

- Lighthouse e métricas de campo LCP/INP/CLS.
- Auditoria WCAG completa com teclado, leitor de tela, axe-core, zoom e movimento reduzido.
- Entrega real de lead do formulário, estado do provedor de hospedagem e permissões empresariais.
- Search Console, backlinks, conversões, autorização de logos de clientes e credenciais profissionais.
- Revisão por responsável técnico dos novos artigos normativos.

## Publicação

Alterações organizadas em commits na branch `modernization/ajn-site-2026-10-09`, destinada à revisão por PR. Nenhum merge ou deploy foi executado; o domínio oficial continua sem as alterações desta branch.
