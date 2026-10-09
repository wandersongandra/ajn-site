# Formulários e integrações

**Data:** 2026-10-08 · **Escopo:** formulário de contato, links de contato e recursos externos.

## Formulário

`src/components/ContactPage.astro` lê `PUBLIC_CONTACT_ENDPOINT` no build. Se o valor não puder ser analisado como HTTPS sem credenciais, não renderiza `<form>` e exibe WhatsApp/e-mail. O `.env.example` deixa a variável vazia. GET público em `/contato/` confirmou o fallback; nenhum POST foi realizado.

O código tem campos de nome, e-mail, telefone, origem, mensagem e anexo com `accept` limitado por extensão. Esse atributo do navegador não é validação de MIME/tamanho. Como não existe endpoint no projeto e o formulário não está ativo na produção observada, processamento, upload, retenção, rate limit, validação server-side, antispam, CSRF/CORS e entrega são **NÃO APLICÁVEIS ao runtime atual**; seriam requisitos obrigatórios antes de habilitar um provedor.

`PUBLIC_CONTACT_ENDPOINT` é variável pública de build e pode aparecer no HTML. Ela não pode conter token, segredo nem URL assinada com credenciais. A PR #50 preserva o `.htaccess` existente; a política atual observada ainda aceita `form-action https:`. Uma futura integração deve autorizar a origem exata em alteração de infraestrutura separada, junto à revisão dos controles do provedor.

## Integrações / terceiros

- Google Fonts: CSS e fonte carregados do navegador via HTTPS; potencial recebimento de IP/user-agent pelo provedor. O código não mostra analytics, cookie banner ativo, pixel ou armazenamento local.
- WhatsApp/telefone, e-mail, Instagram, LinkedIn e plataforma externa de treinamentos: links de navegação; dados inseridos pelo usuário nesses canais passam a ser tratados pelos respectivos terceiros.
- `gov.br` e `planalto.gov.br`: links editoriais para fontes oficiais, não chamadas de backend.
- Nenhum iframe, CORS configurado ou API de aplicação encontrado.

## Pendências

- Restaurar URLs públicas `/politica-de-privacidade/` e `/termos-de-uso/` com conteúdo aprovado. GET de produção retornou 404 em ambas. Não há texto legal novo escrito nesta auditoria.
- Busca no checkout AJN e no diretório pai por arquivos/rotas de privacidade/termos não encontrou conteúdo-fonte; os componentes Astro também não contêm links para essas URLs. Assim, não há link de rodapé quebrado no HTML do checkout, mas as páginas continuam ausentes no domínio público.
- O texto aprovado pode estar em fonte externa/legada não disponível nesta rodada. Restaurar somente após aprovação da AJN sobre conteúdo, URLs e práticas descritas; não copiar texto jurídico genérico.
- Antes de ativar formulário: confirmar controlador, base legal, campos mínimos, retenção, canal seguro para anexos, limites e política do provedor, validação server-side, antiabuso e resposta de erro.
