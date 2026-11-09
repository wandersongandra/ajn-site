# Decisão arquitetural — AJN Carreiras / staging — 2026-11-09

## Decisão

O staging canônico será same-origin no Worker:

```text
https://staging-ajn-carreiras-api.workers.dev
├── /carreiras/*       páginas SSR públicas
├── /admin/carreiras/* painel administrativo estático
├── /api/*              API pública e administrativa
└── /styles/*, /scripts/*, /_astro/*  assets da build
```

O domínio Hostinger `sienna-mongoose-223157.hostingersite.com` não é mais tratado como origem autenticada. O `.htaccess` redireciona as rotas de carreiras para o Worker. Em produção, o endereço canônico pretendido é `https://carreiras.ajnengenharia.com.br`, conectado ao Worker como Custom Domain após validação de zona/DNS.

## Por que esta opção

- elimina a dependência de cookie `SameSite=Strict` entre sites diferentes;
- permite que o Worker entregue HTML SSR e o status 404 real da vaga;
- coloca API e assets sob a mesma origem do HTML;
- evita depender de reverse proxy Apache para respostas dinâmicas;
- preserva o site institucional fora das rotas de carreiras.

## Limitações e riscos

1. `workers.dev` é um endpoint técnico de staging, não o endereço público final.
2. Custom Domain de Worker depende de uma zona Cloudflare ativa e de certificado; não foi configurado nesta etapa.
3. Delegação de subdomínio independente por Subdomain Setup não deve ser assumida em planos não Enterprise.
4. O Apache pode continuar hospedando o apex, mas os registros A/AAAA e o proxy precisam ser confirmados antes da troca.
5. IDs placeholder em `wrangler.toml` não são válidos para homologação remota.

## DNS e e-mail

Caso a zona seja gerida pela Cloudflare, preservar os valores atuais de `A`, `AAAA`, `MX`, `TXT`, SPF, DKIM, DMARC e `CAA` mediante exportação e comparação. A mudança deve ser reversível. Nameservers devem ser os valores atribuídos no painel da zona; nomes genéricos/fictícios não podem ser usados.

Referências: [Subdomain Setup Cloudflare](https://developers.cloudflare.com/dns/zone-setups/subdomain-setup/setup/), [nameservers](https://developers.cloudflare.com/dns/nameservers/), [Custom Domains de Workers](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/), [routing](https://developers.cloudflare.com/workers/configuration/routing/) e [assets do Worker](https://developers.cloudflare.com/workers/static-assets/binding/).

## Pré-requisitos para homologação

- conta e zona Cloudflare identificadas;
- plano e Custom Domain confirmados;
- D1/R2/KV/DO de staging reais;
- secrets e Turnstile válidos;
- usuário RH sintético, MFA e mailbox controlado;
- build criada com `PUBLIC_CAREERS_ORIGIN` do ambiente;
- execução do gate remoto e navegador real.

## Rollback

Sem apagar dados: desativar o Custom Domain ou o redirect novo, restaurar a configuração DNS exportada apenas com autorização, e revalidar o site institucional e e-mail. O rollback não deve reintroduzir o rewrite interno que transforma vaga desconhecida em HTTP 200.

## Estado

`CONFIRMED`: decisão refletida no código local, CSP/CORS explícitos, sessão same-origin planejada e assets configurados.

`BLOCKED`: nenhuma mudança DNS, Custom Domain, deploy, D1/R2/DO real ou navegador contra staging foi executada nesta tarefa.
