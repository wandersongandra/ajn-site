# AJN — Fase 4: UX, responsividade e acessibilidade

Data de execução: 21/10/2026. Base: `main` em `7691507f75dc5a0a5fc18a3e3b1176633f33a8c6`.
Branch: `ux/ajn-fase4-final`.

## Achado confirmado e correção

Em viewport móvel, a regra CSS anterior mantinha `#primary-navigation` com `display: none` e dependia de `header.js` para abrir o menu. Com JavaScript bloqueado, o visitante não conseguia navegar pelos links principais ou pelo submenu. A correção mantém o menu e o submenu visíveis quando `html.js-enabled` não está presente; o script adiciona essa classe antes de inicializar o comportamento interativo, preservando o menu recolhido para navegadores com JavaScript.

O fallback não injeta conteúdo novo, não altera URLs e não remove a navegação por teclado. O submenu móvel sem JavaScript expõe os destinos existentes e mantém o link pai para `/servicos/`.

## Gates executados

| Evidência | Resultado |
| --- | --- |
| `npm run check` | PASS — 0 erros, 0 warnings, 0 hints |
| `npm run build` | PASS — 164 páginas geradas |
| `node scripts/browser-accessibility.mjs` | PASS — 46 asserções; no-JS, reduced motion, Enter, Escape, skip link, foco visível, overflow e alt |
| `node scripts/browser-route-matrix.mjs` | PASS — 164 rotas × 2 viewports, 1.635 asserções |

## Cobertura visual e de interação

- Mobile: 390 px, com JavaScript desabilitado e com `prefers-reduced-motion: reduce`.
- Desktop: 1.440 px, com navegação por teclado e foco mensurável.
- Rotas: todas as páginas HTML geradas foram abertas em Chromium em 390 px e 1.440 px; `/informacoes/` foi validada como artefato de redirecionamento `meta refresh`, sem seguir o destino no mesmo contexto.
- Critérios: HTTP OK, `main#conteudo-principal`, ausência de overflow horizontal, ausência de exceções JavaScript, dimensões intrínsecas em todas as imagens e ausência de elementos focáveis descendentes de `aria-hidden`.

## Limitações e risco residual

- A validação de navegador usa Chromium headless; Safari/iOS, Firefox, leitores de tela e hardware de toque real ainda precisam de homologação humana.
- A matriz mede ausência de regressões estruturais e de overflow, não substitui testes de contraste com hardware, pesquisa com usuários ou dados de Core Web Vitals.
- O comportamento nativo de envio do formulário só é aplicável quando um endpoint HTTPS é configurado; na configuração atual, a página exibe e testa os canais WhatsApp e e-mail como alternativa sem JavaScript.

Não houve merge, deploy, alteração de DNS, e-mail, Hostinger ou configuração de domínio.
