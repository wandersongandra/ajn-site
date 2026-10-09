# Proposta de hardening da hospedagem Hostinger

**Status:** proposta em PR draft; não mesclada nem publicada. **Data:** 2026-10-09.

## Escopo e evidência

Esta entrega altera somente `public/.htaccess`, testes de compatibilidade/redirect, o comando de auditoria e o Quality Gate correspondente. A CSP enforced existente é mantida. Produção respondeu em GET a `www.ajnengenharia.com.br` com 200 sem redirect; o apex respondeu canonical. A resposta pública contém a CSP antiga, compatível com a versão anterior do arquivo, mas isso não confirma o fluxo de publicação nem overrides no painel.

## Configuração candidata

- CSP enforced atual permanece byte a byte na diretiva existente; candidata mais restritiva é apenas `Content-Security-Policy-Report-Only`.
- Candidata mantém `script-src 'self'`, limita `form-action` a `self`, imagens a `self`/`data:`, permite Google Fonts (`fonts.googleapis.com`/`fonts.gstatic.com`) e não adiciona scripts externos. `style-src-attr 'unsafe-inline'` permanece apenas pela utilização observada de estilos inline de apresentação; `unsafe-eval` e scripts inline não são autorizados.
- JSON-LD segue como bloco não executável, serializado com escaping contextual. Os testes inspecionam a saída do build.
- Não há `report-uri`/`report-to`: não existe coletor. Report-Only só pode ser avaliado manualmente no console do browser num ambiente de QA; não oferece telemetria centralizada.
- HSTS começa em `max-age=300`, sem `includeSubDomains` e `preload`. Só deve ser considerado após HTTPS/redirect confirmados; remover o header não apaga imediatamente o estado cacheado, que expira no máximo em cinco minutos sob esta proposta.
- `www` usa redirect temporário 302 para `https://ajnengenharia.com.br`, com condição de host exata. A regra fica antes do redirect legado `/informacoes`. `NE` é intencional para não transformar `%` de paths já codificados em `%25`; a autoridade de destino é literal e a query original não é reconstruída na regra, sendo preservada pelo comportamento do rewrite. A passagem para 301 exige validação em preview, nova revisão e aprovação.

## Compatibilidade e limites dos testes

`npm run audit:hosting-config` verifica o diff das diretivas e as origens de recursos no HTML/CSS produzido: imagens locais/data, scripts same-origin, folhas de estilo/fontes Google e JSON-LD. `npm run test:hosting-redirect` cobre host exato, ausência de loop, HTTPS, rotas, query strings e percent-encoding por modelo determinístico da regra. Isso não executa Apache/LiteSpeed; a semântica real depende do módulo e da configuração da Hostinger.

Hostinger documenta `.htaccess` em planos de hospedagem compatíveis, com limitações em alguns cenários de Agency e conteúdo não WordPress. **Plano desta conta, document root, módulo `mod_rewrite`/`mod_headers` e integração de deploy não foram confirmados.** A hospedagem observada anuncia LiteSpeed, compatível com diretivas Apache em muitos ambientes, mas não prova que esta instância carregará estas regras.

## Plano de rollout

1. Manter esta PR em draft até confirmar com o operador o plano, document root, versão/configuração do LiteSpeed e como validar uma cópia de preview sem substituir o site. O Quality Gate desta PR falhou por a branch base `main` ainda conter o title SEO PGR com 23 caracteres; correção está na PR #50. Repetir os checks depois que a dependência for resolvida. Não mesclar nem disparar publicação sem autorização específica.
2. Em preview isolado, testar páginas representativas, todos os recursos no console, headers HTTP, redirect 302, certificado TLS, caminhos codificados e query strings. Confirmar ausência de loop e comportamento de `/informacoes`.
3. Revisar os eventos CSP manualmente; como não há collector, registrar URLs/recursos legítimos observados sem dados pessoais. Não promover CSP enquanto houver violações não explicadas.
4. Só após aprovação explícita, aplicar/publicar a alteração em janela controlada. Repetir GET dos headers e `www` para apex. Não executar pelo agente.
5. Converter 302 para 301 somente numa mudança posterior revisada; observar cache e testar rollback antes da promoção.

## Rollback

- Restaurar `public/.htaccess` da revisão anterior no repositório e reaplicar apenas pelo fluxo Hostinger aprovado; não editar hPanel nesta tarefa.
- Remover `Content-Security-Policy-Report-Only` se houver incompatibilidade. A CSP enforced preexistente não deve ser substituída como rollback.
- Remover HSTS da resposta; navegadores que receberam `max-age=300` podem continuar forçando HTTPS até a expiração desse prazo.
- 302 é escolhido para reduzir cache durante QA. Não usar 301 sem validação e aprovação; um 301 pode ficar cacheado após rollback e requer verificação independente nos clientes/CDN.
- Não alterar DNS, nameservers ou e-mail. Se o plano não suportar `.htaccess`, parar e submeter uma alternativa via hPanel para aprovação separada.

## Referências

- Apache [`mod_rewrite` e escaping de URI](https://httpd.apache.org/docs/2.4/en/rewrite/tech.html) e [flag `NE`](https://httpd.apache.org/docs/2.4/rewrite/flags.html#flag_ne).
- Hostinger [uso de `.htaccess`](https://support.hostinger.com/en/articles/1583307-how-to-create-an-htaccess-file-at-hostinger), [limitações em Agency](https://www.hostinger.com/support/how-to-enable-htaccess-on-agency-plans/) e [redirects no hPanel](https://www.hostinger.com/support/1583406-how-to-set-up-a-redirect-in-hostinger/).
