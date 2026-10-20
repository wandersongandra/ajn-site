# AJN — implementação da Fase 0: acessibilidade e privacidade

Data: 2026-10-20
Branch: `fix/ajn-auditoria-extrema-fase0-a11y`
Base: `origin/main` em `e1f4576140d9fa0d5ca462d5a1c727c4ec06f194`
Ambiente: preview estático local (`127.0.0.1:4337`)

## Escopo

Esta entrega trata somente os três P1 de acessibilidade/privacy definidos para a Fase 0:

- `AJN-001` — aviso de privacidade sem foco inicial e com ordem de teclado ruim;
- `AJN-002` — nome acessível dos cards do Instagram divergente do texto visível;
- `AJN-003` — links inline nas páginas legais sem distinção persistente no texto.

Não foram alterados formulário, copy, catálogo, rotas públicas, SEO, deploy,
Hostinger, WordPress legado ou findings P2/P3.

## Reprodução antes da correção

O baseline foi executado no mesmo checkout, antes do patch, com Playwright e
viewport mobile de `390x844`:

| Finding | Evidência observada | Estado |
| --- | --- | --- |
| AJN-001 | foco inicial em `BODY`; o primeiro foco em `data-privacy-reject` ocorreu somente após 45 `Tab` | `CONFIRMED` |
| AJN-002 | seis links `.instagram-highlights__link` tinham `aria-label="Abrir no Instagram: ..."`, substituindo o nome derivado do conteúdo visível | `CONFIRMED` |
| AJN-003 | seis links inline da política tinham `text-decoration-line: none` e cor computada `rgb(61, 93, 49)` | `CONFIRMED` |

Capturas do baseline:

- [Home mobile — baseline](./evidencias/fase0/baseline-home-mobile.png)
- [Política de privacidade mobile — baseline](./evidencias/fase0/baseline-privacy-mobile.png)

## Correções implementadas

### AJN-001 — consentimento sem roubo de foco

`public/scripts/privacy-notice.js` agora:

- move o foco uma única vez para `Rejeitar opcionais` quando o aviso é exibido
  sem escolha armazenada e o documento ainda está sem foco em um controle;
- mantém o aviso como banner não modal, sem focus trap;
- envia o foco para `Salvar preferências` ao abrir a área granular;
- trata `Escape` somente nessa área granular: sem escolha mantém o aviso para
  decisão; com escolha anterior cancela a reabertura e oculta o aviso, sem
  alterar consentimento;
- no primeiro acesso, restaura `Personalizar` após o cancelamento com `Escape`;
- depois de uma decisão, usa o conteúdo principal como destino visível quando o
  gatilho de origem está dentro do aviso ocultado;
- restaura o foco ao controle de preferências do rodapé depois de `Escape` ou
  de uma decisão tomada a partir dele;
- mantém a regra fail-closed: nenhuma tag GA4 é criada sem aceite explícito.

### AJN-002 — nome acessível dos cards do Instagram

O `aria-label` redundante foi removido de cada link do card em
`src/components/InstagramHighlights.astro`. O nome acessível passa a ser
derivado do conteúdo visível do próprio link, preservando título, descrição e
ação `Ver no Instagram`, além de `target="_blank"` e `rel="noopener noreferrer"`.

### AJN-003 — links legais distinguíveis

`src/styles/global.css` passou a aplicar aos links inline de parágrafos e listas
legais:

- `color: var(--brand-action)`;
- sublinhado persistente;
- espessura e offset de sublinhado legíveis;
- cor de hover explícita.

O estilo fica escopado a `.legal-document .content-section` e não remove a
hierarquia visual dos quicklinks e botões existentes.

## Revalidação local

| Check | Resultado |
| --- | --- |
| `npm run check` | `PASS` — 0 erros e 0 warnings; 1 hint preexistente em `scripts/audit-medicoes.mjs` |
| `npm run test:privacy-notice` | `PASS` — 23 testes, incluindo primeiro acesso, `Escape`, storage bloqueado e restauração de foco |
| `npm run build` | `PASS` — 164 páginas estáticas |
| `npm run validate` | `PASS` — auditorias SEO, segurança, legais, conteúdo, contato e suítes de teste |
| `node scripts/browser-phase0.mjs` | `PASS` — 84 assertions nos perfis mobile reduzido e desktop padrão |
| `node scripts/browser-smoke.mjs` | `PASS` — 1.457 assertions, matrizes reduced/default/save-data |
| Lighthouse 13.5.0 — Home e política de privacidade, categoria accessibility | `PASS` — score `1.0` em ambas; nenhum audit com score inferior a 1 |

Capturas após a correção:

- [Home mobile — após correção](./evidencias/fase0/after-home-mobile.png)
- [Política de privacidade mobile — após correção](./evidencias/fase0/after-privacy-mobile.png)
- [Lighthouse Home — JSON](./evidencias/fase0/lighthouse-home.json)
- [Lighthouse política de privacidade — JSON](./evidencias/fase0/lighthouse-privacy.json)

O teste de browser foi adicionado ao workflow
`.github/workflows/browser-smoke.yml`, depois do smoke existente, e é executado
contra o preview construído no próprio job.

## Revisão corretiva da PR #74 — foco após cancelamento inicial

A revisão final reproduziu a lacuna em um contexto Playwright novo, sem
consentimento no `localStorage`: clicar em `Personalizar`, pressionar `Escape`
ocultava `Salvar preferências`, mas deixava `document.activeElement` em
`BODY`. O aviso permanecia visualmente presente, porém a navegação por teclado
ficava sem uma referência de foco (`CONFIRMED`, baseline anterior ao patch).

O patch captura o elemento que iniciou a personalização, diferencia o primeiro
acesso de uma reabertura com escolha já salva e usa `main#conteudo-principal`
com `tabindex="-1"` como fallback programático para decisões que ocultam o
aviso. O banner continua não modal: não há `aria-modal`, focus trap ou bloqueio
do restante da página.

Regressões Playwright executadas em contexto novo por cenário:

- primeiro acesso, `Personalizar → Escape`, aviso ainda visível e foco em
  `Personalizar`;
- ordem por teclado (`Personalizar → Rejeitar opcionais → Aceitar análise`);
- aceite e rejeição diretos, ambos com foco no conteúdo principal;
- storage bloqueado, sem consentimento e sem inicialização do GA4;
- reabertura pelo rodapé, `Escape` e decisão, restaurando o gatilho do rodapé;
- desktop `1440x900` com `no-preference` e mobile `390x844` com
  `prefers-reduced-motion: reduce`.

Capturas da revisão:

- [Registro da reprodução e resultado](./evidencias/fase0/revisao-foco-privacy.md)
- [Home mobile reduzido](./evidencias/fase0/after-focus-home-mobile-reduced.png)
- [Política mobile reduzida](./evidencias/fase0/after-focus-privacy-mobile-reduced.png)
- [Home desktop padrão](./evidencias/fase0/after-focus-home-desktop-default.png)
- [Política desktop padrão](./evidencias/fase0/after-focus-privacy-desktop-default.png)

O fluxo de consentimento e as regras de carregamento do GA4 não foram
alterados: a suíte específica continua verificando que nenhuma tag é criada
antes do aceite e que rejeição/storage bloqueado permanecem sem `window.gtag`.

## Limites da evidência

- `CONFIRMED`: comportamento do código, build, testes Node e browser local desta
  branch.
- `CONFIRMED`: Lighthouse 13.5.0 local, categoria `accessibility`, score 1.0
  na Home e na política de privacidade.
- `NÃO VERIFICADO`: Lighthouse/axe em um ambiente público e comportamento do
  domínio oficial após publicação.
- `BLOCKED`: prova de deploy, Hostinger, DNS, cache/CDN, headers efetivos e
  runtime live; esta PR não executa essas operações.

Esta documentação não substitui revisão visual em múltiplos navegadores nem a
validação jurídica do texto de privacidade.
