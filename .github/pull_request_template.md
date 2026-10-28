## Objetivo e escopo

Descreva o problema, as páginas ou os fluxos afetados e o comportamento esperado.

## Riscos e segurança

- [ ] Não há credenciais, tokens, dados pessoais ou exports privados no diff, nos anexos ou nos logs.
- [ ] Entradas externas (URLs, formulários, HTML e JSON-LD) são validadas ou serializadas com segurança.
- [ ] Dependências e Actions novas foram justificadas; o lockfile e os SHAs fixos foram mantidos.
- [ ] Nenhum teste, auditoria, scanner ou permissão foi enfraquecido para obter status verde.
- [ ] Mudanças em workflows, hosting, headers ou redirects receberam revisão específica.

## Validação e evidências

- [ ] `npm run check` e `npm run build` passaram.
- [ ] `npm run validate` e as auditorias aplicáveis passaram com as variáveis de ambiente adequadas.
- [ ] Mudanças visuais ou interativas foram verificadas em mobile, desktop e teclado, quando aplicável.
- [ ] Páginas, canonical, sitemap e links internos mantêm o comportamento esperado.

Inclua resultados dos comandos, evidências antes/depois e eventuais limitações dos testes.

## Publicação e reversão

- Impacto esperado no deploy da `main`/Hostinger:
- Como reverter a mudança se houver regressão:
- Riscos conhecidos e pontos que exigem acompanhamento:

> A checklist apoia a revisão, mas não substitui os checks obrigatórios do GitHub nem a aprovação humana quando configurada.
