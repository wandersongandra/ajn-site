# Remoção de serviços — elétrica, elevadores, SPDA e cabeamento (2026-10)

Pedido do cliente: retirar do site a oferta de **projetos elétricos**, **elevadores** (incl. manutenção), **escadas rolantes**, **plataformas elevatórias/acessibilidade**, **SPDA (para-raios)** e **cabeamento estruturado**.

Branch: `content/remover-servicos-eletricos-elevadores` (a partir de `origin/main`). Independente da branch de design.

## Mantido de propósito

- SST, laudos, PGR/LTCAT/PCMSO, medições ocupacionais
- PPCIP / combate a incêndio, regularização CBM
- Treinamentos de NRs (**incluindo NR-10** — capacitação de segurança, não projeto elétrico)
- Gestão ambiental, qualidade, eSocial
- PMOC / climatização (mencionado em Sobre nós)
- Logo cliente **Techsystem Elevadores** (cliente, não serviço)
- Artigo de blog NR-35 que cita escadas fixas / plataforma em contexto de trabalho em altura (SST)

## Borderline

| Item | Decisão | Motivo |
|---|---|---|
| `/elevacao-vertical` | Removido | Conteúdo de movimento vertical / equipamentos alinhado a elevadores |
| `/mobilizacao-pessoal-equipamentos` | Mantido | Apoio SST/campo genérico, sem oferta de elevadores |
| Blog NR-10 | Mantido | Capacitação / documentação de segurança |
| Blog NR-35 (escadas/plataforma) | Mantido | Trabalho em altura, não venda de equipamento |
| PMOC / climatização | Mantido | Fora do escopo removido |

## Contagens

- Páginas de marketing removidas: **46**
- Página de serviço removida: **1** (`/servicos/projetos-eletricos-...`)
- Páginas Astro dedicadas removidas: **2** (`/projetos-spda`, `/projetos-cabeamento-estruturado`)
- **Total de URLs com 301 → `/servicos`:** **49**

## Redirecionamentos (Hostinger `.htaccess` + Astro `redirects` + Cloudflare `_redirects` no preview)

| Origem | Destino | Status |
|---|---|---|
| `/analise-projetos-eletricos-bh` | `/servicos` | 301 |
| `/elevacao-vertical` | `/servicos` | 301 |
| `/elevador-bh` | `/servicos` | 301 |
| `/empresa-elevador` | `/servicos` | 301 |
| `/empresa-elevador-belo-horizonte` | `/servicos` | 301 |
| `/empresa-escada-rolante` | `/servicos` | 301 |
| `/empresa-plataforma-elevatoria` | `/servicos` | 301 |
| `/empresa-projeto-eletrico` | `/servicos` | 301 |
| `/empresa-projeto-eletrico-bh` | `/servicos` | 301 |
| `/empresas-elevadores-bh` | `/servicos` | 301 |
| `/empresas-manutencao-elevadores-bh` | `/servicos` | 301 |
| `/escada-rolante` | `/servicos` | 301 |
| `/escada-rolante-belo-horizonte` | `/servicos` | 301 |
| `/escada-rolante-bh` | `/servicos` | 301 |
| `/instalacao-predial-eletrica` | `/servicos` | 301 |
| `/instalacoes-eletricas-projeto` | `/servicos` | 301 |
| `/manutencao-elevadores-belo-horizonte` | `/servicos` | 301 |
| `/manutencao-elevadores-bh` | `/servicos` | 301 |
| `/orcamento-projeto-eletrico` | `/servicos` | 301 |
| `/plataforma-acessibilidade` | `/servicos` | 301 |
| `/plataforma-acessibilidade-bh` | `/servicos` | 301 |
| `/plataforma-acessibilidade-preco` | `/servicos` | 301 |
| `/plataforma-elevatoria` | `/servicos` | 301 |
| `/plataforma-elevatoria-belo-horizonte` | `/servicos` | 301 |
| `/plataforma-elevatoria-bh` | `/servicos` | 301 |
| `/plataforma-elevatoria-preco` | `/servicos` | 301 |
| `/preco-projetos-eletricos` | `/servicos` | 301 |
| `/projeto-eletrico` | `/servicos` | 301 |
| `/projeto-eletrico-belo-horizonte` | `/servicos` | 301 |
| `/projeto-eletrico-bh` | `/servicos` | 301 |
| `/projeto-eletrico-comercial` | `/servicos` | 301 |
| `/projeto-eletrico-industrial` | `/servicos` | 301 |
| `/projeto-eletrico-industrial-belo-horizonte` | `/servicos` | 301 |
| `/projeto-eletrico-industrial-preco` | `/servicos` | 301 |
| `/projeto-eletrico-preco` | `/servicos` | 301 |
| `/projeto-eletrico-residencial` | `/servicos` | 301 |
| `/projeto-eletrico-residencial-belo-horizonte` | `/servicos` | 301 |
| `/projeto-eletrico-residencial-completo` | `/servicos` | 301 |
| `/projeto-eletrico-residencial-orcamento` | `/servicos` | 301 |
| `/projeto-instalacao-eletrica-residencial` | `/servicos` | 301 |
| `/projeto-instalacoes-eletricas` | `/servicos` | 301 |
| `/projetos-eletricos-orcamento` | `/servicos` | 301 |
| `/projetos-eletricos-prediais` | `/servicos` | 301 |
| `/projetos-engenharia-eletrica` | `/servicos` | 301 |
| `/projetos-instalacoes-eletricas-prediais` | `/servicos` | 301 |
| `/servico-projeto-eletrico` | `/servicos` | 301 |
| `/projetos-spda` | `/servicos` | 301 |
| `/projetos-cabeamento-estruturado` | `/servicos` | 301 |
| `/servicos/projetos-eletricos-residenciais-comerciais-e-prediais-com-foco-em-qualidade-prazo-e-economia` | `/servicos` | 301 |

## Arquivos editados (resumo)

- Removidos: `src/content/marketing/*` (46), imagens em `public/images/content/marketing/*`, serviço elétrico em `src/content/services/`, `src/pages/projetos-spda.astro`, `src/pages/projetos-cabeamento-estruturado.astro`, thumb `eletricos.webp`
- Catálogos/nav: `src/content/marketing/index.ts`, `route-catalog.ts`, `seo/keyword-map.ts`, `services/index.ts`, `services/catalog.ts`, `src/data/home.ts`, `ServicesIndexPage.astro`, `ServiceDetailPage.astro`, `servicos/[slug].astro`, `utils/seo.ts`
- Institucional: `sobre-nos.ts` (frase sem elevadores/escadas), `mapa-site.ts` (grupos elétrica/elevação removidos)
- Redirects: `public/.htaccess`, `astro.config.mjs`
- Audits: `audit-engineering.mjs`, `audit-fase7-seo.mjs`, `audit-services-catalog.mjs`, `browser-smoke.mjs`

## Preview Cloudflare

Pasta: `/workspace/ajn-audit/cf-preview/` (zip `cf-preview.zip`).
Inclui `_headers` (`X-Robots-Tag: noindex, nofollow` + headers de segurança) e `_redirects`.
**Não funciona no preview:** endpoint PHP de contato (Hostinger). Canonicals continuam apontando para `ajnengenharia.com.br`.

## Status de publicação (preview)

- Branch local: `content/remover-servicos-eletricos-elevadores` (7 commits sobre `origin/main`).
- Push GitHub: **bloqueado (403)** — token sem escrita em `ajn-site`. Bundle: `/workspace/ajn-audit/remover-servicos.bundle` e patch `/workspace/ajn-audit/remover-servicos.patch`.
- Preview Cloudflare (upload manual): pasta `/workspace/ajn-audit/cf-preview/` e zip `/workspace/ajn-audit/cf-preview.zip` (937 arquivos, ~43 MiB; `_headers` noindex + `_redirects`).
- `npm run validate` com `PUBLIC_SITE_ORIGIN=https://ajnengenharia.com.br` e `PUBLIC_ALLOW_INDEXING=true`: **PASS**.
- Smoke Playwright desktop+mobile no preview: **PASS** (13 cards, stubs de redirect, Techsystem mantido, 0 erros de console).
- Sem merge e sem deploy Hostinger.
