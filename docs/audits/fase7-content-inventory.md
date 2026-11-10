# Inventário editorial e SEO — Fase 7

Gerado em 2026-11-09 a partir do build local e dos arquivos de conteúdo do checkout **feat/ajn-carreiras (09cc0da7c7af09a065c98832aab5bc4d02145fdf)**. Gere o HTML em dist/ após selecionar o checkout para evitar evidência de outra revisão. O CSV anexo contém uma linha por rota HTML auditada.

## Escopo e critérios

- Foram consideradas 164 rotas HTML de conteúdo; o `404.html` foi excluído do inventário editorial.
- Metadados, H1, canonical, imagens, links e contagem textual foram lidos do HTML compilado, não inferidos apenas do TypeScript.
- `baseline técnico sem achado automático` significa que os checks mecânicos deste inventário não encontraram ausência ou padrão de risco; não significa aprovação jurídica, comercial ou de UX.
- `afirmação comercial depende de validação` é um alerta de revisão, não uma conclusão de falsidade.
- Candidatos de sobreposição por `preço`, `orçamento`, localização ou `empresa` não são tratados como canibalização sem dados de Search Console/Analytics e revisão de intenção.

## Contagem

| Tipo | Páginas |
|---|---:|
| home | 1 |
| marketing | 110 |
| blog-index | 1 |
| blog | 34 |
| institutional | 3 |
| legacy/redirect | 1 |
| legal | 3 |
| service-catalog | 1 |
| service | 10 |

| Prioridade automática | Páginas |
|---|---:|
| P3 | 83 |
| P1 | 67 |
| P2 | 14 |

- Títulos duplicados exatos: 1 grupos.
- Rotas sem link interno encontrado no HTML compilado: 50.
- O relatório não remove nem redireciona páginas.

## Qualidade da medição de links

- A coluna **Links internos** do CSV conta links em todo o HTML, incluindo menu, rodapé e componentes compartilhados. Não equivale a referências editoriais nem a links únicos.
- Em separado, links internos extraídos de regiões `<article>` nas páginas de blog (fallback para `<main>`): **4 a 8** por artigo; componentes dentro do artigo podem ser incluídos e a relevância precisa de revisão contextual.
- Páginas com ao menos um inbound vindo dessas regiões dos artigos: **16**. Não representa cliques nem comprova relação semântica.
- Uma rota sem inbound no HTML não é necessariamente inacessível aos buscadores, e links globais de navegação não provam relação editorial.

## Amostra priorizada de alertas

| URL | Prioridade | Problemas detectados | Evidência |
|---|---|---|---|
| /analise-projetos-eletricos-bh | P1 | meta description ausente / 0 H1 renderizado(s) / sobreposição estratégica candidata; não prova de canibalização / sem link interno detectado no HTML compilado | dist/analise-projetos-eletricos-bh/index.html |
| /combate-incendio-belo-horizonte | P1 | afirmação comercial depende de validação / sobreposição estratégica candidata; não prova de canibalização | src/content/marketing/combate-incendio-belo-horizonte.ts |
| /elaboracao-projeto-combate-incendio | P1 | afirmação comercial depende de validação | src/content/marketing/elaboracao-projeto-combate-incendio.ts |
| /elevacao-vertical | P1 | meta description ausente / 0 H1 renderizado(s) / sem link interno detectado no HTML compilado | dist/elevacao-vertical/index.html |
| /elevador-bh | P1 | meta description ausente / 0 H1 renderizado(s) / sobreposição estratégica candidata; não prova de canibalização / sem link interno detectado no HTML compilado | dist/elevador-bh/index.html |
| /empresa-combate-incendio | P2 | sobreposição estratégica candidata; não prova de canibalização | src/content/marketing/empresa-combate-incendio.ts |
| /empresa-combate-incendio-bh | P1 | afirmação comercial depende de validação / sobreposição estratégica candidata; não prova de canibalização | src/content/marketing/empresa-combate-incendio-bh.ts |
| /empresa-elevador | P1 | meta description ausente / 0 H1 renderizado(s) / sobreposição estratégica candidata; não prova de canibalização / sem link interno detectado no HTML compilado | dist/empresa-elevador/index.html |
| /empresa-elevador-belo-horizonte | P1 | meta description ausente / 0 H1 renderizado(s) / sobreposição estratégica candidata; não prova de canibalização / sem link interno detectado no HTML compilado | dist/empresa-elevador-belo-horizonte/index.html |
| /empresa-escada-rolante | P1 | meta description ausente / 0 H1 renderizado(s) / sobreposição estratégica candidata; não prova de canibalização / sem link interno detectado no HTML compilado | dist/empresa-escada-rolante/index.html |
| /empresa-ltcat | P2 | sobreposição estratégica candidata; não prova de canibalização | src/content/marketing/empresa-ltcat.ts |
| /empresa-pcmso | P1 | afirmação comercial depende de validação / sobreposição estratégica candidata; não prova de canibalização | src/content/marketing/empresa-pcmso.ts |
| /empresa-plataforma-elevatoria | P1 | meta description ausente / 0 H1 renderizado(s) / sobreposição estratégica candidata; não prova de canibalização / sem link interno detectado no HTML compilado | dist/empresa-plataforma-elevatoria/index.html |
| /empresa-projeto-eletrico | P1 | meta description ausente / 0 H1 renderizado(s) / sobreposição estratégica candidata; não prova de canibalização / sem link interno detectado no HTML compilado | dist/empresa-projeto-eletrico/index.html |
| /empresa-projeto-eletrico-bh | P1 | meta description ausente / 0 H1 renderizado(s) / sobreposição estratégica candidata; não prova de canibalização / sem link interno detectado no HTML compilado | dist/empresa-projeto-eletrico-bh/index.html |
| /empresa-que-elabora-pgr | P2 | sobreposição estratégica candidata; não prova de canibalização | src/content/marketing/empresa-que-elabora-pgr.ts |
| /empresa-que-faz-ltcat | P1 | afirmação comercial depende de validação / sobreposição estratégica candidata; não prova de canibalização | src/content/marketing/empresa-que-faz-ltcat.ts |
| /empresa-que-faz-pcmso | P2 | sobreposição estratégica candidata; não prova de canibalização | src/content/marketing/empresa-que-faz-pcmso.ts |
| /empresa-que-faz-pgr | P2 | sobreposição estratégica candidata; não prova de canibalização | src/content/marketing/empresa-que-faz-pgr.ts |
| /empresas-elevadores-bh | P1 | meta description ausente / 0 H1 renderizado(s) / sobreposição estratégica candidata; não prova de canibalização / sem link interno detectado no HTML compilado | dist/empresas-elevadores-bh/index.html |
| /empresas-manutencao-elevadores-bh | P1 | meta description ausente / 0 H1 renderizado(s) / sobreposição estratégica candidata; não prova de canibalização / sem link interno detectado no HTML compilado | dist/empresas-manutencao-elevadores-bh/index.html |
| /escada-rolante | P1 | meta description ausente / 0 H1 renderizado(s) / sem link interno detectado no HTML compilado | dist/escada-rolante/index.html |
| /escada-rolante-belo-horizonte | P1 | meta description ausente / 0 H1 renderizado(s) / sobreposição estratégica candidata; não prova de canibalização / sem link interno detectado no HTML compilado | dist/escada-rolante-belo-horizonte/index.html |
| /escada-rolante-bh | P1 | meta description ausente / 0 H1 renderizado(s) / sobreposição estratégica candidata; não prova de canibalização / sem link interno detectado no HTML compilado | dist/escada-rolante-bh/index.html |
| /informacoes | P1 | meta description ausente / 0 H1 renderizado(s) / sem link interno detectado no HTML compilado | dist/informacoes/index.html |
| /instalacao-predial-eletrica | P1 | meta description ausente / 0 H1 renderizado(s) / sem link interno detectado no HTML compilado | dist/instalacao-predial-eletrica/index.html |
| /instalacoes-eletricas-projeto | P1 | meta description ausente / 0 H1 renderizado(s) / sem link interno detectado no HTML compilado | dist/instalacoes-eletricas-projeto/index.html |
| /laudos-saude-seguranca-do-trabalho | P1 | afirmação comercial depende de validação | src/content/marketing/laudos-saude-seguranca-do-trabalho.ts |
| /ltcat-evento-esocial | P1 | afirmação comercial depende de validação | src/content/marketing/ltcat-evento-esocial.ts |
| /ltcat-orcamento | P2 | sobreposição estratégica candidata; não prova de canibalização | src/content/marketing/ltcat-orcamento.ts |
| /ltcat-preco | P2 | sobreposição estratégica candidata; não prova de canibalização | src/content/marketing/ltcat-preco.ts |
| /manutencao-elevadores-belo-horizonte | P1 | meta description ausente / 0 H1 renderizado(s) / sobreposição estratégica candidata; não prova de canibalização / sem link interno detectado no HTML compilado | dist/manutencao-elevadores-belo-horizonte/index.html |
| /manutencao-elevadores-bh | P1 | meta description ausente / 0 H1 renderizado(s) / sobreposição estratégica candidata; não prova de canibalização / sem link interno detectado no HTML compilado | dist/manutencao-elevadores-bh/index.html |
| /orcamento-ltcat | P2 | sobreposição estratégica candidata; não prova de canibalização | src/content/marketing/orcamento-ltcat.ts |
| /orcamento-pcmso | P2 | sobreposição estratégica candidata; não prova de canibalização | src/content/marketing/orcamento-pcmso.ts |
| /orcamento-pgr | P1 | afirmação comercial depende de validação / sobreposição estratégica candidata; não prova de canibalização | src/content/marketing/orcamento-pgr.ts |
| /orcamento-projeto-combate-incendio | P2 | sobreposição estratégica candidata; não prova de canibalização | src/content/marketing/orcamento-projeto-combate-incendio.ts |
| /orcamento-projeto-eletrico | P1 | meta description ausente / 0 H1 renderizado(s) / sobreposição estratégica candidata; não prova de canibalização / sem link interno detectado no HTML compilado | dist/orcamento-projeto-eletrico/index.html |
| /pcmso-preco | P2 | sobreposição estratégica candidata; não prova de canibalização | src/content/marketing/pcmso-preco.ts |
| /plataforma-acessibilidade | P1 | meta description ausente / 0 H1 renderizado(s) / sem link interno detectado no HTML compilado | dist/plataforma-acessibilidade/index.html |

## Limites

O inventário não prova capacidade técnica, autorização de uso de imagem, posição no Google, tráfego, conversão, vínculo profissional, certificação ou vigência normativa. Esses itens estão documentados em `fase7-commercial-validation.md` e no relatório final da fase.
