# Registro de redirecionamentos — AJN Astro

Última revisão: 2026-10-08.

## Redirecionamento aprovado

| Origem | Destino | Regra | Motivação |
|---|---|---|---|
| `/informacoes` e `/informacoes/` | `/mapa-site` | HTTP 301 (permanente) | Evitar duplicação entre dois índices de links sem conteúdo próprio. |

- A página **Informações** não é mais uma rota de conteúdo: seu código, menu e itens do catálogo foram retirados.
- O arquivo **`public/.htaccess`** contém `RedirectMatch 301 ^/informacoes/?$ /mapa-site` e é publicado em `dist/.htaccess`. Hospedagens Apache/LiteSpeed compatíveis devem responder com HTTP 301.
- O **Astro** define o mesmo redirecionamento em `astro.config.mjs`, criando uma alternativa de navegação por HTML caso o servidor ignore a regra Apache. **Um meta refresh não equivale a um HTTP 301**.
- A integração do sitemap XML exclui o endereço antigo; páginas de serviços, artigos e demais rotas continuam publicadas.
- Em homologação, **verificar no servidor real**: `curl -I https://sienna-mongoose-223157.hostingersite.com/informacoes`. O resultado esperado é `301` com `Location: /mapa-site`. Se a hospedagem não aplicar a diretiva, é preciso configurar o 301 no painel antes de considerar a migração finalizada.

## Histórico de triagem

A reauditoria anterior de 44 páginas comerciais marcou todas para **KEEP**. Nenhuma delas foi redirecionada nem removida nesta mudança. O alias `/ajn-projeto` do app Next.js arquivado continua fora do escopo.
