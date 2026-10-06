# Auditoria crítica da implementação atual

Data: 2026-10-06

## Veredito executivo

**STATUS GERAL: FAIL para produção.**

O build está funcional, mas a arquitetura atual não corresponde ao requisito de um site institucional estático simples, o formulário não preserva o contrato público atual e há regressões de SEO e fidelidade visual. O novo app não deve ser publicado antes das correções listadas neste documento.

## 1. Next.js versus Astro

### Conclusão

Para um site institucional sem banco, login, CMS ou backend próprio, **Astro é tecnicamente a escolha mais adequada**: geração estática como caminho principal, HTML por padrão, JavaScript apenas em ilhas interativas e menor superfície de runtime.

Next.js só se justifica aqui se houver uma decisão deliberada de manter no mesmo projeto um Route Handler de contato, ISR ou futura aplicação React dinâmica. A implementação atual não usa banco, autenticação, painel, Server Actions ou integrações reais; portanto, a escolha de Next.js foi mais ampla que a necessidade confirmada.

O uso de Next.js pode ser mantido por familiaridade da equipe e pela migração já iniciada, mas isso não é uma justificativa técnica suficiente para declarar a arquitetura ideal.

### Recursos encontrados

| Recurso | Estado | Evidência |
|---|---|---|
| SSR/ISR | SIM | `src/app/[...slug]/page.tsx:7-9` usa `revalidate = 3600` |
| API Route/Route Handler | SIM | `src/app/api/contact/route.ts:18` exporta `POST` |
| Server Actions | NÃO ENCONTRADO | nenhuma diretiva `use server` |
| Middleware | NÃO ENCONTRADO | nenhum `middleware.ts` |
| Runtime Node explícito | NÃO DECLARADO | o Route Handler usa o runtime padrão; não há `runtime` explícito |
| Função server-only | SIM, implícita | `src/lib/live-content.ts:1-12` usa `node:fs` e `node:path`, mas não possui marcação `server-only` |
| Banco/ORM/auth | NÃO ENCONTRADO | nenhum driver, migration ou módulo de autenticação |
| Client Components | SIM | Header, popup, formulário e carrossel usam `use client` |

### Static

**STATIC = NO no estado atual.**

`next.config.ts:10-18` não define `output: "export"`. Mesmo que fosse adicionado, o `POST /api/contact` não poderia continuar como Route Handler local em uma exportação puramente estática. O ISR e a leitura server-side de `public/live-content` também teriam de ser convertidos para dados incorporados durante o build.

STATIC = YES só é tecnicamente correto depois de:

1. remover o Route Handler interno;
2. usar um endpoint externo de formulário aprovado ou uma integração client-side equivalente;
3. transformar os 143 conteúdos em dados de build;
4. remover `revalidate` e qualquer leitura de filesystem em runtime;
5. validar `output: "export"`, links, sitemap e 404 gerados.

## 2. Auditoria de rotas

O inventário completo está em [`ROUTES_AUDIT.md`](./ROUTES_AUDIT.md).

- 143 URLs do sitemap auditadas.
- 142 classificadas como `KEEP` provisório.
- 1 classificada como `REVIEW` por conteúdo muito curto (`/contato`).
- Nenhum anexo WordPress, taxonomia, página de mídia ou arquivo identificado no sitemap.
- Nenhuma duplicata textual exata encontrada entre as 143 páginas.
- `/ajn-projeto` é um alias fora do sitemap e deve ser `REDIRECT` para `/` ou removido após aprovação.
- `/politica-de-privacidade` e `/termos-de-uso` estão fora do sitemap público observado e precisam de decisão SEO/jurídica.

`KEEP` no relatório significa preservar temporariamente a URL; não significa que a página esteja aprovada para publicação.

## 3. Auditoria de imagens

O inventário completo está em [`ASSETS_AUDIT.md`](./ASSETS_AUDIT.md).

- 429 imagens foram baixadas do conteúdo público.
- 513 imagens existem em `public/` considerando assets antigos e auxiliares.
- O lote público ocupa 27,35 MB.
- As 429 imagens são referenciadas pelo HTML local ou pelo código.
- Não há órfãs dentro do lote público.
- 343 arquivos do lote público são duplicatas exatas por SHA-256, resultado de nomes/caminhos diferentes para o mesmo arquivo.
- 16 imagens têm 300 KB ou mais e precisam de revisão de compressão/formato.
- O novo projeto mantém cópias duplicadas entre `ajn-live/` e `ajn-live/content/`.

Conclusão: o crawler preservou demais. Não houve perda de imagem, mas o resultado não é uma biblioteca de assets simples para manutenção.

## 4. Arquitetura e manutenção

### Problemas confirmados

1. `src/components/site/LivePage.tsx:33` usa `dangerouslySetInnerHTML` para renderizar HTML bruto.
2. Existem 143 arquivos HTML gerados em `public/live-content/`.
3. O conteúdo está dividido entre `live-pages.ts`, `live-home.ts`, `live-content-manifest.ts`, os HTML gerados e o antigo `src/data/site.ts`.
4. `ImageCarousel.tsx`, `SectionHeading.tsx` e `src/data/site.ts` não possuem consumidores ativos no fluxo público atual e aparentam ser resíduos da primeira implementação.
5. Homepage, páginas institucionais, índice de links e páginas de detalhe usam fontes de conteúdo e layouts diferentes.
6. O crawler é reproduzível, mas uma nova execução pode sobrescrever conteúdo extraído da publicação sem revisão editorial intermediária.

### Risco do HTML bruto

O crawler removeu scripts, estilos inline, formulários, iframes e handlers de evento, e a inspeção atual não encontrou `javascript:` nem handlers perigosos nos HTML locais. Isso reduz o risco atual, mas não elimina a fragilidade: qualquer alteração manual nos arquivos pode reintroduzir XSS porque o runtime injeta o conteúdo sem sanitização.

### Veredito arquitetural

**WARN/HIGH:** virou parcialmente um espelho de HTML raspado. A manutenção pelo VS Code é possível, mas ruim: editar uma página significa editar HTML gerado, sem tipos de conteúdo, componentes de artigo ou modelo semântico. Para manutenção simples, o conteúdo deveria ser Markdown/MDX ou objetos tipados, com componentes React/Astro para galeria, CTA, breadcrumbs e contato.

## 5. Formulários

O comparativo detalhado está em [`FORMS_AUDIT.md`](./FORMS_AUDIT.md).

### Falhas críticas

- O site público atual possui um formulário WhatsApp no popup; o novo app substituiu isso por um link para `/contato`.
- O formulário público de contato aceita `anexo` e `como_nos_conheceu`; o novo não aceita nenhum dos dois.
- O público atual usa `multipart/form-data` e reCAPTCHA; o novo envia JSON, usa honeypot e não implementa reCAPTCHA/Turnstile.
- O novo delivery está desativado e retorna HTTP 503 (`src/app/api/contact/route.ts:41-43`).
- Não existe banco ou `/admin/leads`, conforme solicitado nesta auditoria.

**STATUS: FAIL — formulário importante desapareceu e o envio novo não está operacional.**

## 6. SEO

### Regressões confirmadas ou prováveis

| Finding | Evidência | Severidade |
|---|---|---|
| Domínio canônico sem `www` no exemplo/default | `.env.example:1` e `layout.tsx:14`; publicação confirma `https://www.ajnengenharia.com.br/` | HIGH |
| Títulos internos duplicam sufixo | `live-pages.ts` já contém `- AJN Consultoria e Engenharia`; `layout.tsx:17` adiciona template `| AJN...` | HIGH |
| Open Graph não é gerado por página | `layout.tsx:22-28` define OG global; metadata dinâmica só retorna title, description e canonical | HIGH |
| Twitter Cards ausentes | nenhum `twitter` em metadata | MEDIUM |
| Robots não preserva regras públicas existentes | `robots.ts:4` permite tudo; o robots live contém disallows específicos | MEDIUM |
| Structured data não confirmada | nenhum JSON-LD no app | MEDIUM |
| Redirects/trailing slash não configurados | nenhum `redirects()` ou regra equivalente em `next.config.ts` | MEDIUM |
| Sitemap não inclui rotas legais/alias locais | `sitemap.ts` usa apenas `livePages` | MEDIUM |

O site público atual redireciona domínio sem `www` para `www`; isso precisa ser preservado na infraestrutura final e no `metadataBase`.

## 7. Validação visual por template

Não foi feito pixel diff das 143 páginas. Foram agrupados os templates e testadas páginas representativas em 1440, 768 e 390 pixels.

| Template | Representantes | Resultado local | Observação comparativa |
|---|---|---|---|
| HOME | `/` | PASS técnico | popup e header diferem visualmente do público |
| ABOUT | `/sobre-nos` | PASS técnico | conteúdo e shell carregam; composição não é equivalente pixel a pixel |
| SERVICES_INDEX | `/servicos` | PASS técnico | grade nova não reproduz exatamente o template público |
| CONTACT | `/contato` | PASS técnico | campos e fluxo diferem do formulário público |
| BLOG_INDEX | `/blog` | PASS técnico | índice novo é uma grade de links, não comparação garantida com a listagem pública |
| INFORMATION_INDEX | `/informacoes` e `/mapa-site` | PASS técnico | cobertura de links preservada, layout simplificado |
| MARKETING_DETAIL | `/emissao-laudos` | PASS técnico | corpo textual/imagens presentes via HTML local |
| BLOG_ARTICLE | artigo LTCAT | PASS técnico | corpo presente, sem garantia de composição lateral original |
| SERVICE_DETAIL | `/servicos/gestao-ambiental` | PASS técnico | corpo presente, template genérico |

### Medição de overflow

- Novo app: `scrollWidth` igual ao viewport em 1440, 768 e 390 nos representantes.
- Publicação atual: `scrollWidth` observado em 1058px para viewport 768 e 474px para viewport 390 em vários representantes. O legado possui overflow horizontal real; o novo app corrige esse sintoma, mas isso também significa que a geometria não é idêntica.
- A homepage pública ainda produz erro Slick `initADA`; o novo app não reproduziu esse erro.

### Diferenças visuais críticas da homepage

- Publicação: popup central modal com overlay escuro e CTA dentro da peça.
- Novo app: popup fixado no canto inferior direito, com CTA separado abaixo da imagem.
- Publicação: header compacto com menu hambúrguer e botão verde de treinamentos em 1440px.
- Novo app: navegação horizontal aberta e logo maior em desktop.

## 8. Tamanho e complexidade

| Métrica | Valor observado |
|---|---:|
| `node_modules/` | 443,80 MB |
| projeto sem `node_modules`, `.next`, `.git` e artefatos de QA | 36,97 MB |
| `public/` | 36,43 MB |
| imagens em `public/` | 35,32 MB |
| componentes TS/TSX | 8 |
| arquivos de rota/config App Router | 8 |
| arquivos HTML locais de conteúdo | 143 |
| Client Components | 4 arquivos |
| `dangerouslySetInnerHTML` | 1 ocorrência |
| JavaScript solicitado na homepage | 8 chunks, aproximadamente 469,7 KB sem compressão |

A auditoria de rede capturou 42 requisições na homepage de produção local, incluindo 5 fontes, chunks, imagens, RSC e assets. O número de JavaScript não é mínimo para uma página institucional; a presença do shell React/Next e quatro Client Components é o principal custo.

Não foi coletada uma trace DevTools/Lighthouse com LCP, INP e CLS nesta execução; esses valores ficam **NÃO VERIFICADOS**. A presença de `<img>` bruto nos HTML locais sem dimensões explícitas é um risco de CLS.

## 9. Segurança

### Findings

- **HIGH — delivery inexistente:** `src/app/api/contact/route.ts:41-43` retorna 503 em modo desabilitado; o formulário não entrega mensagens.
- **MEDIUM — rate limit não distribuído:** `route.ts:6` usa `Map` em memória; múltiplas réplicas não compartilham limite e chaves podem crescer com IPs falsificados.
- **MEDIUM — confiança em headers de proxy:** `route.ts:8-10` aceita `x-real-ip`/`x-forwarded-for` sem uma cadeia de proxy configurada e validada.
- **MEDIUM — HTML confiado em runtime:** `LivePage.tsx:33` injeta arquivos locais sem sanitização runtime; atualmente os arquivos passaram no filtro do crawler.
- **MEDIUM — CSP ausente:** `next.config.ts:3-15` define alguns headers, mas não CSP.
- **LOW — runtime server implícito:** `src/lib/live-content.ts` não declara uma fronteira `server-only` explícita.

`npm audit --omit=dev --audit-level=high` passou com zero vulnerabilidades no grafo de produção durante esta auditoria.

## 10. Classificação final

### PASS

- Legado e banco permaneceram sem alteração.
- Não houve commit, push, PR, deploy ou DNS.
- Build, typecheck, lint e testes existentes passaram na rodada anterior.
- 143 URLs foram inventariadas e 429 imagens foram auditadas.
- O novo app não reproduziu o overflow observado no legado nos representantes.

### WARN

- Next.js é mais amplo que a necessidade de um site estático.
- Conteúdo em HTML raspado dificulta manutenção.
- Há duplicidade significativa de imagens e fontes de conteúdo.
- A equivalência visual completa ainda não foi atingida.
- Core Web Vitals reais não foram medidos.

### FAIL

- STATIC = NO.
- Formulário novo incompatível com o público e sem delivery.
- Regressões de title, OG, domínio canônico e robots precisam ser corrigidas.
- Popup e header não reproduzem o layout atual.

### BLOCKED

- Destino real dos e-mails, webhooks e leads históricos não pode ser confirmado sem fonte operacional/credencial autorizada.
- Deploy, staging público, DNS e provider de e-mail permanecem fora do escopo autorizado.

## Pronto para produção

**NÃO.**

## Precisa corrigir

1. Decidir Astro/static export versus manter Next com backend.
2. Corrigir o contrato dos formulários e preservar WhatsApp, origem e anexo.
3. Corrigir metadata por página, `www`, robots, OG/Twitter, sitemap e redirects.
4. Reproduzir header/popup e templates reais da publicação.
5. Eliminar HTML bruto/crawler como fonte principal ou assumir/documentar formalmente esse custo.
6. Deduplicar assets somente após revisão visual.
7. Medir Lighthouse/trace em staging.

## Opcional

- Migrar para Astro com ilhas para menu, popup e formulário.
- Trocar HTML bruto por Markdown/MDX ou conteúdo tipado.
- Servir apenas uma variante de cada imagem e usar pipeline de otimização.
- Remover componentes e dados legados não utilizados depois de confirmar que `/ajn-projeto` não será preservada.

Nenhuma correção foi aplicada nesta auditoria além da geração dos relatórios.
