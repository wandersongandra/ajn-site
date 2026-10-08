# Security hardening — 2026-10-08

## Escopo

Limpeza do site Astro, redução de duplicação de código cliente e criação de uma linha de base de segurança para o artefato estático publicado. A revisão foi feita sobre o código local e não substitui verificação do host público.

## Achados e correções

### SEC-001 — MEDIUM — Headers de segurança não estavam definidos no artefato publicado

- Evidência: a linha de base agora está em `public/.htaccess:4-8`.
- Impacto: sem aplicação desses headers no servidor, o navegador fica sem CSP, proteção contra MIME sniffing, anti-framing, política de referrer e restrições de permissões.
- Correção: adicionados CSP sem liberação de scripts inline/eval, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` e `Permissions-Policy`. A exceção `style-src-attr 'unsafe-inline'` é limitada aos atributos de estilo existentes; blocos `<style>` continuam proibidos.
- Limite: `NÃO VERIFICADO` no Hostinger/edge; o servidor real precisa confirmar que lê `.htaccess` e entrega esses headers.

### SEC-002 — MEDIUM — Scripts executáveis estavam embutidos em componentes Astro

- Evidência: os scripts agora são arquivos publicados em `public/scripts/` e referenciados por `src/components/Header.astro:74`, `src/components/BlogIndexPage.astro:62`, `src/components/ServicesIndexPage.astro:47` e `src/pages/index.astro:27`.
- Impacto: scripts inline impedem uma CSP estrita e ampliam a superfície de alteração acidental do HTML.
- Correção: comportamento preservado em arquivos externos, com auditoria CI em `scripts/audit-security.mjs` e execução pelo `package.json:23-25`.

### SEC-003 — LOW — JSON-LD era serializado diretamente em `set:html`

- Evidência: a serialização centralizada está em `src/utils/site.ts:10-17`; os usos foram atualizados em `src/layouts/BaseLayout.astro:96`, `src/layouts/BlogPost.astro:172`, `src/components/BlogArticlePage.astro:79` e `src/components/PageShell.astro:34`.
- Impacto: o conteúdo atual é controlado pelo repositório, portanto não foi confirmada exploração. A serialização anterior deixava uma defesa importante dependente de todos os dados futuros permanecerem confiáveis.
- Correção: caracteres HTML sensíveis são escapados antes da inserção do JSON-LD.

### SEC-004 — LOW — Componentes órfãos mantinham armazenamento client-side sem uso

- Evidência: `CookieBanner.astro` e `PromoDialog.astro` não tinham importadores no projeto e foram removidos junto com o CSS exclusivo do toast promocional.
- Impacto: código morto aumenta superfície de manutenção e pode reintroduzir armazenamento ou comportamento não utilizado em futuras integrações.
- Correção: remoção limitada aos componentes comprovadamente órfãos; nenhuma página ou URL pública foi removida.

## Validação

- `npm run check`: PASS — 211 arquivos, 0 erros, 0 warnings, 0 hints.
- `npm run build`: PASS — 145 páginas; `.htaccess` e scripts externos presentes em `dist/`.
- `npm run validate`: PASS — auditorias de SEO, fragments, deploy, segurança, contato, setores, workflow, hero, serviços da home, footer e testes de auditoria.
- `npm audit --omit=dev --audit-level=high`: PASS — 0 vulnerabilidades.
- `git diff --check`: PASS.
- Navegador local: PASS em Home, Blog e Serviços; pesquisa do blog e filtro de serviços funcionaram; console sem erros ou warnings nas páginas verificadas.

## Pendências de evidência

- `NÃO VERIFICADO`: headers efetivos no domínio publicado após deploy.
- `NÃO VERIFICADO`: CSP em produção, pois o preview estático local não aplica `.htaccess`.
- `NÃO REALIZADO`: teste de penetração externo, varredura DAST e revisão do provedor de hospedagem.
