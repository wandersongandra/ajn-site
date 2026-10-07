# FASE 2 — QA Visual WordPress × Astro

Data da auditoria: 2026-10-06  
Escopo: comparação read-only do WordPress público com o preview local Astro.

## Matriz executada

Templates representativos:

- Home: `/`
- Institucional: `/sobre-nos`
- Índice de serviços: `/servicos`
- Detalhe de serviço: `/servicos/gestao-ambiental`
- Landing/marketing: `/emissao-laudos`
- Índice do Blog: `/blog`
- Artigo: `/blog/laudo-tecnico-das-condicoes-ambientais-de-trabalho-ltcat`
- Contato: `/contato`
- Especial: `/mapa-site`

Viewports: 1440×900, 1024×900, 768×1024, 390×844 e 360×800.

Foram capturados 90 screenshots: 45 do legado e 45 do Astro. Os artefatos estão em `tests/visual/screenshots/<template>/<viewport>/` e são ignorados pelo Git.

## Achados e correções

| Severidade | Achado | Resultado |
| --- | --- | --- |
| MAJOR | Popup promocional era montado em todas as rotas Astro, cobrindo o conteúdo | Corrigido: popup limitado à home, mantendo fechamento acessível |
| MAJOR | Missão, visão e valores não reproduziam os três painéis verdes do legado | Corrigido com painéis, contraste e grafismos responsivos |
| MAJOR | Índice de serviços não tinha imagens nem busca visual compatível | Corrigido com cards de imagem, overlay, busca client-side e rotas existentes |
| MAJOR | Blog não tinha sidebar e duplicava o bloco de últimas postagens | Corrigido com sidebar, tags, busca e grid único |
| MAJOR | Detalhes de serviço/marketing não tinham a barra lateral de informações | Corrigido com CTAs e links derivados do catálogo local |
| MAJOR | Rodapé não tinha coluna social, mapa do site e CTAs do legado | Corrigido no template compartilhado |
| MAJOR | Contato não tinha a estrutura visual do formulário legado | Corrigido o shell visual, campos, validação HTML e acessibilidade |
| BLOCKED | Destino operacional do formulário de contato não foi confirmado | Sem POST para o WordPress e sem endpoint inventado; integração permanece pendente antes da publicação |
| A11y Improvement | O legado apresenta overflow horizontal em 390px (`scrollWidth=474`), prejudicando leitura e uso | Astro mantém layout fluido e sem overflow; o defeito legado não foi reproduzido |

## Validação funcional e estrutural

CONFIRMED no preview local:

- As 9 rotas representativas mantêm exatamente 1 `<h1>`.
- As 9 rotas não apresentaram imagens quebradas na coleta pós-scroll.
- As 9 rotas não apresentaram overflow horizontal em 390px.
- O menu mobile abre com `aria-expanded="true"` e navegação visível.
- O banner de cookies fecha e persiste a decisão em `localStorage`.
- O popup promocional existe somente na home.
- `npm run check`: PASS — 0 erros, 0 warnings, 0 hints.
- `npm run build`: PASS — 143 páginas estáticas.
- `git diff --check`: PASS.
- `npm audit --omit=dev --audit-level=high`: PASS — 0 vulnerabilidades.
- Não há `any` nem `dangerouslySetInnerHTML` em `src/`.

## Pendências

- Configurar e validar o destino de envio do formulário de contato em ambiente autorizado.
- Fazer uma rodada visual final com cookie notice previamente aceito e popup fechado para comparação de conteúdo sem overlays.
- A validação de produção, DNS e deploy não faz parte desta rodada.
