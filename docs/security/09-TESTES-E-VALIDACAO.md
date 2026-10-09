# Testes e validação

**Data:** 2026-10-08 · **Ambiente local:** PowerShell, Node 24.13.0, npm 11.12.1, checkout `astro-site`.

| Comando/checagem | Resultado observado | Evidência/limite |
|---|---|---|
| `git status --short --branch` pré-alteração | branch de segurança no commit `5a5edaf`, worktree limpo | `main` e `origin/main` no mesmo SHA no início |
| `npm run test:security-links` | PASS — 6 testes, 0 falhas | links root-relative/HTTPS aceitos; esquemas/códigos, protocolos, relativos suspeitos, barras invertidas e credenciais rejeitados; payload HTML escapado em JSON-LD e válido após parse |
| `npm run audit:security` | PASS — 189 fontes + 145 HTML compilados | sinks, CSP/HSTS/redirect configurados, scripts, links perigosos e JSON-LD renderizados parseados |
| `npm audit --audit-level=high` | PASS — 0 vulnerabilidades conhecidas | advisories disponíveis ao registry no momento da execução |
| `npm run check` dentro de `npm run validate` (preview) | PASS — 218 arquivos, 0 erros/avisos/hints | não valida Hostinger nem renderização visual |
| `npm run validate` com origin preview e `PUBLIC_ALLOW_INDEXING=false` | PASS — build e todos os gates encadeados | 144 páginas; canonical do preview, `noindex`, audits editorial/SST, segurança e regressões passaram |
| `npm run check` standalone com origin de produção/indexação true | PASS — 218 arquivos, 0 erros/avisos/hints | repetido no perfil de produção |
| `npm run validate` com origin `https://ajnengenharia.com.br` e `PUBLIC_ALLOW_INDEXING=true` | PASS — build e todos os gates encadeados | 144 páginas; canonical apex e indexação coerentes; inclui editorial/SST e regressões |
| `npm run validate` final repetido com origin preview e `PUBLIC_ALLOW_INDEXING=false` | PASS — build e todos os gates encadeados | revalidação final após alterações; 144 páginas e `noindex` preservado |
| `npm run audit:editorial` + `npm run audit:sst-seo` no preview | PASS | canonicals usam origin do build e cada página avaliada contém `noindex` |
| Causa das divergências anteriores de canonical | RESOLVIDA | o auditor standalone defaultava para apex ao comparar um artefato preview; agora exige origin e estado de indexação explícitos |
| Build de produção + `audit:deploy`, `audit:seo`, `audit:editorial`, `audit:sst-seo`, `audit:security` com apex e indexação true | PASS | 144 páginas; canonical/robots indexáveis coerentes em 145 HTML; títulos PGR/LTCAT dentro dos limites |
| `npm audit --omit=dev --audit-level=high` | PASS — 0 vulnerabilidades conhecidas | compatível com gate de produção do workflow |
| Audits adicionais do workflow (`audit-blog`, `audit-header`, `audit-home`, `audit:assets`) | PASS | inventário reportou duplicatas existentes; diagnóstico apenas, nenhum arquivo removido |
| GET público de Home, Sobre, Contato, Serviços e sitemap-index | HTTP 200 | produção já entrega Astro; canal de contato está no fallback |
| GET público de robots e sitemap | `/robots.txt` 200, `sitemap-index.xml` 200 | `/sitemap.xml` 404, esperado para este índice; robots aponta para sitemap-index |
| GET público de privacidade e termos | HTTP 404 em ambas | achado aberto; conteúdo não foi inventado |
| GET headers em páginas e sitemap | CSP e headers existentes presentes; HSTS ausente | snapshot público de 2026-10-08; nenhum header foi alterado remotamente |
| GET de HTTP apex e `www` | HTTP 301 para HTTPS correspondente | `www` HTTPS continua 200, sem redirect ao apex; canonical HTML aponta ao apex |
| GET host staging | raiz falhou; robots respondeu sem headers do repositório | origem atual não comprovada, status BLOQUEADO |
| `git diff --check` | PASS nesta revisão | sem erros de whitespace; avisos de conversão LF/CRLF do Git no Windows não alteram conteúdo |
| `git diff --cached --check` | PASS antes dos commits | stage explícito do código e da documentação, sem erros de whitespace |

Não houve QA de browser no Hostinger porque o root do preview falha e não existe collector CSP; também não houve POST, carga, fuzzing, DAST ativo ou acesso administrativo. O redirect/header candidate depois da aplicação, o plano/document root Hostinger, o formulário de provedor e a renderização visual/teclado permanecem não verificados.
