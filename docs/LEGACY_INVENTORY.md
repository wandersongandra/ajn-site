# Inventário da referência atual AJN

Status: `PASS` para a coleta inicial; `WARN` para conteúdo completo de todas as rotas.

## Fontes

| Fonte | Uso | Estado |
|---|---|---|
| `https://www.ajnengenharia.com.br/` | layout, conteúdo público, assets e SEO público | `CONFIRMED` |
| `https://www.ajnengenharia.com.br/sitemap.xml` | URLs indexáveis | `CONFIRMED`, 143 URLs |
| `ajnengenharia.com.br/public_html` | auditoria WordPress/assets locais | `CONFIRMED`, read-only |
| SQL antigo | auditoria histórica de Elementor | `CONFIRMED`, não representa necessariamente produção atual |

## Estrutura pública observada

- Header superior: endereço, WhatsApp `(31) 98473-4644` e `faleconosco@ajnengenharia.com.br`.
- Navegação: Home, Sobre Nós, Serviços, Blog, Contato, Informações e Treinamentos online.
- Home: hero, apresentação AJN, clientes, missão/visão/valores, soluções, portfólio, diferenciais e serviços em destaque.
- Footer: razão social, CNPJ público, navegação, contato, redes sociais, copyright e link flutuante de WhatsApp.
- Popup público de eSocial com imagem e CTA de regularização.

## Tokens confirmados na publicação

| Token | Valor |
|---|---|
| Fonte | Poppins |
| Primária | `#576B43` |
| Secundária | `#728A58` |
| Azul auxiliar | `#8EB7D8` |
| Escura | `#343A40` |
| Clara | `#F0F0F0` |
| Cinza de texto | `#5C5C5C` |
| Container | `1180px` |
| Slider hero | `527px` |
| Raio customizado | `1.875em` |

## Home — conteúdo confirmado

Os textos públicos da home foram extraídos para `new-site/src/data/live-home.ts`, sem copy inventada. Incluem o parágrafo do hero, cinco parágrafos institucionais, missão, visão, valores, nove soluções, três diferenciais e quatro serviços em destaque.

Assets da home estão em `new-site/public/assets/ajn-live/`. O legado não foi modificado.

## URLs

O inventário completo das 143 URLs está em [LIVE_URL_INVENTORY.md](./LIVE_URL_INVENTORY.md). Todas foram representadas em `new-site/src/data/live-pages.ts` com `path`, `title`, `description` e heading coletados da publicação. O conteúdo detalhado de cada artigo ainda precisa de uma etapa própria de extração e comparação visual.

### URLs internas fora do catálogo de 143

A auditoria da Família C confirmou 12 links internos fora do catálogo. Todos
respondem HTTP 200 no domínio público em 2026-10-06, mas nenhum possui conteúdo
correspondente no arquivo local `new-site-next-archive/public/live-content`.
Foram classificados como `LEGACY_URL` em [LINK_AUDIT.md](./LINK_AUDIT.md) e
ficam pendentes de extração de conteúdo/SEO antes de qualquer implementação ou
redirect.

| Grupo | Quantidade | Situação |
|---|---:|---|
| Artigos `/blog/` fora do catálogo | 11 | `LEGACY_URL`, HTTP 200, conteúdo local não recuperado |
| Serviço `/servicos/` fora do catálogo | 1 | `LEGACY_URL`, HTTP 200, conteúdo local não recuperado |
| Total | 12 | Não implementado e não redirecionado |

## Formulários e dados pessoais

Não foram copiados leads. O cache WPForms local foi apenas identificado, não aberto nem migrado. Campos, destino, consentimento, integrações e retenção permanecem `NÃO VERIFICADO`.

## Classificação inicial de dados

| Conjunto | Decisão |
|---|---|
| Rotas, titles e descriptions públicos | `MIGRAR` |
| Textos públicos confirmados da home | `MIGRAR` |
| Logo, hero, ícones e imagens públicas observadas | `MIGRAR` |
| Elementor/CSS/cache WordPress | `ARQUIVAR` |
| Usuários, logs, WAF, cache e transients | `DESCARTAR` do novo runtime |
| Leads, SMTP, tokens e submissions | `REVISAR` |
