# Formulários e integrações

**Data:** 2026-10-08 · **Escopo:** formulário de contato, links de contato e recursos externos.

## Formulário

`src/components/ContactPage.astro` lê `PUBLIC_CONTACT_ENDPOINT` no build. Se o valor não puder ser analisado como HTTPS sem credenciais, não renderiza `<form>` e exibe WhatsApp/e-mail. O `.env.example` deixa a variável vazia. GET público em `/contato/` confirmou o fallback; nenhum POST foi realizado.

O código tem campos de nome, e-mail, telefone, origem, mensagem e anexo com `accept` limitado por extensão. Esse atributo do navegador não é validação de MIME/tamanho. Como não existe endpoint no projeto e o formulário não está ativo na produção observada, processamento, upload, retenção, rate limit, validação server-side, antispam, CSRF/CORS e entrega são **NÃO APLICÁVEIS ao runtime atual**; seriam requisitos obrigatórios antes de habilitar um provedor.

`PUBLIC_CONTACT_ENDPOINT` é variável pública de build e pode aparecer no HTML. Ela não pode conter token, segredo nem URL assinada com credenciais. A CSP passou a bloquear `form-action` externo. Ao aprovar um provedor futuro, configurar sua origem exata em conjunto com revisão da CSP e controles do serviço; não reabrir todos os hosts HTTPS.

## Integrações / terceiros

- Google Fonts: CSS e fonte carregados do navegador via HTTPS; potencial recebimento de IP/user-agent pelo provedor. O código não mostra analytics, cookie banner ativo, pixel ou armazenamento local.
- WhatsApp/telefone, e-mail, Instagram, LinkedIn e plataforma externa de treinamentos: links de navegação; dados inseridos pelo usuário nesses canais passam a ser tratados pelos respectivos terceiros.
- `gov.br` e `planalto.gov.br`: links editoriais para fontes oficiais, não chamadas de backend.
- Nenhum iframe, CORS configurado ou API de aplicação encontrado.

## Pendências

- Restaurar URLs públicas `/politica-de-privacidade/` e `/termos-de-uso/` com conteúdo aprovado. GET de produção retornou 404 em ambas. Não há texto legal novo escrito nesta auditoria.
- Antes de ativar formulário: confirmar controlador, base legal, campos mínimos, retenção, canal seguro para anexos, limites e política do provedor, validação server-side, antiabuso e resposta de erro.
