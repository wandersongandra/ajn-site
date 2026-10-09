# Validação final — modernização AJN

## Complemento de validação — catálogo e blog, 2026-10-09

Esta rodada acrescentou serviços a páginas existentes, três artigos e categorias; não publicou em produção.

- `npm run validate`: PASS com `PUBLIC_SITE_ORIGIN=https://ajnengenharia.com.br` e `PUBLIC_ALLOW_INDEXING=true`. Astro check: 241 arquivos, 0 erros, 0 warnings e 0 hints. Build: 158 páginas estáticas.
- SEO: 159 HTML auditados; âncoras: 159 páginas/338 referências. Sitemap: 154 rotas. Auditoria de segurança: 202 fontes e 159 páginas compiladas.
- Blog: 31 artigos, 31 cards, descrições e srcsets; imagens OG presentes; nenhuma URL anterior foi removida.
- Catálogo: 13 cartões em três grupos; busca/filtros funcionais no script e auditoria; 328 KiB somados pelas imagens carregadas diretamente no catálogo.
- Auditorias de Home, contato, setores, workflow, rodapé, Sobre, sitemap, editorial/legal, cookies, SEO SST e CSS morto: PASS.
- Testes: links seguros 12/12; live-security mockado 4/4; consentimento 10/10; testes do auditor de âncoras passaram.
- `npm audit --omit=dev --audit-level=high`: 0 vulnerabilidades.
- Playwright CLI: catálogo em 390×844; busca PGR anunciou 1 resultado e ocultou os grupos sem resultados. Artigo PPCIP em 390×844 apresentou H1, sumário, links oficiais, links de serviço e CTA. `document.documentElement.scrollWidth` e `clientWidth` foram ambos 390 px na página do artigo, sem overflow horizontal observado.
- Capturas locais, ignoradas pelo Git: `output/playwright/local-services-catalog-390x844.png` e `output/playwright/local-blog-ppcip-390x844.png`.
- GitHub: PR #58 permanece aberto contra `main`, branch `modernization/ajn-site-2026-10-09`, SHA `9b3bedeb51a461aeb58aa8fa5b1517b5bd7ea74f`; Quality Gate, CodeQL JavaScript/Actions, Dependency audit e Secret Leak Scan passaram.
- Publicação: commit e push realizados na branch de revisão; merge e deploy não realizados.

Lighthouse, CrUX/RUM, axe-core e teste manual completo com teclado/leitor de tela não foram executados nesta rodada. Os testes live-security do pacote são unitários com fetch mockado; não representam uma nova consulta ao servidor de produção.

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
