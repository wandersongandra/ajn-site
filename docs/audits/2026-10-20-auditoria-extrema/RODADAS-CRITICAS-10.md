# AJN — 10 rodadas independentes de auditoria crítica

Data de fechamento: 21/10/2026  
Base auditada: main em `7691507f75dc5a0a5fc18a3e3b1176633f33a8c6` e branches de entrega das Fases 3, 4 e 5.  
Regra: cada rodada reavaliou um risco diferente; quando a falha era de código ou de teste, houve correção e novo teste antes de avançar.

## Registro das rodadas

| Rodada | Foco e problema encontrado | Correção aplicada | Reteste e evidência |
| --- | --- | --- | --- |
| 1 | Integração de trabalho: as melhorias de performance estavam divididas nas PRs abertas #78 e #79. | As duas branches foram preservadas e seus commits foram incorporados por cherry-pick em `perf/ajn-fase3-final`; as PRs originais não foram reescritas nem fechadas. | `npm run check`, build de 164 páginas e gates de performance executados na branch consolidada. |
| 2 | Inventário de mídia: o fallback da Home ainda referenciava os PNGs legados da pasta pública. | O catálogo passou a usar WebP/JPEG otimizados, mantendo os PNGs antigos somente para compatibilidade de URL. | `npm run audit:home-services`: PNG 1476 KiB → WebP 425 KiB, economia de 71%, 6 cards aprovados; `npm run audit:services-catalog`: 14 cards e 353 KiB. |
| 3 | Fontes e mídia de origem: havia fontes Google remotas e cópias PNG não usadas no conjunto de assets de Home. | Cinco subsets WOFF2 locais com licenças OFL foram adicionados; links e preconnects externos foram removidos; PCMSO/ASO foi convertido para WebP e seis PNGs de origem não referenciados foram removidos. | Build limpo + `audit:performance` e `audit:hosting-config`: 165 HTML sem Google Fonts, 97 KiB de fontes e 165 HTML + CSS verificados. |
| 4 | Estabilidade visual: detalhes de serviço usavam dimensões genéricas para imagens com proporções portrait e landscape. | `imageWidth`/`imageHeight` passaram a ser dados obrigatórios por serviço; a imagem crítica recebe prioridade explícita e CSS usa `height:auto`/`object-fit:contain`. | Gate estático encontrou 2.042 imagens com dimensões; performance budget passou com 54 assertions; smoke passou com 1.457 assertions. |
| 5 | Qualidade do código: `astro check` apresentava dois hints de imports/parâmetro não usados. | Imports e parâmetro sem uso foram removidos nos scripts de auditoria/navegador. | `npm run check`: 0 errors, 0 warnings, 0 hints nas branches de entrega. |
| 6 | Fallback sem JavaScript: o menu aberto por padrão permanecia em overlay sticky e o botão principal continuava focável sem listener. Severidade P1/P2. | O fallback sem JS passa a usar o fluxo normal, desativa o sticky apenas nesse modo e oculta o botão inerte; submenus permanecem expostos. | `browser-accessibility.mjs`: 214 assertions PASS em Home, serviços, Blog e contato, nos viewports 320/375/390/430/768 px; fluxo, visibilidade, foco e overflow verificados. |
| 7 | Movimento reduzido e teclado: era necessário verificar que a navegação e os controles permaneciam operáveis com `prefers-reduced-motion` e foco de teclado. | O teste foi ampliado para menu mobile, submenu, Escape, skip link, foco visível, `aria-hidden` e overflow em desktop/mobile. | `browser-accessibility.mjs`: 46 assertions PASS; `browser-smoke.mjs`: matrizes reduced/default/save-data PASS. |
| 8 | Primeira execução do teste de acessibilidade apontou falha no alvo de foco: o harness tentava focar o toggle desktop oculto no viewport mobile. | O harness foi corrigido para iniciar no primeiro link de navegação visível, sem alterar o produto. | Reexecução: 46 assertions PASS; o registro preserva o problema como defeito de teste, não como falsa aprovação do site. |
| 9 | Matriz de rotas: o artefato estático `/informacoes/` usa meta refresh e destruía o contexto do navegador durante a varredura. | O teste passou a reconhecer esse artefato de redirecionamento e validar o refresh e o destino `/mapa-site`, sem perder a cobertura das demais rotas. | `browser-route-matrix.mjs`: 164 rotas × 2 viewports, 1.635 assertions PASS; smoke geral: 1.457 PASS. |
| 10 | Governança: o gate aceitava Dependabot sem `version: 2`/diretório correto e podia aprovar seis arquivos sem confirmar CodeQL, Gitleaks e auditoria de dependências. Severidade P2. | CODEOWNERS, parser YAML estruturado, validação de schema/agendas/duplicidades, identidade explícita dos três workflows obrigatórios e fixtures negativas foram adicionados; SECURITY.md existente foi preservado. | `audit:governance` PASS; `audit:workflows` PASS com 6 workflows; `test:audit-workflows` e `test:audit-governance` PASS, incluindo remoção/renomeação de cada workflow obrigatório; check 0/0/0. |

## Testes cruzados e limites

Além das rodadas acima, a Fase 3 passou pelo `npm run validate` completo com `PUBLIC_SITE_ORIGIN` e `PUBLIC_ALLOW_INDEXING=false`, incluindo SEO, fragmentos, deploy, segurança, conteúdo editorial, privacidade, formulário, blog, sitemap, workflows e auditorias de mídia. A Fase 4 foi verificada com servidor estático local e Chromium nas matrizes desktop/mobile, movimento reduzido, `save-data`, teclado e JavaScript desabilitado.

Os testes não comprovam, sozinhos, dados reais de campo, p75 de Core Web Vitals, Safari/iOS, leitores de tela físicos, headers efetivamente entregues pela Hostinger, cache de CDN ou regras de proteção configuradas no GitHub. Esses pontos permanecem como validação pós-aprovação do proprietário.

Não houve merge, deploy, alteração de DNS, alteração de configuração da conta GitHub ou mudança no endpoint de contato. As PRs desta entrega devem continuar aguardando revisão explícita.
