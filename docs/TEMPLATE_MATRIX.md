# Matriz de templates — Fase 2

Data: 2026-10-06
Fonte: inventário das 143 URLs públicas recuperadas do sitemap e conteúdo local
sanitizado. A Home já existia antes desta fase.

| Template | Quantidade de URLs | Rotas | Estrutura | Componentes compartilhados | Diferenças específicas |
|---|---:|---|---|---|---|
| HOME | 1 | `/` | Hero, apresentação, clientes, missão/visão/valores, soluções, portfólio, diferenciais, destaques, popup e footer | `BaseLayout`, `Header`, `Footer`, `PromoDialog` | Ordem e composição exclusiva da Home |
| INSTITUTIONAL | 3 | `/sobre-nos`, `/informacoes`, `/mapa-site` | Breadcrumb, título, conteúdo institucional ou índice | `BaseLayout`, `PageShell`, `Header`, `Footer` | `sobre-nos` possui galeria e valores; índices possuem listas de links |
| MARKETING_DETAIL | 107 | Páginas de LTCAT, PCMSO, projetos, elevadores, incêndio e engenharia | Breadcrumb, título, galeria ou hero, seções editoriais e CTA | `PageShell`, `ContentSections`, `BaseLayout` | Texto, imagens, headings e links variam por slug |
| SERVICE_DETAIL | 9 | `/servicos/*` | Título, imagem de serviço, informações e conteúdo técnico | `ServiceDetailPage`, `ContentSections`, `PageShell` | Conteúdo e imagem de cada serviço |
| SERVICES_INDEX | 1 | `/servicos` | Título e catálogo em cards com descrição e link | `PageShell`, cards de serviço | Lista de dez itens do catálogo |
| BLOG_INDEX | 1 | `/blog` | Últimas postagens, arquivo visual e títulos clicáveis | `BlogIndexPage`, `PageShell` | Ordenação e quantidade de posts |
| BLOG_ARTICLE | 20 | `/blog/*` | Título, imagem editorial, autor/data, seções H2 e parágrafos | `BlogArticlePage`, `ContentSections`, `PageShell` | Conteúdo, imagem, autor, data e tags |
| CONTACT | 1 | `/contato` | Título, contato direto e possível formulário legado | `ContactPage`, `PageShell` | Campos e destino operacional ainda não comprovados |

## Totais

- URLs públicas inventariadas: **143**.
- URLs restantes após a Home: **142**.
- Famílias reais: **8**, contando a Home.
- A classificação SEO permanece a da auditoria de rotas: Home incluída no
  total `KEEP`; entre as 142 restantes, 141 estão `KEEP` e `/contato` está
  `REVIEW` por conteúdo recuperado curto e contrato de formulário não comprovado.
