# AJN — Limpeza técnica, fase 3: carrosséis históricos e inventário de imagens

Data: 08/10/2026. Projeto: `wandersongandra/ajn-site` (Astro e Hostinger).

## O que mudou

Esta rodada removeu **6.573 caracteres** de `src/styles/global.css`, de 92.577 para 86.004 caracteres. As remoções foram escolhidas por referência ao markup dos componentes efetivamente renderizados.

- Removidos estilos de `carousel-shell`, botões de carrossel antigos, grade `clients__track`, imagens `client-logo` e antiga seção `mission__grid`.
- Removido um segundo bloco de carrossel de clientes (`clients__viewport`, `clients__group`, `clients-marquee`), que conflitava conceitualmente com a implementação atual `home-clients-rail`.
- Mantidas as regras **ativas** de fundo e espaçamento `.clients` e `.clients .section-title`; o CSS da faixa atual continua em `src/styles/clients-carousel.css`.
- Retiradas declarações antigas de carrossel em `.solutions__track` e `.highlights__track` e suas entradas de media queries, preservando os cartões de serviço ativos `.service-card`.
- Nenhum elemento da Home foi removido ou substituído; o carrossel atual sem caixas não foi alterado.

## Proteção contra regressões

`scripts/audit-dead-css.mjs` foi ampliado para varrer as classes exatas no HTML do build e impedir o retorno dos seletores mortos no CSS. Confere a existência de `home-clients-rail`, `data-clients-carousel`, área de serviços e etapa de trabalho na Home, além da estrutura Sobre Nós.

Os demais scripts de auditoria de SEO, sitemap, catálogo, Blog, cabeçalho, rodapé e serviços seguem ativos na CI.

## Diagnóstico de mídia duplicada (sem exclusão)

Criado `scripts/audit-asset-duplicates.mjs`: percorre `public/images` e `src/assets`, identifica duplicações por SHA-256 do conteúdo, estima bytes adicionais e procura referências textuais em fontes Astro/CSS/TS/JS. Os resultados aparecem na CI por meio de `npm run audit:assets`.

A última contagem do tree de GitHub indicou **61 famílias de blobs repetidos** e cerca de **7,16 MB** em caminhos adicionais. Esse número é de armazenamento em caminhos do repositório, **não é o tráfego baixado pelo visitante** nem prova de arquivo órfão. URLs públicas e imports podem ser usados individualmente por páginas, por isso as imagens não foram apagadas.

A checagem de referências textuais ajuda a priorizar a investigação, mas não identifica todos os usos dinâmicos, registros externos, URLs antigas indexadas ou backlinks. **Não deletar automaticamente**.

## Plano de continuação

1. Auditar o restante de `global.css` por classes obsoletas e referências exatas, especialmente grades antigas de portfólio e missão, sem remover estilos compartilhados com a Home atual.
2. Comparar visualmente desktop/mobile a Home, Sobre Nós, Serviços, Blog e Contato antes de refatorar a cascata e dividir CSS em novos módulos. Ainda não houve comparação de screenshots automatizada por falta de saldo na ferramenta externa.
3. Consolidar imagens apenas quando todas as referências e URLs públicas forem consideradas, com redirects se houver necessidade real de remover arquivos públicos.
4. Trabalhar em PRs pequenas: Quality Gate, CodeQL, Dependency Security e Secret Leak Scan devem passar antes de merge; confirmar rotas públicas e indexação após deploy automático da Hostinger.

Nenhuma alteração de DNS, e-mail (MX/SPF/DKIM/DMARC), WordPress antigo, URL, robots, sitemap ou estrutura de conteúdo foi feita nesta rodada.
