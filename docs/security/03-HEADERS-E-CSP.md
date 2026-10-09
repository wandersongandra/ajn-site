# Headers HTTP e CSP

**Data:** 2026-10-09 · **Produção:** somente GET passivo; sem POST, scan ou alteração externa.

## Evidência pública

GETs em `https://ajnengenharia.com.br/`, `/sobre-nos/`, `/contato/`, `/servicos/`, `/sitemap-index.xml` e `www` responderam por `LiteSpeed`. O host envia CSP, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin` e `Permissions-Policy`; HSTS esteve ausente. A CSP enforced observada é igual à política ampla versionada na base `5a5edaf`. Isso é consistente com `.htaccess` aplicado, mas não prova o caminho de publicação, plano Hostinger, overrides do painel ou comportamento do próximo deploy.

`https://www.ajnengenharia.com.br/` responde 200 e usa canonical do apex, sem redirecionar. GET em HTTP apex e `www` retorna 301 para a mesma variante HTTPS solicitada. As rotas `/politica-de-privacidade/` e `/termos-de-uso/` retornam 404. A raiz do host de preview falhou; `/robots.txt` respondeu por `hcdn` sem os headers deste repositório, portanto o preview não é atribuível e está bloqueado para QA de headers.

## Política encontrada e estado da PR de código

Fonte versionada: `public/.htaccess`; o build copia-o para `dist/.htaccess`. A configuração atual deste arquivo foi preservada na PR #50; essa PR não altera headers nem regras de servidor.

- A CSP enforced atual permanece igual à política já observada: `form-action 'self' https:` e `img-src 'self' data: https:`. Foi mantida durante a primeira etapa para evitar regressão sem QA de browser no preview.
- Uma política candidata Report-Only, HSTS curto e redirect `www` foram separados da PR de código. Permanecem propostas sem efeito na produção; a avaliação e checklist estão em [PR de infraestrutura #51](https://github.com/wandersongandra/ajn-site/pull/51).
- Recursos externos encontrados: Google Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`) para CSS/fontes; scripts do site são same-origin; dados JSON-LD são blocos `application/ld+json` escapados, não JavaScript executável; imagens dos artefatos são locais/data. Links externos normais não carregam recursos por si só e não precisam ser adicionados às fontes de `img-src`/`script-src`.
- `style-src-attr 'unsafe-inline'` segue na candidata por estilos de apresentação dinâmicos do código. Não há `unsafe-inline` em `script-src` nem `unsafe-eval`.
- Não existe endpoint/backend de coleta CSP. Sem collector, Report-Only permitiria apenas inspeção manual via console de QA, não telemetria de visitantes. Não há política nova enviada nesta PR.
- HSTS permanece ausente na resposta pública observada; a PR de código não o habilita. `includeSubDomains`/`preload` continuam fora de escopo.
- `www` permanece respondendo 200 sem redirect ao apex, conforme a evidência pública anterior. Nenhuma regra nova foi mantida na PR #50.

## Estado e validação

`npm run audit:security` cobre sinks do frontend, links e JSON-LD nos artefatos compilados. Não valida configuração de servidor. Nenhum header ou redirect é alterado pela PR #50; checks locais e CI não provam configuração efetiva do Hostinger.

## Dependência do servidor

Documentação Hostinger informa que `.htaccess` existe em planos Web/Cloud/Agency, mas em Agency pode estar desativado para sites não WordPress; o plano desta conta e o document root não foram verificados. As respostas Live Server são compatíveis com a política antiga, sem provar que o futuro deploy incluirá o arquivo ou que painel/CDN não sobrescreverá headers. Confirmar no hPanel o plano, suporte `.htaccess`, document root e regras de redirect. Se `.htaccess` não for aplicado, usar Redirects do hPanel para 301 `www`→`https://ajnengenharia.com.br`.

Plano de rollout e rollback da configuração proposta foram deslocados para PR de infraestrutura independente em draft. Para esta PR, o baseline de `.htaccess` é idêntico ao `main`.

## Referências técnicas

- [Apache `mod_headers`](https://httpd.apache.org/docs/2.4/mod/mod_headers.html): emissão e substituição de headers.
- [MDN — Strict-Transport-Security](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Strict-Transport-Security): armazenamento do HSTS e alcance de `includeSubDomains`.
- [OWASP — Content Security Policy Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html): escopo de `form-action` e fontes CSP.
- [Hostinger — criação e uso de `.htaccess`](https://support.hostinger.com/en/articles/1583307-how-to-create-an-htaccess-file-at-hostinger): suporte e localização em hosting compartilhado.
- [Hostinger — limite de `.htaccess` em Agency](https://www.hostinger.com/support/how-to-enable-htaccess-on-agency-plans/): não WordPress pode exigir alternativa no painel.
- [Hostinger — Redirects no hPanel](https://www.hostinger.com/support/1583406-how-to-set-up-a-redirect-in-hostinger/): alternativa de redirect sem editar servidor.
