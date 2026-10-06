# Auditoria de links — Família C

Data: 2026-10-06

A varredura base foi feita sobre os HTML estáticos gerados na Fase B. Nesta
rodada, os 12 links que estavam fora do catálogo foram comparados com:

- `src/content/route-catalog.ts`;
- `new-site-next-archive/public/live-content`;
- resposta HTTP HEAD no domínio público, sem autenticação e sem mutação.

## Resultado

| Medição | Resultado | Evidência |
|---|---:|---|
| HTML estáticos gerados antes da Família C | 18 | `npm run build` anterior |
| Imagens locais inexistentes no build anterior | 0 | varredura de `src`/`href` |
| Links internos únicos ainda não implementados | 137 | varredura do `dist` anterior |
| Links para as URLs catalogadas ainda pendentes | 125 | escopo deliberado da Fase C |
| Links fora do catálogo auditado | 12 | tabela abaixo |
| Links fora do catálogo com HTTP público 200 | 12 | HEAD em 2026-10-06 |

## Classificação dos 12 links

`LEGACY_URL` foi usado porque o destino é uma URL interna AJN que responde 200
publicamente, mas não existe no catálogo de 143 URLs nem possui conteúdo
recuperado no arquivo local. Isso não autoriza criar a página, remover a URL ou
redirecioná-la automaticamente.

| URL | Classificação | Catálogo 143 | Artefato local | HTTP | Ação |
|---|---|---|---|---:|---|
| `/blog/guia-completo-para-entender-e-implementar-o-programa-de-controle-medico-de-saude-ocupacional-com-eficiencia` | `LEGACY_URL` | Não | Não encontrado | 200 | Adicionar ao inventário e extrair conteúdo antes da expansão |
| `/blog/laudo-pgr-o-guia-completo-para-entender-e-aplicar` | `LEGACY_URL` | Não | Não encontrado | 200 | Adicionar ao inventário e extrair conteúdo antes da expansão |
| `/blog/laudos-de-saude-e-seguranca-do-trabalho-transforme-sua-empresa-hoje` | `LEGACY_URL` | Não | Não encontrado | 200 | Adicionar ao inventário e extrair conteúdo antes da expansão |
| `/blog/ltcat-evento-esocial-o-que-voce-precisa-saber-para-estar-atualizado` | `LEGACY_URL` | Não | Não encontrado | 200 | Adicionar ao inventário e extrair conteúdo antes da expansão |
| `/blog/ltcat-guia-completo-para-entender-a-emissao-e-sua-importancia-na-seguranca-do-trabalho` | `LEGACY_URL` | Não | Não encontrado | 200 | Adicionar ao inventário e extrair conteúdo antes da expansão |
| `/blog/ltcat-renovacao-guia-completo-para-facilitar-o-processo` | `LEGACY_URL` | Não | Não encontrado | 200 | Adicionar ao inventário e extrair conteúdo antes da expansão |
| `/blog/manutencao-de-elevadores-bh-evite-erros-comuns-e-garanta-seguranca` | `LEGACY_URL` | Não | Não encontrado | 200 | Adicionar ao inventário e extrair conteúdo antes da expansão |
| `/blog/pcmso-entenda-como-garantir-a-saude-ocupacional-e-a-seguranca-no-ambiente-de-trabalho` | `LEGACY_URL` | Não | Não encontrado | 200 | Adicionar ao inventário e extrair conteúdo antes da expansão |
| `/blog/projeto-de-protecao-contra-incendio-transforme-sua-seguranca-agora` | `LEGACY_URL` | Não | Não encontrado | 200 | Adicionar ao inventário e extrair conteúdo antes da expansão |
| `/blog/projeto-eletrico-comercial-transforme-sua-empresa-com-eficiencia-energetica` | `LEGACY_URL` | Não | Não encontrado | 200 | Adicionar ao inventário e extrair conteúdo antes da expansão |
| `/blog/tudo-o-que-voce-precisa-saber-sobre-consultoria-pcmso-para-seguranca-no-trabalho` | `LEGACY_URL` | Não | Não encontrado | 200 | Adicionar ao inventário e extrair conteúdo antes da expansão |
| `/servicos/projetos-eletricos-residenciais-comerciais-e-prediais-com-foco-em-qualidade-prazo-e-economia` | `LEGACY_URL` | Não | Não encontrado | 200 | Adicionar ao inventário e extrair conteúdo antes da expansão |

## Decisão

- Não há `EXTERNAL_VALID` ou `EXTERNAL_BROKEN`: os 12 destinos são internos.
- Não há `REDIRECT_CANDIDATE`: não foi demonstrado equivalente local ou destino
  canônico.
- Não há `ASSET` ou `ANCHOR` entre estes 12 destinos.
- Os 12 foram adicionados ao inventário documental em
  `docs/LEGACY_INVENTORY.md`; não foram adicionados ao catálogo de 143 nem
  implementados no Astro nesta etapa.
- A resposta 200 é evidência do estado público observado em 2026-10-06; ainda
  não é prova de que o conteúdo e o SEO dessas páginas estejam corretos.

