# Auditoria de segurança Git — Fase 2

Data: 2026-10-06
Escopo: somente `astro-site`; WordPress, snapshots e dumps ficaram fora do repositório.

| Verificação | Evidência | Status |
|---|---|---|
| Estado do Git | Repositório local sem commits e sem remote configurado | PASS |
| `.gitignore` | Protege `node_modules`, `dist`, `.astro`, `.env*`, SQL, dumps, backups, logs, caches e `.playwright-cli` | PASS |
| Secrets no código novo | Nenhum valor secreto encontrado; não há `.env` real | PASS |
| SQL, dumps e backups | Nenhum arquivo encontrado em `astro-site` | PASS |
| `wp-config.php` e arquivos WordPress | Nenhum arquivo encontrado em `astro-site` | PASS |
| Logs e artefatos locais | Existe log em `.playwright-cli/`, coberto pelo `.gitignore` | WARN |
| Arquivos anormalmente grandes | Nenhum arquivo versionável acima de 5 MB; imagens selecionadas totalizam aproximadamente 5,9 MB | PASS |
| Legado dentro do Astro | Não encontrado; o legado permanece em diretórios separados | PASS |
| Ações remotas | Push, commit, PR, deploy e DNS não foram executados | PASS |

## Limite

O scan de nomes e tamanhos não prova que um valor aparentemente não secreto não
seja sensível. A regra operacional permanece: não colocar credenciais, PII,
dumps ou backups no projeto Astro.
