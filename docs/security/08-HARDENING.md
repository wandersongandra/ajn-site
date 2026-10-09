# Hardening implementado e plano operacional

**Data:** 2026-10-08 · alterações locais na branch `security/auditoria-hardening-2026-10-08`.

## A. Implementado na PR de código #50

1. **Links de conteúdo:** schema Zod aceita caminhos root-relative e URLs HTTPS sem credenciais, com validação via `URL`; rejeita esquemas executáveis, protocolos não autorizados, controles, barras invertidas e percent-encoding malformado/sensível. Testes exercitam esses casos e JSON-LD.
2. **SEO e ambiente:** keyword map fornece títulos explícitos para PGR/LTCAT; audits exigem origin e estado de indexação e conferem canonical/noindex por página. Workflow roda audits editoriais/SST no build de produção.
3. **HTML/JSON-LD:** serializador preservado e parser de auditoria reconhece fechamento de script com whitespace, evitando falso negativo no audit de HTML compilado.

## B. Separado para a PR de infraestrutura em draft

- CSP Report-Only, HSTS inicial e redirecionamento temporário de `www` foram retirados desta PR; estão separados em [PR de infraestrutura #51](https://github.com/wandersongandra/ajn-site/pull/51), ainda draft e não ativos.
- Confirmar plano Hostinger, suporte a `.htaccess`, document root e overrides do painel/CDN.
- Validar em preview acessível com GETs, console do navegador e preservação de rota/query antes de decidir por 301. Nenhuma ação foi feita no host/CDN.

## C. Dependente de conteúdo, serviço ou conta

- Recuperar e aprovar o conteúdo legal original para `/politica-de-privacidade/` e `/termos-de-uso/`; manter o texto e URLs aprovados.
- Confirmar configurações GitHub: branch protection, checks obrigatórios, secret scanning/push protection e Dependency Graph.
- Não habilitar formulário até selecionar provedor, aprovar tratamento/retensão e configurar allowlist exata de CSP.
- Não habilitar `includeSubDomains`/preload antes de inventariar e testar TLS de todos os subdomínios.

## Risco residual

Na PR #50 o HSTS não é emitido, a CSP atualmente observada não é alterada e `www` continua sem redirect. A PR separada mantém a infraestrutura não aplicada até revisão. Google Fonts permanece terceiro autorizado; estilo inline continua permitido em atributos.
