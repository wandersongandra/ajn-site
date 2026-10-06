# Contato — decisão funcional

Data: 2026-10-06

## Contrato confirmado no legado

O legado público possuía campos de nome, e-mail, telefone, origem (`como_nos_conheceu`), mensagem, anexo e proteção anti-spam em fluxos de contato. O destino operacional servidor não foi comprovado no backup.

## Implementação desta fase

A página Astro permanece sem banco, API ou retenção de leads.

O formulário atual:

- preserva nome, e-mail, telefone, origem e mensagem;
- não armazena dados;
- não simula sucesso de servidor;
- abre o cliente de e-mail do visitante com a mensagem preparada;
- oferece preparação de mensagem para WhatsApp;
- informa explicitamente que anexos devem ser enviados por e-mail enquanto não houver provider;
- mantém validação nativa e feedback acessível com `aria-live`.

## Decisão de arquitetura

Esta é uma solução intermediária segura para um site puramente estático. Ela não substitui um provider de entrega confiável.

Para produção com envio direto pelo site, a recomendação continua sendo um endpoint/serverless ou serviço de formulário com:

- validação server-side;
- Turnstile/reCAPTCHA ou proteção equivalente;
- rate limiting;
- validação de anexos;
- confirmação real do provider antes de exibir sucesso;
- nenhum banco, salvo requisito futuro explícito.

## Status

`PASS` para comportamento estático transparente.
`BLOCKED` para envio servidor e anexos automáticos até escolha de provider/credenciais.
