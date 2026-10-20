# Fase 3 — Rodada 2: PPP, PCMSO e manutenção de elevadores

Data: 20/10/2026
Repositório: `wandersongandra/ajn-site`

## Critério de escolha

Google Search Console da AJN, período **8–17 de outubro de 2026**, consultado via Windsor.ai. Linhas por página agrupadas por **caminho**, ignorando variantes de domínio, protocolo e barra terminal. Impr./cliques são histórico anterior a esta PR, não uma previsão.

| Rota | Impressões | Cliques | CTR | Posição média ponderada por impressões |
| --- | ---: | ---: | ---: | ---: |
| `/blog/ppp-facil-o-ue-e-como-consultar-e-sua-importancia` | 157 | 0 | 0,00% | 13,8 |
| `/manutencao-elevadores-belo-horizonte` | 88 | 0 | 0,00% | 24,9 |
| `/preco-pcmso` | 66 | 1 | 1,52% | 13,5 |

## Alterações

1. **PPP eletrônico:** substitui título ambíguo “PPP Fácil” por título de consulta, apresenta etapas no Meu INSS, trata períodos desde janeiro de 2023, inconsistências, LTCAT/eSocial e aponta serviço oficial gov.br.
2. **Manutenção de elevadores em BH:** esclarece preventiva/corretiva, informações necessárias para definir orçamento e cuidados de segurança; retira garantias vagas, promessas de excelência e disponibilidade de serviços sem confirmação comercial.
3. **Preço de PCMSO:** explica fatores reais de composição de proposta sem preços inventados, diferencia elaboração, gestão, consultas e exames; direciona dados de escopo para contato sem solicitar informações clínicas individuais.
4. Preserva conteúdo técnico, links internos existentes e arquivos de imagem sem introduzir fotografias genéricas. Titles e metas de `/preco-pcmso` podem ser normalizados pelo `keyword-map` existente; verificar saída renderizada.

## Referências oficiais

- Serviço de emissão de PPP: https://www.gov.br/pt-br/servicos/emitir-ppp-eletronico-perfil-profissiografico-previdenciario
- Portal Meu INSS: https://www.gov.br/inss/pt-br/canais_atendimento/meu-inss/meu-inss
- PGR no MTE: https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/pgr
- NR-7: https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/nr-07-atualizada-2022.pdf

## Controle de publicação

- **Não altera slugs, canonical, sitemap, robots, redirects, GA4, hospedagem ou endpoints.**
- Nenhum preço, prazo, contrato, equipe ou disponibilidade é garantido sem aprovação comercial da AJN.
- Não há atualização de data de publicação original do blog; revisão editorial PPP: `updatedAt` 20/10/2026.
- Revisar manualmente autorização/direitos das imagens legadas; este lote não as substitui.

## Gates

- `npm ci`, `npm run check`, `npm run build`, `npm run validate`, `audit:seo`, `audit:editorial`, `audit:legal`, `audit:engineering`, browser smoke e auditorias de segurança via Actions.
- Confirmar conteúdo renderizado, H1, title/description, rota canônica e links em mobile/desktop.
- Exigir revisão comercial da AJN quanto ao escopo efetivamente oferecido em manutenção de elevadores e PCMSO.
- Acompanhar impressões, cliques, CTR e posições por **4–6 semanas**, segmentando consultas e dispositivo, sem prometer melhoria nem causalidade.
