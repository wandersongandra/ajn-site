# QA visual — WordPress x Astro

Data: 2026-10-06
Branch: `feat/phases-2-5-hardening`

## Escopo

Esta fase endurece a implementação já validada por template e registra o gate de QA para o preview. O WordPress público continua sendo a referência visual. A comparação pixel a pixel integral não é tratada como critério de aceite; o foco é equivalência perceptível, conteúdo, responsividade, navegação e estados interativos.

## Evidência já disponível

- Home, institucional, serviços e três representantes de marketing já haviam sido validados em 1440, 768 e 390 px.
- Não havia overflow horizontal nas amostras registradas.
- Header, menu mobile, popup, imagens e console estavam sem FAIL crítico nas páginas representativas documentadas em `TEMPLATE_PARITY.md`.
- O site público atual confirma endereço, telefone, e-mail, navegação, famílias de serviços, blog e contato como referências funcionais.

## Correções desta rodada

- Estado `aria-current` adicionado à navegação.
- Menu mobile fecha após navegação e por `Escape`, devolvendo foco ao botão.
- Links externos do topo recebem `noopener noreferrer`.
- Formulário de contato passa a ter estados transparentes, sem simular envio servidor.
- Metadados e política de indexação passam a ser controláveis por ambiente.

## Gate de preview

Antes de declarar `VISUAL_QA=PASS`, o preview deve ser validado em 1440, 1024, 768, 390 e 360 px para:

1. Home.
2. Sobre nós.
3. Índice de serviços.
4. Detalhe de serviço.
5. Marketing standard.
6. Marketing rich.
7. Blog index.
8. Artigo.
9. Contato.
10. Mapa do site.

Classificação: `CRITICAL`, `MAJOR`, `MINOR`, `ACCEPTABLE`.

**Critério de aceite:** nenhum `CRITICAL` ou `MAJOR` conhecido.

## Estado

`WARN` — hardening implementado, mas o QA final requer o site Astro renderizado em um preview/staging acessível. Nenhuma alegação de pixel-perfect é feita nesta etapa.
