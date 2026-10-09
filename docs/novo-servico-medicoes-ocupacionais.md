# AJN — Avaliações e medições ambientais ocupacionais

**Implementação:** nova página comercial `/medicoes-ambientais-ocupacionais/`.

## Escopo de comunicação
A nova frente divulga avaliações instrumentais de **ruído, calor e iluminamento**, indicando que metodologia, configuração instrumental, pontos, grupos de exposição e entregáveis são definidos na proposta. Outras avaliações (agentes químicos, poeiras, vibração) aparecem apenas **sob consulta de viabilidade**, sem alegação de que todos os aparelhos estejam disponíveis. Não publica número de série, certificado, acreditação, laudo ou nome de responsável técnico não fornecido pelo cliente.

**Não foi executada uma auditoria técnica dos equipamentos nesta entrega, por solicitação da AJN.** A página não afirma calibração atualizada, acreditação ou disponibilidade de um aparelho específico.

## Imagens
Seis recursos WebP otimizados foram gerados digitalmente para a comunicação, todos em `public/images/medicoes/`. Não retratam funcionários, instalações ou aparelhos reais da AJN. O site exibe avisos claros na hero, nos cartões, no destaque da Home e nas publicações do blog.

Se futuramente forem substituídos por fotografias reais, confirmar direitos de uso, dados pessoais, marcas e correspondência com o serviço, mantendo edição discreta e registro do arquivo de origem.

## Integrações
- Página própria com apresentação, três modalidades-base, outras demandas sob consulta, etapas, entregáveis, FAQ, links ao PGR e LTCAT e CTA WhatsApp.
- Menu, catálogo de serviços, destaque editorial da Home e mapa HTML do site.
- SEO com título, descrição, canonical, Open Graph e dados estruturados de serviço.
- Três artigos técnicos de blog, com referências de Fundacentro e NRs; vínculos editoriais para a nova landing.
- Novo `audit:medicoes` e revisão dos testes que contavam 13 serviços e 31 artigos.

## Comercial e atendimento
O CTA de orçamento preenche uma mensagem no WhatsApp da AJN. Pergunta por segmento, local da unidade, agente ou tipo de exposição e objetivo da campanha. Não instala coleta invisível de dados nem depende de backend adicional.

## Validação
Executar `npm run check`, `npm run build`, `npm run audit:medicoes`, `npm run audit:services-catalog`, `npm run audit:blog`, `npm run audit:sitemap`, `npm run audit:seo` e browser smoke nas larguras 320 / 390 / 768 / 1440 px. Revisar imagens e conteúdo técnico antes de fazer merge para a `main`, que publica automaticamente na Hostinger.

## Observação técnica
Resultados instrumentais não se confundem com caracterização jurídica de insalubridade, emissão de LTCAT, PGR, PCMSO ou responsabilidade legal desses documentos. A finalidade, o escopo e as obrigações de cada entrega precisam ser definidos separadamente.
