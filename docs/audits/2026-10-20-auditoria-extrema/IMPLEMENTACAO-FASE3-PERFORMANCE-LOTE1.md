# AJN — Fase 3 / Lote 1: LCP mobile e prioridades críticas

Base Git: `7691507f75dc5a0a5fc18a3e3b1176633f33a8c6` (PR #77 integrada).
Branch: `perf/ajn-fase3-lote1-lcp-mobile`.

## Contexto medido em 20/10/2026

A auditoria anterior registrou, em execução única do Lighthouse 13.5 com Chromium 141:
- Home pública mobile: LCP **2.964 ms**; FCP 2.889 ms; TBT 0; CLS 0.
- Home local mobile: LCP **3.321 ms**.
- Blog local mobile: LCP **3.232 ms**.
- Desktop da Home local: LCP **668 ms**.
- Imagem da Home em `public/images/hero/banner.webp`: **39.306 bytes**, já com preload/high.
- Imagens de serviço na pasta `public/images/services`: algumas chegam a **321.799 bytes** e são usadas em detalhes sem `fetchpriority` explícito.

**Limitação:** dados da auditoria são amostras laboratoriais antigas, não métricas p75 reais, nem podem ser comparados com metodologias diferentes sem controle. Não há alegação de ganho quantificado antes de nova medição equivalente.

## Correções implementadas

### AJN-005 — Evitar atraso artificial no conteúdo crítico do hero mobile

Arquivo: `src/styles/home-motion.css`.

Com motion habilitado, o H1 era incluído em uma animação `hero-rise` de 490 ms com entrada por opacidade. O texto pode ser candidato a LCP. No mobile (até 768 px), o H1 passa a ser exibido imediatamente, sem depender da execução da animação. Animações dos outros elementos permanecem intactas, e desktop mantém a experiência anterior.

Nenhuma regra desabilita animações do restante do site ou altera a estratégia progressiva sem JS, com `saveData` e `prefers-reduced-motion`.

### AJN-016 — Prioridade de imagem acima da dobra nos detalhes de serviço

Arquivo: `src/components/ServiceDetailPage.astro`.

A imagem principal já era `loading="eager"`. Agora recebe `fetchpriority="high"` e `decoding="async"`, preservando `src`, texto alternativo e dimensões preexistentes (1000 × 720). Isso comunica prioridade à rede sem introduzir nova dependência.

Observação: a correção não comprime o PNG original nem garante, sozinha, melhoria de LCP.

### Monitoramento preventivo de prioridades e métricas

Arquivo: `scripts/browser-performance.mjs`, executado pelo `Browser Smoke` na CI.

Para 390 px (padrão/reduced/saveData) e 1440 px:
- Testa Home, catálogo do Blog e detalhe de serviço, com status HTTP e ausência de exceções.
- Confirma H1 mobile sem animação de opacidade e visível imediatamente.
- Confirma que o preload da imagem principal da Home é único, aponta para `banner.webp` e está marcado `fetchpriority="high"`.
- Verifica prioridade/eager/decoding/dimensões da imagem de serviço.
- Registra amostras informativas de Largest Contentful Paint (LCP), First Contentful Paint (FCP), DOMContentLoaded e bytes visíveis no Resource Timing (de acordo com disponibilidade do navegador).

O relatório é exportado para `output/playwright/browser-smoke/performance-lab.json`, incluído no artefato do workflow. **Não estabelece orçamento absoluto de LCP** a partir de execução única, pois medição sujeita a rede, dispositivo, fonte e variação.

## Pendências do programa de performance

- Repetir Lighthouse do mobile (mínimo 3–5 execuções comparáveis, antes/depois), identificar o elemento LCP real e medir ganho/regressão.
- Planejar otimizações de fontes externas, caso o waterfall confirme render blocking e se possa medir CLS/estabilidade de tipografia.
- Auditar as 78 famílias duplicadas de assets por referência em rotas. Não apagar os originais nem alterar URLs públicas sem mapeamento e validação.
- Verificar cache efetivo no Apache/Hostinger após deploy e, quando houver evidência, propor regras de cache sem mexer nas diretivas de segurança.
- Confirmar Safari/iOS e métricas de campo (p75) quando disponíveis.

## Merge / Segurança

Apenas arquivos versionados foram alterados. Não houve mudança em Hostinger, DNS, SSL, consentimento/GA4, política de privacidade nem deploy.

**Não executar merge nesta PR sem revisão explícita do proprietário.**
