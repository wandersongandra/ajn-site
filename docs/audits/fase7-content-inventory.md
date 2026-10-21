# Inventário editorial e SEO — Fase 7

Gerado em 2026-10-21 a partir do build local de `origin/main` e dos arquivos de conteúdo. O CSV anexo contém uma linha por rota HTML auditada.

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
| P3 | 97 |
| P1 | 42 |
| P2 | 25 |

- Títulos duplicados exatos: 3 grupos.
- Rotas sem link interno encontrado no HTML compilado: 1.
- O relatório não remove nem redireciona páginas.

## Amostra priorizada de alertas

| URL | Prioridade | Problemas detectados | Evidência |
|---|---|---|---|
| /analise-projetos-eletricos-bh | P1 | afirmação comercial depende de validação / sobreposição estratégica candidata; não prova de canibalização | src/content/marketing/analise-projetos-eletricos-bh.ts |
| /combate-incendio-belo-horizonte | P1 | afirmação comercial depende de validação / sobreposição estratégica candidata; não prova de canibalização | src/content/marketing/combate-incendio-belo-horizonte.ts |
| /elaboracao-projeto-combate-incendio | P1 | afirmação comercial depende de validação | src/content/marketing/elaboracao-projeto-combate-incendio.ts |
| /elevador-bh | P1 | afirmação comercial depende de validação / sobreposição estratégica candidata; não prova de canibalização | src/content/marketing/elevador-bh.ts |
| /empresa-combate-incendio | P2 | sobreposição estratégica candidata; não prova de canibalização | src/content/marketing/empresa-combate-incendio.ts |
| /empresa-combate-incendio-bh | P1 | afirmação comercial depende de validação / sobreposição estratégica candidata; não prova de canibalização | src/content/marketing/empresa-combate-incendio-bh.ts |
| /empresa-elevador | P2 | sobreposição estratégica candidata; não prova de canibalização | src/content/marketing/empresa-elevador.ts |
| /empresa-elevador-belo-horizonte | P1 | afirmação comercial depende de validação / sobreposição estratégica candidata; não prova de canibalização | src/content/marketing/empresa-elevador-belo-horizonte.ts |
| /empresa-escada-rolante | P2 | sobreposição estratégica candidata; não prova de canibalização | src/content/marketing/empresa-escada-rolante.ts |
| /empresa-ltcat | P2 | sobreposição estratégica candidata; não prova de canibalização | src/content/marketing/empresa-ltcat.ts |
| /empresa-pcmso | P1 | afirmação comercial depende de validação / sobreposição estratégica candidata; não prova de canibalização | src/content/marketing/empresa-pcmso.ts |
| /empresa-plataforma-elevatoria | P1 | afirmação comercial depende de validação / sobreposição estratégica candidata; não prova de canibalização | src/content/marketing/empresa-plataforma-elevatoria.ts |
| /empresa-projeto-eletrico | P2 | sobreposição estratégica candidata; não prova de canibalização | src/content/marketing/empresa-projeto-eletrico.ts |
| /empresa-projeto-eletrico-bh | P2 | sobreposição estratégica candidata; não prova de canibalização | src/content/marketing/empresa-projeto-eletrico-bh.ts |
| /empresa-que-elabora-pgr | P2 | sobreposição estratégica candidata; não prova de canibalização | src/content/marketing/empresa-que-elabora-pgr.ts |
| /empresa-que-faz-ltcat | P1 | afirmação comercial depende de validação / sobreposição estratégica candidata; não prova de canibalização | src/content/marketing/empresa-que-faz-ltcat.ts |
| /empresa-que-faz-pcmso | P2 | sobreposição estratégica candidata; não prova de canibalização | src/content/marketing/empresa-que-faz-pcmso.ts |
| /empresa-que-faz-pgr | P2 | sobreposição estratégica candidata; não prova de canibalização | src/content/marketing/empresa-que-faz-pgr.ts |
| /empresas-elevadores-bh | P1 | afirmação comercial depende de validação / sobreposição estratégica candidata; não prova de canibalização | src/content/marketing/empresas-elevadores-bh.ts |
| /empresas-manutencao-elevadores-bh | P1 | afirmação comercial depende de validação / sobreposição estratégica candidata; não prova de canibalização | src/content/marketing/empresas-manutencao-elevadores-bh.ts |
| /escada-rolante | P1 | afirmação comercial depende de validação | src/content/marketing/escada-rolante.ts |
| /escada-rolante-belo-horizonte | P1 | afirmação comercial depende de validação / sobreposição estratégica candidata; não prova de canibalização | src/content/marketing/escada-rolante-belo-horizonte.ts |
| /escada-rolante-bh | P1 | afirmação comercial depende de validação / sobreposição estratégica candidata; não prova de canibalização | src/content/marketing/escada-rolante-bh.ts |
| /informacoes | P1 | meta description ausente / 0 H1 renderizado(s) / sem link interno detectado no HTML compilado | dist/informacoes/index.html |
| /laudos-saude-seguranca-do-trabalho | P1 | afirmação comercial depende de validação | src/content/marketing/laudos-saude-seguranca-do-trabalho.ts |
| /ltcat-evento-esocial | P1 | afirmação comercial depende de validação | src/content/marketing/ltcat-evento-esocial.ts |
| /ltcat-orcamento | P1 | afirmação comercial depende de validação / sobreposição estratégica candidata; não prova de canibalização | src/content/marketing/ltcat-orcamento.ts |
| /ltcat-preco | P2 | sobreposição estratégica candidata; não prova de canibalização | src/content/marketing/ltcat-preco.ts |
| /manutencao-elevadores-belo-horizonte | P2 | sobreposição estratégica candidata; não prova de canibalização | src/content/marketing/manutencao-elevadores-belo-horizonte.ts |
| /manutencao-elevadores-bh | P1 | afirmação comercial depende de validação / sobreposição estratégica candidata; não prova de canibalização | src/content/marketing/manutencao-elevadores-bh.ts |
| /orcamento-ltcat | P1 | afirmação comercial depende de validação / sobreposição estratégica candidata; não prova de canibalização | src/content/marketing/orcamento-ltcat.ts |
| /orcamento-pcmso | P2 | sobreposição estratégica candidata; não prova de canibalização | src/content/marketing/orcamento-pcmso.ts |
| /orcamento-pgr | P1 | afirmação comercial depende de validação / sobreposição estratégica candidata; não prova de canibalização | src/content/marketing/orcamento-pgr.ts |
| /orcamento-projeto-combate-incendio | P2 | sobreposição estratégica candidata; não prova de canibalização | src/content/marketing/orcamento-projeto-combate-incendio.ts |
| /orcamento-projeto-eletrico | P2 | sobreposição estratégica candidata; não prova de canibalização | src/content/marketing/orcamento-projeto-eletrico.ts |
| /pcmso-preco | P2 | sobreposição estratégica candidata; não prova de canibalização | src/content/marketing/pcmso-preco.ts |
| /plataforma-acessibilidade-bh | P2 | sobreposição estratégica candidata; não prova de canibalização | src/content/marketing/plataforma-acessibilidade-bh.ts |
| /plataforma-acessibilidade-preco | P2 | sobreposição estratégica candidata; não prova de canibalização | src/content/marketing/plataforma-acessibilidade-preco.ts |
| /plataforma-elevatoria | P1 | afirmação comercial depende de validação | src/content/marketing/plataforma-elevatoria.ts |
| /plataforma-elevatoria-belo-horizonte | P1 | afirmação comercial depende de validação / sobreposição estratégica candidata; não prova de canibalização | src/content/marketing/plataforma-elevatoria-belo-horizonte.ts |

## Limites

O inventário não prova capacidade técnica, autorização de uso de imagem, posição no Google, tráfego, conversão, vínculo profissional, certificação ou vigência normativa. Esses itens estão documentados em `fase7-commercial-validation.md` e no relatório final da fase.
