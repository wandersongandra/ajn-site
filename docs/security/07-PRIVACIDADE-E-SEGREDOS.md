# Privacidade e segredos

**Data:** 2026-10-08 · **Escopo:** arquivos de ambiente, dados públicos, formulários, armazenamento e páginas legais.

## Segredos

- `.gitignore` exclui `.env`, `.env.production` e `.env.*`, com exceção de `.env.example`.
- `.env.example` contém somente origem pública, flag de indexação e endpoint de contato vazio; não contém credenciais.
- `git ls-files` não encontrou `.env`, chave privada, dump ou source map versionado no checkout.
- Varredura local de palavras/padrões sensíveis não encontrou token/chave/credencial de produção. Matches em documentação e CSP foram falsos positivos sem segredo.
- Isso significa **não detectado na amostra atual**, não prova de inexistência histórica em todos os refs/remotos; Gitleaks está configurado na CI, mas seu run e configurações do GitHub não foram verificados.

## Dados e terceiros

O formulário de produção está desativado; o site apresenta links diretos para WhatsApp e e-mail. O visitante pode decidir enviar dados a esses canais, mas o repositório não processa nem armazena as mensagens. Google Fonts gera requisição do navegador a terceiros. Não foram encontrados analytics, cookies próprios, local/session storage ou pixel nos arquivos de aplicação auditados.

## Páginas legais

GET read-only em 2026-10-08 retornou **404** para `https://ajnengenharia.com.br/politica-de-privacidade/` e `/termos-de-uso/`. As rotas são relevantes para transparência do visitante e continuidade da migração. O conteúdo jurídico aprovado e sua proveniência não foram localizados nesta rodada; não foram redigidos textos inventados. Status: `ABERTO`, severidade média, responsável: AJN/operador do conteúdo.

## Limitações

Não foram inspecionados painel Hostinger, caixa de e-mail, CRM, WhatsApp Business, logs administrativos ou registros do provedor. Não se afirma ausência de cookies/retensão fora do código do repositório; observações do site foram GET pontual e sem browser/storage inspection.
