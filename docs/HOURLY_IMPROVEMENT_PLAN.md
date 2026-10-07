# Plano horário de melhoria — AJN Astro

Início: 2026-10-06  
Staging: https://sienna-mongoose-223157.hostingersite.com  
Branch de deploy do staging: `main`

## Regras

- Uma fase por execução, com duração-alvo de aproximadamente 1 hora.
- Cada fase deve ler o estado atual antes de alterar qualquer arquivo.
- Não alterar DNS, WordPress legado, banco ou domínio oficial.
- O staging deve permanecer `noindex` enquanto usar o domínio temporário.
- Só atualizar `main` quando o lote da fase estiver coerente e o gate técnico estiver saudável.
- Nunca inventar conteúdo, equipe, certificações, avaliações ou métricas.
- Respeitar `prefers-reduced-motion` e acessibilidade.
- Atualizar este arquivo ao final de cada fase com status, commit e pendências reais.

## Fases

| Hora | Fase | Escopo principal | Status |
|---|---|---|---|
| 1 | Design system e tipografia | Fonte, escala tipográfica, rendering, ritmo, tokens, movimento-base e quality gate | DONE |
| 2 | Home e conversão | Hero, ordem das seções, densidade, clientes, soluções, portfólio, diferenciais e CTAs | DONE |
| 3 | Páginas internas | Legibilidade, largura de leitura, headings, galerias, sidebars, serviços e marketing | DONE |
| 4 | Motion e microinterações | Entradas sutis, hover/focus, menus, cards, feedback e redução de movimento | DONE |
| 5 | SEO técnico | Titles, descriptions, canonicals, robots, sitemap, schema, breadcrumbs, 404 e redirects | DONE |
| 6 | Performance e mídia | Imagens, carregamento, formatos, fontes, CSS/JS, cache e desperdícios | DONE |
| 7 | Acessibilidade e mobile | Teclado, foco, contraste, labels, touch targets, 360/390/768/1024 | DONE |
| 8 | QA final e polimento | Staging completo, consistência visual, links, imagens, regressões e relatório final | DONE WITH WARN |

## Fase 1 — resultado

Implementado:

- migração tipográfica de Poppins para Manrope;
- melhoria de legibilidade e suavização de fonte;
- hierarquia de títulos mais consistente;
- escala básica de espaçamento;
- animação de entrada sutil no hero;
- estados de hover/focus nos principais cards;
- preservação de `prefers-reduced-motion`;
- workflow de qualidade no GitHub para `npm ci`, `astro check`, build e audit de dependências.

Critério de continuidade:

- manter o site totalmente estático;
- não adicionar bibliotecas de animação sem necessidade;
- priorizar percepção de qualidade, legibilidade e performance.


## Fases 2–7 — resultado consolidado

### Fase 2 — Home e conversão
- reorganização do fluxo da Home para priorizar confiança, apresentação e serviços;
- metadata da Home mais específica;
- logos e portfólio com menor ruído e feedback visual consistente.

### Fase 3 — Páginas internas
- cabeçalhos internos com hierarquia mais clara;
- superfícies de leitura para artigos, serviços e páginas de marketing;
- largura de texto reduzida para leitura confortável;
- sidebars e conteúdo longo com separação visual mais consistente.

### Fase 4 — Motion e microinterações
- animações progressivas em CSS sem biblioteca de runtime;
- entradas discretas, hover e feedback de clique;
- respeito integral a `prefers-reduced-motion`.

### Fase 5 — SEO técnico
- Open Graph e Twitter metadata completos;
- schema `Organization`, `WebSite`, `BreadcrumbList` e `Article`;
- 404 próprio com `noindex`;
- audit automatizado de title, description, canonical, robots, H1 e links internos;
- quality gate passou a executar `npm run audit:seo`.

### Fase 6 — Performance e mídia
- preload do hero somente na Home;
- `content-visibility` em blocos longos abaixo da dobra;
- manutenção de lazy loading e build totalmente estático;
- nenhuma biblioteca de animação adicionada.

### Fase 7 — Acessibilidade e mobile
- skip link para conteúdo principal;
- alvos de navegação com altura mínima;
- formulário de contato com labels explícitos, autocomplete, inputmode e `aria-live`;
- foco visível e ergonomia mobile reforçados;
- staging permanece `noindex`.

## Fase 8 — QA final e polimento

Validado no staging publicado:

- Home, Serviços, Contato, Mapa do site e páginas representativas carregando com metadata do domínio de staging;
- rota recuperada de Projetos Elétricos gerada e acessível;
- artigos implementados do Blog retornando conteúdo real, após eliminar links do catálogo antigo para posts não migrados;
- `robots` meta confirmado como `noindex,nofollow,noarchive` no staging;
- canonical, Open Graph e Twitter metadata confirmados no domínio temporário;
- Manrope, hierarquia visual, cards, sidebars, footer e WhatsApp consistentes nas páginas inspecionadas;
- Quality Gate: PASS — 0 erros, 0 warnings do Astro, 145 páginas geradas, audit SEO PASS e 0 vulnerabilidades.

Correções descobertas pelo próprio gate/QA:

- uma URL de serviço elétrico existente no WordPress estava fora do catálogo original; foi recuperada e incluída no Astro;
- o catálogo visual do Blog apontava para posts não implementados; agora é derivado de `blogPages`, impedindo novos links órfãos;
- 404 próprio, acessível e com identidade visual foi adicionado.

WARNs remanescentes:

- o endpoint `robots.txt` do domínio temporário é parcialmente controlado pela Hostinger e apresenta regra própria para crawlers; as páginas, porém, estão protegidas por meta `noindex`. Revalidar o `robots.txt` no cutover;
- testes automatizados intensivos receberam HTTP 429 da Hostinger; isso foi tratado como limitação de staging/bot protection, não como erro funcional do site;
- envio real do formulário permanece bloqueado até escolha/configuração explícita de provider;
- o comportamento do 404 em URL inexistente deve ser revalidado na configuração final do host, pois provedores podem interceptar a resposta antes do arquivo Astro.

Status: melhorias 1–8 implementadas; staging aprovado com WARNs operacionais acima. Produção WordPress e DNS permanecem intactos.
