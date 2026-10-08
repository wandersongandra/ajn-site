# AJN — Execução faseada SEO, conteúdo e experiência

Registro da rodada: 08/10/2026. Produção: https://ajnengenharia.com.br/
Repositório: `wandersongandra/ajn-site` (Astro estático).
Regra operacional: preservar DNS, 10 caixas do Standard Business Email, repositório WordPress antigo e backups.

## Status das frentes

| Fase | Entregável | Estado |
| --- | --- | --- |
| 0 — Medição | Domínio verificado no Google Search Console, cadastrado no GSC Wizard, sitemap Astro enviado e 6 URLs monitoradas | Concluído; processamento/indexação pelo Google em andamento |
| 1 — SEO técnico | Canonical para host sem www, variáveis de indexação em produção, CI com smoke test de build indexável | Concluído na PR #40; confirmar continuamente hPanel e HTML final |
| 2 — Páginas institucionais | Metadados de Home, Serviços, Contato e Blog; URLs canônicas com a mesma barra final das respostas 200; texto de contato e apresentação de Serviços | Implementado nesta rodada |
| 3 — Serviços prioritários | Edição técnica de páginas PGR (elaboração e contratação) e PCMSO/ASOs; clareza editorial e CTA de orçamento | Implementado nesta rodada, revisão humana de responsabilidade técnica recomendada |
| 4 — Catálogo e mobile | Substituição de resumos truncados dos 10 serviços, pesquisa acessível, contraste, espaço e legibilidade de cards no mobile | Implementado nesta rodada |
| 5 — Blog | Revisar 20 artigos, autoria, atualizações, fontes, duplicações, links e fotos | Pendente por artigo |
| 6 — Demais landing pages | Avaliar 107 URLs comerciais por intenção, evidência, qualidade e canibalização, sem remoções/redirecionamentos em massa | Pendente após coleta de dados históricos da GSC |
| 7 — Observabilidade de SEO | Rankings de consultas, CTR, leads, Core Web Vitals por dispositivo, Search Console | Coleta em curso; CrUX não configurado na integração atual |

## Métricas de partida observadas

- Home, Serviços, Contato, Blog, Sobre Nós, /elaboracao-pgr, /empresa-que-faz-pgr e /servicos/pcmso-e-asos responderam HTTP 200 nas inspeções do GSC Wizard de 08/10/2026 e foram classificados como indexáveis.
- A auditoria marca diversas imagens sem texto alternativo. Isto inclui imagens deliberadamente decorativas com `alt=""` (correto para acessibilidade). Não preencher automaticamente alt com palavras-chave.
- Redirecionamento sem barra → com barra ocorre na Hostinger; o layout passa a usar canonical com barra final para ficar coerente com o destino HTTP 200.
- PageSpeed/CrUX ainda não disponível no GSC Wizard por falta de chave de API. Não inferir métricas a partir de ausência de dados.
- Google havia registrado sitemap legado `https://www.ajnengenharia.com.br/sitemap.xml`; sitemap Astro `https://ajnengenharia.com.br/sitemap-index.xml` foi enviado em 08/10/2026. Acompanhar erros e submissão até Google baixar.
- Registros de domínio/e-mail NÃO são alterados neste conjunto.

## Critérios de publicação

1. `npm run check`, `npm run build`, `npm run audit:seo`, `npm run audit:editorial`, `npm run audit:deploy`, suites da CI e revisão da PR.
2. Build de homologação deve continuar `noindex`; produção deve definir `PUBLIC_SITE_ORIGIN=https://ajnengenharia.com.br` e `PUBLIC_ALLOW_INDEXING=true` no build da Hostinger.
3. Confirmar 200/301 esperados, canonical e robots depois de publicação.
4. Conferir Home, Serviços, Contato, 2 landing pages de PGR e PCMSO no desktop/mobile.
5. Não reconfigurar DNS ou caixas corporativas durante o deploy.
6. Se houver falha, reverter commit da aplicação no GitHub; não alterar zone DNS.

## Próximas páginas a tratar, uma por vez

- `/emissao-ltcat` e variantes: consolidar informações de LTCAT com revisão normativa.
- `/servicos/gestao-do-e-social`: explicar S-2210, S-2220, S-2240 de acordo com escopo efetivo da AJN.
- `/servicos/pericias-em-periculosidade-e-insalubridade`: precisão nas atribuições e entregáveis.
- `/blog` e 20 artigos: retirar repetições artificiais, corrigir dados e fontes, evitar duplicar a intenção das páginas de serviço.
- SEO local Belo Horizonte: só publicar localidades e serviços realmente atendidos; validar dados de contato e perfil da empresa.
