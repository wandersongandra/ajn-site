# Headers HTTP e CSP

**Data:** 2026-10-08 · **Produção:** somente GET passivo; sem POST, scan ou alteração externa.

## Evidência pública

Em `https://ajnengenharia.com.br/`, `/sobre-nos/`, `/contato/`, `/servicos/` e `/sitemap-index.xml`, o servidor respondeu `LiteSpeed`. Nas páginas HTML foram observados CSP, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin` e `Permissions-Policy`. `Strict-Transport-Security` esteve ausente em todas as respostas verificadas. As respostas HTTP podem ser confirmadas novamente com `Invoke-WebRequest`/`curl` após publicação.

`https://www.ajnengenharia.com.br/` responde 200 e usa canonical do apex; o host `www` não redireciona ao apex. GET em `http://ajnengenharia.com.br/` e `http://www.ajnengenharia.com.br/` respondeu 301 para as respectivas URLs HTTPS. O host de staging falhou na raiz; `/robots.txt` respondeu por `hcdn` sem os headers deste repositório, portanto o estado do preview é bloqueado/não atribuível.

## Política encontrada e ajuste

Fonte: `public/.htaccess`; a configuração atual do servidor efetivamente entrega CSP compatível com o arquivo.

- Antes: `form-action 'self' https:` e `img-src 'self' data: https:` autorizavam qualquer origem HTTPS.
- Agora: formulário limitado a `'self'`; imagens limitadas a `'self' data:`. Não há formulário externo ativo nem imagem HTTPS externa observada no artefato público.
- `script-src 'self'`, `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'` permanecem.
- Google Fonts é carregado; `style-src` e `font-src` mantêm somente os dois hosts específicos observados.
- `style-src-attr 'unsafe-inline'` continua por causa dos atributos de estilo dinâmicos e controlados pelo código; não há `unsafe-inline` para scripts nem `unsafe-eval`.
- Adicionado `Strict-Transport-Security: max-age=31536000` sem `includeSubDomains` e sem `preload`. Esse valor cobre somente o host que envia o header; não impõe TLS a todos os subdomínios.

## Estado e validação

`npm run audit:security` passou e agora impede regressão de CSP ampla e ausência de HSTS na configuração versionada. A aplicação real do HSTS, após publicação, está **NÃO VERIFICADA**. O site HTTPS está ativo no apex e `www`, mas a persistência do HSTS no navegador só começa quando uma resposta HTTPS com o header atualizado for recebida.

## Dependência do servidor

O repositório não garante que um futuro deploy envie `.htaccess` nem que outro CDN/proxy não substitua headers. Operador Hostinger deve confirmar que o arquivo está no document root e consultar as respostas de apex e `www`. Não ativar `includeSubDomains`/preload sem inventariar e validar TLS de todos os subdomínios, e-mail e integrações.

## Referências técnicas

- [Apache `mod_headers`](https://httpd.apache.org/docs/2.4/mod/mod_headers.html): emissão e substituição de headers.
- [MDN — Strict-Transport-Security](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Strict-Transport-Security): armazenamento do HSTS e alcance de `includeSubDomains`.
- [OWASP — Content Security Policy Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html): escopo de `form-action` e fontes CSP.
