# Headers HTTP e CSP

**Data:** 2026-10-08 · **Produção:** somente GET passivo; sem POST, scan ou alteração externa.

## Evidência pública

GETs em `https://ajnengenharia.com.br/`, `/sobre-nos/`, `/contato/`, `/servicos/`, `/sitemap-index.xml` e `www` responderam por `LiteSpeed`. O host envia CSP, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin` e `Permissions-Policy`; HSTS esteve ausente. A CSP enforced observada é igual à política ampla versionada na base `5a5edaf`. Isso é consistente com `.htaccess` aplicado, mas não prova o caminho de publicação, plano Hostinger, overrides do painel ou comportamento do próximo deploy.

`https://www.ajnengenharia.com.br/` responde 200 e usa canonical do apex, sem redirecionar. GET em HTTP apex e `www` retorna 301 para a mesma variante HTTPS solicitada. As rotas `/politica-de-privacidade/` e `/termos-de-uso/` retornam 404. A raiz do host de preview falhou; `/robots.txt` respondeu por `hcdn` sem os headers deste repositório, portanto o preview não é atribuível e está bloqueado para QA de headers.

## Política encontrada e ajuste

Fonte local: `public/.htaccess`. O artefato Astro copia esse arquivo para `dist/.htaccess`. Aplicação no ambiente de publicação ainda não foi validada.

- A CSP enforced atual permanece igual à política já observada: `form-action 'self' https:` e `img-src 'self' data: https:`. Foi mantida durante a primeira etapa para evitar regressão sem QA de browser no preview.
- A política mais restritiva foi adicionada como `Content-Security-Policy-Report-Only`: `form-action 'self'`, `img-src 'self' data:`, `script-src 'self'`, `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'` e `connect-src 'self'`.
- Recursos externos encontrados: Google Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`) para CSS/fontes; scripts do site são same-origin; dados JSON-LD são blocos `application/ld+json` escapados, não JavaScript executável; imagens dos artefatos são locais/data. Links externos normais não carregam recursos por si só e não precisam ser adicionados às fontes de `img-src`/`script-src`.
- `style-src-attr 'unsafe-inline'` segue na candidata por estilos de apresentação dinâmicos do código. Não há `unsafe-inline` em `script-src` nem `unsafe-eval`.
- Não existe endpoint/backend de coleta CSP. O Report-Only não envia relatórios centralizados; violações ficam visíveis no console do browser de QA. Logo, a fase é operacional apenas para inspeção manual, e não para telemetria de visitantes. Não adicionar `report-uri` apontando para rota inexistente nem serviço externo sem aprovação.
- HSTS local foi reduzido para `max-age=300` (5 minutos), sem `includeSubDomains`/`preload`. Aumentar em etapas somente depois de observar TLS e redirects no host.
- Regra 301 de `www` para o apex HTTPS foi preparada sob `mod_rewrite.c`; não está ativa na produção observada até publicação. Path e query são preservados pela regra, mas isso precisa ser confirmado por GET depois do deploy.

## Estado e validação

`npm run audit:security` passou: verifica política Report-Only, ausência de `unsafe-inline` em scripts/`unsafe-eval`, HSTS de 300 segundos, ausência de `includeSubDomains`/`preload`, redirect configurado, sinks e artefatos HTML/JSON-LD compilados. A política restritiva não está enforced e nenhum header novo foi confirmado após publicação.

## Dependência do servidor

Documentação Hostinger informa que `.htaccess` existe em planos Web/Cloud/Agency, mas em Agency pode estar desativado para sites não WordPress; o plano desta conta e o document root não foram verificados. As respostas Live Server são compatíveis com a política antiga, sem provar que o futuro deploy incluirá o arquivo ou que painel/CDN não sobrescreverá headers. Confirmar no hPanel o plano, suporte `.htaccess`, document root e regras de redirect. Se `.htaccess` não for aplicado, usar Redirects do hPanel para 301 `www`→`https://ajnengenharia.com.br`.

Plano de rollout: primeiro aplicar Report-Only num preview acessível e testar home, blog, página de serviço, contato e mobile em browser com console aberto; corrigir qualquer violação de recurso legítimo; em alteração aprovada posterior, promover a política para enforced e validar novamente os headers. Só então elevar HSTS gradualmente (300 s → 1 dia → 1 semana → 1 ano). Sem publicação/autorização, todos os novos headers permanecem locais.

## Referências técnicas

- [Apache `mod_headers`](https://httpd.apache.org/docs/2.4/mod/mod_headers.html): emissão e substituição de headers.
- [MDN — Strict-Transport-Security](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Strict-Transport-Security): armazenamento do HSTS e alcance de `includeSubDomains`.
- [OWASP — Content Security Policy Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html): escopo de `form-action` e fontes CSP.
- [Hostinger — criação e uso de `.htaccess`](https://support.hostinger.com/en/articles/1583307-how-to-create-an-htaccess-file-at-hostinger): suporte e localização em hosting compartilhado.
- [Hostinger — limite de `.htaccess` em Agency](https://www.hostinger.com/support/how-to-enable-htaccess-on-agency-plans/): não WordPress pode exigir alternativa no painel.
- [Hostinger — Redirects no hPanel](https://www.hostinger.com/support/1583406-how-to-set-up-a-redirect-in-hostinger/): alternativa de redirect sem editar servidor.
