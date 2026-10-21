# AJN — Fase 2, lote 1: mobile, rolagem rápida e animações

Data: 20/10/2026

Base: `main` no commit `524bd531d3c3f04f6efb7f23e6b24bd655ff81f5`

Branch: `fix/ajn-fase2-mobile-motion-scroll`

## Escopo

Correções cirúrgicas para a Home e o carrossel editorial, preservando a experiência visual, o consentimento, os links e as páginas internas. Não houve alterações em Hostinger, WordPress, DNS, SSL, GA4, conteúdo comercial ou deploy.

### Histórico da auditoria

- **AJN-008 (P2)**: na Home publicada, uma rolagem instantânea até o final podia deixar elementos com `data-reveal` invisíveis porque o `IntersectionObserver` não reporta necessariamente elementos pulados entre duas posições de scroll.
- **AJN-006 (P2)**: medições síncronas do rail do Instagram em eventos `scroll` causavam reflow desnecessário (~66–74 ms em observação anterior).
- **AJN-007 (P2)**: overflow horizontal a 390px foi observado em modificações locais **não commitadas** de `MedicoesHomeSection.astro`. Não há justificativa para aplicar correção genérica ao componente limpo da main. O novo gate verifica overflow efetivo sem mascará-lo com `overflow-x: hidden`.

## Correções versionadas

### 1. Visibilidade de conteúdo após rolagem rápida — AJN-008

`public/scripts/home.js`:

- Mantém `IntersectionObserver` para entrada progressiva em rolagem normal.
- Adiciona uma varredura de elementos ainda não revelados após `scroll`, `resize`, `pageshow` e `hashchange`.
- Um elemento já alcançado ou ultrapassado pela viewport torna-se visível mesmo quando o observer não registrou sua interseção.
- Agrupa leituras de layout por `requestAnimationFrame` e remove listeners/observer quando todos os itens já apareceram.
- Revela ao receber foco por teclado, sem obrigar usuários a esperar animação.
- Sem JavaScript, com movimento reduzido, com `saveData` ou sem `IntersectionObserver`, o conteúdo permanece visível conforme o progressive enhancement existente.

### 2. Controles do carrossel Instagram — AJN-006

`public/scripts/instagram-highlights.js`:

- Leitura de `scrollWidth/clientWidth/scrollLeft` e escrita do estado dos botões agrupadas em até uma execução por frame.
- Os listeners passivos de rolagem e resize apenas agendam o cálculo.
- `ResizeObserver` observa alterações geométricas do rail sem cálculos síncronos a cada tick.
- Preservados botões anterior/próximo, rolagem reduzida e evento de clique encaminhado ao gestor de consentimento, sem tag GA4 própria.

### 3. Regressões em navegador e CI

Novo `scripts/browser-phase2.mjs`, integrado ao `.github/workflows/browser-smoke.yml`.

Cenários:

- Mobile 320 e 390 px, desktop 1440 px, com animações permitidas.
- Mobile 390 px com `prefers-reduced-motion: reduce`.
- Mobile 390 px com `navigator.connection.saveData`.
- Mobile 390 px sem JavaScript.
- Salto instantâneo para o fim da Home; checagem de visibilidade de todas as seções passadas.
- Overflow horizontal antes e depois do salto.
- Estado dos controles Instagram no início e após salto para o fim do rail.
- Garantia de ausência de `gtag` sem consentimento, e ausência de erros JavaScript.
- Capturas Playwright disponíveis como artefatos do Browser Smoke.

## Validação e critérios de merge

Os resultados de execução efetiva são informados pelos checks remotos da PR. Código gravado no GitHub, por si só, **não** comprova que os testes rodaram.

A PR só deve ser aprovada após:

1. Browser Smoke existente, Phase 0 e Phase 2 PASS no workflow remoto.
2. Validate, CodeQL, Gitleaks e Dependency Security PASS.
3. Ausência de regressão visual e de overflow nos perfis cobertos.
4. Revisão crítica do diff, inclusive comportamento do foco e do consentimento.

**Limite:** o gate usa Chromium/Playwright no preview Astro construído pela PR. Não substitui validação em Safari/iOS, Firefox e domínio público após a publicação.

**Sem merge, deploy ou mudanças administrativas neste lote.**
