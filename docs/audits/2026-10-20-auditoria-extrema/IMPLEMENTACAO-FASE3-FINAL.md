# AJN — Fase 3 final: performance, estabilidade e recursos locais

Data da evidência: 21/10/2026  
Base: `7691507f75dc5a0a5fc18a3e3b1176633f33a8c6` (main, PR #77 integrada)  
Branch de entrega: `perf/ajn-fase3-final`  
PR relacionada: será aberta contra `main`; nenhuma alteração foi integrada ou publicada.

## Escopo concluído

Esta PR consolida as alterações já aprovadas nas PRs #78 e #79 e conclui o lote de performance da Fase 3. As branches dessas PRs não foram reescritas nem fechadas.

- Fontes Archivo e IBM Plex Sans passaram a ser entregues localmente, em cinco subsets WOFF2 com `font-display: swap`; os arquivos somam 97 KiB e incluem as licenças OFL-1.1.
- Preloads de fonte e do hero usam somente a origem própria. Não há link para `fonts.googleapis.com` ou `fonts.gstatic.com` no HTML final.
- O fallback de serviços da Home deixou de apontar para os PNGs legados e usa WebP/JPEG otimizados. A imagem PCMSO/ASO usada pelo componente foi convertida para WebP.
- Imagens dos detalhes de serviço recebem dimensões intrínsecas reais por conteúdo, além de `loading="eager"`, `fetchpriority="high"` e `decoding="async"` quando são o visual principal.
- A CSP efetiva e a candidata restringem `img-src` a origem própria, `data:` e os endpoints conhecidos de medição; não há mais liberação genérica de qualquer origem HTTPS.
- O gate estático exige dimensões em todas as imagens, `defer`/`module` nos scripts locais, ausência de fontes remotas, subset de fontes abaixo do limite e nenhum PNG pesado no catálogo de fallback.
- O H1 mobile não depende da animação de entrada para ficar disponível ao usuário e ao candidato a LCP.

As imagens públicas legadas em `public/images/services/*.png` foram preservadas para não quebrar URLs antigas. Elas não são mais referenciadas pelo catálogo de fallback; sua remoção depende de confirmar redirecionamentos e acessos no ambiente publicado.

## Evidências executadas

Build limpo, com o diretório de saída anterior movido para uma área temporária antes da geração:

```text
164 page(s) built
```

Gates estáticos:

```text
[performance] PASS: 165 HTML, 2042 imagens com dimensões, 334 scripts locais defer/module e 97 KiB de fontes locais.
[hosting-config] PASS: CSP enforced preservada, candidata em Report-Only e 165 HTML + CSS verificados.
[home-services] Fotos do catálogo: PNG original 1476 KiB; WebP padrão 425 KiB; economia 71%.
[home-services] PASS: 6 cards, rotas únicas, imagens, CTAs, tipografia, mobile e animações acessíveis.
[catalogo] PASS: 14 cartões clicáveis em três grupos, imagens existentes (353 KiB no total), pesquisa e mobile.
```

Browser Smoke e gates de navegador, servidos por `python3 -m http.server` sobre o `dist` recém-gerado:

```text
Performance regression PASS: 54 assertions
Performance regression PASS: 46 assertions, 12 lab samples.
Browser smoke PASS: 1457 assertions, reduced=9 routes x 10 viewports, default=4 routes x 2 viewports, save-data=4 routes x 2 viewports.
```

O relatório detalhado do laboratório foi gravado em `output/playwright/browser-smoke/performance-lab.json`. Amostras observadas nesta execução Chromium local:

| Cenário | Rota | LCP observado | FCP observado | DCL | Transferência observada |
| --- | --- | ---: | ---: | ---: | ---: |
| mobile | `/` | 92 ms | 92 ms | 55 ms | 494.659 B |
| mobile | `/servicos/gestao-ambiental/` | 40 ms | 40 ms | 34 ms | 282.363 B |
| mobile | `/blog/` | 72 ms | 72 ms | 46 ms | 583.804 B |
| desktop | `/` | 104 ms | 104 ms | 48 ms | 716.389 B |
| desktop | `/servicos/gestao-ambiental/` | 48 ms | 48 ms | 34 ms | 282.363 B |
| desktop | `/blog/` | 80 ms | 80 ms | 37 ms | 641.424 B |

Esses números são amostras laboratoriais de execução única, em Chromium local e servidor local. Não são p75 de usuários reais, não substituem CrUX/RUM e não devem ser comparados diretamente com o Lighthouse histórico sem repetir a mesma metodologia.

Qualidade de código e regressão de layout:

```text
npm run check: 0 errors, 0 warnings, 0 hints
git diff --check: PASS
```

## Reteste após análise de segurança do CI

Depois de abrir a PR, o CodeQL identificou dois alertas de alta severidade nos próprios gates novos: uma verificação por substring em `scripts/audit-legal.mjs` e uma expressão regular não ancorada em `scripts/audit-performance.mjs`. Embora fossem apenas auditorias de artefatos locais, poderiam aceitar uma URL maliciosa contendo o texto de um domínio confiável.

Os dois pontos foram corrigidos para extrair `href` de links, normalizar com `new URL` e comparar o `hostname` com o conjunto exato `fonts.googleapis.com`/`fonts.gstatic.com`, exigindo HTTPS. O `npm run validate` foi executado novamente após a correção e passou integralmente, incluindo `audit:legal`, `audit:performance`, `audit:hosting-config` e `audit:workflows`.

## Riscos e limitações residuais

- A configuração live da Hostinger, cache, compressão, headers efetivamente entregues e comportamento de redirecionamento ainda precisam ser confirmados após aprovação em uma janela de homologação. O gate local declara explicitamente essa limitação.
- O laboratório não cobre Safari/iOS, leitores de tela, dispositivos físicos, rede móvel real ou métricas de campo.
- O conjunto de fontes é uma seleção latina; caracteres fora desse subconjunto dependem do fallback do sistema.
- Os PNGs públicos antigos permanecem por compatibilidade de URL e continuam consumindo espaço no artefato. Removê-los exige evidência de que não há tráfego legítimo ou um plano de redirecionamento.
- PRs de dependências Dependabot e regras de proteção da branch continuam sendo decisões de manutenção/configuração fora do código desta fase.

## Decisão de entrega

Os gates verificáveis desta fase estão verdes na branch. A PR deve permanecer aberta para revisão; não fazer merge nem deploy sem aprovação explícita do proprietário.
