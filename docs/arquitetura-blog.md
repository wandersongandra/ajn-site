# Arquitetura do Blog AJN

## Fluxo atual

- `src/content/blog/*.ts` contém os metadados e seções de cada artigo, tipados por `BlogContentData`.
- `src/content/blog/index.ts` importa os artigos, executa `validateBlogContent` e exporta a lista `blogPages`.
- `src/content/blog/catalog.ts` prepara os cards, data de publicação e categorias do arquivo.
- `src/pages/blog/[slug].astro` gera cada artigo pelo template compartilhado `src/layouts/BlogPost.astro`.
- `src/pages/blog/index.astro` renderiza a busca local, categorias, destaques, cards e estado vazio.
- `src/assets/blog/` guarda imagens fonte/derivadas; `public/images/og/` contém as capas públicas de compartilhamento.
- `src/content/route-catalog.ts` lista as rotas para sitemap, navegação e auditorias.

## Contratos editoriais

Todo artigo precisa de slug e path estáveis, título, descrição exclusiva, heading, data verdadeira, autor identificável, imagem com texto alternativo, categoria, tags e seções. Datas de revisão só devem ser acrescentadas quando a revisão ocorrer. A validação Zod confere os campos e a política de links seguros.

Os 20 artigos existentes mantêm as URLs. O campo `topic` é explícito nos novos conteúdos; os antigos usam mapeamento editorial por slug até que seus arquivos recebam metadados individuais. A classificação não depende mais do texto do título.

## Adicionar um artigo

1. Pesquisar o arquivo e as URLs existentes para evitar duplicação e canibalização.
2. Confirmar tema, serviço relacionado e limites de competência com a AJN.
3. Criar arquivo tipado em `src/content/blog/`, categoria editorial controlada e fontes oficiais vigentes.
4. Criar ilustração SVG original identificada como ilustração e derivado WebP raster para `astro:assets`.
5. Criar imagem OG 1200×630 em `public/images/og/<slug>.jpg`.
6. Importar e validar o artigo em `src/content/blog/index.ts`; adicionar path/title ao `route-catalog.ts`.
7. Adicionar link interno apenas se a página de destino existir e representar oferta real.
8. Rodar `npm run validate` e revisar a URL gerada, SEO, links e imagem.

## Pesquisa, filtros e acessibilidade

A busca usa índice de texto local no browser; categorias são links/filtros navegáveis. O botão de expansão do grid declara `aria-controls`, a contagem usa região de status e o estado vazio é explícito. Preservar comportamento de teclado, foco e movimento reduzido ao ampliar a interface.

## Decisão sobre Markdown/Content Collections

A migração integral para Markdown/MDX não foi feita. O formato TypeScript atual permite conteúdo rico validado, segmentos de link seguros e renderização do layout comum; migrar todos os 20 artigos agora cria risco de regressão de URL e contrato sem ganho comprovado. Reavaliar quando a equipe editorial precisar editar conteúdo sem tocar em TypeScript.
