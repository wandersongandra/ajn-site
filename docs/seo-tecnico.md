# SEO técnico AJN — outubro de 2026

## Estado verificado

- Domínio canônico: `https://ajnengenharia.com.br/`.
- Home, Blog, Serviços, Contato e três páginas legais responderam HTTP 200 na inspeção GET.
- HTML público observado com `index,follow`; `PUBLIC_ALLOW_INDEXING=true` no build institucional; preview deve definir explicitamente falso conforme `scripts/audit-deploy.mjs`.
- Sitemap e catálogo de rotas conferidos por `audit:sitemap`; sitemap resultante inclui novas URLs sem retirar as atuais.
- Auditoria do build após as alterações: 156 arquivos HTML (incluindo 404), canonicals/robots coerentes, sem fragmentos locais quebrados.
- Na revisão anterior, `audit:blog` encontrou 28 páginas. A atualização baseada no relatório da empresa adiciona três artigos, preservando os slugs existentes; o novo build deve confirmar 31 páginas, títulos/descrições únicas, uma H1, BlogPosting JSON-LD e imagem OG.
- Capas WebP são processadas pelo Astro, com dimensões/srcset/sizes no HTML; 11 capas OG dedicadas para artigos recentes são arquivos JPEG 1200×630.

## Indexação e deploy

Não altere `PUBLIC_ALLOW_INDEXING` indiscriminadamente. Produção pode ser indexada somente quando o domínio for o institucional e o release estiver aprovado. Preview/staging devem permanecer `noindex`; o gate de deploy e os testes de segurança existentes cobrem consistência, mas a configuração real do provedor/hPanel não foi consultada.

Canonical usa URLs existentes com barra final e respeita a origem configurada. Não há alteração de slug nesta rodada. Nenhum redirect foi criado porque nenhum conteúdo foi consolidado/removido.

## Conteúdo e dados estruturados

`BlogPosting` e `BreadcrumbList` refletem conteúdo e URL gerados. Organization/Website/Service devem usar somente dados verificáveis; não adicionar avaliações, locais atendidos ou responsáveis sem fonte empresarial confirmada. Nenhum schema foi usado para simular elegibilidade de resultado enriquecido.

## Intenções e links internos

- **Informacional:** artigos explicam procedimentos, documentos e NRs com referências oficiais.
- **Comercial:** relatório da AJN confirmou 13 frentes/ofertas para o catálogo atual; cada card usa uma página já existente. A disponibilidade, habilitação e escopo específico continuam sujeitos à avaliação de cada contrato.
- **Local:** não expandir páginas por cidade sem comprovar atendimento e conteúdo substantivo local.

Links do blog só apontam para artigos ou páginas que existem. As ligações comerciais são por slug e oferta confirmada no código, não por categoria ampla.

## Medição pendente

Não foi executado Lighthouse/axe nesta rodada e não foram consultados Search Console, CrUX ou RUM. Logo, não há pontuação ou LCP/INP/CLS para relatar. Os oito tamanhos de viewport foram auditados quanto a overflow horizontal em Home e Blog, sem substituir auditoria de interação/acessibilidade completa.
