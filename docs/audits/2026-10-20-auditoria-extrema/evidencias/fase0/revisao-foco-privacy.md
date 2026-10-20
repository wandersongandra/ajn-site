# Evidência — revisão de foco do aviso de privacidade

Data: 2026-10-20
PR: #74
Branch: `fix/ajn-auditoria-extrema-fase0-a11y`

## Reprodução do baseline

Em um contexto Playwright novo, sem chave `ajn-cookie-preferences-v2`:

1. abrir a Home;
2. clicar em `Personalizar`;
3. pressionar `Escape`;
4. consultar `document.activeElement`.

Resultado antes do patch: `BODY`. O aviso continuava visível e `Salvar
preferências` ficava oculto, mas não havia foco utilizável (`CONFIRMED`).

## Resultado após o patch

O mesmo cenário restaura o foco em `[data-privacy-customize]` e mantém o aviso
visível. Após `Aceitar análise` ou `Rejeitar opcionais`, o foco vai para
`main#conteudo-principal`. Ao reabrir pelo rodapé, `Escape` ou a decisão
restaura o botão `[data-privacy-open]` que iniciou a interação.

## Execução

- `npm run test:privacy-notice`: 23/23 testes;
- `node scripts/browser-phase0.mjs`: 84 asserções;
- perfis: mobile `390x844` + `reduce` e desktop `1440x900` + padrão;
- storage bloqueado verificado nos dois perfis;
- `window.gtag` ausente sem aceite e presente somente nos cenários de aceite.
