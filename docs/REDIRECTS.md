# Registro de redirecionamentos — AJN Astro

Última revisão: 2026-10-27.

## Redirecionamento aprovado

| Origem | Destino | Regra | Motivação |
|---|---|---|---|
| `/sitemap.xml` e `/sitemap.xml/` | `https://ajnengenharia.com.br/sitemap-index.xml` | HTTP 301 (permanente) | Compatibilidade do sitemap legado com o índice XML atualmente gerado pelo Astro. |
| `/informacoes` e `/informacoes/` | `/mapa-site` | HTTP 301 (permanente) | Evitar duplicação entre dois índices de links sem conteúdo próprio. |

- A página **Informações** não é mais uma rota de conteúdo: seu código, menu e itens do catálogo foram retirados.
- O arquivo **`public/.htaccess`** contém os redirecionamentos e é publicado em `dist/.htaccess`. Hospedagens Apache/LiteSpeed compatíveis devem responder com HTTP 301. O sitemap XML legado aponta diretamente para o índice atual `sitemap-index.xml`.
- O **Astro** define o mesmo redirecionamento em `astro.config.mjs`, criando uma alternativa de navegação por HTML caso o servidor ignore a regra Apache. **Um meta refresh não equivale a um HTTP 301**.
- A integração do sitemap XML exclui o endereço antigo; páginas de serviços, artigos e demais rotas continuam publicadas.
- Em homologação, **verificar no servidor real**: `curl -I https://sienna-mongoose-223157.hostingersite.com/informacoes`. O resultado esperado é `301` com `Location: /mapa-site`. Se a hospedagem não aplicar a diretiva, é preciso configurar o 301 no painel antes de considerar a migração finalizada.

## Histórico de triagem

A reauditoria anterior de 44 páginas comerciais marcou todas para **KEEP**. Nenhuma delas foi redirecionada nem removida nesta mudança. O alias `/ajn-projeto` do app Next.js arquivado continua fora do escopo.


## Remoção de serviços (2026-10)

Ver lista completa em [REMOCAO-SERVICOS-2026-10.md](./REMOCAO-SERVICOS-2026-10.md).

Resumo: **49** URLs de projetos elétricos, elevadores/escadas/plataformas, SPDA e cabeamento redirecionam com **HTTP 301** para `/servicos` via `public/.htaccess` (Hostinger) e, no preview Cloudflare, via `_redirects`. O `astro.config.mjs` espelha as mesmas regras como fallback HTML.
