# AJN Carreiras — configuração e topologia de homologação

Este guia descreve a arquitetura implementada na branch `feat/ajn-carreiras`. Ele não autoriza deploy, alteração de DNS ou execução de migration remota.

## 1. Decisão arquitetural

As páginas de carreiras, a API administrativa/pública e os recursos necessários às páginas SSR são entregues pelo mesmo Worker:

| Ambiente | Origem canônica | Apache institucional |
|---|---|---|
| Staging | `https://ajn-carreiras-api-staging.<account-subdomain>.workers.dev` ou Custom Domain confirmado | O Worker entrega `/carreiras/*`, `/admin/carreiras/*`, `/api/*` e os assets na mesma origem |
| Produção pretendida | `https://carreiras.ajnengenharia.com.br` | Redireciona as rotas de carreiras do apex para o Custom Domain do Worker |

Isso elimina o cookie administrativo cross-site entre página e API no ambiente pretendido. O cookie continua `HttpOnly; Secure; SameSite=Strict`; nenhum token é salvo em `localStorage` ou `sessionStorage`.

O site institucional existente continua sendo servido pelo Apache. O Worker não substitui as páginas institucionais e o `.htaccess` não faz mais rewrite interno de uma vaga dinâmica para `/carreiras/vaga/?slug=...`, pois esse fallback podia entregar HTTP 200 sem o recurso real.

## 2. Recursos do Worker

`worker/wrangler.toml` declara a binding `ASSETS` para `../dist`, com Worker-first. O `postbuild` copia `src/styles/global.css` e `src/styles/carreiras.css` para `dist/styles`; scripts públicos continuam sendo gerados em `dist/scripts` pelo Astro.

Os bindings D1, R2, KV e Durable Object permanecem explicitamente declarados. Os IDs atualmente presentes no arquivo são placeholders de configuração e impedem homologação remota até serem substituídos pelos IDs reais do ambiente correto.

| Recurso | Produção | Staging |
|---|---|---|
| Worker | `ajn-carreiras-api` | `ajn-carreiras-api-staging` |
| D1 | `prod-ajn-carreiras-d1` | `staging-ajn-carreiras-d1` |
| R2 privado | `prod-ajn-carreiras-resumes` | `staging-ajn-carreiras-resumes` |
| KV | `prod-ajn-carreiras-kv` | namespace definido pelo ID real de staging |

Antes de qualquer publicação, provisionar e validar separadamente:

1. D1 de staging e produção, com migrations aplicadas no ambiente correto;
2. bucket R2 privado para currículos;
3. namespace KV e Durable Object de rate limiting;
4. `SESSION_SECRET`, `TURNSTILE_SECRET_KEY` e credenciais do provedor de e-mail como secrets do Worker;
5. chaves Turnstile de staging e produção;
6. usuário administrativo de teste com MFA e mailbox controlado;
7. build com `PUBLIC_CAREERS_ORIGIN` igual à origem canônica do ambiente.

Não inserir secrets no repositório, em fixtures ou na saída dos testes.

## 3. Segurança de origem, CORS e CSP

As listas de CORS são explícitas em `CORS_ORIGINS`. Não há `Access-Control-Allow-Origin: *` em rotas autenticadas. Para mutações em `/api/admin/*`, o Worker exige `Origin` ou `Referer` cuja origem seja exatamente `APP_URL`; a exceção existe apenas para fixtures locais/testes, nunca para `staging` ou `production`.

No Apache, a CSP enforced e a Report-Only autorizam somente a API de carreiras, Google Analytics já existente e Turnstile. `script-src` não libera inline/eval; `form-action` não usa o curinga `https:`.

## 4. DNS e e-mail — pré-requisitos e preservação

Não usar delegação de uma zona filha como premissa: a documentação da Cloudflare informa que Subdomain Setup é recurso Enterprise. A alternativa sem essa dependência é manter a zona autoritativa completa no Cloudflare e conectar o Worker por Custom Domain, preservando o Apache por registros da zona.

Se a autoridade DNS for migrada para Cloudflare, exportar e comparar antes os registros atuais e recriá-los com os valores exatos:

- `A` e `AAAA` do apex e `www`, apontando para o Apache Hostinger conforme o estado confirmado;
- `MX` e eventuais subdomínios de e-mail;
- `TXT` de verificação, SPF e demais políticas;
- DKIM (normalmente `CNAME` ou `TXT`, conforme o provedor);
- DMARC (`_dmarc`);
- `CAA` e qualquer outro registro necessário ao certificado/serviços atuais.

Os nameservers devem ser exatamente os atribuídos pela Cloudflare à zona no painel. `ns1.cloudflare.com` e `ns2.cloudflare.com` não são valores genéricos válidos para essa finalidade. Nenhum registro ou nameserver foi alterado nesta tarefa.

Referências oficiais: [Subdomain Setup](https://developers.cloudflare.com/dns/zone-setups/subdomain-setup/setup/), [nameservers](https://developers.cloudflare.com/dns/nameservers/), [troubleshooting de nameservers](https://developers.cloudflare.com/dns/zone-setups/troubleshooting/pending-nameservers/), [Custom Domains de Workers](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/) e [configuração de assets](https://developers.cloudflare.com/workers/wrangler/configuration/).

## 5. Sequência controlada de homologação

Executar em uma conta Cloudflare de staging autorizada, nunca neste checkout sem credenciais/IDs reais:

```bash
npm ci
set PUBLIC_CAREERS_ENVIRONMENT=staging
set PUBLIC_CAREERS_ORIGIN=%AJN_CARREIRAS_STAGING_ORIGIN%
npm run test:backend
npm run check
npm run build
npx wrangler deploy --dry-run --config worker/wrangler.toml --env staging
```

O comando `deploy --dry-run` é somente validação de bundle/configuração. O deploy efetivo exige autorização operacional separada.

Para o staging, definir `AJN_CARREIRAS_STAGING_ORIGIN` com a origem real confirmada pela conta autorizada ou `CLOUDFLARE_ACCOUNT_SUBDOMAIN` para derivá-la do nome do Worker. A validação é executada com `npm run test:staging-origin`; sem esses dados o resultado correto é `BLOCKED`, sem inferir um hostname.

Depois da publicação controlada, definir `AJN_CARREIRAS_REMOTE_ORIGIN` e executar `npm run test:homologation-remote`. O gate remoto é dividido em Gates A-D e só retorna `PASS` com evidência real de todos os fluxos; `AJN_CARREIRAS_HOMOLOGATION_READY` não autoriza nem substitui testes.

## 6. Rollback

1. Interromper a promoção do Worker sem apagar D1, R2, KV ou DO.
2. Remover/desativar apenas o Custom Domain ou as regras de redirect que foram alterados, com registro do estado anterior.
3. Restaurar o `.htaccess` anterior somente a partir do commit conhecido e após revisão, sem rewrite dinâmico que masque 404.
4. Se houver mudança DNS autorizada, restaurar os registros exportados exatamente; não improvisar nameservers.
5. Revalidar apex, `www`, MX, SPF, DKIM, DMARC, CAA e o site institucional antes de qualquer nova tentativa.

## 7. Estado desta branch

`CONFIRMED`: código local com topologia same-origin planejada, CSP/CORS explícitos, cookie forte, SSR 200/404 e binding de assets configurada.

`BLOCKED`: recursos Cloudflare reais, secrets, seed MFA, mailbox, Turnstile válido, DNS/Custom Domain e homologação remota ainda não estão comprovados neste checkout.
