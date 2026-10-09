# Testes e validação

**Data:** 2026-10-08 · **Ambiente local:** PowerShell, Node 24.13.0, npm 11.12.1, checkout `astro-site`.

| Comando/checagem | Resultado observado | Evidência/limite |
|---|---|---|
| `git status --short --branch` pré-alteração | branch de segurança no commit `5a5edaf`, worktree limpo | `main` e `origin/main` no mesmo SHA no início |
| `npm run test:security-links` | PASS — 5 testes, 0 falhas | caminhos locais/HTTPS aceitos; javascript, data, protocol-relative, barra invertida normalizada como origem externa, HTTP, credenciais e tipos inválidos rejeitados |
| `npm run audit:security` | PASS — 188 arquivos | sinks DOM, storage, CSP/headers, JSON-LD e scripts inline |
| `npm audit --audit-level=high` | PASS — 0 vulnerabilidades conhecidas | advisories disponíveis ao registry no momento da execução |
| `npm run check` com origin preview e indexação falsa | PASS — 217 arquivos, 0 erros/avisos/hints | não valida Hostinger nem renderização visual |
| `npm run build` com origin preview e indexação falsa | PASS — 144 páginas estáticas | geração local; não é prova de deploy |
| `npm run validate` com origin preview e indexação falsa | FAIL após check, build e vários gates PASS | `audit:editorial` interrompeu em título SEO de 23 caracteres na página `/elaboracao-pgr/`; não alterado por ser conteúdo SEO fora do escopo de segurança |
| `npm run audit:sst-seo` com origin preview | FAIL — 6 verificações | cinco canonicals diferem do origin preview esperado e título SEO de 22 caracteres em `/emissao-ltcat/`; não é falha de canonical no build indexável de produção |
| `npm run audit:sst-seo` com origin de produção | FAIL — título de 22 caracteres | canonical das cinco páginas passa; requer decisão editorial para o título curto de `/emissao-ltcat/` |
| Gates independentes após a interrupção | PASS — contato, setores, workflow, hero, home services, footer, about, sitemap, fixtures, catálogo de serviços e CSS | `audit:sst-seo` é o único gate independente observado como falho nesta rodada além do `audit:editorial` incluído em `validate` |
| Build com origin de produção e indexação verdadeira + `audit:deploy`, `audit:seo`, `audit:sitemap`, `audit:security` | PASS | 144 páginas; indexação/canonical/robots coerentes; `audit:seo` verifica 145 HTML gerados |
| GET público de Home, Sobre, Contato, Serviços e sitemap-index | HTTP 200 | produção já entrega Astro; canal de contato está no fallback |
| GET público de robots e sitemap | `/robots.txt` 200, `sitemap-index.xml` 200 | `/sitemap.xml` 404, esperado para este índice; robots aponta para sitemap-index |
| GET público de privacidade e termos | HTTP 404 em ambas | achado aberto; conteúdo não foi inventado |
| GET headers em páginas e sitemap | CSP e headers existentes presentes; HSTS ausente | snapshot público de 2026-10-08; nenhum header foi alterado remotamente |
| GET de HTTP apex e `www` | HTTP 301 para HTTPS correspondente | `www` HTTPS continua 200, sem redirect ao apex; canonical HTML aponta ao apex |
| GET host staging | raiz falhou; robots respondeu sem headers do repositório | origem atual não comprovada, status BLOQUEADO |
| `git diff --check` e `git diff --cached --check` | PASS | verificação sem whitespace errors antes do commit de documentação |

Não houve teste de browser/teclado, POST, carga, fuzzing, DAST ativo, scanner em produção ou acesso administrativo. Sem isso, comportamento visual, formulário de provedor, configurações de conta e headers depois da publicação permanecem não verificados.
