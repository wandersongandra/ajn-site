# Revisão factual do blog AJN — 07/10/2026

## Escopo

Atualização editorial dos 20 artigos publicados em `/blog` (19 artigos tipados e um artigo independente), preservando slugs, rotas, datas de publicação, imagens e URLs canônicas. Data de atualização acrescentada ao conteúdo, à interface e ao JSON-LD BlogPosting.

## Critérios de revisão

- Separar **LTCAT** (caracterização previdenciária da exposição a agentes nocivos, Lei 8.213/1991, art. 58), **PGR** (NR-1, gestão de riscos), **PCMSO** (NR-7, acompanhamento médico) e **PPP** (histórico laboral previdenciário).
- Não afirmar que LTCAT concede aposentadoria, caracteriza automaticamente adicionais trabalhistas ou possui vencimento anual universal.
- Informar que o PPP eletrônico substitui o papel para períodos a partir de **01/01/2023** e deriva dos eventos de SST do eSocial.
- Informar que a nova NR-1 passou a vigorar em **26/05/2026**, explicitando fatores psicossociais relacionados ao trabalho; observar dispensas condicionais de elaboração do PGR.
- Atualizar NR-35 segundo alterações divulgadas pelo MTE em setembro de 2026, especialmente capacitações presenciais, mudanças em escadas e regras de transição.
- Não presumir credenciais profissionais, prazos de validade, preços, volume de atuação ou conquistas comerciais da AJN.
- Trocar blocos repetidos e títulos sensacionalistas por guias com escopos específicos.
- Substituir tags antigas e irrelevantes por temas estritamente associados ao artigo.

## Fontes primárias consultadas

1. [Lei 8.213/1991 compilada, art. 58](https://www.planalto.gov.br/ccivil_03/leis/l8213compilado.htm)
2. [MTE — Programa de Gerenciamento de Riscos](https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/pgr)
3. [MTE — Norma Regulamentadora 1](https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/nr-1)
4. [MTE — Norma Regulamentadora 7](https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/nr-07-atualizada-2022.pdf/view)
5. [MTE — Norma Regulamentadora 35](https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/norma-regulamentadora-no-35-nr-35)
6. [MTE — Alterações da NR-35 em 2026](https://www.gov.br/trabalho-e-emprego/pt-br/noticias-e-conteudo/2026/setembro/trabalho-em-altura-veja-o-que-muda-nos-treinamentos-e-nas-escadas-fixas-verticais)
7. [eSocial — Disponibilização do PPP eletrônico](https://www.gov.br/esocial/pt-br/noticias/disponibilizacao-do-perfil-profissiografico-previdenciario-ppp-eletronico/)
8. [eSocial — Manual Web Geral, seção SST](https://www.gov.br/esocial/pt-br/empresas/manual-web-geral/manual-web-geral/)

## Limites e revisão futura

Revisão documental baseada em fontes públicas, **não substitui a validação e a responsabilidade de profissional legalmente habilitado em caso concreto**. Reexaminar informações normativas quando houver atualizações oficiais. O artigo institucional mantém apenas descrições de serviços já mencionados em seu conteúdo original, sem novas afirmações verificáveis sobre porte, tempo de mercado ou credenciais. As imagens/legendas do acervo legado e a qualidade técnica dos exemplos fotográficos exigem conferência humana.

## Regressão automática

O teste `node scripts/audit-blog.mjs` após `npm run build` verifica 20 cards, 20 páginas, descrições completas/não duplicadas, imagens responsivas, data de revisão no BlogPosting e vínculo com fontes oficiais em artigos técnicos.
