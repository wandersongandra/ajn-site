# Relatório final de auditoria e hardening

**Data:** 2026-10-08 · **Branch:** `security/auditoria-hardening-2026-10-08` · **Base:** `5a5edaf`.

## 1. Resumo executivo

Arquitetura confirmada: Astro estático, 144 páginas de conteúdo e rota 404, sem API, banco, SSR ou autenticação. Produção responde com HTML Astro em LiteSpeed. A revisão independente identificou o risco de aplicar automaticamente alterações de servidor ao integrar na `main`; por isso a PR #50 agora preserva `.htaccess` e contém apenas código/testes/documentação pertinente. HSTS segue ausente, CSP vigente não é alterada, `www` continua sem redirect e as páginas legais permanecem sem conteúdo aprovado.

## 2. Achados consolidados

| ID | Severidade | Evidência | Estado atual | Resíduo |
|---|---|---|---|---|
| AJN-SEC-001 | Média | HSTS ausente em GETs HTTPS de produção | ABERTO; configuração isolada em PR infra draft | requer revisão e validação host; PR #50 não altera headers |
| AJN-SEC-002 | Média | CSP aceita origens HTTPS amplas para forms/imagens | ABERTO; candidata isolada em PR infra draft | enforced atual não foi modificado; sem collector CSP |
| AJN-SEC-003 | Baixa | schema aceitava esquema arbitrário em link editorial | CORRIGIDO; testes ampliados nesta rodada (pendentes de execução) | revisão de conteúdo versionado continua necessária |
| AJN-SEC-004 | Média | privacidade e termos retornam 404 | ABERTO | conteúdo original aprovado não disponível nesta rodada |
| AJN-SEC-005 | Média | mecanismo de publicação não está no repo; preview inacessível | BLOQUEADO | confirmação Hostinger necessária |
| AJN-SEC-006 | Média | Actions referenciadas por tag major e settings externos não verificados | ABERTO/mitigado | revisar pinning e settings GitHub |
| AJN-SEC-007 | Baixa | Google Fonts e canais externos expõem metadados aos provedores | NECESSITA VERIFICAÇÃO | atualizar aviso de privacidade com base legal/processamento aprovado |
| AJN-SEC-008 | Baixa | CSP permite atributo style inline exigido por componentes atuais | ACEITO com justificativa | remover apenas em mudança de apresentação planejada |
| AJN-SEC-009 | Baixa | `www` retorna 200 com canonical apex, sem redirect de host | ABERTO; proposta isolada em PR infra draft | validar path/query/encoding em preview; nenhuma regra na PR #50 |

Contagens de severidade: **5 Média, 4 Baixa; 0 Crítica/Alta**. Evidência: 7 confirmados (001–004, 006, 008–009), 1 provável (007), 1 bloqueado (005). Nesta entrega de código, 1 achado é corrigido (003), 3 permanecem abertos e propostos separadamente (001, 002, 009), 2 abertos (004, 006), 1 bloqueado (005), 1 necessita verificação (007) e 1 risco residual aceito (008).

### Tratamento dos comentários da revisão

| Comentário | Arquivo/escopo | Problema e solução | Risco | Status | Testes/evidência |
|---|---|---|---|---|---|
| CodeQL: regex não reconhecia `</script >` | `scripts/audit-security.mjs` | Parser compartilhado agora aceita whitespace antes de `>` e tem regressão automatizada | Regex não substitui parser HTML completo | Implementado | `test:security-links` inclui extração da tag com espaço |
| Separar servidor da PR #50 | `.htaccess`, docs e CI | Arquivo restaurado ao baseline; audit de código não exige configuração do host; proposta isolada em PR #51 | Sem novos headers/redirects ao integrar PR #50; infra segue não aplicada | Implementado localmente; aguardando CI novo | diff de `.htaccess` contra `main` vazio; confirmar diff remoto após push |
| Validar `www` path/query/encoding e loops; considerar 302 e `NE` | Proposta de infraestrutura | Regra exata usa 302 temporário; modela paths, queries, encoding, HTTPS e ausência de loop | Modelo não executa LiteSpeed; runtime depende de staging | Implementado em PR #51 draft | `test:hosting-redirect` 4/4; live segue 200 sem redirect |
| CSP Report-Only sem collector | Proposta de infraestrutura | Report-Only sem `report-uri`/`report-to`; ausência de telemetria central documentada | Violações de visitantes não são coletadas | Documentado em PR #51 draft | auditoria estática passou; QA browser não executado |
| HSTS inicial e rollback | Proposta de infraestrutura | `max-age=300`, sem subdomínios/preload; rollback e expiração cacheada documentados | Estado HSTS pode persistir até expirar | Documentado em PR #51 draft | configuração local; headers live inalterados |
| Páginas legais e conteúdo confiável | checkout, histórico e fonte WordPress | Relatório de 07/10 cita 200 no WordPress, sem texto integral; checkout/quarentena/histórico não contêm cópia; GET mais recente é 404 | AJN precisa fornecer/aprovar conteúdo jurídico | Investigado; sem fonte para restauração | buscas read-only; nenhum texto inventado |
| Expandir testes de URLs | helper, auditoria SEO e testes | controles C0/C1/Unicode, CR/LF/tab, percent decoding, esquemas não autorizados, credenciais, `vbscript`, URLs malformadas e normalização | revisão de conteúdo por commit continua necessária | Implementado | 9 testes locais; execução de CI do novo SHA pendente |
| Alerta CodeQL de protocolo incompleto na auditoria SEO | `scripts/audit-seo.mjs` | reutiliza política explícita de URL; HTTP, esquemas executáveis e URLs malformadas deixam de ser confundidos com links internos | alerta na análise de segurança do default branch só poderá ser encerrado após novo scan elegível | Implementado localmente | testes de links 9/9 e auditoria de segurança passam; scan do SHA novo pendente |
| Alerta CodeQL de Action não imutável | `.github/workflows/gitleaks.yml` | fixa Gitleaks no commit `e0c47f4...`, resolvido do tag publicado `v3` no repositório oficial | atualização/rollback da Action passa a exigir alteração deliberada do SHA | Implementado localmente | novo Quality Gate/CodeQL/Secret Scan pendente após push |
| CodeRabbit pulou revisão automática por PR draft | PR #50 | Aviso operacional sem finding técnico | Nenhum risco direto | Observado | manter draft até review humano/checks dos novos SHAs |

## 3. Correções

- `keyword-map.ts`: títulos/descrições explícitos de PGR e LTCAT, sem afrouxar os limites dos audits.
- `audit-editorial.mjs`/`audit-sst-seo.mjs`: exigem origin e indexing explícitos; verificam canonical e `noindex` por rota.
- `public/.htaccess`: preservado sem diferenças em relação à base `main`; nenhuma regra nova de servidor fica nesta PR.
- `site.ts`/`json-ld.mjs`, `content.config.ts`/`safe-content-href.mjs`: serialização testável contra injeção HTML e validação de links com `URL`, controles e encoding inválidos rejeitados.
- `test-safe-content-links.mjs`, `security-html.mjs`, `audit-security.mjs`, `quality.yml`: testes de inputs, parser para tags `</script >`, auditoria de HTML/JSON-LD buildado e gates de preview/produção.
- Nenhuma dependência nova; nenhuma URL/página existente foi removida; nenhum texto legal foi fabricado.

## 4. Camadas

- **Frontend:** sem sinks DOM perigosos, scripts externos ou armazenamento client-side detectados; links editoriais agora restringidos.
- **Integrações:** formulário desativado na produção consultada; Google Fonts e links externos documentados.
- **Dependências:** npm audit retornou 0 vulnerabilidades conhecidas.
- **Segredos/privacidade:** nenhum segredo detectado no checkout; páginas legais retornam 404.
- **GitHub/CI:** checks e scanners versionados com permissões mínimas visíveis; settings e execução remota não verificados.
- **Headers:** headers existentes confirmados publicamente; esta PR não modifica headers nem redirect.
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

**GO CONDICIONAL** para revisão da parcela de código: os workflows da PR #50 no SHA `4974469` passaram, exceto o contexto legado `CodeQL`, associado a alertas no default branch; a anotação inline de regex foi respondida. As correções locais dos alertas de URL e Action imutável exigem novo push/scan. Não é prontidão para produção: headers/redirect estão em proposta independente, Hostinger não foi validada e páginas legais precisam de texto aprovado.
