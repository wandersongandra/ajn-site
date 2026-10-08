# AJN — Matriz editorial dos 20 artigos do Blog

Auditoria iniciada em **08/10/2026**. Repositório Astro: `wandersongandra/ajn-site`.
Este inventário separa **intenção de busca** de slug histórico. As URLs herdadas do WordPress permanecem estáveis até existir evidência suficiente de indexação/tráfego/links para qualquer consolidação.

## Diagnóstico

- 20 artigos no catálogo: 19 gerados pela coleção de conteúdo e 1 página legada individual.
- Grande concentração em LTCAT: várias abordagens são específicas (PPP, avaliações, orçamento, atualização, EPIs, múltiplos locais), mas ainda apresentam potencial de sobreposição.
- O Search Console foi reconectado em 08/10 e, no momento da auditoria, não disponibilizava histórico consolidado de impressões e cliques. **Zero retornado ≠ prova de zero tráfego.**
- Evitar fundir URLs ou impor `noindex` apenas porque dois títulos possuem LTCAT.
- Os 20 arquivos OG JPEG próprios já existem em `public/images/og`; o build passa a ter auditoria que verifica presença de cada imagem, publisher com logo e canonical do BlogPosting.
- Público alvo: gestores de SST, empresas contratantes, profissionais de engenharia e saúde ocupacional. Evitar promessa de aposentadoria, certificação, conformidade integral ou resultado em SEO.

## Mapa URL / intenção / ação

| Slug preservado | Ângulo editorial principal | Decisão |
| --- | --- | --- |
| `laudo-tecnico-das-condicoes-ambientais-de-trabalho-ltcat` | Página-pilar: o que é o LTCAT, assinatura, revisão e PPP | Manter e usar como ponto de entrada |
| `ltcat-papel-fundamental-na-seguranca-do-trabalho-e-no-bem-estar-dos-colaboradores` | Histórico de exposição e coerência com PPP | Manter; distinguir de introdução ao LTCAT |
| `orcamento-eficiente-para-ltcat-passos-essenciais-para-garantir-a-seguranca-no-trabalho` | Informações antes de pedir orçamento | Manter como busca de contratação |
| `ltcat-e-seguranca-do-trabalho-como-garantir-a-protecao-eficaz-da-sua-equipe` | Uso das informações ambientais na prevenção | Manter, reforçar diferença para PGR |
| `ltcat-e-seguranca-do-trabalho-como-proteger-sua-empresa-com-eficiencia` | LTCAT em unidades e turnos distintos | Manter se houver profundidade específica |
| `ltcat-guia-essencial-para-garantir-a-seguranca-no-ambiente-de-trabalho` | Preparação de levantamento para LTCAT | Manter como guia operacional |
| `ltcat-na-seguranca-do-trabalho-fortaleca-a-protecao-dos-seus-funcionarios-eficazmente` | EPC, EPI e evidências de efetividade | Manter como subtópico técnico |
| `seguranca-do-trabalho-e-ltcat-conformidade-e-protecao-previdenciaria` | LTCAT e conformidade previdenciária | Revisar sobreposição com pilar e PPP quando houver GSC |
| `ltcat-guia-essencial-para-garantir-seguranca-do-trabalho-eficaz` | Situações em que LTCAT precisa ser atualizado | Manter como dúvida específica |
| `ltcat-essencial-para-a-seguranca-do-trabalho-e-protecao-da-sua-equipe` | Agentes físicos, químicos e biológicos | Manter se diferenciado por agentes |
| `ltcat-na-seguranca-do-trabalho-garantindo-protecao-e-reducao-de-riscos-para-sua-equipe` | Consistência entre LTCAT, PGR e PPP | Revisar sobreposição com artigos de integração |
| `a-importancia-do-ltcat-para-a-seguranca-do-trabalho-e-a-protecao-do-ambiente-profissional` | Finalidade do LTCAT, diferenças para outros programas | Revisar como candidato a consolidação futura, sem redirecionar hoje |
| `o-fim-do-ppra-e-a-chegada-do-pgr-o-que-mudou` | Diferença PPRA x PGR e NR-1 atual | Manter com vigilância da norma |
| `laudo-de-gerenciamento-de-riscos-essencial-para-garantir-a-seguranca-no-ambiente-de-trabalho` | Página-pilar: conceito, inventário e plano de ação do PGR | Manter como início de leitura |
| `elaboracao-de-pgr-e-pcmso-conformidade-e-seguranca-no-trabalho` | Integração do PGR com PCMSO | Manter e ligar a ambas as páginas de serviço |
| `seguranca-do-trabalho-e-pcmso-gestao-da-saude-ocupacional` | Página-pilar: PCMSO/NR-7 e ASO | Manter como início de leitura |
| `ppp-facil-o-ue-e-como-consultar-e-sua-importancia` | Como consultar PPP no Meu INSS | Manter como guia para trabalhador |
| `perfil-profissiografico-previdenciario-ppp` | Conteúdo, histórico e regime eletrônico do PPP | Manter; diferenciar do tutorial anterior |
| `nr-35-trabalho-em-altura-e-seguranca` | Trabalho em altura, cuidados, capacitação e resgate | Manter; revisar normas quando atualizadas |
| `um-pouco-sobre-nos` | Apresentação institucional e serviços AJN | Revisar duplicação com `/sobre-nos/`, sem redirecionar automaticamente |

## Mudanças técnicas desta rodada

1. Dar destaque no início do Blog a três leituras básicas — LTCAT, PGR e PCMSO — sem interromper os filtros e os 20 cards de artigos.
2. Ajustar `BlogPosting.author`, `publisher` e `mainEntityOfPage` para referir corretamente a organização já existente no schema e manter URL final com barra.
3. Reforçar `audit-blog.mjs` para testar, em **todos os 20 HTML gerados**, a imagem OG existente, o publisher com logo e a coerência do URL principal.
4. Manter imagens puramente decorativas com `alt=""` em vez de preencher palavras-chave indiscriminadamente.

## Próximas decisões dependem dos dados

- Ler no GSC consultas × páginas × impressões × posição após tempo suficiente de rastreamento.
- Priorizar revisão manual dos quatro artigos potencialmente sobrepostos acima, incluindo atualização técnica e diferenciação real de intenção.
- Conferir backlinks e páginas de referência antes de implementar 301; preservar relações e histórico de URLs quando apropriado.
- Medir Core Web Vitals em celular (CrUX indisponível por falta de chave, não afirmar métricas).
- Reavaliar a presença da AJN para buscas locais de Belo Horizonte e termos de serviços, sem multiplicar páginas por cidade indevidamente.

**Gate de publicação:** passar `npm run check`, build, testes da CI, `audit-blog`, checagem de indexação e verificação real de artigos após a Hostinger atualizar o deploy. Não alterar nameservers, MX, SPF, DKIM, DMARC, caixas de e-mail nem WordPress.
