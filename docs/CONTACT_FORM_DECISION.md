# Formulário e contato — Fase 4
Data: 2026-10-06

O frontend preserva nome, e-mail, telefone, como nos conheceu, anexo opcional e mensagem. Há validação acessível e limite de anexo de 10 MB.

Nenhum dado é enviado ou armazenado. O submit informa explicitamente que a entrega está desabilitada; não existe sucesso falso.

Para produção ainda é necessário decidir provedor, destinatário, anti-spam e se anexo/origem serão mantidos. Recomenda-se endpoint serverless/edge com validação server-side, Turnstile, rate limit e provedor de e-mail/API, sem banco.
