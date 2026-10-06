# Paridade por template — Fase 3 / Família C

Data: 2026-10-06
Escopo: Home, família institucional, serviços e três representantes difíceis da família de marketing. O legado WordPress continua somente como fonte de referência.

| Template | Elemento | Legado | Astro | Status |
|---|---|---|---|---|
| HOME | Shell e composição | Header, footer, popup e seções da Home | Componentes Astro reutilizáveis e tokens preservados | PASS |
| INSTITUTIONAL | Conteúdo | Texto institucional, imagens, valores e índices | src/content/institutional + templates compartilhados | PASS |
| SERVICE_DETAIL | Conteúdo | 9 imagens e seções técnicas dos serviços | 9 arquivos em src/content/services + [slug].astro | PASS |
| SERVICE_DETAIL | Links oficiais | Links de NRs presentes no legado | Segmentos estruturados com links externos seguros | PASS |
| SERVICES_INDEX | Catálogo | Dez itens com título, resumo e link | src/content/services/catalog.ts | PASS |
| MARKETING_GALLERY_STANDARD | Representantes | Emissão de laudos e laudos de segurança com galeria, H3 e listas | src/content/marketing/*.ts + template compartilhado | PASS |
| MARKETING_GALLERY_RICH | Representantes | Projeto de incêndio/pânico e sistemas contra incêndio com galerias de 4–6 imagens | src/content/marketing/*.ts + template compartilhado | PASS |
| MARKETING_GALLERY_* | Conteúdo | Textos, headings, listas, ênfase e imagens recuperados sem HTML bruto | src/content/marketing + ContentSections.astro | PASS |
| BLOG_ARTICLE | Representante | Artigo com imagem, autoria/data e seções | Arquivo dedicado em src/content/blog | PASS |
| TODOS | Estática | Sem dependência de runtime para as páginas implementadas | Build Astro output: static | PASS |
| TODOS | 1440/768/390 | Layout responsivo sem overflow | Três representantes × três viewports, scrollWidth sem overflow | PASS |
| MARKETING_GALLERY_* | Imagens | Assets locais | 14 assets copiados; imagens carregadas nas três amostras | PASS |
| MARKETING_GALLERY_* | Console | Sem erros de execução no preview local | Console local: 0 erros e 0 warnings | PASS |
| CONTACT | Formulário | Campos, destino e anti-spam não comprovados integralmente | Não configurado; aguarda decisão operacional | WARN |
| ROTAS NÃO IMPLEMENTADAS | Conteúdo | 125 URLs permanecem no inventário | Não copiadas aleatoriamente nesta fase | WARN |
| TODOS | Pixel-perfect | Diff formal para todas as 143 URLs ainda não executado | QA agrupado por template | WARN |

## Evidência de navegador desta fase

- Família institucional: 3 rotas × 1440/768/390, sem overflow, um H1 por rota e console limpo.
- Família de serviços: 3 páginas representativas (gestao-da-qualidade, PPCIP e Treinamento de NRs) × 1440/768/390.
- Nas 9 navegações da família de serviços: scrollWidth igual ao viewport, exatamente um H1 e nenhuma imagem quebrada depois da rolagem completa.
- HTTP local confirmado para as 9 URLs de serviço: status 200, um H1 e imagem principal presente.
- Família de marketing: `/projeto-seguranca-incendio-panico`, `/laudos-seguranca-do-trabalho` e `/sistemas-incendio-bh` × 1440/768/390.
- Nos três representantes: exatamente um H1, sem overflow horizontal e todas as imagens carregadas (`naturalWidth > 0`) nos três viewports.
- A página legada pública de `/projeto-seguranca-incendio-panico` foi aberta para comparação visual; shell, cores, header, conteúdo editorial, CTA e popup permanecem pontos de referência. O legado exibiu um erro de console de terceiro durante a abertura; isso não foi reproduzido no Astro local.
