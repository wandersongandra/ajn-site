# Auditoria de links — Fase 3

Data: 2026-10-06

A varredura foi feita sobre os 18 HTML estáticos gerados em dist após o build.

| Medição | Resultado | Evidência |
|---|---:|---|
| HTML estáticos gerados | 18 | npm run build |
| Rotas locais resolvidas | 18 | arquivos index.html presentes |
| Imagens locais inexistentes | 0 | varredura de src/href no dist |
| Links internos únicos ainda não resolvidos | 137 | varredura do dist |
| Links para as 125 URLs auditadas ainda não implementadas | 125 | esperado nesta fase |
| Links locais fora do catálogo das 143 URLs | 12 | abaixo |

## Links fora do catálogo auditado

Esses destinos aparecem no conteúdo recuperado do índice de blog ou do catálogo
de serviços, mas não estão no conjunto de 143 URLs públicas auditadas. Eles
não foram promovidos automaticamente para novas páginas:

- /blog/guia-completo-para-entender-e-implementar-o-programa-de-controle-medico-de-saude-ocupacional-com-eficiencia
- /blog/laudo-pgr-o-guia-completo-para-entender-e-aplicar
- /blog/laudos-de-saude-e-seguranca-do-trabalho-transforme-sua-empresa-hoje
- /blog/ltcat-evento-esocial-o-que-voce-precisa-saber-para-estar-atualizado
- /blog/ltcat-guia-completo-para-entender-a-emissao-e-sua-importancia-na-seguranca-do-trabalho
- /blog/ltcat-renovacao-guia-completo-para-facilitar-o-processo
- /blog/manutencao-de-elevadores-bh-evite-erros-comuns-e-garanta-seguranca
- /blog/pcmso-entenda-como-garantir-a-saude-ocupacional-e-a-seguranca-no-ambiente-de-trabalho
- /blog/projeto-de-protecao-contra-incendio-transforme-sua-seguranca-agora
- /blog/projeto-eletrico-comercial-transforme-sua-empresa-com-eficiencia-energetica
- /blog/tudo-o-que-voce-precisa-saber-sobre-consultoria-pcmso-para-seguranca-no-trabalho
- /servicos/projetos-eletricos-residenciais-comerciais-e-prediais-com-foco-em-qualidade-prazo-e-economia

## Decisão

- Não há imagem local quebrada confirmada.
- Os 125 links do inventário principal permanecem pendentes por escopo
  deliberado, não são classificados como removidos.
- Os 12 links fora do catálogo precisam ser comparados ao sitemap atual antes
  de entrar na próxima família.
- Nenhum redirect foi criado automaticamente.

