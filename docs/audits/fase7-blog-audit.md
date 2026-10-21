# Auditoria dos artigos e arquitetura editorial — Fase 7

Data: 2026-10-21. Foram auditados os 34 artigos efetivamente exportados por `src/content/blog/index.ts`, além da página índice e do catálogo de tópicos.

## Resultado mecânico

`CONFIRMADO`: o build contém 34 artigos, 34 cards, 34 descrições e 34 `srcset`, conforme `npm run audit:blog`. O inventário compilado encontrou, nos 34 artigos, título, H1, description, canonical, imagens com `alt` e links internos. A contagem renderizada varia de 714 a 1.017 palavras e os artigos têm entre 57 e 68 links internos.

O resultado é um baseline editorial; não mede posição, tráfego, conversão, originalidade perante a web, aprovação jurídica ou desempenho de busca. Search Console/Analytics ficaram `BLOCKED` nesta fase.

## Auditoria individual

| Rota | Foco editorial observado | Estado | Ação |
|---|---|---|---|
| `/blog/a-importancia-do-ltcat-para-a-seguranca-do-trabalho-e-a-protecao-do-ambiente-profissional` | importância e proteção no LTCAT | `CONFIRMADO` | manter |
| `/blog/aep-e-aet-diferencas-e-quando-aplicar-cada-avaliacao` | diferença entre AEP e AET | `CONFIRMADO` | manter |
| `/blog/apr-e-permissao-de-trabalho-como-planejar-atividades-de-risco` | APR e Permissão de Trabalho | `CONFIRMADO` | manter |
| `/blog/avaliacao-de-calor-ocupacional-ibutg-e-atividade` | IBUTG, atividade e jornada | `CONFIRMADO` | manter |
| `/blog/avaliacao-de-iluminamento-posto-de-trabalho-nho-11` | iluminamento e NHO 11 | `CONFIRMADO` | manter |
| `/blog/controle-de-qualidade-em-obras-registros-inspecoes-e-desvios` | registros, inspeções e desvios | `CONFIRMADO` | manter |
| `/blog/elaboracao-de-pgr-e-pcmso-conformidade-e-seguranca-no-trabalho` | funções diferentes de PGR e PCMSO | `CONFIRMADO` | manter |
| `/blog/esocial-sst-diferencas-entre-s2210-s2220-e-s2240` | diferenças entre S-2210, S-2220 e S-2240 | `CONFIRMADO` | manter e monitorar manual |
| `/blog/gestao-de-residuos-como-organizar-a-rotina-da-operacao` | rotina de gestão de resíduos | `CONFIRMADO` | manter |
| `/blog/gestao-de-terceiros-em-sst-documentos-mobilizacao-e-controles` | documentos e controles de terceiros | `CONFIRMADO` | manter |
| `/blog/higiene-ocupacional-como-planejar-avaliacoes-de-exposicao` | planejamento de avaliações | `CONFIRMADO` | manter |
| `/blog/investigacao-de-acidentes-como-transformar-registros-em-prevencao` | registros e prevenção | `CONFIRMADO` | manter |
| `/blog/laudo-de-gerenciamento-de-riscos-essencial-para-garantir-a-seguranca-no-ambiente-de-trabalho` | PGR como gerenciamento, não laudo isolado | `CONFIRMADO` | manter |
| `/blog/laudo-tecnico-das-condicoes-ambientais-de-trabalho-ltcat` | finalidade e atualização do LTCAT | `CONFIRMADO` | manter |
| `/blog/ltcat-e-seguranca-do-trabalho-como-garantir-a-protecao-eficaz-da-sua-equipe` | LTCAT e informações ambientais | `CONFIRMADO` | manter |
| `/blog/ltcat-e-seguranca-do-trabalho-como-proteger-sua-empresa-com-eficiencia` | LTCAT em várias unidades | `CONFIRMADO` | manter |
| `/blog/ltcat-essencial-para-a-seguranca-do-trabalho-e-protecao-da-sua-equipe` | agentes físicos, químicos e biológicos | `CONFIRMADO` | manter |
| `/blog/ltcat-guia-essencial-para-garantir-a-seguranca-no-ambiente-de-trabalho` | preparação da avaliação ambiental | `CONFIRMADO` | manter |
| `/blog/ltcat-guia-essencial-para-garantir-seguranca-do-trabalho-eficaz` | quando revisar o LTCAT | `CONFIRMADO` | manter |
| `/blog/ltcat-na-seguranca-do-trabalho-fortaleca-a-protecao-dos-seus-funcionarios-eficazmente` | documentação de medidas de proteção | `CONFIRMADO` | manter |
| `/blog/ltcat-na-seguranca-do-trabalho-garantindo-protecao-e-reducao-de-riscos-para-sua-equipe` | consistência entre LTCAT, PGR e PPP | `CONFIRMADO` | manter |
| `/blog/ltcat-papel-fundamental-na-seguranca-do-trabalho-e-no-bem-estar-dos-colaboradores` | LTCAT e histórico do PPP | `CONFIRMADO` | manter |
| `/blog/medicao-de-ruido-ocupacional-dosimetria-e-planejamento` | planejamento da dosimetria | `CONFIRMADO` | manter |
| `/blog/nr-10-documentacao-capacitacao-e-transicao-regulatoria` | NR-10, documentação e transição de 2027 | `CONFIRMADO` | manter e monitorar |
| `/blog/nr-12-como-organizar-a-analise-de-riscos-de-maquinas` | análise de riscos de máquinas | `CONFIRMADO` | manter |
| `/blog/nr-35-trabalho-em-altura-e-seguranca` | capacitação e controles de trabalho em altura | `CONFIRMADO` | manter e monitorar |
| `/blog/o-fim-do-ppra-e-a-chegada-do-pgr-o-que-mudou` | transição PPRA/PGR | `CONFIRMADO` | manter |
| `/blog/orcamento-eficiente-para-ltcat-passos-essenciais-para-garantir-a-seguranca-no-trabalho` | informações necessárias ao orçamento de LTCAT | `CONFIRMADO` | manter |
| `/blog/perfil-profissiografico-previdenciario-ppp` | função do PPP | `CONFIRMADO` | manter |
| `/blog/ppcip-avcb-clcb-como-organizar-a-regularizacao-do-imovel` | relação entre PPCIP, AVCB e CLCB | `CONFIRMADO` | manter e monitorar autoridade local |
| `/blog/ppp-facil-o-ue-e-como-consultar-e-sua-importancia` | consulta do PPP eletrônico no Meu INSS | `CONFIRMADO` | preservar URL; revisar fonte quando mudar |
| `/blog/seguranca-do-trabalho-e-ltcat-conformidade-e-protecao-previdenciaria` | LTCAT e histórico previdenciário | `CONFIRMADO` | manter |
| `/blog/seguranca-do-trabalho-e-pcmso-gestao-da-saude-ocupacional` | PCMSO e acompanhamento da saúde | `CONFIRMADO` | manter |
| `/blog/um-pouco-sobre-nos` | áreas de atuação da AJN | `CONFIRMADO` | validar claims institucionais com proprietário |

## Cluster LTCAT

O cluster possui vários artigos com o termo principal em comum, mas a inspeção atual encontrou diferenciação por intenção: finalidade, agentes, unidades, atualização, medidas de proteção, relação com PGR/PPP e orçamento. Não houve duplicação exata de título entre artigos.

`INFERIDO`: a quantidade de páginas pode gerar sobreposição em buscas competitivas. `NÃO VERIFICADO`: não é possível dizer qual artigo deve consolidar sem impressões, cliques, consultas, conversões e páginas de destino do Search Console.

Decisão: não redirecionar, apagar, canonicalizar ou aplicar `noindex` nesta fase. Na Fase 8, comparar consultas e desempenho por cluster e definir uma página pilar somente com evidência.

## Outras decisões de arquitetura

- Não foram encontrados artigos sem inbound interno no inventário; a única rota sem inbound foi `/informacoes`, fallback legado de redirecionamento para `/mapa-site`, e não um artigo.
- O índice do blog e o catálogo possuem correspondência 34/34 no build.
- Os artigos de NR-10, NR-12 e NR-35 são mantidos como peças normativas específicas, sem transformar o blog em catálogo de garantias de treinamento.
- O artigo com slug legado `ppp-facil-o-ue...` não deve sofrer renomeação de URL sem plano de redirect e evidência de benefício.

