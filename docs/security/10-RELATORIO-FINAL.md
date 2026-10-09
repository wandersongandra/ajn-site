# Relatório final de auditoria e hardening

**Data:** 2026-10-08 · **Branch:** `security/auditoria-hardening-2026-10-08` · **Base:** `5a5edaf`.

## 1. Resumo executivo

Arquitetura confirmada: Astro estático, 144 páginas de conteúdo e rota 404, sem API, banco, SSR ou autenticação. Produção responde com HTML Astro em LiteSpeed; CI valida builds, mas não publica. Os bloqueios dos gates foram corrigidos: os títulos agora são explícitos e os audits exigem contexto de ambiente; as divergências de canonical eram comparação de artefato preview com auditor defaultando para apex. Permanecem riscos operacionais: HSTS ausente, CSP restrita ainda em Report-Only, páginas legais em 404, `www` sem redirect e confirmação do plano/fluxo Hostinger pendente.

## 2. Achados consolidados

| ID | Severidade | Evidência | Estado atual | Resíduo |
|---|---|---|---|---|
| AJN-SEC-001 | Média | HSTS ausente em GETs HTTPS de produção | EM IMPLEMENTAÇÃO local (300s) | depende de publicação e GET posterior |
| AJN-SEC-002 | Média | CSP aceitava qualquer HTTPS para forms/imagens | EM IMPLEMENTAÇÃO local (candidata em Report-Only) | enforced antigo até publicação e revisão de violações |
| AJN-SEC-003 | Baixa | schema aceitava esquema arbitrário em link editorial | VALIDADO localmente; 6 testes e build | requer revisão de conteúdo versionado |
| AJN-SEC-004 | Média | privacidade e termos retornam 404 | ABERTO | conteúdo original aprovado não disponível nesta rodada |
| AJN-SEC-005 | Média | mecanismo de publicação não está no repo; preview inacessível | BLOQUEADO | confirmação Hostinger necessária |
| AJN-SEC-006 | Média | Actions referenciadas por tag major e settings externos não verificados | ABERTO/mitigado | revisar pinning e settings GitHub |
| AJN-SEC-007 | Baixa | Google Fonts e canais externos expõem metadados aos provedores | NECESSITA VERIFICAÇÃO | atualizar aviso de privacidade com base legal/processamento aprovado |
| AJN-SEC-008 | Baixa | CSP permite atributo style inline exigido por componentes atuais | ACEITO com justificativa | remover apenas em mudança de apresentação planejada |
| AJN-SEC-009 | Baixa | `www` retorna 200 com canonical apex, sem redirect de host | EM IMPLEMENTAÇÃO local | validar regra 301 após publicação autorizada |

Contagens de severidade: **5 Média, 4 Baixa; 0 Crítica/Alta**. Evidência: 7 confirmados (001–004, 006, 008–009), 1 provável (007), 1 bloqueado (005). Estado: 1 validado localmente (003); 3 em implementação local/QA (001–002, 009); 2 abertos (004, 006); 1 bloqueado (005); 1 necessita verificação (007); 1 risco residual aceito (008). A correção local de headers/redirect não confirma runtime no host.

## 3. Correções

- `keyword-map.ts`: títulos/descrições explícitos de PGR e LTCAT, sem afrouxar os limites dos audits.
- `audit-editorial.mjs`/`audit-sst-seo.mjs`: exigem origin e indexing explícitos; verificam canonical e `noindex` por rota.
- `.htaccess`: mantém CSP vigente enforced, põe candidata mais restrita em Report-Only, HSTS inicial 300s e prepara 301 de `www` para apex.
- `site.ts`/`json-ld.mjs`, `content.config.ts`/`safe-content-href.mjs`: serialização testável contra injeção HTML e validação de links restrita a root-relative/HTTPS sem credenciais.
- `test-safe-content-links.mjs`, `audit-security.mjs`, `quality.yml`: testes de inputs, auditoria de HTML/JSON-LD buildado e gates duplicados para preview/produção.
- Nenhuma dependência nova; nenhuma URL/página existente foi removida; nenhum texto legal foi fabricado.

## 4. Camadas

- **Frontend:** sem sinks DOM perigosos, scripts externos ou armazenamento client-side detectados; links editoriais agora restringidos.
- **Integrações:** formulário desativado na produção consultada; Google Fonts e links externos documentados.
- **Dependências:** npm audit retornou 0 vulnerabilidades conhecidas.
- **Segredos/privacidade:** nenhum segredo detectado no checkout; páginas legais retornam 404.
- **GitHub/CI:** checks e scanners versionados com permissões mínimas visíveis; settings e execução remota não verificados.
- **Headers:** headers existentes confirmados publicamente; HSTS novo ainda não confirmado.
- **Deploy:** produção observada é Astro; o caminho de publicação não está definido no checkout; staging bloqueado nesta consulta.

## 5. Validação

`npm run validate` passou integralmente nos perfis de produção indexável e preview `noindex`; `npm run check` standalone também passou em produção. Os dois builds produziram 144 páginas, com 145 documentos HTML auditados. Causa dos títulos: `getMarketingSeo` gerava título a partir de `heading` e ignorava os títulos completos do conteúdo; keyword map agora tem entradas explícitas. Causa dos canonicals: o build e a auditoria standalone usavam `PUBLIC_SITE_ORIGIN` diferente/ausente; os audits agora exigem ambiente explícito e verificam indexabilidade por rota. `npm audit --audit-level=high`: zero vulnerabilidades conhecidas. Evidências e comandos em `09-TESTES-E-VALIDACAO.md`.

## 6. Impacto

- **Segurança:** restringe links editoriais; CSP restrita está em Report-Only, ainda não enforced; HSTS curto e redirect www estão só preparados no arquivo.
- **Manutenção:** o mesmo helper de URL é exercitado por teste Node nativo.
- **Performance/SEO/acessibilidade:** sem dependências adicionadas; build manteve 144 páginas, canonical e geração do sitemap. Nenhuma navegação visual foi executada nesta rodada.
- **Compatibilidade:** integração futura de formulário externo exigirá allowlist explícita na CSP; o estado atual de contato permanece inalterado.

## 7. Pendências

1. Recuperar e aprovar conteúdo jurídico AJN e restaurar as rotas legais.
2. Confirmar plano/document root e processo Hostinger; fazer preview controlado e validar headers/redirects antes de promover.
3. CSP Report-Only não possui collector; decidir se QA manual de console é suficiente ou se serviço de reports será aprovado.
4. Confirmar configurações administrativas GitHub e aguardar CI remoto Node 22/Actions após PR.
5. Fazer browser/teclado QA; formulário segue desativado, sem endpoint.

## 8. Estado Git

Branch: `security/auditoria-hardening-2026-10-08`, base `5a5edaf`, sincronizada com `origin/main` na abertura da PR. Commits nesta rodada: `ec1fe43` (código/testes) e `301001e` (documentação). PR draft [#50](https://github.com/wandersongandra/ajn-site/pull/50) aberta para aprovação. Sem merge ou deploy; `main` não foi alterada.

## 9. Classificação final

**GO CONDICIONAL** para revisão por PR local/remoto após CI: gates obrigatórios passaram nos dois ambientes locais. Não é prontidão para produção: CSP restrita segue apenas Report-Only, redirect/HSTS ainda não observados no host, plano/document root Hostinger não confirmados e rotas legais seguem 404. Não representa autorização de deploy nem garantia de ausência de vulnerabilidades.
