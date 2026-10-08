# AJN — Auditoria e plano de limpeza técnica

Data: 08/10/2026. Repositório: `wandersongandra/ajn-site` (Astro). Meta: simplificar a manutenção sem regressão visual, de SEO ou da integração Hostinger.

## Linha de base verificada

- GitHub `main`: **625 arquivos de conteúdo no tree** (`blob`), somando **28.196.747 bytes** armazenados nos caminhos listados. Não equivale ao tamanho da página nem ao tráfego do usuário.
- `src/styles/global.css`: **103.685 caracteres** antes desta rodada; contém blocos históricos das diferentes fases visuais.
- **61 grupos de blobs idênticos por hash SHA**, com cerca de **7.159.365 bytes em caminhos adicionais**. Muitas cópias ficam em pastas de artigos comerciais e têm nomes de arquivo/URL diferentes. Não é possível concluir que estejam sem uso apenas porque seus bytes são idênticos.
- Há seis PNGs exatamente iguais nos dois caminhos `src/assets/home-services/` e `public/images/services/`, mas os imports do Astro e URLs do site usam formas distintas de acesso. Não remover os arquivos sem migrar e validar seus consumidores.
- `src/content/services/catalog.ts` e `ServicesIndexPage.astro` mantinham a informação de imagem separada e dependente da coincidência exata do título. Este acoplamento é frágil em futuras revisões editoriais.
- O CSS global inclui regras históricas de `service-index` e novas regras encapsuladas em `src/styles/services-catalog.css`. Apenas os fragmentos de catálogo substituídos foram retirados nesta fase.

## Plano com entregas e riscos

| Fase | Objetivo | Tratamento |
| --- | --- | --- |
| 1 — Dados e CSS do catálogo | Unificar origem da imagem e retirar CSS legado já substituído | **Executado nesta PR** |
| 2 — CSS global | Mapear seletores por componente; separar apenas blocos de propriedade clara, preservando cascade e media queries | Pendente de captura visual desktop/mobile e CI |
| 3 — Arquivos/imagens | Construir mapa de referências; deduplicar somente após alterar todas as rotas/fontes e testar que arquivos públicos existem | Pendente; **não apagar por SHA igual** |
| 4 — Conteúdo e URLs | Revisar páginas de intenção duplicada, especialmente LTCAT e projetos elétricos, com dados GSC e backlinks | Pendente; não aplicar 301, `noindex` ou excluir rotas sem evidência |
| 5 — Componentes e auditorias | Inspecionar imports órfãos, prop drilling, estilos não usados, testes redundantes e logs | Pendente de análise por uso e criticidade |
| 6 — QA de manutenção | Testes por rota, snapshots visuais desktop/mobile, a11y, performance e verificação após deploy | Pendente; confirmar recurso de navegador antes de alegar testes visuais |

## Mudanças realizadas na fase 1

1. `serviceIndexItems` passa a definir `image` na mesma estrutura que `title`, `description` e `href`.
2. `ServicesIndexPage.astro` utiliza `service.image` e deixa de criar um mapa que dependia do texto do título.
3. Foram retirados de `global.css` dois fragmentos já substituídos pelo CSS isolado do catálogo: um bloco de 1.375 caracteres e um conjunto final de 957 caracteres (total **2.332 caracteres**).
4. O teste `audit:services-catalog` agora barra regressões na estrutura de dados, no CSS legado e nas imagens.
5. **Nenhum recurso público, artigo, rota, ou caixa de e-mail foi excluído nesta rodada.**

## Condições de segurança para próximas fases

- O CSS tem precedência por especificidade e posição; refatorar trechos grandes sem comparar screenshots pode produzir mudanças visuais silenciosas, mesmo com `npm run build` verde.
- O navegador automatizado TinyFish não pôde iniciar na rodada anterior por saldo insuficiente. Portanto **nenhuma aprovação visual por screenshot** deve ser alegada até uma execução real ou captura alternativa verificável.
- Preservar `src/assets/home-services` e os PNGs públicos enquanto o audit da Home consumir esses caminhos; pré-conversão dos assets pelo Astro pode ser relevante para o output.
- Não alterar recursos de DNS, MX, SPF, DKIM, DMARC, configuração da Hostinger ou backup de WordPress.
- Publicar somente após Quality Gate, CodeQL, scanner de segredos/dependências PASS, e revisar HTML publicado do catálogo (10 serviços, indexável, com imagens corretas).

## Critério de conclusão da limpeza completa

Reduzir complexidade **mensurável**, não apenas contagem de linhas: nenhuma rota quebrada, mesmas informações, mesmo design validado, sem duplicação de definições de um mesmo dado, com testes estáveis e histórico para reversão.
