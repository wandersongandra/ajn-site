# Plano de modernização AJN — outubro de 2026

## Escopo

Trabalho local na branch `modernization/ajn-site-2026-10-09`, baseada em `origin/main` (`c96f446`). O site oficial continua sob operação independente; não foi feito merge ou deploy.

## Entregas desta rodada

1. **Reconhecimento:** GETs ao domínio oficial, inspeção do repositório/rotas/CI e comparação do estado live com a branch. O live já serve Astro; o registro de WordPress em `docs/AUDITORIA-PRODUCAO-2026-10-07.md` é histórico.
2. **Auditoria visual:** Home e Blog medidos com viewport CSS real em 320, 375, 390, 430, 768, 1024, 1440 e 1920 px. Não foi confirmado overflow horizontal. Capturas válidas ficam em `output/playwright/` local, fora do Git.
3. **Blog:** 20 artigos antigos mantidos, categorias explícitas por metadados/mapeamento editorial e oito novos artigos técnicos. A rota antiga isolada passou ao template comum, sem mudar o slug.
4. **SEO/editorial:** imagens processadas pelo Astro e capas OG próprias; metadados existentes são auditados pelo novo gate `audit:blog`; fontes oficiais e links relacionados incluídos nos novos textos.
5. **Engenharia:** diretório local `output/` excluído do `astro check`; teste do mock de consentimento corrigido.
6. **Documentação:** relatório crítico, arquitetura, estratégia editorial, matriz de conteúdo/ofertas, SEO e validação.

## Sequência para a próxima rodada

1. Revisão técnica por profissional responsável da AJN dos artigos normativos, especialmente os que mencionam vigência e escopo legal.
2. Confirmação empresarial de serviços, regiões atendidas, responsáveis técnicos e entregáveis antes de acrescentar ofertas.
3. Revisão de desempenho com Lighthouse em browser controlado e dados de campo via CrUX/Analytics, se disponíveis.
4. QA manual de teclado, leitores de tela, zoom e movimento reduzido em páginas internas e interações.
5. Revisão de métricas de busca/backlinks para decidir manutenção, atualização ou eventual consolidação editorial.
6. Aprovação da branch por PR. Merge/publicação exigem o fluxo normal do repositório e decisão explícita; nada foi publicado nesta execução.

## Fora do escopo executado

Não foram alterados DNS, hospedagem, produção, WordPress/SQL/backups, formulários reais, textos jurídicos, políticas de headers, estrutura de URLs nem dados de clientes. Não foram criadas páginas de serviço para competências sem confirmação.
