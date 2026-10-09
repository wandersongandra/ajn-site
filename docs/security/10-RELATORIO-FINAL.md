# Relatório final de auditoria e hardening

**Data:** 2026-10-08 · **Branch:** `security/auditoria-hardening-2026-10-08` · **Base:** `5a5edaf`.

## 1. Resumo executivo

Arquitetura confirmada: Astro estático, 144 páginas de conteúdo e rota 404, sem API, banco, SSR ou autenticação. Produção já responde com HTML Astro em LiteSpeed; CI valida builds, mas não publica. Riscos mais relevantes: HSTS ausente no host observado; limites amplos de `form-action`/`img-src` na CSP; links editoriais sem esquema permitido; duas rotas legais em 404; mecanismo de deploy e settings administrativos não confirmados.

## 2. Achados consolidados

| ID | Severidade | Evidência | Estado atual | Resíduo |
|---|---|---|---|---|
| AJN-SEC-001 | Média | HSTS ausente em GETs HTTPS de produção | CORRIGIDO no repositório | depende de publicação e GET posterior |
| AJN-SEC-002 | Média | CSP aceitava qualquer HTTPS para forms/imagens | CORRIGIDO no repositório e coberto por auditoria | header publicado ainda antigo até deploy |
| AJN-SEC-003 | Baixa | schema aceitava esquema arbitrário em link editorial | CORRIGIDO; 5 testes e build | requer revisão de conteúdo versionado |
| AJN-SEC-004 | Média | privacidade e termos retornam 404 | ABERTO | conteúdo original aprovado não disponível nesta rodada |
| AJN-SEC-005 | Média | mecanismo de publicação não está no repo; preview inacessível | BLOQUEADO | confirmação Hostinger necessária |
| AJN-SEC-006 | Média | Actions referenciadas por tag major e settings externos não verificados | ABERTO/mitigado | revisar pinning e settings GitHub |
| AJN-SEC-007 | Baixa | Google Fonts e canais externos expõem metadados aos provedores | NECESSITA VERIFICAÇÃO | atualizar aviso de privacidade com base legal/processamento aprovado |
| AJN-SEC-008 | Baixa | CSP permite atributo style inline exigido por componentes atuais | ACEITO com justificativa | remover apenas em mudança de apresentação planejada |

Contagens de severidade: **5 Média, 3 Baixa; 0 Crítica/Alta**. Evidência: 6 confirmados (001–004, 006, 008), 1 provável (007), 1 bloqueado (005). Estado: 3 corrigidos localmente (001–003); 2 abertos (004, 006); 1 bloqueado (005); 1 necessita verificação (007); 1 risco residual aceito (008). Não há finding crítico/alto confirmado. A classificação de risco é contextual e não prova ausência de vulnerabilidades.

## 3. Correções

- `.htaccess`: HSTS de um ano e CSP com destinos de forms/imagens restritos.
- `content.config.ts` + `safe-content-href.mjs`: validação de links relativos locais e HTTPS sem credenciais.
- `test-safe-content-links.mjs`, `audit-security.mjs`, `package.json`, `quality.yml`: regressão automatizada local e no Quality Gate.
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

Resultados detalhados e limitações em `09-TESTES-E-VALIDACAO.md`. Check, builds de preview e produção indexável e checks focados passaram. `npm run validate` **falhou** no gate editorial por título SEO de 23 caracteres em `/elaboracao-pgr/`. `npm run audit:sst-seo` com origin de produção falhou pelo título de 22 caracteres em `/emissao-ltcat/`; no build de preview, cinco canonicals também divergem do origin de preview esperado. Esses achados editoriais preexistentes não foram alterados nesta auditoria de segurança; publicação deve aguardar validação editorial separada. `npm audit --audit-level=high` passou com zero vulnerabilidades conhecidas.

## 6. Impacto

- **Segurança:** reduz fontes CSP amplas, ativa HSTS no arquivo de hospedagem e bloqueia esquemas perigosos no conteúdo.
- **Manutenção:** o mesmo helper de URL é exercitado por teste Node nativo.
- **Performance/SEO/acessibilidade:** sem dependências adicionadas; build manteve 144 páginas, canonical e geração do sitemap. Nenhuma navegação visual foi executada nesta rodada.
- **Compatibilidade:** integração futura de formulário externo exigirá allowlist explícita na CSP; o estado atual de contato permanece inalterado.

## 7. Pendências

1. Recuperar conteúdo jurídico aprovado e restaurar as URLs legais.
2. Publicar a revisão pelo processo autorizado e confirmar HSTS/CSP em apex e `www`.
3. Confirmar Hostinger/staging e settings GitHub com operadores administrativos.
4. Validar UX/browser, teclado e formulários se um endpoint for habilitado.

## 8. Estado Git

Branch: `security/auditoria-hardening-2026-10-08`, base `5a5edaf`. Commits locais: `608a24e` (hardening) e commit de documentação desta auditoria. Arquivos alterados: `.github/workflows/quality.yml`, `package.json`, `public/.htaccess`, `scripts/audit-security.mjs`, `scripts/test-safe-content-links.mjs`, `src/content.config.ts`, `src/utils/safe-content-href.mjs`, `src/utils/safe-content-href.d.mts` e os 11 relatórios em `docs/security/`. Nenhuma mudança em `main`; sem PR, push, merge ou deploy.

## 9. Classificação final

**GO CONDICIONAL** para revisão local: patches e documentação estão implementados, mas a publicação segura depende da confirmação do host e as rotas legais indisponíveis continuam abertas. Não é garantia de ausência de vulnerabilidades e não representa autorização de deploy.
