# Validação comercial e de credibilidade — Fase 7

Data da coleta: 2026-10-21. Base: `origin/main` em `06b51a606fe65408f22efbb945ba2e5921ad6f2b`, build local com 164 páginas HTML.

## Escopo e limite de evidência

Esta é uma triagem editorial/comercial baseada no código e no HTML gerado. Ela não comprova capacidade operacional, registro profissional, acervo próprio, autorização de uso de imagens, contratos, clientes, certificados, licenças, cobertura geográfica ou disponibilidade atual de qualquer serviço.

Rótulos usados:

- `CONFIRMADO`: observado diretamente no repositório ou no HTML compilado.
- `INFERIDO`: interpretação editorial derivada da estrutura, sem prova externa.
- `NÃO VERIFICADO`: exige confirmação do proprietário, documento ou operação externa.
- `BLOCKED`: não foi possível obter a evidência necessária nesta fase.

## Resultado executivo

| Área | Resultado | Evidência |
|---|---|---|
| Páginas auditadas | `CONFIRMADO` — 164 rotas HTML; 110 páginas classificadas como marketing, 10 páginas de serviço e 34 artigos | `docs/audits/fase7-content-inventory.csv` |
| Metadados e imagens | `CONFIRMADO` — 0 imagens sem `alt` no build auditado; os alertas comerciais não são falhas de acessibilidade | inventário compilado |
| Copy legada | `CONFIRMADO` — há textos genéricos ou truncados em seis descrições de serviços e afirmações comerciais que requerem prova em páginas de marketing | `src/content/services/*.ts`, `src/content/marketing/*.ts` |
| Capacidade comercial | `NÃO VERIFICADO` — não há, nesta coleta, prova suficiente para publicar garantias de equipe, certificação, experiência, responsabilidade técnica, locação, instalação/manutenção ou atendimento integral | confirmação do proprietário necessária |
| Canibalização | `NÃO VERIFICADO` — existem grupos de intenção próximos, mas não há dados de Search Console/Analytics | relatório de inventário |

## Correção segura identificada

O catálogo canônico já contém descrições curtas, específicas e menos arriscadas para seis serviços. As páginas individuais, porém, ainda usam descrições herdadas com texto truncado e a expressão `Saiba mais`:

| Rota | Evidência atual | Base segura já existente |
|---|---|---|
| `/servicos/assessoria-e-consultoria-em-saude-ocupacional` | `src/content/services/assessoria-e-consultoria-em-saude-ocupacional.ts` | `src/content/services/catalog.ts` |
| `/servicos/gestao-ambiental` | `src/content/services/gestao-ambiental.ts` | `src/content/services/catalog.ts` |
| `/servicos/gestao-da-qualidade` | `src/content/services/gestao-da-qualidade.ts` | `src/content/services/catalog.ts` |
| `/servicos/projetos-de-combate-a-incendio-e-panico-ppcip` | `src/content/services/projetos-de-combate-a-incendio-e-panico-ppcip.ts` | `src/content/services/catalog.ts` |
| `/servicos/regularizacao-de-imoveis-junto-ao-corpo-de-bombeiros` | `src/content/services/regularizacao-de-imoveis-junto-ao-corpo-de-bombeiros.ts` | `src/content/services/catalog.ts` |
| `/servicos/treinamento-de-nrs` | `src/content/services/treinamento-de-nrs.ts` | `src/content/services/catalog.ts` |

Essa correção pode ser implementada sem adicionar capacidade, certificação ou resultado comercial: copiar as descrições canônicas para os campos equivalentes e corrigir apenas gramática evidente. A implementação deve permanecer em PR próprio, revisável e sem misturar a auditoria.

## Claims que dependem de validação do proprietário

Os padrões abaixo aparecem em páginas legadas e foram tratados como fila de validação, não como falsidade confirmada:

| Claim/padrão | Exemplos de evidência | Risco | Evidência exigida |
|---|---|---|---|
| “empresa referência”, “empresa renomada”, “escolha certa” | `escada-rolante-bh.ts`, `sistemas-incendio-bh.ts` | prova social ou superioridade sem fonte | autorização de marketing e evidência verificável |
| “garantindo conformidade”, “conformidade total”, “cumprindo todas as normas” | `projeto-eletrico-belo-horizonte.ts`, `valor-elaboracao-pgr.ts` | promessa absoluta; escopo depende de projeto, atividade e autoridade competente | revisão técnica e substituição por formulação condicionada, quando necessário |
| responsabilidade técnica, equipe qualificada ou profissionais alocados | `projetos-engenharia-eletrica.ts`, `assessoria-e-consultoria-em-saude-ocupacional.ts` | pode sugerir registro, atribuição ou disponibilidade não comprovada | profissionais, registros e escopo contratual confirmados |
| locação, instalação e manutenção de equipamentos | `plataforma-elevatoria-bh.ts`, páginas de elevadores e escadas | capacidade operacional e responsabilidade de terceiros | confirmação do catálogo comercial vigente e fornecedores |
| “anos de experiência”, “expertise” e atendimento amplo | páginas de marketing legadas | credibilidade sem data, métrica ou escopo | data de fundação, portfólio autorizado ou remoção do claim |
| AVCB/CLCB “rápido”, “sem burocracia” ou garantia de aprovação | `regularizacao-de-imoveis-junto-ao-corpo-de-bombeiros.ts` | decisão depende de análise da autoridade competente | revisão comercial/jurídica e linguagem sem garantia de prazo ou resultado |

## Decisões editoriais

1. Não apagar páginas, imagens, artigos ou rotas apenas por baixa evidência comercial.
2. Não publicar clientes, certificados, números, CREA/ART, prazos, cobertura geográfica ou resultados sem documento correspondente.
3. Não transformar “candidato a sobreposição” em redirecionamento, `noindex` ou canonicalização sem dados de desempenho e intenção.
4. Manter o legado de URLs durante a validação; o slug `/blog/ppp-facil-o-ue-e-como-consultar-e-sua-importancia` permanece inalterado.
5. Usar o catálogo de serviços como fonte editorial segura, mas não como prova independente de capacidade operacional.

## Pendências de validação

| Item | Estado | Próximo responsável |
|---|---|---|
| Capacidade atual de cada serviço | `NÃO VERIFICADO` | proprietário/comercial |
| Profissionais, registros e atribuições | `NÃO VERIFICADO` | responsável técnico |
| Clientes, obras, imagens e depoimentos | `NÃO VERIFICADO` | proprietário/marketing |
| Search Console, Analytics e conversões por URL | `BLOCKED` | acesso ao ambiente de métricas |
| Aprovação de claims absolutos e promessas | `NÃO VERIFICADO` | proprietário + revisão técnica/jurídica |

