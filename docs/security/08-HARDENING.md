# Hardening implementado e plano operacional

**Data:** 2026-10-08 · alterações locais na branch `security/auditoria-hardening-2026-10-08`.

## A. Implementado no repositório

1. **HSTS:** `public/.htaccess` prepara `max-age=300`, sem `includeSubDomains`/`preload`, para limitar o risco inicial. Produção ainda não emite o header; não afirmar proteção ativa.
2. **CSP progressiva:** política atual permanece enforced; política restrita está em Report-Only. Não há collector central, então o console de browser em QA é a única observabilidade disponível. Promoção a enforced depende de preview acessível, QA e aprovação.
3. **Canonical host:** `.htaccess` prepara regra 301 `www`→apex HTTPS sem alterar DNS/e-mail. Não está ativa na produção até publicação; alternativa é hPanel Redirects se mod_rewrite não for aplicado.
4. **Links de conteúdo:** schema Zod aceita paths root-relative e URLs HTTPS sem credenciais, rejeitando esquemas executáveis/codificados, protocolos não autorizados, relativos suspeitos, protocol-relative e autoridade escapada por barras invertidas. Testes incluem payload de injeção em JSON-LD e parse dos JSON-LD reais do build.
5. **SEO e ambiente:** keyword map agora fornece títulos explícitos para PGR/LTCAT; audits exigem origin e estado de indexação explícitos e conferem canonical/noindex por página. Workflow também roda audits editoriais/SST no build de produção.

## B. Dependente de Hostinger/CDN

- Operador confirmar plano Hostinger, suporte a `.htaccess`, document root e overrides do painel/CDN.
- Em preview acessível, validar Report-Only no browser; depois aprovar e promover CSP para enforced em alteração separada.
- Após publicação autorizada, repetir GET em apex e `www`: HSTS inicial 300s, headers enforced/report-only e redirect 301 com caminho/query.
- O endpoint de preview `sienna-mongoose-223157.hostingersite.com` teve resposta inconsistente/indisponível; revisar DNS/Hostinger sem mutações nesta auditoria.
- Nenhuma ação foi feita no host ou CDN.

## C. Dependente de conteúdo, serviço ou conta

- Recuperar e aprovar o conteúdo legal original para `/politica-de-privacidade/` e `/termos-de-uso/`; manter o texto e URLs aprovados.
- Confirmar configurações GitHub: branch protection, checks obrigatórios, secret scanning/push protection e Dependency Graph.
- Não habilitar formulário até selecionar provedor, aprovar tratamento/retensão e configurar allowlist exata de CSP.
- Não habilitar `includeSubDomains`/preload antes de inventariar e testar TLS de todos os subdomínios.

## Risco residual

HSTS e candidate CSP dependem da publicação; CSP restrita ainda não está enforced. Report-Only sem collector não observa violações de visitantes. Google Fonts permanece terceiro autorizado; estilo inline continua permitido em atributos. Não foi possível validar redirect/headers candidatos no host nem usar preview de browser, pois o endpoint de staging está bloqueado.
