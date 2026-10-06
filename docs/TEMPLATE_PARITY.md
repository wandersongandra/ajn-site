# Paridade por template — Fase 2

Data: 2026-10-06
Escopo: oito rotas representativas, comparadas contra o conteúdo recuperado e
a estrutura pública atual. A validação de viewport foi feita em 1440, 768 e
390 pixels.

| Template | Elemento | Legado | Astro | Status |
|---|---|---|---|---|
| HOME | Shell | Header, footer e popup globais | Reutiliza os componentes da Fase 1 | PASS |
| INSTITUTIONAL | Conteúdo | Texto, imagens, valores e compromisso | Dados tipados em `representatives.ts` | PASS |
| INSTITUTIONAL | Responsividade | Colunas e galeria adaptáveis | CSS responsivo sem overflow observado | PASS |
| MARKETING_DETAIL | Conteúdo | Galeria, H2, parágrafos e CTA | `MarketingDetailPage` + `ContentSections` | PASS |
| MARKETING_DETAIL | Imagens | Três imagens de emissão de laudos | Assets locais selecionados | PASS |
| SERVICE_DETAIL | Conteúdo | Imagem, seção Informações e seis parágrafos | `ServiceDetailPage` + dados estruturados | PASS |
| SERVICES_INDEX | Catálogo | Dez itens com título, resumo e link | `ServicesIndexPage` com dados tipados | PASS |
| BLOG_INDEX | Arquivo | Últimas postagens e lista visual de artigos | `BlogIndexPage` com 12 imagens recuperadas | PASS |
| BLOG_ARTICLE | Conteúdo editorial | Imagem, autor/data, H1, H2 e parágrafos | `BlogArticlePage` sem HTML bruto | PASS |
| BLOG_ARTICLE | SEO | Title e description específicos | Metadata específica, canonical e Open Graph | PASS |
| CONTACT | Conteúdo | H1, Fale conosco e links de contato | `ContactPage` reproduz conteúdo público recuperado | PASS |
| CONTACT | Formulário | Campos/destino não comprovados no artefato recuperado | Não implementado até decisão operacional | WARN |
| TODOS | Header/footer | Shell global do site atual | Componentes compartilhados | PASS |
| TODOS | 1440/768/390 | Layout responsivo | Sem overflow horizontal observado | PASS |
| TODOS | Pixel-perfect | Requer comparação visual dedicada por rota | Paridade estrutural validada; diff formal não executado | WARN |

## Divergências restantes

- `/contato`: o envio não foi implementado. O inventário legado indica campos e
  integrações que precisam de confirmação antes de criar um contrato novo.
- Links para as demais 135 URLs ainda apontam para rotas que serão implementadas
  nas próximas fases.
- O diff visual automatizado por screenshot ainda não foi usado; a validação
  desta fase é estrutural, de conteúdo, geometria e console.

## Evidência de browser

- 8 rotas representativas × 3 viewports = 24 navegações verificadas.
- Em 1440, 768 e 390 pixels, `scrollWidth` foi igual à largura do viewport em
  todas as rotas.
- Todas as rotas entregaram exatamente um H1.
- Console final do preview: 0 erros e 0 warnings.
- Home em 390 pixels: popup aberto automaticamente, menu abriu com
  `aria-expanded="true"` e não houve overflow.
