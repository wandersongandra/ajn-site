# Visual polish 3 — AJN Astro

Data: 2026-10-07

## Objetivo

Terceira passada visual, restrita a problemas confirmados no staging. Não altera DNS, WordPress legado, banco, conteúdo factual ou estratégia de indexação.

## Alterações

- Hero reequilibrado com imagens reais já presentes no portfólio da AJN;
- Popup promocional com entrada/saída suave, fechamento claro e auto-dismiss;
- Escala de títulos internos reduzida para evitar H1 desproporcional;
- Kicker e breadcrumbs com leitura melhor;
- Busca da página de Serviços reorganizada em bloco próprio;
- Sidebar do Blog simplificada, removendo duplicação de "Últimas postagens";
- Filtros de busca/tópicos do Blog tornados funcionais;
- Ajustes adicionais de responsividade para tablet e mobile.

## Itens da auditoria não aplicados

- "Blog ausente na Home": falso positivo; o preview já existe.
- "Clientes ausentes": falso positivo; os logos já são renderizados.
- "Botão Enviar mensagem no footer é formulário": incorreto; trata-se de link para /contato.
- Não houve troca por imagem genérica externa; foram reutilizadas imagens reais do próprio projeto.

## Gate

A branch deve passar por:
- npm ci
- npm run check
- npm run build
- npm run audit:seo
- npm audit --omit=dev --audit-level=high

Somente após PASS deve ser incorporada à main.
