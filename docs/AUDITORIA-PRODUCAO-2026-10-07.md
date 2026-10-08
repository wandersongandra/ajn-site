# Auditoria de prontidão para produção — AJN Consultoria e Engenharia (Astro SSG)

> **Data:** 2026-10-07
> **Ambiente auditado:** repositório local (`astro-site/`, working tree com alterações por commitar) + `dist/` construído + staging `sienna-mongoose-223157.hostingersite.com` + produção `ajnengenharia.com.br`
> **Método:** análise read-only. Nenhum ficheiro do projecto foi alterado. Rede: apenas GET passivo e leitura de headers.
> **Nota:** este relatório substitui/complementa `IMPLEMENTATION_AUDIT.md`, que audita uma app Next.js que **não existe neste repositório**.

---

## 1. Resumo executivo

**Veredito: NÃO APROVADO para publicação.**

**Nota geral: 5,5 / 10.**
**Nível de confiança: ALTO** para código, build, SEO estrutural, contraste e infra observada por HTTP. **MÉDIO-BAIXO** para UX renderizada (não havia browser disponível nesta sessão — ver §2).

O produto é tecnicamente sólido na camada de build: compila limpo, gera 145 páginas em 4,54 s, tem 145 títulos únicos, 145 descrições únicas, zero links internos partidos, zero imagens em falta, zero JSON-LD inválido, zero `<img>` sem `alt`, zero saltos de heading, skip-link e `<main>` em 145/145 páginas. Isto é invulgarmente bom para um site deste tamanho.

O que o impede de ir para produção não é a engenharia — são **três classes de problema**:

1. **O site não está terminado onde importa.** O formulário de contacto, único mecanismo de conversão das 107 landing pages, não envia nada e mostra ao utilizador a frase *"O formulário está validado, mas o envio ainda não está habilitado neste ambiente."* Toda a cadeia de validação (`astro check`, `astro build`, `audit:seo`, `audit-blog`, CI) passa a verde com este defeito.
2. **O corte para produção destruiria activos legais e de SEO que estão vivos hoje.** Produção (`ajnengenharia.com.br`) é hoje um WordPress 7.1 com exactamente 3 URLs: `/`, `/politica-de-privacidade/` (HTTP 200) e `/termos-de-uso/` (HTTP 200). O site Astro não tem nenhuma destas duas páginas — devolvem 404 em staging. E o canonical do Astro aponta para `https://www.ajnengenharia.com.br`, enquanto produção faz **301 de `www.` para apex**.
3. **Há um segundo sistema de design morto dentro do CSS** e uma camada de conteúdo gerado por substituição de keyword que produz texto agramatical e fotografias trocadas em 35 páginas.

**Achados por severidade:** P0 **2** · P1 **16** · P2 **21** · P3 **17** · P4 **7** — total **63**.

**Bloqueadores de produção (detalhe em §5):** 2 × P0 + 8 × P1.

### O que está a funcionar bem (confirmado, não inferido)

- Build reprodutível e rápido; `npm ci` na CI; lockfile v3 consistente com o manifest nos 5 pacotes verificados.
- `PUBLIC_ALLOW_INDEXING` tem **default seguro**: sem a variável, todas as 145 páginas emitem `noindex,nofollow,noarchive` e o `robots.txt` emite `Disallow: /`. Confirmado no build local e no HTML publicado em staging.
- **Nenhum segredo no repositório nem no histórico git.** Varredura de 17 branches, `git log --all --diff-filter=A`: apenas `.env.example` alguma vez foi adicionado. Zero tokens, chaves ou connection strings.
- Integridade de dados notável: `route-catalog.ts` (144 entradas) corresponde exactamente às 144 rotas geradas, nos dois sentidos; 20/20 imagens OG existem, 1:1 com os slugs do blog, sem órfãos; CNPJ `50.970.588/0001-84` tem dígitos verificadores válidos; telefone/email/morada consistentes em todos os ficheiros.
- Sem JavaScript externo: **0 scripts com `src=`** nas 145 páginas; todo o JS é inline (~1,8 KB/página). Superfície de ataque e peso de runtime mínimos.
- `target="_blank"` sempre com `noopener` (1308/1308). Zero `href="#"` ou `href=""`. Zero `http://`.
- Carrossel de clientes correctamente implementado: faixa duplicada com `aria-hidden="true"` e `alt=""` (`ClientsSection.astro:14-16`).
- Brotli activo no CDN; `cache-control: public, max-age=604800` nos assets.

---

## 2. Escopo e limitações

### O que foi analisado (com evidência)

| Camada | Método | Cobertura |
|---|---|---|
| Código-fonte `src/`, `scripts/`, `.github/`, configs | leitura directa + 2 subagentes de exploração | 100 % dos ficheiros relevantes |
| Build de produção | `npm run build` executado → **exit 0, 145 páginas, 4,54 s** | total |
| HTML gerado | censo programático read-only sobre `dist/` | **145/145 páginas** |
| Contraste WCAG | cálculo de rácios sobre os tokens CSS reais, com alpha-blending | 27 pares |
| Produção `ajnengenharia.com.br` | GET passivo + headers | home, robots.txt, wp-sitemap, 2 páginas legais, 9 slugs, wp-admin, wp-login |
| Staging `sienna-mongoose-223157.hostingersite.com` | GET passivo + headers | home, robots.txt, sitemap-index, `/ltcat-preco/`, CSS, imagem |

### O que NÃO foi analisado — e porquê

- **Nenhum teste em browser.** Não havia ferramenta de browser/Playwright disponível nesta sessão. Consequência directa: **não medi LCP, INP, CLS nem TTFB**; **não testei navegação por teclado**, ordem de foco, armadilhas de foco, zoom a 200 %, reflow, nem comportamento responsivo real; **não testei com leitor de ecrã**; **não vi nenhuma página renderizada**. Tudo o que se afirma sobre acessibilidade vem de análise estática do HTML/CSS e de cálculo de contraste — é sólido para os critérios que dependem de markup e cor, e **não cobre** os critérios que dependem de comportamento em runtime.
- **`npm audit` não executado** (exigia acesso ao registry). Estado de vulnerabilidades das dependências: **não verificado**.
- **Definições do GitHub não verificáveis** a partir do repo: branch protection, required status checks, secret scanning/push protection, histórico de runs das Actions.
- **Não foi verificada a vivacidade dos links externos**: `gov.br` (17 links em `treinamento-de-nrs.ts` + 15 ficheiros de blog), `planalto.gov.br` (10 ficheiros), Instagram, LinkedIn, `ajntreinamentos.formasegnr.com`.
- **Proveniência do deploy de staging: desconhecida.** O `robots.txt` publicado em staging **não é** o que o repo gera (ver P1-08).
- **Contas de teste / áreas autenticadas: não aplicável.** O site é 100 % estático e público; não existe autenticação, backoffice, CRUD, upload com destino, checkout, webhook ou API. Todas as verificações sobre IDOR/BOLA, CSRF, gestão de sessão, cookies de autenticação, rate limiting e multi-tenancy são **N/A por ausência de superfície** — não por terem passado.
- **O `dist/` medido foi construído a partir de uma working tree suja** (`src/data/home.ts` e `src/styles/global.css` modificados, 11 imagens untracked, `main` **1 commit atrás de `origin/main`**). As métricas reflectem o estado local, **não** o commit `main`.

---

## 3. Inventário completo de rotas

**Total: 145 páginas geradas = 144 indexáveis + `404.html`.** Todas com `noindex,nofollow,noarchive` (a flag de indexação está desligada).

| Família | Rotas | Ficheiro de origem | Estado no build | Estado em staging | Problemas |
|---|---|---|---|---|---|
| Home | 1 (`/`) | `pages/index.astro` | 200 ✓ | — | — |
| Serviços (índice) | 1 (`/servicos`) | `pages/servicos/index.astro` | 200 ✓ | — | `<select>` não funcional; 9 PNG > 150 KB; pesquisa sem feedback |
| Serviços (detalhe) | 10 (`/servicos/{slug}`) | `pages/servicos/[slug].astro` | 200 ✓ | — | 1 página órfã (só acessível via `/mapa-site`) |
| Blog (índice) | 1 (`/blog`) | `pages/blog/index.astro` | 200 ✓ | — | — |
| Blog (artigos) | 20 (`/blog/{slug}`) | `pages/blog/[slug].astro` + 1 `.astro` avulso | 200 ✓ | — | 1 artigo contorna a validação Zod; `pubDate` fabricado; sem `BreadcrumbList` |
| Marketing/SEO | **107** (`/{slug}`) | `pages/[slug].astro` | 200 ✓ | **200 confirmado em `/ltcat-preco/`** | conteúdo, imagens, títulos — ver §4 |
| Institucionais | 4 (`/contato`, `/sobre-nos`, `/informacoes`, `/mapa-site`) | `pages/*.astro` | 200 ✓ | — | `/contato` formulário morto; `/mapa-site` mostra mojibake |
| Erro | 1 (`/404`) | `pages/404.astro` | gerado ✓ | — | canonical aponta para `/404`, rota inexistente |
| Infra | `robots.txt`, `sitemap-index.xml`, `sitemap-0.xml` | `pages/robots.txt.ts`, `@astrojs/sitemap` | gerados ✓ | **robots.txt divergente do repo** | sitemap com 144 `<loc>`, 0 `<lastmod>` |

### Rotas legadas em produção hoje (WordPress) — inventário completo, obtido de `wp-sitemap.xml`

| URL | HTTP | Existe no Astro? | Consequência do cutover |
|---|---|---|---|
| `https://ajnengenharia.com.br/` | 200 | ✓ | OK |
| `https://ajnengenharia.com.br/politica-de-privacidade/` | **200** | **✗ (404 em staging)** | **página legal viva desaparece → P0-01** |
| `https://ajnengenharia.com.br/termos-de-uso/` | **200** | **✗ (404 em staging)** | **página legal viva desaparece → P0-01** |

O sitemap do WordPress lista **apenas 3 URLs** e o índice tem um único sub-sitemap (`wp-sitemap-posts-page-1.xml`) — não há posts nem taxonomias publicados.

**Isto contradiz `docs/LEGACY_INVENTORY.md` e `docs/ROUTES_AUDIT.md`, que falam em 143 URLs legadas.** Conclusão: as 107 landing pages de marketing são URLs **novas**, não migradas. Duas implicações opostas, ambas a exigir decisão:

- **Boa:** o risco de "conteúdo duplicado herdado" é menor do que os docs sugerem — não há equity de SEO a preservar nesses slugs.
- **Má:** `docs/REDIRECTS.md` conclui "nenhum redirect necessário", mas **falta o redirect das 2 páginas legais**, que são as únicas URLs legadas com equity real. E os 107 slugs novos não têm histórico — o seu valor depende inteiramente de indexação, que está desligada.

> **Ambiguidade não resolvida:** se alguma vez existiram 143 URLs indexadas, `redirects: {}` em `astro.config.mjs` é um problema grave; se só existiram 3, faltam apenas 2. **Verificar no Google Search Console antes do cutover.** Não há backup WordPress neste directório (só `.playwright-mcp/` e `astro-site/`), pelo que não foi possível determinar a origem do número 143.

### Rotas órfãs / duplicadas confirmadas

- `/servicos/projetos-eletricos-residenciais-comerciais-e-prediais-com-foco-em-qualidade-prazo-e-economia` — gerada e no catálogo, mas **nenhum menu ou card aponta para ela**. `home.ts:33` e `services/catalog.ts:9` apontam para a landing page de marketing `/projetos-eletricos-prediais`. `/informacoes` filtra `/servicos/*`. Só é alcançável por `/mapa-site`.
- Clusters de canibalização explícita: `/ltcat-preco` · `/ltcat-orcamento` · `/orcamento-ltcat` · `/valor-fazer-ltcat`; `/pcmso-preco` ↔ `/preco-pcmso`; `/projeto-eletrico-preco` ↔ `/preco-projetos-eletricos`; 7 URLs para "elevador/escada rolante BH".

### Parâmetros, query strings, deep links

N/A — não há rotas dinâmicas com parâmetros, nem estado em URL, nem paginação. O único estado é a pesquisa client-side em `/servicos` (não reflectido na URL, logo não partilhável).

---

## 4. Matriz de problemas

### P0 — Crítico (não publicar)

#### P0-01 · Legal / LGPD · `/contato`, todo o site
**Título:** Site recolhe dados pessoais sem Política de Privacidade nem Termos de Uso — e o cutover apaga as versões que estão vivas

**Descrição:** O formulário recolhe nome, e-mail, telefone, "como nos conheceu", mensagem e **anexo de ficheiro** = dados pessoais ao abrigo da LGPD. O site Astro **não tem** `/politica-de-privacidade` nem `/termos-de-uso`. Ambos existem e respondem **200** no WordPress de produção hoje. Existe ainda um `CookieBanner.astro` que anuncia uma "Política de Cookies" que não existe — e que **nem sequer é renderizado** (não é importado em lado nenhum).

**Impacto:** Exposição legal/regulatória directa. Regressão face ao que está publicado. Sem base legal documentada para tratamento de dados de leads. O banner de cookies morto indica que o tema foi iniciado e abandonado.

**Evidência:** `curl` → `200 https://ajnengenharia.com.br/politica-de-privacidade/`, `200 .../termos-de-uso/`; `404` para ambas em staging. `src/pages/` não contém nenhuma das duas. `src/components/CookieBanner.astro` sem imports (grep de imports: 18 resultados, nenhum é CookieBanner). Campos do form: `ContactPage.astro:70-105`.

**Causa provável:** Migração focou-se nas 143 URLs de conteúdo e ignorou as páginas legais do WordPress.

**Correcção:** (1) Criar `/politica-de-privacidade` e `/termos-de-uso` com conteúdo real, revisto por alguém com competência jurídica; (2) decidir o destino do `CookieBanner` (ligar à `BaseLayout` ou apagar o ficheiro); (3) adicionar redirect 301 das URLs legadas; (4) adicionar links no footer.

**Critério de aceite:** Ambas as rotas devolvem 200 no build, estão linkadas no footer de todas as páginas, e a política descreve efectivamente os campos recolhidos pelo formulário, a finalidade, a base legal e o contacto do encarregado.

**Esforço:** M

---

#### P0-02 · Negócio / UX · `/contato` (CTA de 107 páginas)
**Título:** O formulário de contacto não envia; mostra linguagem de ambiente de desenvolvimento ao utilizador final

**Descrição:** `PUBLIC_CONTACT_ENDPOINT` está vazio. Sem ele, `action` fica `undefined` e o handler faz sempre `preventDefault()`. O estado inicial renderizado no HTML é **"Envio online indisponível neste ambiente."** e ao submeter aparece **"O formulário está validado, mas o envio ainda não está habilitado neste ambiente."** A palavra "ambiente" é vocabulário de dev a falar para o utilizador.

**Impacto:** O canal principal de captação de leads está inerte. Todas as 107 landing pages e o footer de 145 páginas empurram tráfego para aqui. Pior do que não ter formulário: valida os dados, dá esperança ao utilizador e depois informa-o de que não funciona. **E toda a cadeia de qualidade passa a verde** — nenhuma gate detecta.

**Evidência:** `ContactPage.astro:4` (`?? ''`), `:64` (`action={contactEndpoint || undefined}`), `:120-122` (texto inicial), `:125-129` (`if (contactEndpoint) return; event.preventDefault();`). `.env.example:8` → `PUBLIC_CONTACT_ENDPOINT=`. `quality.yml:19-21` não define a variável. Corroborado por `docs/FORMS_AUDIT.md:15` (**BLOCKED**) e `docs/PHASE2_VISUAL_QA.md:35`.

**Causa provável:** Provider de formulários nunca foi aprovado; o código foi desenhado para degradar graciosamente e degradou para um beco sem saída.

**Correcção:** Escolher e configurar o provider; definir `PUBLIC_CONTACT_ENDPOINT` em produção **e na CI**; reescrever as duas strings para linguagem de utilizador; adicionar um passo de CI que falhe se o endpoint estiver vazio num build de produção.

**Critério de aceite:** Submeter o formulário em produção com dados de teste produz um lead efectivamente recebido; nenhuma string contém "ambiente"; a CI falha se `PUBLIC_CONTACT_ENDPOINT` estiver vazio.

**Esforço:** M

---

### P1 — Alto (corrigir antes da publicação)

| ID | Área | Rota | Título | Descrição e impacto | Evidência | Correcção | Esf. |
|---|---|---|---|---|---|---|---|
| **P1-01** | SEO | 144 páginas | **Canonical aponta para `www.` mas produção faz 301 para apex** | O Astro usa `https://www.ajnengenharia.com.br` como origem canónica. Produção responde `301 Moved Permanently` com `Location: https://ajnengenharia.com.br/` e `X-Redirect-By: WordPress`. Um canonical que aponta para um URL que redirecciona é um canonical inválido — o Google ignora-o. **Todas as 144 páginas** perderiam o sinal de canonicalização no dia do cutover. | `curl -D - https://www.ajnengenharia.com.br/` → `HTTP/1.1 301`, `Location: https://ajnengenharia.com.br/`. Default hardcoded em 6 sítios: `astro.config.mjs:5`, `BaseLayout.astro:26`, `BlogPost.astro:22`, `BlogArticlePage.astro:10`, `PageShell.astro:7`, `robots.txt.ts:6`. | Decidir o host canónico (recomendo apex, que é o que a infra já impõe) e substituir os **6** defaults. Idealmente centralizar num único helper com schema `env:` tipado do Astro. | S |
| **P1-02** | SEO | 144/144 páginas | **Canonical sem trailing slash; sitemap com trailing slash — discordam em 144 de 144** | Medido, não inferido: `sitemap-0.xml` tem 144 `<loc>`, **todos** com `/` final, **0** sem. Dos 145 canonicals, **144 não terminam em `/`**. Apenas **1** `<loc>` coincide exactamente com um canonical (a home). Duas formas "oficiais" de cada URL → sinais de ranking divididos e desperdício de crawl budget. `astro.config.mjs` não define `trailingSlash` (default Astro `'ignore'`). | `BaseLayout.astro:27` faz `.replace(/^\/+\|\/+$/g,'')`; `@astrojs/sitemap` emite estilo directório. Medido sobre `dist/`: `SITEMAP_LOC 144 LOC_WITHOUT_TRAILING_SLASH 0` · `CANONICAL_NO_SLASH_NON_HOME 144` · `SITEMAP_LOC_EXACTLY_MATCHING_A_CANONICAL 1`. | Definir `trailingSlash: 'always'` em `astro.config.mjs` **ou** configurar `trailingSlash`/`serialize` no sitemap para coincidir. Depois **estender `audit-seo.mjs` para comparar sitemap vs canonical** — hoje só verifica presença, nunca correcção. | S |
| **P1-03** | A11y (WCAG 1.4.3 AA) | **145 páginas** | **CTA do footer falha contraste: branco sobre `#4caf50` = 2,78:1** | Os dois botões do rodapé — **"Envie sua mensagem!"** e **"Trabalhe Conosco"** — são o CTA de conversão presente em todas as 145 páginas. Rácio calculado **2,78:1**; o exigido para texto de 12 px bold é **4,5:1**. No hover (`#67bd6a`) desce para **2,32:1**. Mesma falha em `.contact-page__social a` e no botão de submit do formulário (`#fff` sobre `#5b9923` = **3,49:1**). | Cálculo sobre os tokens reais: `global.css:2682-2692` (`.site-footer .footer__button { color: var(--white); background: #4caf50; font-size: .76rem }`), `:1892-1901`, `:1805-1809`, `:1842-1846`, `:2109` (`--wp-green: #5b9923` scoped a `.contact-layout`). Rácios: 2,78 / 2,32 / 3,49 / 3,49. | Escurecer o verde de fundo (o próprio `--wp-green-dark: #2f7d35` já dá **5,11:1** com branco, e `#576b43` dá **5,85:1**) ou passar o texto a escuro sobre o verde claro. Aplicar também ao estado hover. | S |
| **P1-04** | A11y (WCAG 1.4.11 AA) | todo o site | **Indicador de foco de teclado insuficiente: `#86a56f` = 2,75:1 (branco) / 2,58:1 (canvas)** | A única regra global de foco é `outline: 3px solid #86a56f`. Exigido para indicador de foco: **3:1**. Fica abaixo em qualquer fundo claro do site. Agravado em `.contact-form__status:focus`, cujo outline é `rgb(76 175 80 / 20%)` → cor efectiva `#d2e9d2` sobre `#f3f8f3` = **1,20:1**, praticamente invisível. | `global.css:39`, `:2382`. Rácios calculados com alpha-blending: 2,75 · 2,58 · 1,20. | Usar um outline de alto contraste (ex. `2px solid #223222` + `outline-offset: 2px`, que dá >10:1) ou contorno duplo escuro/claro. Nunca outline com alpha de 20 %. | S |
| **P1-05** | CSS / Design system | todo o site | **Dois sistemas de design em `global.css`; o segundo anula o primeiro** | `global.css` tem **três blocos `:root`** (linhas 1, 530, 901). O bloco da linha 901 (paridade com o WordPress legado) sobrescreve o da linha 1: `font-family` passa de `'Manrope'` para `'Open Sans'`; `color` de `#202820` para `#333`; `background` de `#f6f8f4` para `#fff`; `--shell` de `1200px` para `1140px`. Depois `body { font-size: 14px }` (:920) anula os `16px` (:35) e `h1 { font-size: 36px }` (:937) anula o `clamp(2.5rem, 5vw, 4.8rem)` (:42). **Resultado: `'Manrope'` está declarado mas nunca é carregado, e o H1 fluido responsivo está morto.** O site carrega Open Sans do Google (render-blocking) e renderiza a 14 px fixos. | `global.css:1-32` vs `:901-937`; `BaseLayout.astro:94` carrega só `Open+Sans`. Grep: `Manrope` aparece 1× (`:28`), `Open Sans` 4× (`:911,919,925,931`). Ficheiro: 3360 linhas, 104 534 bytes → **87 337 bytes de CSS por página** (mediano), 106 196 no máximo. | Decidir qual é o design system. Remover o ramo morto por completo. Se Open Sans é a fonte real, remover `'Manrope'`. Considerar self-hosting da fonte para eliminar o pedido render-blocking a terceiros. | L |
| **P1-06** | Conteúdo | 3 páginas + `/mapa-site` | **Headings agramaticais por costura de keyword + mojibake visível** | (a) **10 headings** sem espaço na costura: `"AJN Consultoria e Engenharia: Especialista emsistemas contra incêndio bhe Soluções em QSSMA"`, `"Definição e Tipos delaudos de segurança do trabalho"`, `"Especialista emprojeto de segurança contra incêndio…"`. (b) **Mojibake**: `route-catalog.ts:51` tem `"PPP Fácil: O Ǫue é"` (U+01EA no lugar do Q) — renderizado como texto de link em `/mapa-site`. (c) **3 páginas** terminam com um `<h2>` sem nada debaixo: `"Para saber mais sobre Laudos de segurança do trabalho"` + `paragraphs: []`. | `sistemas-incendio-bh.ts:29,65,92,158,186`; `laudos-seguranca-do-trabalho.ts:33,63,87`; `projeto-seguranca-incendio-panico.ts:37,81,124`; `route-catalog.ts:51`; `laudos-seguranca-do-trabalho.ts:139-141`, `projeto-seguranca-incendio-panico.ts:143-145`, `sistemas-incendio-bh.ts:213-215`. Varredura UTF-8 de 220 ficheiros: **exactamente 1** hit de mojibake. | Corrigir as 10 costuras, o `Ǫ`→`Q` e as 3 secções vazias. **Reforçar o schema Zod**: `contentSectionSchema` permite `heading: ""` e `paragraphs: []` (`content.config.ts:33-45`) — é a causa raiz de 5 headings vazios no blog e das 3 secções dangling. | S |
| **P1-07** | Conteúdo / confiança | ≥ 4 páginas | **Substituição de keyword gera afirmações semanticamente falsas** | `"O ltcat preço é um documento indispensável para empresas e trabalhadores"` — um preço não é um documento. `"A elaboração do valor para fazer ltcat requer análises precisas"` — elaborar um valor ≠ elaborar um laudo. `"Benefícios da plataforma elevatória preço Justo para sua Empresa"` (maiúscula a meio da frase). `"Benefícios da Implementação do LTcat"` (sigla mal capitalizada). Além de prejudicar a conversão, é conteúdo que um engenheiro não escreveria — afecta E-E-A-T num site que vende laudos técnicos. | `ltcat-preco.ts:18`; `valor-fazer-ltcat.ts:17,26,31`; `plataforma-elevatoria-preco.ts:19`; `seguranca-do-trabalho-ltcat.ts:23`. Confirmado também no HTML publicado em staging: `DESC` = `"Ltcat preço é um documento indispensável para empresas…"`. | Reescrever as frases dos clusters `*-preco`, `*-orcamento`, `valor-*`, separando a keyword de SEO do texto corrido. | M |
| **P1-08** | DevOps | staging | **O artefacto publicado não corresponde ao que o repo gera — deploy não reprodutível** | O repo gera, com indexação desligada, `User-agent: *\nDisallow: /`. O `robots.txt` **publicado** em staging é `User-agent: Googlebot / Disallow: /` + `User-agent: * / Allow: /`. São ficheiros diferentes. Não existe **nenhum** pipeline de deploy no repo: zero workflow de release, sem `netlify.toml`/`vercel.json`/`_headers`/`_redirects`/`wrangler.toml`, sem adapter de hosting em `astro.config.mjs`. Logo o deploy é manual e fora de banda, e **nenhuma gate de CI pode bloquear um deploy mau**. | `curl https://sienna-mongoose-223157.hostingersite.com/robots.txt` vs `src/pages/robots.txt.ts:9-11`. Varredura completa de `*.toml/*.yml/*.yaml`: apenas os 5 ficheiros `.github`. Mitigação real: as páginas publicadas trazem `noindex,nofollow,noarchive` (verificado em `/ltcat-preco/`), portanto o `Allow: /` não polui o índice do Google — mas permite que outros crawlers acedam a staging. | Criar pipeline de deploy versionado. Bloquear staging por autenticação ou por IP. Garantir que o `robots.txt` publicado é o gerado. | M |
| **P1-09** | DevOps / CI | — | **A CI valida o origin de staging, nunca o de produção; e não há evidência de branch protection** | `quality.yml:19-21` fixa `PUBLIC_SITE_ORIGIN: https://sienna-mongoose-223157.hostingersite.com` e `PUBLIC_ALLOW_INDEXING: 'false'`. **Nenhum build de produção é alguma vez validado.** O P1-01 (canonical `www.` vs apex) é exactamente a classe de bug que esta pipeline não consegue apanhar. `SECURITY.md:29` lista branch protection como trabalho *por fazer*. Sem required checks, as 4 workflows são advisory — um `quality.yml` vermelho ainda faz merge. | `quality.yml:19-21`, `:4-7`; `SECURITY.md:29`. Estado real do GitHub: **não verificado**. | Adicionar um job que construa com as variáveis de produção e valide canonical/sitemap/robots. Activar branch protection com `quality.yml` como required check. | S |
| **P1-10** | Build / CI | `/` (home) | **Código não commitado referencia binários untracked → 10 logos 404 num checkout limpo, e a CI não detecta** | `git status`: ` M src/data/home.ts`, ` M src/styles/global.css`, 11 imagens `??` untracked, `main` **1 commit atrás de `origin/main`**. A working tree tem `home.ts:65` a apontar para `/images/clients/cliente-*.png`; o HEAD tem `.jpg`; só os `.jpg` estão versionados. Os 10 `.png` estão untracked. O mesmo padrão em `src/assets/blog/…-5b7fade9f1.png`. Como são strings de `public/` (não imports), **`astro build` passa na mesma** — e `audit-seo.mjs:31-33` exclui deliberadamente `/images/`, `/assets/` e tudo com extensão de ficheiro da verificação de links. | `git status --porcelain`; `git show HEAD:src/data/home.ts` vs working tree; `git ls-files public/images/clients`; `scripts/audit-seo.mjs:31-33`. | Fazer `git add` das imagens ou reverter `home.ts` para `.jpg`. **E remover a exclusão de assets do link checker** — é o que torna esta classe de bug invisível. | S |
| **P1-11** | Segurança (produção actual) | `ajnengenharia.com.br` | **Produção corre PHP 8.0.30 (EOL) e WordPress 7.1, com `wp-login.php` público** | `X-Powered-By: PHP/8.0.30` em todas as respostas. PHP 8.0 perdeu suporte de segurança em Novembro de 2023 — não recebe patches há mais de dois anos. `Server: LiteSpeed`, `GENERATOR WordPress 7.1`. `/wp-login.php` devolve **200**. É o risco **actual e vivo**, independente do projecto Astro; e é um argumento forte para acelerar o cutover, desde que os P0 sejam resolvidos. | Headers de `curl -D - https://ajnengenharia.com.br/`; `<meta name="generator" content="WordPress 7.1">` na página 404; `curl -o NUL -w "%{http_code}" .../wp-login.php` → `200`. | Actualizar PHP e WordPress imediatamente, ou antecipar o cutover para o SSG (que elimina o runtime PHP por completo). Restringir `/wp-login.php` por IP/2FA enquanto o WP existir. | M |
| **P1-12** | Segurança (headers) | staging + produção | **Sem HSTS, sem X-Content-Type-Options, sem frame-ancestors, sem Referrer-Policy, sem Permissions-Policy** | A única directiva presente é `Content-Security-Policy: upgrade-insecure-requests` — que não restringe nada, apenas promove http→https. Confirmado **nos dois hosts**. Sem HSTS, o primeiro pedido de um utilizador novo é vulnerável a downgrade SSL. | Headers completos de `curl -D -` em `https://ajnengenharia.com.br/`, `https://www.ajnengenharia.com.br/` e `https://sienna-mongoose-223157.hostingersite.com/`. Nenhum dos 5 headers presente. | Configurar no Hostinger (hPanel/`.htaccess` LiteSpeed) ou, preferível, num ficheiro `_headers` versionado no repo e aplicado pelo pipeline de deploy. | S |
| **P1-13** | Conversão / mobile | **145 páginas** | **Zero links `tel:`; 103 páginas dizem "Ligue para 31 98473-4644" como texto não clicável** | Medido nas 145 páginas construídas: **0** contêm `tel:`; **145** mostram o número como texto simples. Em mobile — onde um serviço de urgência de segurança do trabalho é mais procurado — o utilizador lê o número e tem de o marcar à mão. Simultaneamente, **581 hrefs usam `web.whatsapp.com`**, que força o cliente web e exige login por QR code em vez de abrir a app nativa (`wa.me/5531984734644` ou `api.whatsapp.com/send` fá-lo). | Censo sobre `dist/`: `PAGES_WITH_TEL_LINK 0` · `PAGES_PHONE_PLAIN_TEXT_ONLY 145` · `WEB_WHATSAPP_HREFS 581`. Origem: `src/data/home.ts:11-12`; literal duplicado em `PromoDialog.astro:3`. Exemplos: `ltcat-preco.ts:43`, `orcamento-ltcat.ts:38`, `empresa-que-faz-pcmso.ts:72`. | Adicionar `tel:+5531984734644` no `site.phone` e usá-lo onde o número aparece. Trocar `web.whatsapp.com` por `wa.me`. Remover o literal duplicado de `PromoDialog.astro`. | S |
| **P1-14** | QA / Testes | — | **Não existe nenhum framework de testes; a evidência de QA visual é irreplicável** | `package.json` não tem script `test` nem `vitest`/`jest`/`@playwright/test`/`playwright`. `git ls-files tests` devolve **vazio** — a árvore `tests/visual/screenshots/**` existe em disco mas está gitignored (`.gitignore:37`). Logo as screenshots que sustentam `docs/PHASE2_VISUAL_QA.md` **não são reproduzíveis a partir de um clone limpo**. Há ~180 artefactos `.playwright-cli/` gerados ad-hoc, nunca codificados. | `package.json:8-16`; `git ls-files tests`; `.gitignore:37`; `docs/PHASE2_VISUAL_QA.md`. | Adicionar Playwright como devDependency com specs versionados (rotas 200, canonical vs sitemap, headings, contraste, submissão do form) e correr na CI. Versionar as screenshots de referência ou deixar de as citar como evidência. | L |
| **P1-15** | CI / Conteúdo | `/blog` | **`audit-blog.mjs` parte a CI quando se publica o 21.º artigo** | As asserções são igualdades estritas: `report.articles !== 20` (`:76`) e `report.archiveCards !== 20` (`:40`). Adicionar um artigo — o objectivo de um blog — falha o gate. Paginar (`/blog/2/index.html`) também falha, porque o contador incrementa por cada ficheiro não-`index.html`. Há também acoplamento a `class="blog-card"` exacto (`:39`), numa altura em que `global.css` tem +186 linhas por commitar. `docs/blog/REVISAO-TECNICA-2026-10-07.md:35` consagra estas constantes como contrato. | `scripts/audit-blog.mjs:39,40,76`; `quality.yml:44-45`. | Substituir `!== 20` por `>= 1` (ou por uma constante derivada do catálogo). Descobrir os cards por `data-*` em vez de classe CSS. | S |
| **P1-16** | SEO | 37 + 92 páginas | **37 titles acima de 65 caracteres (máx. 120) e 92 descriptions truncadas a meio de palavra** | Medido nas 145 páginas: **37** títulos > 65 chars — o pior com **120** (`/blog/a-importancia-do-ltcat-…`). **92** descrições contêm 3+ pontos consecutivos, várias com **sete** pontos (`"…proteger o patrimônio da empresa....... Saiba mais."`). Todas as **9** descrições de serviços cortam sem espaço (`"…para o seu local de traba...Saiba mais."`). Isto é o que aparece no snippet do Google. | Censo `dist/`: `LONGT 37`, `DOTS 92`, `SHORTD 3` (`404.html` 39, `contato` 52, `mapa-site` 50). Fontes: `projeto-combate-incendio-panico.ts:6`, `projeto-protecao-incendio.ts:6`, `consultoria-pcmso.ts:7`, todos os `services/*.ts:5`. Positivo: **145 títulos únicos e 145 descrições únicas** — zero duplicados. | Reescrever os 37 títulos para ≤ 60 chars e as 92 descrições para 120–160 chars sem truncatura. Adicionar ao `audit-seo.mjs` limites de comprimento como **falha**, não warning. | M |

---

### P2 — Médio

| ID | Área | Título | Evidência | Correcção |
|---|---|---|---|---|
| **P2-01** | SEO / Imagem | **35 de 107 landing pages mostram fotografias de outro tema — e essa é a imagem `og:image`** | `emissao-ltcat.ts:9-11` (página de LTCAT com fotos de combate a incêndio); `elaboracao-pcmso.ts:9-11` (3/3 de consultoria da qualidade); `escada-rolante-bh.ts:9-11` (3/3 de plataforma de acessibilidade); `projeto-protecao-incendio.ts:9-11`. Em 313 slots de galeria há só **226** ficheiros distintos. `pcmso-preco-01.webp` é reutilizado em **6** páginas. `ogImage={page.images[0]?.src}` (`pages/[slug].astro:13`). | Atribuir imagens correctas por página; gerar OG images próprias em vez de reaproveitar a primeira foto da galeria. |
| **P2-02** | SEO | **51 dos 107 `<h1>`/`<title>` são strings de keyword cruas, não títulos** | `"Ltcat preço"`, `"Elevador bh"`, `"Laudos de sst"`, `"Escada rolante bh"`, `"Pcmso preço"`, `"Orçamento pgr"`. Espelhados em `route-catalog.ts` → são também os textos de link em `/mapa-site` e `/informacoes`. | Reescrever como frases. |
| **P2-03** | Performance | **`/servicos` carrega 9 PNG fotográficos > 150 KB (~2,4 MB) para thumbnails 600×800** | `pericia-em-insalubridade-e-periculosidade.png` 314 KB, `assessoria-…-trabalho.png` 293 KB, `regularizacao-de-imoveis-cbm.png` 283 KB, `gestao-de-PCMSO-e-ASOs.png` 261 KB, `treinamentos-nrs.png` 256 KB, `gestao-de-meio-ambiente.png` 254 KB + 3. `dist/` total: **39,47 MB / 778 ficheiros**, dos quais **36,75 MB são 628 imagens**. | Converter para WebP/AVIF e servir via `astro:assets` com `srcset`, como o blog já faz correctamente. |
| **P2-04** | Performance / Repo | **3,22 MB de assets órfãos publicados em `dist/images/`** | 33 ficheiros: `bg-contato.png` **504 KB**, `popup.jpg` **369 KB** (só referenciado pelo `PromoDialog` órfão), 13 imagens de blog de artigos apagados, `cliente-01..10.jpg` (o código usa os `.png`), `portfolio-03..08.webp` (6 ficheiros — os dados `home.ts:96-101` existem mas nenhuma secção os renderiza), `icon-right.png`, `content/servicos/cover-gestao-da-qualidade.webp`. | Apagar os órfãos e o código morto que os referencia. |
| **P2-05** | A11y | **Placeholder do formulário abaixo do mínimo AA: `#7a847b` sobre `#fbfdfb` = 3,79:1** | `global.css:2311` (`.contact-form input::placeholder { color: #7a847b }`). Exigido 4,5:1. | Escurecer para ≥ 4,5:1. |
| **P2-06** | A11y / UX | **Pesquisa de `/servicos` filtra em silêncio — sem estado vazio e sem anúncio a leitor de ecrã** | `ServicesIndexPage.astro:47-53`: `card.hidden = …`. Nenhum `aria-live`, nenhuma mensagem "sem resultados". Um utilizador de leitor de ecrã que pesquise "xyz" não recebe qualquer feedback (WCAG 4.1.3). | Adicionar região `role="status" aria-live="polite"` com contagem de resultados e estado vazio. |
| **P2-07** | Conteúdo / Schema | **Schema Zod permite conteúdo vazio; `types.ts` e `content.config.ts` divergem; serviços nunca são validados** | `content.config.ts:33-45`: `heading: z.string()` e `paragraphs: z.array(...)` sem `.min(1)`, ao contrário de `title`/`description`/`slug`. `types.ts:74` declara `pubDate: string` vs `content.config.ts:87` `z.coerce.date()`. Não há schema Zod para `ServiceContent`. Consequência medida: **5** posts de blog com `heading: ""` e **3** secções que renderizam `<h2>` dangling. | Adicionar `.min(1)`, unificar os dois contratos, criar schema para serviços. |
| **P2-08** | Conteúdo | **Um post de blog contorna a validação e tem `pubDate` fabricado** | `src/content/blog/a-importancia-do-ltcat-….ts` não passa por `validateBlogContent()` (`blog/index.ts` valida só os 19 `blogPages`). Tem forma diferente (`image: image0`/`imageAlt:` vs `image:{src,alt}`) e não tem `pubDate` — `catalog.ts:36` inventa `new Date('2026-01-23T12:00:00.000Z')` e `:37` define `tags: []`. | Integrar no pipeline de validação; usar a data real. |
| **P2-09** | SEO / Conteúdo | **`updatedAt: "2026-10-07"` idêntico nos 20 posts** | Verificado em todos os ficheiros (ex.: `ppp-facil-o-ue-….ts:14`, `nr-35-….ts:14`). Renderiza "· Atualizado em …" (`BlogPost.astro:80`) e define `dateModified` uniforme no JSON-LD (`:29`). Um toque em massa, não histórico de revisão — `dateModified` uniforme em todo o site é sinal de spam para o Google. | Usar datas reais de revisão por artigo. |
| **P2-10** | SEO | **Canibalização explícita latente — armada para disparar quando `PUBLIC_ALLOW_INDEXING=true`** | Medida de sobreposição de 6-gramas entre os 107 ficheiros: só **3 %** das frases e **6 %** dos shingles aparecem em mais do que uma página — o texto é genuinamente reescrito, não copiado. Mas **106/107** páginas terminam com o heading-template `"Para saber mais sobre <Keyword>"` e **103/107** contêm o parágrafo byte-idêntico `"Ligue para 31 98473-4644 ou [clique aqui](/contato)…"`. Pares de URLs com as mesmas duas palavras invertidas: `/pcmso-preco`↔`/preco-pcmso`, `/projeto-eletrico-preco`↔`/preco-projetos-eletricos`. Corpos curtos: mediana ~300–700 palavras. | Consolidar clusters antes de ligar a indexação; diferenciar intenção por página; `noindex` selectivo nas variantes fracas. |
| **P2-11** | Config | **6 cópias inline do default de origin; sem schema `env:` tipado** | `astro.config.mjs:5` usa `process.env`; os 5 ficheiros em `src/` usam `import.meta.env`. Se o Astro não injectar `.env` em `process.env` antes de avaliar o config (**não verificado**), um dev com apenas `.env` obtém canonical do `.env` mas sitemap do fallback hardcoded → mismatch de domínio. | Centralizar num helper; usar `loadEnv()` de `vite`; definir schema `env:` em `astro.config.mjs`. |
| **P2-12** | SEO | **Sitemap é publicado mesmo com `Disallow: /`, e tem 0 `<lastmod>`** | `robots.txt.ts:9-11` omite a linha `Sitemap:` quando a indexação está desligada, mas `@astrojs/sitemap` escreve `sitemap-index.xml` + `sitemap-0.xml` incondicionalmente — confirmado `HTTP 200, 211 bytes` em staging. `sitemap-0.xml`: **144 `<loc>`, 0 `<lastmod>`**, sem `changefreq`/`priority`. | Tornar a integração condicional à flag; adicionar `lastmod` a partir de `updatedAt`. |
| **P2-13** | CI | **Dependency Graph desligado → `dependency-review` nunca corre** | `dependency-review.yml:27-33`: `if: ${{ vars.ENABLE_DEPENDENCY_REVIEW == 'true' }}` com comentário "*GitHub's Dependency Graph is currently disabled for this repository.*". `fail-on-severity: high` nunca executa. Só resta `npm audit`. | Activar Dependency Graph e remover o guard. |
| **P2-14** | CI / Build | **Node em três versões diferentes** | `.nvmrc` = `24.13.0`; `package.json:5-6` engines = `>=22.12.0`; `quality.yml:29` e `dependency-review.yml:21` fixam `'22'` e nunca usam `node-version-file: .nvmrc`. Máquina local corre `v24.13.0`. A CI prova o build em Node 22 enquanto os devs usam 24 — binários nativos de rolldown/Vite 8/esbuild 0.28 diferem por ABI. | Alinhar os três; usar `node-version-file: .nvmrc` na CI. |
| **P2-15** | Supply chain | **`allowScripts` é inerte sob o npm instalado** | `package.json:22-24` declara `"allowScripts": { "esbuild": true }`. Verificado: `npm config get ignore-scripts` → `false`; grep por `allowScripts` em `npm/lib/**` (npm 11.12.1) → **0 matches**; grep em todo o `node_modules/` → **0 matches**; sem `.npmrc`; campo ausente do bloco root do lockfile. A intenção é uma allowlist de postinstall; nada a aplica. | Usar o mecanismo real (`ignore-scripts=true` + allowlist explícita) ou remover o campo para não dar falsa segurança. |
| **P2-16** | Dependências | **PR do Dependabot para TypeScript 7.0.2 quebra o peer contract** | `origin/dependabot/npm_and_yarn/typescript-7.0.2` existe; manifest capped a `^6.0.3`; `@astrojs/check@0.9.10` declara peer `typescript: "^5.0.0 \|\| ^6.0.0"`. Fazer merge parte `npm run check` → e portanto `quality.yml:36`. | Fechar o PR ou bumpar `@astrojs/check` em conjunto. |
| **P2-17** | Qualidade de código | **Sem linter e sem formatter** | Sem `eslint`, sem script `lint`, sem `.eslintrc*`/`eslint.config.*` versionados. Sem `prettier`, sem `.prettierrc`, sem `.editorconfig`, sem `.gitattributes`. `git diff` emite warnings de LF→CRLF em 3 ficheiros. Para um projecto que escreve JSON-LD e HTML à mão, `astro check` (só tipos) é a única análise estática. | Adicionar `eslint-plugin-astro` + Prettier + `.gitattributes`. |
| **P2-18** | Docs | **A documentação contradiz o estado real do repositório** | `docs/GIT_SAFETY_AUDIT.md:9` afirma "*Repositório local sem commits e sem remote configurado \| PASS*" — na realidade há 17+ commits, `origin` = `github.com/wandersongandra/ajn-site.git` e 17 branches remotas. `:19` afirma "*Push, commit, PR, deploy e DNS não foram executados \| PASS*" — `git log` mostra PRs merged `(#6)`, `(#12)`, `(#13)`, `(#14)`, `(#15)`. A última linha do `README.md` repete a mesma afirmação. `docs/PHASE3_STATUS.md:14` diz "NOT STARTED" onde `docs/MIGRATION_FINAL_STATUS.md:37-43` diz 144/144 concluídas. | Corrigir ou marcar os docs como históricos. |
| **P2-19** | Conteúdo | **Blurbs de serviços são filler ou fragmentos de markdown** | `src/content/services/catalog.ts:2-11` (renderizado em `/servicos`) preserva a numeração crua: `'1 - Gestão ambiental - Segregação, armazenamento…'`, `'1 - Treinamento de NR 01 - DISPOSIÇÕES GERAIS… 2 - Treinamento de NR 06 -…'`. `home.ts:94` = `'Saiba mais sobre os treinamentos'` (puro filler); `:92` e `:93` são **byte-idênticos** para dois serviços diferentes; `:89` começa com `"Este documento detalha…"` sem antecedente. | Reescrever os 10 blurbs. |
| **P2-20** | Conteúdo / Confiança | **Inconsistências factuais na identidade da empresa** | **QSSMA vs QSMS**: `home.ts:54` e `sobre-nos.ts:8` usam QSSMA; 12 ficheiros de marketing usam QSMS com duas expansões diferentes. **Razão social**: `Footer.astro:9` diz `AJN Consultoria e Engenharia`; `sobre-nos.ts:25` diz `AJN Consultoria e Engenharia LTDA` — e o footer usa a etiqueta "Razão Social", o que torna a afirmação legal. **Antiguidade hardcoded**: "mais de 08 anos"/"8 anos"/"oito anos" em ≥ 18 ficheiros, em três formatos, e o valor nunca avança com o ano. | Fixar um glossário; derivar a antiguidade de `foundingDate`. |
| **P2-21** | Confiança / E-E-A-T | **Sem CREA, sem horário de funcionamento, sem ART** | Grep por `CREA`, `CAU-`, `openingHours`, `Horário`, dias da semana: **zero** hits de conteúdo. Para uma consultoria brasileira que vende laudos que exigem profissional legalmente habilitado — e cujos posts dizem "profissional legalmente habilitado" (`ltcat-guia-essencial-…:35`) sem nunca nomear um — é uma lacuna de credibilidade. O JSON-LD `Organization` (`BaseLayout.astro:34-51`) também omite `vatID` (o CNPJ válido está só no footer), `openingHoursSpecification` e `foundingDate`. | Publicar CREA/ART e horário; enriquecer o JSON-LD. |

---

### P3 — Baixo

| ID | Área | Título | Evidência |
|---|---|---|---|
| **P3-01** | A11y / SEO | Acentos em falta em `<title>` e `<h1>` de 6 páginas, derivados do slug | `projeto-eletrico-industrial-preco.ts:6,8` (`"eletrico"`), `projeto-eletrico-residencial-orcamento.ts:6,8`, `projetos-eletricos-orcamento.ts:6,8`, `preco-projetos-eletricos.ts:6,8`, `consultoria-seguranca-saude-no-trabalho.ts:6,8` (`"saude"`), `laudos-saude-seguranca-do-trabalho.ts:6,8`. Espelhados em `route-catalog.ts:9,25,49,67,96,128` → aparecem em `/mapa-site`. |
| **P3-02** | SEO | `404.html` emite canonical para uma rota que não existe | `dist/404.html` canonical = `https://www.ajnengenharia.com.br/404`. Está correctamente excluído do sitemap (144 `<loc>` vs 145 html) e tem `noindex`. O canonical deveria ser omitido. |
| **P3-03** | SEO | 21 páginas sem `BreadcrumbList` | Medido: `404.html` + os 20 artigos de blog (o layout `BlogPost` usa schema Article, não breadcrumb). |
| **P3-04** | SEO | Breadcrumb JSON-LD omite o nível intermédio | `PageShell.astro:11-15` emite sempre `Home > {heading}` — em `/servicos/gestao-ambiental` falta o nível `/servicos`. |
| **P3-05** | SEO | Sem `og:image:alt`, `og:image:width/height`, `twitter:site` | Medido nas 145 páginas: **0** com qualquer um. `theme-color` é `#4CAF50` em 145/145 — que é o verde que falha contraste (P1-03), não a cor primária da marca (`#526846`/`#31452f`). |
| **P3-06** | Performance | Fonte Google render-blocking em todas as páginas, sem `preload` de fonte | `BaseLayout.astro:94`: `<link href="https://fonts.googleapis.com/css2?family=Open+Sans…" rel="stylesheet">`. Bloqueia render. Tem `preconnect` correcto (:92-93). Third-party recebe o IP do visitante — relevante para LGPD. |
| **P3-07** | Performance | CSS monolítico de 87 KB em todas as páginas; assets com cache curta | Mediano **87 337 bytes/página** (máx. 106 196), contendo dois design systems (P1-05). Em staging, `_astro/BaseLayout.BKBdKQK3.css` devolve `cache-control: public, max-age=604800` — assets com hash no nome deveriam ser `max-age=31536000, immutable`. HTML **não tem `cache-control` nenhum**. Positivo: `content-encoding: br` activo. |
| **P3-08** | Conteúdo | Autores incoerentes nos 20 posts | `"AJN Consultoria e Engenharia"` (12), `"Admin"` (6 — default de CMS), `"Kaique"` (2). `BlogPost.astro:79` esconde `"Admin"` no byline mas **renderiza `· Por Kaique`** — primeiro nome sem apelido nem cargo. `catalog.ts:22` não filtra `"Admin"` no índice/sidebar. |
| **P3-09** | Conteúdo | Datas de publicação em massa | 6 posts partilham `pubDate: "2026-01-23"`, 3 `"2025-10-02"`, 2 `"2025-04-09"`, 2 `"2025-01-24"`. O índice ordena por `pubDate` desc (`catalog.ts:42`) → ordem arbitrária dentro de cada empate. |
| **P3-10** | Conteúdo | Endereço duplicado à mão no JSON-LD | `BaseLayout.astro:45-50` escreve `streetAddress: 'Rua Egeu, 34 - Minaslândia'` e `postalCode: '31812-120'` (sem pontos) enquanto `home.ts:9-10` tem `CEP: 31.812-120`. Duas cópias do mesmo facto vão divergir. |
| **P3-11** | Conteúdo | `/informacoes` promete mais do que entrega | `informacoes.ts:8` diz `"Conheça todas as informações da AJN…"`; `:9` filtra `/blog` e `/servicos` e exclui as 5 páginas institucionais → lista só as 107 landing pages, sem CNPJ, morada, telefone ou horário (que só existem no footer). |
| **P3-12** | UX | Galeria diz "Clique nas imagens para ampliar" mas não há lightbox | `MarketingDetailPage.astro:18-20` envolve as imagens em `<a href={image.src}>` — navega para o `.webp` cru. |
| **P3-13** | DevOps | `.tmp-og-test/` existe e **não** está gitignored | `git status` → `?? .tmp-og-test/`; `git check-ignore -v .tmp-og-test/elaboracao.jpg` → vazio. A um `git add -A` de ficar permanente. (`.gitignore` cobre correctamente `dist/`, `.astro/`, `node_modules/`, `.env*`, `.playwright-cli/`, `output/`, `*.sql`, `*.dump`, `backups/`.) |
| **P3-14** | DevOps | `AGENTS.md` documenta comandos que não existem | `:3-9` instrui `astro dev --background`, `astro dev stop`, `astro dev status`, `astro dev logs`. O CLI do Astro não tem estes subcomandos e `package.json:9` define `dev` como `astro dev` simples. Qualquer agente ou humano que siga as instruções do projecto apanha um erro no primeiro passo. `CLAUDE.md` e `AGENTS.md` são **byte-idênticos** (`fc /b`). |
| **P3-15** | DevOps | `.vscode/launch.json` commitado com caminho POSIX | `:4-9` `"command": "./node_modules/.bin/astro dev"` — falha no VS Code em Windows. |
| **P3-16** | CI | `quality.yml` sem `timeout-minutes`; escopo de audit inconsistente | Todos os outros workflows têm timeout (codeql 30, gitleaks 15, dependency-review 12). `quality.yml:48` corre `npm audit --omit=dev` enquanto `dependency-review.yml:26` corre `npm audit --audit-level=high` (tudo) → vulnerabilidades da árvore de dev são invisíveis no push a `main`. `dependency-review.yml` não tem bloco `concurrency`. Actions em majors inconsistentes (`checkout@v4` no gate principal vs `@v6` nos outros), com PRs do Dependabot por mergear. |
| **P3-17** | Docs | `docs/IMPLEMENTATION_AUDIT.md` audita um codebase que não existe neste repo | 240 linhas a citar `src/app/api/contact/route.ts:41-43`, `LivePage.tsx:33`, `next.config.ts:3-15` — **nenhum existe** (`src/` = `assets components content content.config.ts data layouts pages styles`). O seu veredicto "Pronto para produção: **NÃO**" e os 6 achados HIGH/MEDIUM são de uma app Next.js abandonada. Um leitor não consegue perceber isto sem verificar. |

---

### P4 — Informativo

| ID | Título | Evidência |
|---|---|---|
| **P4-01** | `<select>` decorativo apresentado como controlo | `ServicesIndexPage.astro:27-31`: "Exibir / Por página" com uma única opção (`{serviceIndexItems.length}` = 10). Nenhum JS o lê. |
| **P4-02** | Dois componentes órfãos no repositório | `CookieBanner.astro` e `PromoDialog.astro` não são importados em lado nenhum (verificado por grep de imports). `PromoDialog` usa `sessionStorage` e um timer de 1,8 s — se for ligado sem `prefers-reduced-motion`, é um risco de CLS. |
| **P4-03** | "Trabalhe Conosco" aponta para `/contato`, tal como "Envie sua mensagem!" | `Footer.astro:29-30`: dois botões lado a lado, destino idêntico, sem página de carreiras. |
| **P4-04** | Copyright sem ano | `Footer.astro:44`: `Copyright © AJN Consultoria e Engenharia. (Lei 9610 de 19/02/1998)` — sem ano, e a citação da lei de direitos de autor num rodapé é invulgar. |
| **P4-05** | `README.md` desalinhado com a CI | `:26-27` diz para correr `npm install`; a CI corre `npm ci` (`quality.yml:33`). `:31-37` lista só `check`/`build`/`preview` — nunca menciona `npm run validate`, `audit:seo` ou `audit-blog.mjs`. |
| **P4-06** | `astro.config.mjs` não declara `output` | `docs/TEMPLATE_PARITY.md:17` e o `README.md` afirmam `output: 'static'`. O config não tem a chave — depende do default. Verdadeiro na prática, mas a adição futura de um adapter mudaria o comportamento em silêncio. `redirects: {}` vazio é **consistente** com `docs/REDIRECTS.md` (não é um achado). |
| **P4-07** | `audit-seo.mjs` faz parse de HTML por regex sensível à ordem de atributos | `:63` exige `name="description"` antes de `content=`; `:64` exige `rel="canonical"` antes de `href=`. O Astro emite essa ordem hoje; uma mudança de compilador transforma as verificações em falsos negativos/positivos em silêncio. `routeExists` (`:38-50`) engole todos os erros de `stat` com `catch {}`. |

---

## 5. Bloqueadores de produção

Apenas estes impedem genuinamente o lançamento.

| # | ID | Porquê é bloqueador |
|---|---|---|
| 1 | **P0-01** | Publicar um site que recolhe nome, e-mail, telefone e anexo **sem política de privacidade**, quando as duas páginas legais estão **vivas e a 200** no domínio actual, é uma regressão legal directa ao abrigo da LGPD. Não é uma melhoria adiável — é remover algo que já existe. |
| 2 | **P0-02** | Um site institucional de captação de leads cujo formulário não envia, e que diz ao visitante *"não está habilitado neste ambiente"*, não cumpre o objectivo de negócio. E a falha é **invisível a todas as gates**. |
| 3 | **P1-01** | Canonical a apontar para um host que devolve 301 invalida o sinal de canonicalização de **144 páginas** no momento do cutover. É o tipo de dano de SEO que demora meses a reverter. |
| 4 | **P1-02** | Duas formas "oficiais" de cada URL em 144/144 páginas divide sinais de ranking desde o primeiro dia. |
| 5 | **P1-03** | O CTA de conversão do rodapé, em 145 páginas, falha WCAG 2.2 AA com 2,78:1 contra 4,5:1 exigidos. |
| 6 | **P1-04** | Indicador de foco de teclado a 2,75:1 em todo o site — utilizadores de teclado não conseguem ver onde estão. |
| 7 | **P1-06** | Headings como `"emsistemas contra incêndio bhe"` e `"O Ǫue é"` são defeitos visíveis ao utilizador que destroem credibilidade num site que vende pareceres técnicos. |
| 8 | **P1-08** + **P1-09** | Sem pipeline de deploy e com a CI a validar apenas o origin de staging, **não há forma reprodutível de publicar** nem forma de impedir que um build mau chegue a produção. Já há deriva comprovada entre repo e servidor (robots.txt). |
| 9 | **P1-10** | Um checkout limpo da CI produz uma home com **10 logos em 404**, e o link checker exclui assets por desenho. O deploy actual partiria a home. |
| 10 | **P1-12** | Sem HSTS nem `X-Content-Type-Options`/`frame-ancestors`/`Referrer-Policy`. É barato de corrigir e é o mínimo esperado num domínio que vai receber tráfego pago e orgânico. |

**Não são bloqueadores** (mas devem entrar no plano): P1-05 (design system duplicado — o site renderiza correctamente, só é caro de manter), P1-07, P1-11 (é risco do WordPress actual, e o cutover resolve-o), P1-13, P1-14, P1-15, P1-16, e todos os P2.

---

## 6. Plano de correcção priorizado

### Antes de publicar

| # | Tarefa | ID | Depende de | Responsável sugerido | Esf. | Critério de conclusão |
|---|---|---|---|---|---|---|
| 1 | Decidir o host canónico (recomendo apex) e substituir os 6 defaults de origin; centralizar num helper tipado | P1-01, P2-11 | Decisão de negócio | Eng. frontend | S | Todos os canonicals, `og:url`, JSON-LD e `Sitemap:` usam o mesmo host que responde 200 sem redirect |
| 2 | Alinhar trailing slash entre canonical e sitemap; estender `audit-seo.mjs` para comparar os dois | P1-02 | Tarefa 1 | Eng. frontend | S | `SITEMAP_LOC_EXACTLY_MATCHING_A_CANONICAL` = 144/144 |
| 3 | Criar `/politica-de-privacidade` e `/termos-de-uso`; redirect 301 das URLs legadas; links no footer; decidir o `CookieBanner` | P0-01 | Conteúdo jurídico | PM + Jurídico | M | Ambas 200 no build; legadas redireccionam; banner ligado ou removido |
| 4 | Ligar o provider de formulários; definir `PUBLIC_CONTACT_ENDPOINT` em produção e na CI; reescrever as 2 strings; gate de CI que falha se vazio | P0-02 | Escolha de provider | Eng. backend | M | Lead de teste efectivamente recebido; zero ocorrências de "ambiente"; CI vermelha sem endpoint |
| 5 | Corrigir contraste: `--wp-green` dos botões, outline de foco global, placeholder, outline do `__status:focus` | P1-03, P1-04, P2-05 | — | Design + frontend | S | Todos os rácios ≥ 4,5:1 (texto) e ≥ 3:1 (foco/bordas) recalculados |
| 6 | Corrigir as 10 costuras de keyword, o `Ǫ`→`Q`, as 3 secções `<h2>` vazias; endurecer o schema Zod com `.min(1)` | P1-06, P2-07 | — | Conteúdo + eng. | S | Grep por costuras sem espaço devolve 0; Zod rejeita `heading: ""` |
| 7 | `git add` das 11 imagens untracked **ou** reverter `home.ts` para `.jpg`; remover a exclusão de assets do link checker | P1-10 | Decisão sobre quais imagens são as correctas | Eng. frontend | S | Clone limpo → `npm ci && npm run validate` → 0 imagens em 404, detectado automaticamente |
| 8 | Pipeline de deploy versionado + headers de segurança (`_headers` ou `.htaccess`) + branch protection com `quality.yml` required | P1-08, P1-09, P1-12 | Acesso ao hPanel e ao GitHub | DevOps | M | Deploy automático a partir de `main`; os 5 headers presentes em `curl -I`; PR vermelho não faz merge |
| 9 | Adicionar job de CI que constrói com as variáveis de **produção** e valida canonical/sitemap/robots | P1-09 | Tarefas 1, 8 | DevOps | S | Job existe e falha se origin/sitemap divergirem |
| 10 | Substituir `!== 20` por limites mínimos em `audit-blog.mjs`; descobrir cards por `data-*` | P1-15 | — | Eng. | S | Publicar um 21.º artigo num branch de teste → CI verde |
| 11 | Reescrever as afirmações falsas dos clusters `*-preco`/`valor-*` | P1-07 | — | Conteúdo | M | Revisão humana: nenhuma frase trata um preço como documento |
| 12 | Adicionar `tel:` e trocar `web.whatsapp.com` por `wa.me` | P1-13 | — | Eng. frontend | S | `PAGES_WITH_TEL_LINK` > 0; `WEB_WHATSAPP_HREFS` = 0 |
| 13 | Actualizar PHP/WordPress em produção **ou** antecipar o cutover; restringir `/wp-login.php` | P1-11 | Acesso ao servidor | DevOps | M | `X-Powered-By` ≥ PHP 8.2 ou header removido; `/wp-login.php` não devolve 200 público |

### Primeiras 24 horas

| # | Tarefa | ID | Esf. |
|---|---|---|---|
| 14 | Apagar os 33 assets órfãos (3,22 MB) e o código morto (`portfolio` em `home.ts:96-101`, `bg-contato.png`, `popup.jpg`) | P2-04 | S |
| 15 | Converter os 9 PNG de `/servicos` para WebP com `srcset` via `astro:assets` | P2-03 | M |
| 16 | Corrigir os 37 titles > 65 chars e as 92 descriptions truncadas; tornar limites de comprimento uma **falha** no auditor | P1-16 | M |
| 17 | Alinhar Node (`.nvmrc` vs `engines` vs CI) e activar Dependency Graph | P2-14, P2-13 | S |
| 18 | Estado vazio + `aria-live` na pesquisa de `/servicos` | P2-06 | S |

### Primeira semana

| # | Tarefa | ID | Esf. |
|---|---|---|---|
| 19 | Corrigir as imagens trocadas das 35 landing pages e gerar OG images próprias | P2-01 | L |
| 20 | Reescrever os 51 `<h1>`/`<title>` que são keywords cruas | P2-02 | M |
| 21 | Decidir e remover um dos dois design systems em `global.css`; resolver `Manrope` vs `Open Sans`; considerar self-hosting da fonte | P1-05, P3-06 | L |
| 22 | Introduzir Playwright versionado com specs de rotas, canonical, headings, contraste e submissão de form | P1-14 | L |
| 23 | Adicionar ESLint (`eslint-plugin-astro`) + Prettier + `.gitattributes` | P2-17 | M |
| 24 | Reescrever os 10 blurbs de serviços (`catalog.ts`, `home.ts`) | P2-19 | S |
| 25 | Fixar QSSMA/QSMS, razão social, e derivar antiguidade de `foundingDate` | P2-20 | S |
| 26 | Corrigir ou marcar como históricos os docs que contradizem o repo; remover `docs/IMPLEMENTATION_AUDIT.md` (Next.js) ou movê-lo com aviso | P2-18, P3-17 | S |
| 27 | `lastmod` no sitemap; tornar a integração condicional à flag de indexação | P2-12 | S |

### Primeiro mês

| # | Tarefa | ID | Esf. |
|---|---|---|---|
| 28 | **Consolidação dos clusters de canibalização antes de ligar `PUBLIC_ALLOW_INDEXING=true`** — é a tarefa que desbloqueia o valor de SEO das 107 páginas | P2-10 | L |
| 29 | Publicar CREA/ART/horário; enriquecer o JSON-LD `Organization` com `vatID`, `foundingDate`, `openingHoursSpecification` | P2-21 | M |
| 30 | Validar JSON-LD nos dois auditores (parse + resolução de `@id`) | P2-07, P4-07 | M |
| 31 | Normalizar autores e datas do blog | P3-08, P3-09, P2-09 | M |
| 32 | `BreadcrumbList` nos 20 artigos + nível intermédio em `/servicos/*`; remover canonical do `404.html` | P3-02, P3-03, P3-04 | S |
| 33 | `og:image:alt`/`width`/`height`, `twitter:site`, e corrigir `theme-color` para a cor real da marca | P3-05 | S |
| 34 | `cache-control: immutable` para `/_astro/*`; política de cache para HTML | P3-07 | S |
| 35 | Higiene: `.gitignore` para `.tmp-og-test/`, corrigir `AGENTS.md`, remover `.vscode/launch.json` ou torná-lo multiplataforma | P3-13, P3-14, P3-15 | S |

### Backlog futuro

- Lightbox real ou remover o caption "Clique nas imagens para ampliar" (P3-12)
- Página de carreiras ou remover o botão "Trabalhe Conosco" (P4-03)
- Ano no copyright; remover ou reformular a citação da Lei 9610 (P4-04)
- Remover o `<select>` decorativo de `/servicos` (P4-01)
- Resolver os PRs do Dependabot pendentes e agrupar (`groups` no config) (P2-16, P3-16)
- `npm audit` completo incluindo devDependencies na CI (P3-16)

---

## 7. Checklist de aceite

```
CONTEÚDO E LEGAL
[ ] /politica-de-privacidade devolve 200 e está linkada no footer de todas as páginas
[ ] /termos-de-uso devolve 200 e está linkada no footer
[ ] As URLs legadas vivas redireccionam 301 (verificado com curl -I)
[ ] CookieBanner ligado à BaseLayout OU ficheiro removido
[ ] Zero ocorrências de "neste ambiente" em qualquer página construída
[ ] Zero costuras de keyword sem espaço ("emsistemas", "delaudos", "emprojeto")
[ ] Zero mojibake: grep por "Ǫ" devolve 0 resultados
[ ] Zero secções com <h2> sem conteúdo seguinte
[ ] Nenhuma frase trata um preço/orçamento como um documento
[ ] QSSMA vs QSMS unificado em todo o site
[ ] Razão social idêntica no footer e em /sobre-nos
[ ] CREA e horário de funcionamento publicados

FORMULÁRIO
[ ] PUBLIC_CONTACT_ENDPOINT definido no ambiente de produção
[ ] Submissão com dados de teste produz lead efectivamente recebido
[ ] Estado de sucesso visível e anunciado (aria-live)
[ ] Estado de erro visível, com mensagem útil e sem stack trace
[ ] Upload respeita tipo/tamanho e o erro é comunicado
[ ] CI falha se PUBLIC_CONTACT_ENDPOINT estiver vazio num build de produção

CONTACTO
[ ] tel:+5531984734644 presente e funcional em mobile
[ ] WhatsApp usa wa.me ou api.whatsapp.com (zero web.whatsapp.com)
[ ] Telefone, e-mail e morada idênticos em footer, /contato e JSON-LD

SEO
[ ] Canonical, og:url, JSON-LD e Sitemap: usam todos o mesmo host
[ ] O host canónico devolve 200 (não 301)
[ ] 144/144 <loc> do sitemap coincidem exactamente com um canonical
[ ] Todos os titles <= 65 caracteres
[ ] Todas as descriptions entre 120 e 160 caracteres, sem "..."
[ ] 145 titles únicos e 145 descriptions únicas (já passa hoje)
[ ] 404.html sem canonical
[ ] BreadcrumbList em todas as páginas excepto home e 404
[ ] og:image existe para todas as páginas (já passa hoje: 0 em falta)
[ ] og:image:alt e og:image:width/height presentes
[ ] sitemap tem lastmod
[ ] sitemap só é publicado quando a indexação está ligada
[ ] Decisão tomada sobre indexação das 107 landing pages antes de ALLOW_INDEXING=true

ACESSIBILIDADE (WCAG 2.2 AA)
[ ] Todo o texto >= 4,5:1 (>= 3:1 para texto grande) — incluindo botões do footer
[ ] Todo o indicador de foco >= 3:1 contra o fundo adjacente
[ ] Placeholders >= 4,5:1
[ ] Nenhum outline com alpha < 100% como único indicador de foco
[ ] Navegação completa por teclado testada em browser real (NÃO FEITO nesta auditoria)
[ ] Ordem de foco lógica, sem armadilhas (NÃO TESTADO)
[ ] Zoom a 200% sem perda de conteúdo (NÃO TESTADO)
[ ] Reflow a 320px sem scroll horizontal (NÃO TESTADO — nota: body tem overflow-x:hidden, que mascara o sintoma)
[ ] Alvos interactivos >= 24x24px (parcial: .primary-navigation a tem min-height:44px OK)
[ ] Pesquisa de /servicos anuncia resultados via aria-live
[ ] Estado vazio da pesquisa implementado
[ ] Teste com leitor de ecrã (NÃO FEITO)

PERFORMANCE
[ ] LCP < 2,5s em 4G simulado, mobile (NÃO MEDIDO — sem browser)
[ ] INP < 200ms (NÃO MEDIDO)
[ ] CLS < 0,1 (NÃO MEDIDO)
[ ] Zero imagens > 150KB servidas como PNG fotográfico
[ ] Zero assets órfãos em dist/images
[ ] CSS por página < 50KB após remoção do design system morto
[ ] Fonte não bloqueia render (preload, self-host ou font-display controlado)
[ ] cache-control: public, max-age=31536000, immutable em /_astro/*

SEGURANÇA
[ ] Strict-Transport-Security presente
[ ] X-Content-Type-Options: nosniff presente
[ ] frame-ancestors (CSP) ou X-Frame-Options presente
[ ] Referrer-Policy presente
[ ] Permissions-Policy presente
[ ] CSP com default-src (não apenas upgrade-insecure-requests)
[ ] X-Powered-By removido ou PHP actualizado para versão suportada
[ ] /wp-login.php não acessível publicamente (enquanto o WP existir)
[ ] npm audit --audit-level=high limpo, incluindo devDependencies
[ ] Zero segredos no repo e no histórico (JÁ PASSA)
[ ] Staging protegido por autenticação ou IP

DEVOPS
[ ] Pipeline de deploy versionado no repo
[ ] Build de produção validado na CI com as variáveis de produção
[ ] Branch protection activa com quality.yml como required check
[ ] quality.yml tem timeout-minutes
[ ] .nvmrc, package.json engines e CI na mesma versão de Node
[ ] Actions pinadas por SHA ou todas no mesmo major
[ ] Clone limpo -> npm ci -> npm run validate passa com 0 imagens em falta
[ ] Link checker cobre /images/, /assets/ e favicon
[ ] Testes E2E versionados e a correr na CI
[ ] Lint e format configurados e a correr na CI
[ ] Estratégia de rollback documentada
[ ] docs/ coerentes com o estado real do repo
```

---

## 8. Casos de teste reproduzíveis

**Dados de teste seguros:** usar sempre `teste.exemplo@dominio.invalid`, `+55 00 00000-0000`, nome `Utilizador Teste`. Nunca dados reais de terceiros.

### P0-01 — Páginas legais ausentes

```bash
# Esperado hoje: 200 / 200  ->  após cutover sem correcção: 404 / 404
curl -sS -o /dev/null -w "%{http_code}\n" https://ajnengenharia.com.br/politica-de-privacidade/
curl -sS -o /dev/null -w "%{http_code}\n" https://ajnengenharia.com.br/termos-de-uso/
curl -sS -o /dev/null -w "%{http_code}\n" https://sienna-mongoose-223157.hostingersite.com/politica-de-privacidade/
curl -sS -o /dev/null -w "%{http_code}\n" https://sienna-mongoose-223157.hostingersite.com/termos-de-uso/
```

**Resultado observado:** `200`, `200`, `404`, `404`.
**Esperado após correcção:** `200` nos quatro, e os dois últimos com 301 das URLs legadas.

### P0-02 — Formulário não envia

1. Abrir `/contato`.
2. Preencher: Nome `Utilizador Teste`, E-mail `teste.exemplo@dominio.invalid`, Telefone `+55 00 00000-0000`, "Como nos conheceu" → `Busca do Google`, Mensagem `Teste de auditoria`.
3. Clicar "Enviar mensagem".

**Resultado observado (estático, confirmado no código e no HTML publicado):** nenhum pedido de rede é efectuado; `event.preventDefault()` corre sempre; a região `role="status"` passa a *"O formulário está validado, mas o envio ainda não está habilitado neste ambiente."* e recebe foco. Mesmo antes de interagir, o texto já visível é *"Envio online indisponível neste ambiente."*

**Esperado:** pedido POST ao endpoint configurado, resposta de sucesso, lead recebido na caixa de entrada de destino.

### P1-01 — Canonical vs redirect de produção

```bash
curl -sS -D - -o /dev/null https://www.ajnengenharia.com.br/ | grep -iE "^HTTP|^location"
```

**Observado:** `HTTP/1.1 301 Moved Permanently` / `Location: https://ajnengenharia.com.br/`.
**Esperado após correcção:** o host usado em `<link rel="canonical">` devolve `200` sem redirect.

### P1-02 — Canonical vs sitemap

```bash
npm run build
grep -o "<loc>[^<]*</loc>" dist/sitemap-0.xml | head -3
grep -o 'rel="canonical" href="[^"]*"' dist/ltcat-preco/index.html
```

**Observado:** sitemap `https://www.ajnengenharia.com.br/ltcat-preco/` (com `/`); canonical `https://www.ajnengenharia.com.br/ltcat-preco` (sem `/`). **144 de 144 divergem.**
**Esperado:** strings idênticas.

### P1-03 / P1-04 — Contraste

Reproduzir o cálculo sobre os tokens em `src/styles/global.css:39` (`#86a56f`), `:2689` (`#4caf50`), `:2357`+`:2109` (`#5b9923`), `:2311` (`#7a847b`).

**Observado:** 2,75:1 · 2,78:1 · 3,49:1 · 3,79:1. **Esperado:** ≥ 3:1 (foco/UI) e ≥ 4,5:1 (texto).

**Verificação adicional em browser (não feita aqui):** abrir `/contato`, navegar só com `Tab` e confirmar que o anel de foco é visível em cada paragem.

### P1-06 — Costuras de keyword e mojibake

```bash
grep -n "emsistemas\|delaudos\|emprojeto\|Utilizarlaudos\|seuprojeto" src/content/marketing/*.ts
grep -n "Ǫ" src/content/route-catalog.ts
```

**Observado:** 10 hits de costura em 3 ficheiros; 1 hit de mojibake em `route-catalog.ts:51`. Visível em `/mapa-site` como texto de link.
**Esperado:** 0 hits.

### P1-10 — Clone limpo parte a home

```bash
git clone <repo> /tmp/clone && cd /tmp/clone
npm ci && npm run build
grep -o 'src="/images/clients/[^"]*"' dist/index.html | sort -u
# verificar se cada ficheiro existe em dist/
```

**Esperado (estado actual, se `home.ts` for commitado sem os PNG):** 10 referências a `cliente-NN.png` sem ficheiro correspondente → 10 imagens em 404, com `npm run validate` **verde**.
**Após correcção:** 0 referências partidas, e o link checker a detectá-las se regressarem.

### P1-12 — Headers de segurança

```bash
curl -sSI https://sienna-mongoose-223157.hostingersite.com/ | grep -iE "strict-transport|x-content-type|content-security|referrer-policy|permissions-policy|x-frame"
```

**Observado:** apenas `content-security-policy: upgrade-insecure-requests`. Faltam os outros cinco.
**Esperado:** todos presentes.

### P1-15 — CI parte com o 21.º artigo

1. Num branch, duplicar um post de blog existente com slug novo e dados válidos.
2. `npm run build && node scripts/audit-blog.mjs`

**Observado esperado:** exit code ≠ 0 com falha em `report.articles !== 20`, apesar de o conteúdo ser válido.
**Após correcção:** exit 0.

### P2-03 — Peso de `/servicos`

```bash
npm run build
ls -l dist/images/services/*.png | sort -k5 -n -r | head -9
```

**Observado:** 9 ficheiros entre 170 KB e 314 KB, PNG fotográficos servidos a 600×800.
**Esperado:** WebP/AVIF, < 60 KB cada.

---

## 9. Evidências

### Build

```
npm run build -> exit 0
22:23:43 [build] output: "static"
22:23:47 [build] 145 page(s) built in 4.54s
22:23:47 [@astrojs/sitemap] `sitemap-index.xml` created at `dist`
dist/: 778 ficheiros, 39,47 MB (36,75 MB em 628 imagens)
```

### Censo das 145 páginas construídas (read-only)

```
SEO
  PAGES 145
  UNIQ_TITLES 145        UNIQ_DESCRIPTIONS 145
  NO_TITLE 0   NO_DESC 0   NO_CANONICAL 0   NO_ROBOTS 0
  DUP_TITLE 0  DUP_DESC 0  DUP_CANONICAL 0
  LONG_TITLE(>65) 37     SHORT_DESC(<70) 3
  DESC_COM_RETICENCIAS 92
  ROBOTS_DIRECTIVE_COUNTS {"noindex":145}
  OG_IMAGE_FICHEIRO_INEXISTENTE 0
  JSON_LD_INVALIDO 0
  SEM_BreadcrumbList 21
  og:image:alt 0/145 · og:image:width 0/145 · twitter:site 0/145 · hreflang 0/145
  theme_color {"#4CAF50":145}
  404_canonical https://www.ajnengenharia.com.br/404

SITEMAP vs CANONICAL
  SITEMAP_LOC 144   LOC_SEM_TRAILING_SLASH 0
  UNIQ_CANONICALS 145   CANONICAL_SEM_SLASH_NAO_HOME 144
  LOC_QUE_COINCIDEM_EXACTAMENTE_COM_UM_CANONICAL 1  <- de 144

ACESSIBILIDADE ESTRUTURAL
  IMG_TAGS 1800   IMG_SEM_ALT 0   IMG_SEM_WIDTH/HEIGHT 0   ALT=""_DECORATIVAS 1039
  H1_ZERO 0   H1_MULTIPLO 0   SALTOS_DE_HEADING 0   HEADINGS_VAZIOS 0
  SKIP_LINK_FALTA 0   MAIN_FALTA 0   IDS_DUPLICADOS 0
  TARGET_BLANK_SEM_NOOPENER 0 (de 1308)
  ANCORAS_SEM_NOME_ACESSIVEL 0
  NAV_SEM_ARIA-LABEL 0
  TEL_LINKS 0/145 · TELEFONE_COMO_TEXTO 145/145 · HREFS_web.whatsapp.com 581

PESO
  CSS_POR_PAGINA min 87.337 / mediano 87.337 / max 106.196 bytes
  SCRIPTS_EXTERNOS 0 · SCRIPTS_INLINE 255 KB no total (437 tags)
  PAGINAS_COM_PNG>150KB 1 (/servicos, 9 referências)
  ORFAOS_EM dist/images 33 ficheiros · 3,22 MB
```

### Contraste (rácios calculados sobre os tokens reais, com alpha-blending)

| Elemento | Cor efectiva | Rácio | Requisito | Veredicto |
|---|---|---|---|---|
| `input:focus` box-shadow `rgb(76 175 80/16%)` s/ `#fbfdfb` | `#dff1e0` | 1,15 | 3:1 | **FALHA** |
| `.contact-form__status:focus` outline (20 % alpha) | `#d2e9d2` | 1,20 | 3:1 | **FALHA** |
| border de campo em repouso `#c9d6ca` vs `#fbfdfb` | — | 1,47 | 3:1 | risco (ver §11.2) |
| `.footer__button--secondary` border (30 % alpha) s/ `#333` | `#6b6d6b` | 2,42 | 3:1 | **FALHA** |
| focus outline global `#86a56f` vs `--canvas #f6f8f4` | — | 2,58 | 3:1 | **FALHA** |
| focus outline global `#86a56f` vs `#ffffff` | — | 2,75 | 3:1 | **FALHA** |
| `.footer__button` `#fff` vs `#4caf50` (145 páginas) | — | 2,78 | 4,5:1 | **FALHA** |
| `.footer__button:hover` `#fff` vs `#67bd6a` | — | 2,32 | 4,5:1 | **FALHA** |
| `.footer__button--secondary` border `#777` vs `#333` | — | 2,82 | 3:1 | **FALHA** |
| `.contact-form .button` `#fff` vs `#5b9923` | — | 3,49 | 4,5:1 | **FALHA** |
| `.contact-page__social a` `#fff` vs `#5b9923` | — | 3,49 | 4,5:1 | **FALHA** |
| `::placeholder` `#7a847b` vs `#fbfdfb` | — | 3,79 | 4,5:1 | **FALHA** |
| `input:focus` border-color `#576b43` vs `#fbfdfb` | — | 5,72 | 3:1 | PASSA |
| `input:focus` border-color `#2f7d35` vs `#fbfdfb` | — | 5,00 | 3:1 | PASSA |
| `.contact-form__help` `#666` vs `#fff` | — | 5,74 | 4,5:1 | PASSA |
| `.primary-navigation a[aria-current]` `#576b43` vs `#fff` | — | 5,85 | 4,5:1 | PASSA |
| `.contact-form .button:hover` `#fff` vs `#576b43` | — | 5,85 | 4,5:1 | PASSA |
| `a` link `--primary #526846` vs `#fff` | — | 6,13 | 4,5:1 | PASSA |
| `.contact-form__status` `#526052` vs `#f3f8f3` | — | 6,19 | 4,5:1 | PASSA |
| `.footer__brand > p` (66 % alpha) s/ `#333` | `#bababa` | 6,51 | 4,5:1 | PASSA |
| `.topbar__label` (58 % alpha) s/ `#223222` | `#98a296` | 5,13 | 4,5:1 | PASSA |
| `.topbar` text `#dbe4d7` vs `#223222` | — | 10,40 | 4,5:1 | PASSA |
| `.button` (legado) `#fff` vs `#31452f` | — | 10,38 | 4,5:1 | PASSA |
| `.footer` / `.service-index-card__content` `#fff` vs `#333` | — | 12,63 | 4,5:1 | PASSA |
| `.hero__lead` (84 % alpha) s/ `#223222` — **fundo é imagem, estimativa** | `#dcdedc` | 10,03 | 4,5:1 | **não verificado** |

### Headers HTTP observados (GET passivo)

```
https://www.ajnengenharia.com.br/
  HTTP/1.1 301 Moved Permanently · Location: https://ajnengenharia.com.br/
  X-Powered-By: PHP/8.0.30 · X-Redirect-By: WordPress · Server: LiteSpeed
  Content-Security-Policy: upgrade-insecure-requests · X-Litespeed-Cache: miss
  platform: hostinger · panel: hpanel

https://ajnengenharia.com.br/
  HTTP/1.1 200 OK · x-powered-by: PHP/8.0.30 · Server: LiteSpeed
  link: <https://ajnengenharia.com.br/wp-json/>; rel="https://api.w.org/"
  X-Litespeed-Cache: hit · Content-Security-Policy: upgrade-insecure-requests
  <meta name="generator" content="WordPress 7.1">

https://ajnengenharia.com.br/robots.txt
  User-agent: * / Disallow: /wp-admin/ / Allow: /wp-admin/admin-ajax.php
  Sitemap: https://ajnengenharia.com.br/wp-sitemap.xml

https://ajnengenharia.com.br/wp-sitemap.xml
  1 sub-sitemap -> wp-sitemap-posts-page-1.xml -> 3 URLs:
    / · /politica-de-privacidade/ · /termos-de-uso/

Códigos de estado em produção:
  / 200 · /politica-de-privacidade/ 200 · /termos-de-uso/ 200
  /wp-admin/ 302 · /wp-login.php 200
  /contato 404 · /servicos 404 · /ltcat-preco 404 · /projeto-eletrico-bh 404
  /empresa-ltcat 404 · /pcmso-preco 404 · /elaboracao-pgr-pcmso 404
  /blog/nr-35-trabalho-em-altura-e-seguranca 404
  (404 genuíno: 26.703 bytes, title "Página não encontrada - AJN…", wp-content presente)

https://sienna-mongoose-223157.hostingersite.com/
  HTTP/1.1 200 OK · Server: hcdn · x-hcdn-cache-status: DYNAMIC
  ETag: W/"73bf-6ac6fb96-639a46fd78ff7b9;;;" · Last-Modified: Thu, 08 Oct 2026 02:10:30 GMT
  Content-Security-Policy: upgrade-insecure-requests · SEM cache-control
  ACESSO PÚBLICO, SEM AUTENTICAÇÃO

https://sienna-mongoose-223157.hostingersite.com/robots.txt   <- DIVERGE DO REPO
  User-agent: Googlebot / Disallow: /
  User-agent: * / Allow: /

https://sienna-mongoose-223157.hostingersite.com/ltcat-preco/
  200 · 17.018 bytes · IS_WORDPRESS false
  robots: noindex,nofollow,noarchive
  canonical: https://sienna-mongoose-223157.hostingersite.com/ltcat-preco   <- SEM slash
  title: "Ltcat preço - AJN Consultoria e Engenharia"
  description: "Ltcat preço é um documento indispensável … presentes no..."  <- truncada

  /_astro/BaseLayout.BKBdKQK3.css -> 200 · cache-control: public, max-age=604800
    content-encoding: br · x-hcdn-cache-status: MISS
  imagem -> 200 · image/png · 6.118 bytes · cache-control: public, max-age=604800
  /politica-de-privacidade/ 404 · /termos-de-uso/ 404 · /sitemap-index.xml 200 (211 bytes)
```

### Estado do repositório

```
git status: ## main...origin/main [behind 1]
   M src/data/home.ts      M src/styles/global.css
  ?? .tmp-og-test/         ?? public/images/clients/cliente-01..10.png
  ?? src/assets/blog/blog-a-importancia-do-ltcat-…-5b7fade9f1.png
remote: https://github.com/wandersongandra/ajn-site.git · HEAD a381e71 · 17 branches remotas

Dependências (manifest vs lockfile, ambos concordam):
  astro 7.3.6 · @astrojs/sitemap 3.7.4 · zod 4.6.5 · @astrojs/check 0.9.10 · typescript 6.0.3
  lockfileVersion 3 · 3 dependências de produção · 0 adapters de hosting

Varredura de segredos: 0 tokens/chaves/credentials
  Único .env* alguma vez commitado = .env.example
global.css: 3.360 linhas, 104.534 bytes, 3 blocos :root (linhas 1, 530, 901)
```

### Ficheiros/linhas citados com mais peso

`src/layouts/BaseLayout.astro:26-33,36-61,90-94` · `src/components/ContactPage.astro:4,64,120-129` · `src/pages/robots.txt.ts:6-11` · `astro.config.mjs:5,8-12` · `src/styles/global.css:39,901-937,1892-1901,2109,2311,2350-2362,2382,2682-2698` · `src/components/ServicesIndexPage.astro:27-31,47-53` · `src/components/Footer.astro:9,25,29-30,44` · `src/components/PromoDialog.astro:3` · `src/components/CookieBanner.astro` · `src/components/ClientsSection.astro:14-16` · `src/content/route-catalog.ts:51` · `src/content.config.ts:33-45,87` · `scripts/audit-seo.mjs:31-33,38-50,62-70` · `scripts/audit-blog.mjs:39,40,76` · `.github/workflows/quality.yml:19-21,44-48` · `SECURITY.md:29`

---

## 10. Recomendação final

**Publicaria agora? Não.**

**Motivo principal:** o site não consegue receber um lead. O formulário de `/contato` — destino do CTA das 107 landing pages e do rodapé de 145 páginas — não envia nada e diz ao visitante, em linguagem de desenvolvimento, que "o envio ainda não está habilitado neste ambiente". Simultaneamente, o cutover apagaria duas páginas legais que estão vivas e a responder 200 no domínio actual (`/politica-de-privacidade/`, `/termos-de-uso/`), enquanto o formulário recolhe nome, e-mail, telefone e anexo. Um site de captação que não capta e que perde a sua base legal não está pronto, independentemente da qualidade do resto.

**Correcções indispensáveis (por esta ordem):**

1. **P0-02** — provider de formulários + `PUBLIC_CONTACT_ENDPOINT` em produção e na CI + reescrever as duas strings + gate que falha se o endpoint estiver vazio.
2. **P0-01** — política de privacidade e termos de uso reais, redirect 301 das URLs legadas, links no footer, decisão sobre o `CookieBanner` órfão.
3. **P1-01 + P1-02** — host canónico único (o apex, que é o que a infra já impõe) e trailing slash consistente entre canonical e sitemap. Sem isto, o cutover queima o SEO de 144 páginas no dia 1.
4. **P1-10** — commitar as 11 imagens untracked e remover a exclusão de assets do link checker. Sem isto, um deploy feito a partir de um clone limpo parte visivelmente os 10 logos da home **com todas as gates verdes**.
5. **P1-08 + P1-09 + P1-12** — pipeline de deploy versionado, job de CI que valida as variáveis de produção, headers de segurança. Já há deriva comprovada entre o repo e o que está publicado (o `robots.txt` de staging não é o que o código gera).
6. **P1-03 + P1-04** — contraste dos botões do footer (2,78:1) e do indicador de foco (2,75:1). São duas linhas de CSS cada.
7. **P1-06 + P1-07** — as 10 costuras (`"emsistemas contra incêndio bhe"`), o `Ǫ` em `/mapa-site`, as 3 secções `<h2>` vazias e as frases que tratam um preço como documento.

**Riscos que permanecem mesmo após as correcções:**

- **As 107 landing pages são o maior risco latente.** A prosa é genuinamente reescrita (só 3 % de frases partilhadas), mas a arquitectura é doorway: 106/107 terminam com o mesmo heading-template, 103/107 partilham um parágrafo byte-idêntico, 51 `<h1>` são keywords cruas, há URLs com as mesmas duas palavras invertidas, e 35 páginas mostram fotografias de outro serviço. **Hoje isto está neutralizado** — `noindex,nofollow,noarchive` em 145/145 páginas e `Disallow: /` no robots. `PUBLIC_ALLOW_INDEXING=true` é o interruptor que transforma isto de latente em activo, e nenhum dos gates actuais o impede. A decisão de indexar tem de ser precedida da consolidação dos clusters (tarefa 28).
- **Produção continua em WordPress 7.1 sobre PHP 8.0.30 (EOL desde Nov/2023) com `/wp-login.php` público** até o cutover acontecer. É o risco vivo hoje.
- **Nada foi testado em browser.** CLS/LCP/INP, navegação por teclado, ordem de foco, zoom a 200 %, reflow a 320 px e leitor de ecrã estão **por verificar**. Nota específica: `body { overflow-x: hidden }` (`global.css:35`) mascara activamente overflow horizontal — se houver um problema de reflow, ele está escondido, não ausente.
- **Não existe rede de testes.** Nenhuma regressão futura é detectável automaticamente para além de tipos, build e duas verificações de presença de SEO.
- **`npm audit` não foi executado** — o estado real de vulnerabilidades das dependências é desconhecido.

**Próximo passo mais importante:** decidir o provider do formulário e o host canónico, e escrever essas duas decisões em código e em CI. São duas escolhas pequenas que desbloqueiam 2 dos 10 bloqueadores e sem as quais nada do resto pode ser publicado. Enquanto isso, **corrigir P1-10** — é o único achado em que um deploy feito hoje, a partir de um clone limpo, parte visivelmente a home page com todas as validações a passar a verde.

---

## 11. Segunda revisão do próprio relatório

Procura de omissões, contradições e falsos positivos.

### 11.1 Falsos positivos retirados

1. **"`/servicos` tem 2 controlos de formulário sem label."** O censo reportou `NOLABEL 1 :: servicos/index.html 2`. **Está errado.** `ServicesIndexPage.astro:22-25` envolve o input num `<label>` com `<span class="sr-only">Pesquisar serviços</span>` (label implícita, válida) e o `<select>` tem `aria-label="Quantidade por página"` (`:28`). O detector só procurava `for=` ou `aria-label` no próprio input. **Não é violação de WCAG 1.3.1/4.1.2.** Retirado. Os problemas reais daquele componente são outros e estão reportados separadamente: o `<select>` não funcional (P4-01) e a ausência de feedback da pesquisa (P2-06).
2. **"O `robots.txt` de staging permite indexação."** Tecnicamente emite `User-agent: * / Allow: /`, mas foi verificado que a página publicada traz `noindex,nofollow,noarchive`. O `meta robots` prevalece sobre o `robots.txt` para indexação. **O risco real é outro**: o artefacto publicado não corresponde ao que o repo gera (deriva de deploy, P1-08) e staging está publicamente acessível. Redacção do P1-08 ajustada.
3. **"`--wp-green`/`--wp-green-dark` no botão do formulário."** Há duas definições (`#4caf50`/`#2f7d35` globais, `#5b9923`/`#576b43` scoped a `.contact-layout` em `global.css:2109-2110`). Ambos os rácios foram reportados (3,49:1 e 5,85:1) — o estado de repouso (3,49:1) falha, o hover (5,85:1) passa. A conclusão mantém-se; a dualidade estava pouco clara na primeira redacção.

### 11.2 Achados rebaixados

4. **"Contraste do contorno do campo em repouso falha 1.4.11 (1,47:1)."** O par calculado foi a border contra o **fundo do próprio campo**. O par relevante para SC 1.4.11 é a border contra o fundo **circundante**. O número mantém-se mas está classificado como **risco, não violação confirmada** — o fundo da secção `.contact-page--form` não foi verificado.
5. **"Foco dos inputs do formulário é invisível."** Parcialmente falso: o `box-shadow` a 16 % é de facto invisível (1,15:1), mas `outline: 0` é compensado por `border-color: var(--wp-green-dark)`, que dá **5,72:1** contra o fundo do campo. O foco **é** perceptível via mudança de cor da borda. Classificado como recomendação (P1-04 cobre o outline global, que é o problema real), não como violação de WCAG 2.4.7.

### 11.3 Omissões corrigidas

6. `body { overflow-x: hidden }` mascara overflow horizontal — relevante para o teste de reflow que **não foi possível fazer**. Adicionado aos riscos remanescentes e ao checklist.
7. Não estava dito explicitamente que **não existe superfície de autenticação** — logo IDOR/BOLA, CSRF, sessão, cookies de auth, rate limiting e multi-tenancy são **N/A por ausência**, não "verificados e limpos". Declarado em §2.
8. O `dist/` medido vem de uma **working tree suja e com `main` 1 commit atrás de `origin/main`**. Todas as métricas de HTML/CSS/imagens são do estado local, não do commit `main`. Declarado em §2 e no bloco de evidências.

### 11.4 Contradição não resolvida

9. `docs/LEGACY_INVENTORY.md` e `docs/ROUTES_AUDIT.md` falam em **143 URLs legadas**. O `wp-sitemap.xml` de produção lista **3**, e o índice tem um único sub-sitemap (sem posts nem taxonomias). Ou os docs vieram de um backup/Google Search Console que já não reflecte o live, ou o WordPress foi entretanto reduzido. **Não foi possível determinar qual** — não há backup WordPress neste directório. Esta ambiguidade afecta directamente a decisão de redirects (ver §3). **Acção: verificar no Google Search Console antes do cutover.**

### 11.5 Limitação metodológica declarada

10. Uma das tabelas de contraste foi inicialmente impressa com a coluna `VERDICT` a dizer `FAIL` em **todas** as linhas, incluindo rácios de 12,63:1. Causa: `parseFloat("AA 4.5:1")` devolve `NaN` e `x >= NaN` é sempre `false`. **Os rácios estavam correctos; só o veredicto automatizado estava partido.** Cada linha foi reavaliada manualmente contra o limiar correcto e a tabela em §9 reflecte essa reavaliação, não a saída bruta do script.

### 11.6 O que não será revisto por falta de acesso

Estado real das definições do GitHub, `npm audit`, vivacidade dos ~40 links externos, e qualquer métrica de Core Web Vitals. Estes quatro ficam marcados como **não testados** em todo o relatório e **não devem ser lidos como "sem problemas"**.
