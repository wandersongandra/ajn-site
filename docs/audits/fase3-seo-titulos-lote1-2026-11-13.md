# Fase 3 — Lote 1 de títulos SEO curtos

Data: 2026-11-13. Branch `security/hostinger-hardening-2026-10-09`. Esta revisão não comprova prestação dos serviços, desempenho orgânico nem autorização de claims comerciais — apenas corrige metadados.

## Contexto

Auditoria encontrou 102/144 páginas com `<title>` abaixo de 50 caracteres (ideal: 50–60), 14 delas abaixo até do mínimo de 24 caracteres. Causa: `src/utils/seo.ts` usa o fallback `` `${heading} | AJN` `` sempre que a rota não tem entrada explícita em `src/content/seo/keyword-map.ts`.

Esta branch divergiu de `main` há 141 commits. Em `main`, o mesmo problema já foi tratado página a página (`keyword-map.ts` tem 77 entradas vs. 29 aqui), de forma incremental e documentada — ver `fix(fase7): títulos SEO distintos e auditorias integradas (#91)`, commit `5604933`. O fallback de `seo.ts` **não foi alterado** em `main`; o método estabelecido é curadoria manual por lote, não mudança de template.

## O que este lote faz

Adiciona 14 entradas em `keyword-map.ts` para as 14 rotas que estavam abaixo de 24 caracteres:

- **11 rotas** (`/ltcat-orcamento`, `/orcamento-ltcat`, `/ltcat-preco`, `/ltcat-renovacao`, `/emissao-laudos`, `/laudos-sst`, `/laudo-pgr`, `/orcamento-pgr`, `/empresa-pcmso`, `/orcamento-pcmso`, `/servicos-pcmso`) já existem em `main` com o mesmo caminho e o mesmo negócio (PGR/PCMSO/LTCAT não foi removido lá) — copiadas **verbatim** do `keyword-map.ts` de `main`, sem invenção de conteúdo novo.
- **3 rotas** (`/elevacao-vertical`, `/escada-rolante`, `/projeto-eletrico`) não existem em `main` — essa branch ainda tem um cluster inteiro de páginas de elétrica/elevação/escada rolante (14 variantes de "projeto-eletrico", 4 de "escada rolante") que `main` removeu (commit "remove elétrica, elevadores, SPDA e cabeamento"). Escrevi título/descrição com base apenas no conteúdo já publicado na página (sem novas afirmações de serviço, equipe ou prazo).

Resultado: 0 páginas abaixo de 24 caracteres (eram 14); 90 páginas ainda abaixo de 50 (eram 102) — as ~101 páginas restantes do catálogo geral não foram tocadas neste lote.

## Pendência que esta PR não resolve

`main` descontinuou o vertical de elétrica/elevação/escada rolante. Esta branch ainda publica ~19 páginas dessa família (apenas as 3 raízes receberam título neste lote). Vale decisão do proprietário: manter, consolidar ou remover esse cluster antes de investir mais curadoria de SEO nele.

## Verificação

`npm run check` (0 erros) e `npm run validate` completo (todos os `audit:*`/`test:*` em PASS) executados após a mudança, com `PUBLIC_SITE_ORIGIN=https://ajnengenharia.com.br` e `PUBLIC_ALLOW_INDEXING=true`.
