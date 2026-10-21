# Fase 7D — Revisão de coerência SEO e conteúdo comercial

Data da triagem: 2026-10-21. Base: seis páginas de marketing já existentes, inspecionadas na branch `codex/ajn-fase7-seo-20261021`. Esta revisão acompanha a PR #91; não comprova prestação dos serviços, desempenho orgânico nem autorização de claims.

## O que a PR #91 realmente corrige

- O normalizador SEO expandia a sigla "BH" para "Belo Horizonte" e gerava três pares de **títulos exatamente iguais**.
- As seis entradas explícitas do `keyword-map.ts` tornam os títulos diferentes, preservam URLs, canonical, H1, conteúdo do corpo, sitemap e status de indexação.
- A distinção de títulos é uma correção de metadados; **não demonstra intenção de busca exclusiva nem resolve canibalização**.

## Matriz de coerência e pendências comerciais

| Rota | Assunto aparente | Ponto de atenção no corpo legado | Decisão |
|---|---|---|---|
| `/escada-rolante-belo-horizonte` | Escadas rolantes em Belo Horizonte | Textos promocionais amplos sobre consultoria, qualidade e especialização sem comprovação independente | Manter URL; validar escopo de atuação |
| `/escada-rolante-bh` | Segurança e gestão técnica de escadas rolantes | Afirma gestão completa, emissão de laudos, responsabilidade técnica, conformidade total e prazos rigorosos | Manter URL; exigir comprovação comercial e técnica antes de reforçar claims |
| `/plataforma-elevatoria-belo-horizonte` | Plataformas elevatórias na região | Afirma equipe altamente qualificada e serviços especializados de execução com plataformas | Confirmar escopo, modalidade e qualificação |
| `/plataforma-elevatoria-bh` | Plataformas móveis para trabalho em altura | Afirma locação de plataformas e disponibilidade de equipamentos; também cita outros serviços | Confirmar locação, parceiros, disponibilidade e responsabilidades |
| `/projeto-eletrico-belo-horizonte` | Projetos elétricos para edificações | Afirma elaboração e execução, equipe de engenheiros e conformidade integral com normas | Confirmar serviço, atribuições e responsáveis técnicos |
| `/projeto-eletrico-bh` | Planejamento e escopo de projeto elétrico | Afirma soluções completas, equipes qualificadas e serviços de climatização | Validar portfólio e escopo oferecido |

**Atenção:** `plataforma elevatória` pode designar equipamentos com usos e requisitos distintos (ex.: equipamentos móveis para trabalho em altura versus plataformas de acessibilidade). As páginas devem esclarecer o equipamento e serviço específicos antes de receber conteúdo comercial adicional.

## Decisão desta PR

- **Pode-se validar a alteração técnica dos títulos independentemente da confirmação dos claims preexistentes**, porque o diff não afirma nova certificação, serviço, equipe, disponibilidade, prazo ou resultado.
- Não tratar seis títulos únicos como prova de ausência de canibalização.
- Não remover, canonizar para outra rota, aplicar `noindex` ou redirecionar os três pares sem análise de intenção, tráfego e indexação.
- Não reescrever as afirmações antigas por suposição. Solicitar confirmação do proprietário e dos responsáveis técnicos.
- As correções editoriais dos corpos devem formar outra entrega, documentada e sujeita a revisão específica.

## Aceite da PR #91

1. `npm run validate` deve executar `audit:fase7-seo` após o build.
2. Títulos e descrições renderizados devem estar coerentes com a redação existente, sem ampliar promessas.
3. CI, revisão Codex e proteção de branch devem estar sem pendências.
4. A publicação das mudanças na produção deve ser comprovada separadamente após merge autorizado.
