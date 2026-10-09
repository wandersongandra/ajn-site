# Hardening implementado e plano operacional

**Data:** 2026-10-08 · alterações locais na branch `security/auditoria-hardening-2026-10-08`.

## A. Implementado no repositório

1. **HSTS:** `public/.htaccess` passa a emitir `Strict-Transport-Security: max-age=31536000`, sem `includeSubDomains`/`preload`. Evidência: HTTPS confirmado e header ausente em produção. Preserva rotas e conteúdo. Aplicação remota ainda não validada.
2. **CSP:** `form-action` limitado à origem própria e imagens a origem própria/data. Evidência: formulário externo ausente na produção, endpoints de formulário não configurados e imagens locais no código. Fontes Google continuam autorizadas nos hosts observados; atributos de estilo inline permanecem por dependência visual existente.
3. **Links de conteúdo:** schema Zod rejeita esquema não HTTPS, URL protocol-relative, barras invertidas que navegadores podem normalizar como autoridade e credenciais; caminhos locais são resolvidos contra origem sentinela. Teste Node cobre casos aceitos/rejeitados; URLs existentes validadas pela build.
4. **Regressão CI:** auditoria de segurança verifica HSTS/CSP; teste de links incluído em `npm run validate` e no workflow de qualidade.

## B. Dependente de Hostinger/CDN

- Publicar o artefato por processo autorizado e confirmar que o `.htaccess` desta revisão está no document root.
- Repetir GET em apex e `www`; confirmar HSTS 1 ano, CSP, `nosniff`, framing, referrer e permissions.
- Verificar redirect HTTP→HTTPS e decidir se `www` deve redirecionar ao host canonical; hoje ambas respondem 200 e canonical aponta ao apex.
- O endpoint de preview `sienna-mongoose-223157.hostingersite.com` teve resposta inconsistente/indisponível; revisar DNS/Hostinger sem mutações nesta auditoria.
- Nenhuma ação foi feita no host ou CDN.

## C. Dependente de conteúdo, serviço ou conta

- Recuperar e aprovar o conteúdo legal original para `/politica-de-privacidade/` e `/termos-de-uso/`; manter o texto e URLs aprovados.
- Confirmar configurações GitHub: branch protection, checks obrigatórios, secret scanning/push protection e Dependency Graph.
- Não habilitar formulário até selecionar provedor, aprovar tratamento/retensão e configurar allowlist exata de CSP.
- Não habilitar `includeSubDomains`/preload antes de inventariar e testar TLS de todos os subdomínios.

## Risco residual

HSTS e CSP só protegem visitantes quando o header atualizado é servido. Google Fonts permanece terceiro autorizado; estilo inline continua permitido em atributo para os valores de apresentação do site. Nenhum scan dinâmico ou browser automation foi executado.
