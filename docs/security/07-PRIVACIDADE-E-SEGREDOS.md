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

GETs read-only em 2026-10-08 e novamente em 2026-10-09 retornaram **404** para `https://ajnengenharia.com.br/politica-de-privacidade/` e `/termos-de-uso/`. As rotas são relevantes para transparência do visitante e continuidade da migração. Status: `ABERTO`, severidade média, responsável: AJN/operador do conteúdo.

O checkout, o histórico Git disponível, o diretório `_QUARENTENA-SITE-2026-10-08` e a documentação acessível não forneceram o texto integral dessas páginas. `docs/AUDITORIA-PRODUCAO-2026-10-07.md` registra que ambas respondiam 200 no WordPress naquela data, mas não contém o conteúdo jurídico. A evidência mais recente documentada em 2026-10-08 é 404 no domínio público. Não há conteúdo a restaurar sem fonte aprovada; AJN deve fornecer/revisar/aprovar o original.

## Limitações

Não foram inspecionados painel Hostinger, caixa de e-mail, CRM, WhatsApp Business, logs administrativos ou registros do provedor. Não se afirma ausência de cookies/retensão fora do código do repositório; observações do site foram GET pontual e sem browser/storage inspection.
