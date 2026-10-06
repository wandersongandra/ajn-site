# Auditoria de rotas

Data da auditoria inicial: 2026-10-06
Reauditoria Fase 3: 2026-10-06

## Resultado

Foram reavaliadas as **143 URLs do sitemap público**. A classificação não
transforma automaticamente toda URL encontrada em conteúdo aprovado: foram
considerados conteúdo real, intenção de busca, estrutura, duplicidade, páginas
técnicas e necessidade de decisão humana.

| Status final | Quantidade |
|---|---:|
| KEEP | 141 |
| REDIRECT | 0 |
| REMOVE | 0 |
| REVIEW | 2 |

As 142 URLs restantes após a Home correspondem a 140 `KEEP` e 2 `REVIEW`
(`/contato` e `/mapa-site`). A Home permanece `KEEP`.

## Critérios e evidências da reauditoria

- 143 arquivos editoriais públicos analisados contra o manifest recuperado.
- 0 grupos de texto exatamente duplicado.
- 1 par semanticamente próximo detectado por similaridade lexical:
  `/elevador-bh` e `/escada-rolante-bh`; os equipamentos e intenções são
  diferentes, portanto não há base para redirect automático.
- 2 páginas com conteúdo editorial muito curto: `/contato` e `/mapa-site`.
  Ambas precisam de revisão de objetivo, mas não devem ser removidas apenas por
  tamanho.
- Nenhum anexo WordPress, página de mídia, taxonomia, paginação ou extensão de
  arquivo foi encontrado no sitemap público auditado.
- As páginas de serviço com texto enxuto permanecem `KEEP` quando representam
  um serviço distinto; a qualidade editorial fica como revisão de conteúdo,
  não como remoção automática.

## Decisão de rota versus funcionamento

| URL | route_decision | functional_status | Motivo |
|---|---|---|---|
| `/contato` | KEEP | NEEDS_USER_DECISION | Rota pública válida; campos, anexos, anti-spam e destino do formulário não foram comprovados. |
| `/mapa-site` | REVIEW | NOT_APPLICABLE | Página técnica com links, pouco conteúdo editorial e necessidade de confirmar seu papel na estratégia SEO. |
| Demais 141 URLs do sitemap | KEEP | NOT_APPLICABLE | Conteúdo público distinto ou intenção específica; sem evidência suficiente para redirect/removal. |

| Status | Quantidade |
|---|---:|
| KEEP | 141 |
| REDIRECT | 0 |
| REMOVE | 0 |
| REVIEW | 2 |

### Achados objetivos

- Anexos WordPress, páginas de mídia, taxonomias e extensões de arquivo não aparecem no sitemap auditado.
- Foram encontrados **0 grupos de conteúdo textual exatamente duplicado**, envolvendo **0 URLs**. Essas URLs permanecem REVIEW; não foram removidas.
- A comparação lexical encontrou **0 pares com similaridade igual ou superior a 78%**; eles aparecem abaixo para revisão editorial, pois similaridade não prova duplicação intencional.
- O sitemap não fornece histórico de tráfego, backlinks ou conversões. Portanto, não é possível declarar REMOVE com segurança apenas pelo crawler.
- O novo app também possui rotas fora do sitemap que exigem decisão explícita:

| URL | Classificação | Motivo |
|---|---|---|
| /ajn-projeto | REDIRECT | alias local fora do sitemap atual e duplicata da homepage no novo app |
| /politica-de-privacidade | REVIEW | rota local fora do sitemap público observado; requer decisão jurídica/SEO |
| /termos-de-uso | REVIEW | rota local fora do sitemap público observado; requer decisão jurídica/SEO |
| /api/contact | REVIEW | Route Handler, não é URL editorial pública |

## Grupos de conteúdo duplicado

Nenhum grupo exato encontrado.

## Possíveis duplicatas semânticas

Nenhum par acima do limiar lexical.

## Inventário completo

| URL | Template | Classificação | Texto (caracteres) | Evidência |
|---|---|---|---:|---|
| / | HOME | KEEP | 4239 | URL pública presente no sitemap e com conteúdo não vazio |
| /empresa-elevador-belo-horizonte | MARKETING_DETAIL | KEEP | 4512 | URL pública presente no sitemap e com conteúdo não vazio |
| /projeto-eletrico-industrial-preco | MARKETING_DETAIL | KEEP | 2703 | URL pública presente no sitemap e com conteúdo não vazio |
| /consultoria-da-qualidade | MARKETING_DETAIL | KEEP | 5132 | URL pública presente no sitemap e com conteúdo não vazio |
| /blog/laudo-tecnico-das-condicoes-ambientais-de-trabalho-ltcat | BLOG_ARTICLE | KEEP | 6228 | URL pública presente no sitemap e com conteúdo não vazio |
| /elaboracao-pgr-pcmso | MARKETING_DETAIL | KEEP | 4924 | URL pública presente no sitemap e com conteúdo não vazio |
| /pericias-insalubridade-periculosidade | MARKETING_DETAIL | KEEP | 3789 | URL pública presente no sitemap e com conteúdo não vazio |
| /empresa-que-elabora-pgr | MARKETING_DETAIL | KEEP | 2152 | URL pública presente no sitemap e com conteúdo não vazio |
| /projeto-instalacao-eletrica-residencial | MARKETING_DETAIL | KEEP | 2868 | URL pública presente no sitemap e com conteúdo não vazio |
| /projeto-seguranca-incendio | MARKETING_DETAIL | KEEP | 4234 | URL pública presente no sitemap e com conteúdo não vazio |
| /instalacao-predial-eletrica | MARKETING_DETAIL | KEEP | 2974 | URL pública presente no sitemap e com conteúdo não vazio |
| /projeto-eletrico-residencial-belo-horizonte | MARKETING_DETAIL | KEEP | 2844 | URL pública presente no sitemap e com conteúdo não vazio |
| /empresa-ltcat | MARKETING_DETAIL | KEEP | 2534 | URL pública presente no sitemap e com conteúdo não vazio |
| /inspecoes-seguranca-do-trabalho | MARKETING_DETAIL | KEEP | 4646 | URL pública presente no sitemap e com conteúdo não vazio |
| /pcmso-preco | MARKETING_DETAIL | KEEP | 4078 | URL pública presente no sitemap e com conteúdo não vazio |
| /laudos-seguranca-do-trabalho | MARKETING_DETAIL | KEEP | 4147 | URL pública presente no sitemap e com conteúdo não vazio |
| /projeto-eletrico-industrial-belo-horizonte | MARKETING_DETAIL | KEEP | 2444 | URL pública presente no sitemap e com conteúdo não vazio |
| /plataforma-acessibilidade | MARKETING_DETAIL | KEEP | 2183 | URL pública presente no sitemap e com conteúdo não vazio |
| /projeto-eletrico-residencial-orcamento | MARKETING_DETAIL | KEEP | 3424 | URL pública presente no sitemap e com conteúdo não vazio |
| /laudo-ltcat-insalubridade | MARKETING_DETAIL | KEEP | 2642 | URL pública presente no sitemap e com conteúdo não vazio |
| /empresa-escada-rolante | MARKETING_DETAIL | KEEP | 3061 | URL pública presente no sitemap e com conteúdo não vazio |
| /projeto-sistema-combate-incendio | MARKETING_DETAIL | KEEP | 2314 | URL pública presente no sitemap e com conteúdo não vazio |
| /blog/ltcat-papel-fundamental-na-seguranca-do-trabalho-e-no-bem-estar-dos-colaboradores | BLOG_ARTICLE | KEEP | 16104 | URL pública presente no sitemap e com conteúdo não vazio |
| /projeto-combate-incendio-preco | MARKETING_DETAIL | KEEP | 3710 | URL pública presente no sitemap e com conteúdo não vazio |
| /projeto-prevencao-incendio-panico | MARKETING_DETAIL | KEEP | 2690 | URL pública presente no sitemap e com conteúdo não vazio |
| /projeto-eletrico-residencial-completo | MARKETING_DETAIL | KEEP | 2523 | URL pública presente no sitemap e com conteúdo não vazio |
| /analise-projetos-eletricos-bh | MARKETING_DETAIL | KEEP | 2270 | URL pública presente no sitemap e com conteúdo não vazio |
| /blog/orcamento-eficiente-para-ltcat-passos-essenciais-para-garantir-a-seguranca-no-trabalho | BLOG_ARTICLE | KEEP | 15799 | URL pública presente no sitemap e com conteúdo não vazio |
| /empresa-projeto-eletrico-bh | MARKETING_DETAIL | KEEP | 2497 | URL pública presente no sitemap e com conteúdo não vazio |
| /projeto-eletrico-comercial | MARKETING_DETAIL | KEEP | 2816 | URL pública presente no sitemap e com conteúdo não vazio |
| /empresa-que-faz-ltcat | MARKETING_DETAIL | KEEP | 2945 | URL pública presente no sitemap e com conteúdo não vazio |
| /blog/ltcat-e-seguranca-do-trabalho-como-garantir-a-protecao-eficaz-da-sua-equipe | BLOG_ARTICLE | KEEP | 17806 | URL pública presente no sitemap e com conteúdo não vazio |
| /empresas-elevadores-bh | MARKETING_DETAIL | KEEP | 4357 | URL pública presente no sitemap e com conteúdo não vazio |
| /contato | CONTACT | KEEP | 194 | rota pública válida; funcionalidade do formulário separada como NEEDS_USER_DECISION |
| /projeto-sistema-incendio | MARKETING_DETAIL | KEEP | 2153 | URL pública presente no sitemap e com conteúdo não vazio |
| /blog/ltcat-e-seguranca-do-trabalho-como-proteger-sua-empresa-com-eficiencia | BLOG_ARTICLE | KEEP | 16441 | URL pública presente no sitemap e com conteúdo não vazio |
| /projeto-eletrico | MARKETING_DETAIL | KEEP | 3029 | URL pública presente no sitemap e com conteúdo não vazio |
| /combate-incendio-belo-horizonte | MARKETING_DETAIL | KEEP | 2698 | URL pública presente no sitemap e com conteúdo não vazio |
| /projetos-engenharia-eletrica | MARKETING_DETAIL | KEEP | 3088 | URL pública presente no sitemap e com conteúdo não vazio |
| /instalacoes-eletricas-projeto | MARKETING_DETAIL | KEEP | 2796 | URL pública presente no sitemap e com conteúdo não vazio |
| /escada-rolante | MARKETING_DETAIL | KEEP | 2461 | URL pública presente no sitemap e com conteúdo não vazio |
| /blog/o-fim-do-ppra-e-a-chegada-do-pgr-o-que-mudou | BLOG_ARTICLE | KEEP | 6410 | URL pública presente no sitemap e com conteúdo não vazio |
| /projetos-eletricos-orcamento | MARKETING_DETAIL | KEEP | 3064 | URL pública presente no sitemap e com conteúdo não vazio |
| /blog/ltcat-guia-essencial-para-garantir-a-seguranca-no-ambiente-de-trabalho | BLOG_ARTICLE | KEEP | 18301 | URL pública presente no sitemap e com conteúdo não vazio |
| /blog/ppp-facil-o-ue-e-como-consultar-e-sua-importancia | BLOG_ARTICLE | KEEP | 7162 | URL pública presente no sitemap e com conteúdo não vazio |
| /orcamento-projeto-combate-incendio | MARKETING_DETAIL | KEEP | 2222 | URL pública presente no sitemap e com conteúdo não vazio |
| /escada-rolante-belo-horizonte | MARKETING_DETAIL | KEEP | 2882 | URL pública presente no sitemap e com conteúdo não vazio |
| /valor-projeto-incendio | MARKETING_DETAIL | KEEP | 4643 | URL pública presente no sitemap e com conteúdo não vazio |
| /plataforma-elevatoria | MARKETING_DETAIL | KEEP | 3011 | URL pública presente no sitemap e com conteúdo não vazio |
| /ltcat-evento-esocial | MARKETING_DETAIL | KEEP | 2816 | URL pública presente no sitemap e com conteúdo não vazio |
| /projeto-prevencao-combate-incendio | MARKETING_DETAIL | KEEP | 4515 | URL pública presente no sitemap e com conteúdo não vazio |
| /elaboracao-do-pgr-pcmso | MARKETING_DETAIL | KEEP | 2679 | URL pública presente no sitemap e com conteúdo não vazio |
| /projetos-instalacoes-eletricas-prediais | MARKETING_DETAIL | KEEP | 3151 | URL pública presente no sitemap e com conteúdo não vazio |
| /ltcat-preco | MARKETING_DETAIL | KEEP | 3031 | URL pública presente no sitemap e com conteúdo não vazio |
| /blog/seguranca-do-trabalho-e-pcmso-gestao-da-saude-ocupacional | BLOG_ARTICLE | KEEP | 15220 | URL pública presente no sitemap e com conteúdo não vazio |
| /empresa-combate-incendio-bh | MARKETING_DETAIL | KEEP | 4585 | URL pública presente no sitemap e com conteúdo não vazio |
| /servicos/gestao-ambiental | SERVICE_DETAIL | KEEP | 2186 | URL pública presente no sitemap e com conteúdo não vazio |
| /blog/a-importancia-do-ltcat-para-a-seguranca-do-trabalho-e-a-protecao-do-ambiente-profissional | BLOG_ARTICLE | KEEP | 16862 | URL pública presente no sitemap e com conteúdo não vazio |
| /servicos/projetos-de-combate-a-incendio-e-panico-ppcip | SERVICE_DETAIL | KEEP | 980 | URL pública presente no sitemap e com conteúdo não vazio |
| /consultoria-seguranca-saude-no-trabalho | MARKETING_DETAIL | KEEP | 4649 | URL pública presente no sitemap e com conteúdo não vazio |
| /servico-projeto-eletrico | MARKETING_DETAIL | KEEP | 2477 | URL pública presente no sitemap e com conteúdo não vazio |
| /servicos/assessoria-e-consultoria-em-saude-ocupacional | SERVICE_DETAIL | KEEP | 789 | URL pública presente no sitemap e com conteúdo não vazio |
| /orcamento-pgr | MARKETING_DETAIL | KEEP | 2630 | URL pública presente no sitemap e com conteúdo não vazio |
| /blog/laudo-de-gerenciamento-de-riscos-essencial-para-garantir-a-seguranca-no-ambiente-de-trabalho | BLOG_ARTICLE | KEEP | 16871 | URL pública presente no sitemap e com conteúdo não vazio |
| /pcmso-programa-controle-medico-saude-ocupacional | MARKETING_DETAIL | KEEP | 4412 | URL pública presente no sitemap e com conteúdo não vazio |
| /ltcat-renovacao | MARKETING_DETAIL | KEEP | 3049 | URL pública presente no sitemap e com conteúdo não vazio |
| /ltcat-orcamento | MARKETING_DETAIL | KEEP | 3271 | URL pública presente no sitemap e com conteúdo não vazio |
| /blog/ltcat-na-seguranca-do-trabalho-fortaleca-a-protecao-dos-seus-funcionarios-eficazmente | BLOG_ARTICLE | KEEP | 16283 | URL pública presente no sitemap e com conteúdo não vazio |
| /empresas-manutencao-elevadores-bh | MARKETING_DETAIL | KEEP | 3336 | URL pública presente no sitemap e com conteúdo não vazio |
| /emissao-laudos | MARKETING_DETAIL | KEEP | 3395 | URL pública presente no sitemap e com conteúdo não vazio |
| /orcamento-projeto-eletrico | MARKETING_DETAIL | KEEP | 2765 | URL pública presente no sitemap e com conteúdo não vazio |
| /empresa-elevador | MARKETING_DETAIL | KEEP | 3205 | URL pública presente no sitemap e com conteúdo não vazio |
| /blog/seguranca-do-trabalho-e-ltcat-conformidade-e-protecao-previdenciaria | BLOG_ARTICLE | KEEP | 17840 | URL pública presente no sitemap e com conteúdo não vazio |
| /empresa-combate-incendio | MARKETING_DETAIL | KEEP | 2641 | URL pública presente no sitemap e com conteúdo não vazio |
| /projeto-combate-incendio-panico | MARKETING_DETAIL | KEEP | 4643 | URL pública presente no sitemap e com conteúdo não vazio |
| /empresa-que-faz-pgr | MARKETING_DETAIL | KEEP | 2354 | URL pública presente no sitemap e com conteúdo não vazio |
| /servicos | SERVICES_INDEX | KEEP | 1863 | URL pública presente no sitemap e com conteúdo não vazio |
| /projeto-eletrico-bh | MARKETING_DETAIL | KEEP | 2894 | URL pública presente no sitemap e com conteúdo não vazio |
| /seguranca-do-trabalho-ltcat | MARKETING_DETAIL | KEEP | 3787 | URL pública presente no sitemap e com conteúdo não vazio |
| /orcamento-ltcat | MARKETING_DETAIL | KEEP | 2822 | URL pública presente no sitemap e com conteúdo não vazio |
| /consultoria-pcmso | MARKETING_DETAIL | KEEP | 2308 | URL pública presente no sitemap e com conteúdo não vazio |
| /projeto-eletrico-industrial | MARKETING_DETAIL | KEEP | 2720 | URL pública presente no sitemap e com conteúdo não vazio |
| /elevacao-vertical | MARKETING_DETAIL | KEEP | 2394 | URL pública presente no sitemap e com conteúdo não vazio |
| /projeto-incendio | MARKETING_DETAIL | KEEP | 3521 | URL pública presente no sitemap e com conteúdo não vazio |
| /consultoria-seguranca-do-trabalho | MARKETING_DETAIL | KEEP | 4548 | URL pública presente no sitemap e com conteúdo não vazio |
| /elaboracao-projeto-combate-incendio | MARKETING_DETAIL | KEEP | 3480 | URL pública presente no sitemap e com conteúdo não vazio |
| /projetos-eletricos-prediais | MARKETING_DETAIL | KEEP | 2523 | URL pública presente no sitemap e com conteúdo não vazio |
| /servicos/gestao-da-qualidade | SERVICE_DETAIL | KEEP | 1557 | URL pública presente no sitemap e com conteúdo não vazio |
| /preco-projetos-eletricos | MARKETING_DETAIL | KEEP | 2657 | URL pública presente no sitemap e com conteúdo não vazio |
| /projeto-eletrico-preco | MARKETING_DETAIL | KEEP | 2405 | URL pública presente no sitemap e com conteúdo não vazio |
| /projeto-seguranca-incendio-panico | MARKETING_DETAIL | KEEP | 2811 | URL pública presente no sitemap e com conteúdo não vazio |
| /projeto-eletrico-belo-horizonte | MARKETING_DETAIL | KEEP | 2210 | URL pública presente no sitemap e com conteúdo não vazio |
| /valor-elaboracao-pgr | MARKETING_DETAIL | KEEP | 2576 | URL pública presente no sitemap e com conteúdo não vazio |
| /projeto-protecao-incendio | MARKETING_DETAIL | KEEP | 3581 | URL pública presente no sitemap e com conteúdo não vazio |
| /plataforma-elevatoria-belo-horizonte | MARKETING_DETAIL | KEEP | 2418 | URL pública presente no sitemap e com conteúdo não vazio |
| /blog/ltcat-guia-essencial-para-garantir-seguranca-do-trabalho-eficaz | BLOG_ARTICLE | KEEP | 18111 | URL pública presente no sitemap e com conteúdo não vazio |
| /elaboracao-pcmso | MARKETING_DETAIL | KEEP | 3197 | URL pública presente no sitemap e com conteúdo não vazio |
| /empresa-que-faz-pcmso | MARKETING_DETAIL | KEEP | 4111 | URL pública presente no sitemap e com conteúdo não vazio |
| /laudos-seguranca-do-trabalho-esocial | MARKETING_DETAIL | KEEP | 2901 | URL pública presente no sitemap e com conteúdo não vazio |
| /projeto-protecao-incendio-panico | MARKETING_DETAIL | KEEP | 2451 | URL pública presente no sitemap e com conteúdo não vazio |
| /seguranca-do-trabalho-pcmso | MARKETING_DETAIL | KEEP | 4264 | URL pública presente no sitemap e com conteúdo não vazio |
| /empresa-projeto-eletrico | MARKETING_DETAIL | KEEP | 3187 | URL pública presente no sitemap e com conteúdo não vazio |
| /elevador-bh | MARKETING_DETAIL | KEEP | 4259 | URL pública presente no sitemap e com conteúdo não vazio |
| /manutencao-elevadores-belo-horizonte | MARKETING_DETAIL | KEEP | 2765 | URL pública presente no sitemap e com conteúdo não vazio |
| /blog/um-pouco-sobre-nos | BLOG_ARTICLE | KEEP | 9155 | URL pública presente no sitemap e com conteúdo não vazio |
| /empresa-pcmso | MARKETING_DETAIL | KEEP | 3511 | URL pública presente no sitemap e com conteúdo não vazio |
| /servicos/pericias-em-periculosidade-e-insalubridade | SERVICE_DETAIL | KEEP | 1238 | URL pública presente no sitemap e com conteúdo não vazio |
| /projeto-eletrico-residencial | MARKETING_DETAIL | KEEP | 2422 | URL pública presente no sitemap e com conteúdo não vazio |
| /inspecao-seguranca-saude-no-ambiente-trabalho | MARKETING_DETAIL | KEEP | 2918 | URL pública presente no sitemap e com conteúdo não vazio |
| /blog | BLOG_INDEX | KEEP | 7011 | URL pública presente no sitemap e com conteúdo não vazio |
| /servicos-pcmso | MARKETING_DETAIL | KEEP | 3072 | URL pública presente no sitemap e com conteúdo não vazio |
| /blog/perfil-profissiografico-previdenciario-ppp | BLOG_ARTICLE | KEEP | 8643 | URL pública presente no sitemap e com conteúdo não vazio |
| /elaboracao-pgr | MARKETING_DETAIL | KEEP | 4266 | URL pública presente no sitemap e com conteúdo não vazio |
| /blog/nr-35-trabalho-em-altura-e-seguranca | BLOG_ARTICLE | KEEP | 7668 | URL pública presente no sitemap e com conteúdo não vazio |
| /plataforma-acessibilidade-bh | MARKETING_DETAIL | KEEP | 3334 | URL pública presente no sitemap e com conteúdo não vazio |
| /blog/ltcat-na-seguranca-do-trabalho-garantindo-protecao-e-reducao-de-riscos-para-sua-equipe | BLOG_ARTICLE | KEEP | 17404 | URL pública presente no sitemap e com conteúdo não vazio |
| /manutencao-elevadores-bh | MARKETING_DETAIL | KEEP | 2663 | URL pública presente no sitemap e com conteúdo não vazio |
| /empresa-plataforma-elevatoria | MARKETING_DETAIL | KEEP | 2700 | URL pública presente no sitemap e com conteúdo não vazio |
| /valor-projeto-combate-incendio | MARKETING_DETAIL | KEEP | 2499 | URL pública presente no sitemap e com conteúdo não vazio |
| /projeto-deteccao-incendio | MARKETING_DETAIL | KEEP | 2116 | URL pública presente no sitemap e com conteúdo não vazio |
| /laudos-saude-seguranca-do-trabalho | MARKETING_DETAIL | KEEP | 2695 | URL pública presente no sitemap e com conteúdo não vazio |
| /orcamento-pcmso | MARKETING_DETAIL | KEEP | 2867 | URL pública presente no sitemap e com conteúdo não vazio |
| /servicos/gestao-do-e-social | SERVICE_DETAIL | KEEP | 1940 | URL pública presente no sitemap e com conteúdo não vazio |
| /mobilizacao-pessoal-equipamentos | MARKETING_DETAIL | KEEP | 2713 | URL pública presente no sitemap e com conteúdo não vazio |
| /mapa-site | INFORMATION_INDEX | REVIEW | 6656 | página técnica com conteúdo editorial reduzido; confirmar papel SEO/UX |
| /sistemas-incendio-bh | MARKETING_DETAIL | KEEP | 5189 | URL pública presente no sitemap e com conteúdo não vazio |
| /plataforma-elevatoria-preco | MARKETING_DETAIL | KEEP | 3644 | URL pública presente no sitemap e com conteúdo não vazio |
| /sobre-nos | INFORMATION_INDEX | KEEP | 1932 | URL pública presente no sitemap e com conteúdo não vazio |
| /blog/ltcat-essencial-para-a-seguranca-do-trabalho-e-protecao-da-sua-equipe | BLOG_ARTICLE | KEEP | 16703 | URL pública presente no sitemap e com conteúdo não vazio |
| /servicos/treinamento-de-nrs | SERVICE_DETAIL | KEEP | 1968 | URL pública presente no sitemap e com conteúdo não vazio |
| /valor-fazer-ltcat | MARKETING_DETAIL | KEEP | 3342 | URL pública presente no sitemap e com conteúdo não vazio |
| /plataforma-elevatoria-bh | MARKETING_DETAIL | KEEP | 2454 | URL pública presente no sitemap e com conteúdo não vazio |
| /blog/elaboracao-de-pgr-e-pcmso-conformidade-e-seguranca-no-trabalho | BLOG_ARTICLE | KEEP | 15878 | URL pública presente no sitemap e com conteúdo não vazio |
| /preco-pcmso | MARKETING_DETAIL | KEEP | 3997 | URL pública presente no sitemap e com conteúdo não vazio |
| /projeto-instalacoes-eletricas | MARKETING_DETAIL | KEEP | 2777 | URL pública presente no sitemap e com conteúdo não vazio |
| /servicos/regularizacao-de-imoveis-junto-ao-corpo-de-bombeiros | SERVICE_DETAIL | KEEP | 405 | URL pública presente no sitemap e com conteúdo não vazio |
| /laudo-pgr | MARKETING_DETAIL | KEEP | 3418 | URL pública presente no sitemap e com conteúdo não vazio |
| /informacoes | INFORMATION_INDEX | KEEP | 3213 | URL pública presente no sitemap e com conteúdo não vazio |
| /laudos-sst | MARKETING_DETAIL | KEEP | 2394 | URL pública presente no sitemap e com conteúdo não vazio |
| /servicos/pcmso-e-asos | SERVICE_DETAIL | KEEP | 2683 | URL pública presente no sitemap e com conteúdo não vazio |
| /plataforma-acessibilidade-preco | MARKETING_DETAIL | KEEP | 2633 | URL pública presente no sitemap e com conteúdo não vazio |
| /emissao-ltcat | MARKETING_DETAIL | KEEP | 2509 | URL pública presente no sitemap e com conteúdo não vazio |
| /escada-rolante-bh | MARKETING_DETAIL | KEEP | 4354 | URL pública presente no sitemap e com conteúdo não vazio |

## Limites da evidência

- KEEP significa manter a URL para preservar patrimônio SEO enquanto o conteúdo é validado; não significa aprovação editorial, legal ou de conversão.
- REDIRECT é recomendação para alias local do novo app, não uma alteração publicada.
- Nenhuma URL foi removida, redirecionada ou publicada durante esta auditoria.
