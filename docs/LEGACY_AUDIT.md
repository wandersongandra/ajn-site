# Auditoria do legado AJN

Status geral: `WARN`

## Resultado principal

Existem três referências locais diferentes e elas não são equivalentes:

1. `u635272896.../public_html`: snapshot WordPress antigo já auditado.
2. `ajnengenharia.com.br/public_html`: cópia WordPress adicionada agora, com 15.020 arquivos, WordPress `7.1.2`, Hello Elementor `3.4.5`, Elementor `3.34.1` e biblioteca de uploads extensa.
3. `https://www.ajnengenharia.com.br/`: publicação observada no navegador/HTTP, com layout Poppins verde, 143 URLs no sitemap, header de contato e estrutura de site diferente do CSS Elementor preto/amarelo encontrado nas cópias locais.

Para a reconstrução visual, a publicação atual é a referência principal (`CONFIRMED`). As cópias WordPress permanecem fontes de auditoria e não foram alteradas.

## FASE 0 — segurança

- `PASS`: raiz protegida com `.gitignore` para `ajnengenharia.com.br/`, snapshots, SQL, `wp-config.php`, `.env`, chaves, logs, caches, uploads e backups.
- `CONFIRMED`: a nova cópia contém `wp-config.php`, `create_autologin_*.php`, `wordfence-waf.php`, `wp-content/wflogs`, cache WPForms e arquivos de chave. Valores não foram exibidos; quando necessário, usar `[REDACTED]`.
- `CONFIRMED`: a nova cópia não contém dump de banco do site; os sete `.sql` encontrados são schemas internos do LiteSpeed.
- `PASS`: nenhum arquivo WordPress, upload, SQL, produção, DNS ou domínio foi alterado.
- `HIGH`: o perímetro contém material que deve permanecer fora do Git. Se houve compartilhamento externo, credenciais e tokens devem ser rotacionados pelo responsável; a rotação não foi executada.

## Plataforma e plugins instalados

WordPress local `7.1.2`; temas instalados: Hello Elementor `3.4.5`, Twenty Twenty-One/Two/Three/Four/Five. Não foi encontrado child theme.

Diretórios de plugins encontrados: Complianz `7.4.4.2`, Creame WhatsApp Me `6.0.8`, Elementor `3.34.1`, ElementsKit Lite `3.7.8`, Google Site Kit `1.170.0`, Happy Elementor Addons `3.20.4`, Hostinger `3.0.55`, Hostinger Easy Onboarding `2.0.94`, LiteSpeed Cache `7.6.2`, PRO Elements e Wordfence `8.1.3`.

O status ativo de cada plugin não pode ser confirmado pela cópia de arquivos sem o banco correspondente. O snapshot SQL antigo registrava a combinação Elementor/PRO Elements/ElementsKit/Happy Addons/Complianz/WhatsApp/Site Kit/Hostinger/LiteSpeed/Wordfence; isso não deve ser promovido automaticamente para o estado atual.

## Elementor e conteúdo local

- `CONFIRMED`: a nova cópia contém CSS Elementor para `post-16.css`, `post-113.css`, `post-253.css` e `post-261.css`.
- `CONFIRMED`: `post-16.css` descreve o layout legado Montserrat/preto/amarelo.
- `CONFIRMED`: esse layout não corresponde à publicação pública observada, que usa Poppins, verde `#576B43`/`#728A58`, header superior e componentes de QSSMA.
- `WARN`: o banco que alimentaria `_elementor_data` da nova cópia não foi entregue junto dela. Não é seguro presumir que o SQL antigo represente a publicação atual.

## Formulários e leads

- `CONFIRMED`: há `wp-content/uploads/wpforms/cache/email-summaries.json` na cópia atual; isso é resíduo/cache e não prova submissions migráveis.
- `CONFIRMED`: a publicação atual carrega reCAPTCHA em páginas públicas.
- `NÃO VERIFICADO`: plugin/formulário ativo, campos, destino SMTP/webhook, consentimento, retenção e leads históricos.
- `BLOCKED`: não há base autorizada para copiar PII ou construir `/admin/leads` com dados reais. Nenhuma informação pessoal foi reproduzida.

## Assets

- Cópia WordPress atual: 226 JPG, 22 WebP e 34 GIF em uploads, além de CSS/PDF/JSON e artefatos de plugins.
- Publicação atual: 44 assets públicos identificados na home e baixados apenas para `new-site/public/assets/ajn-live/` (logo, hero, clientes, serviços, portfólio, ícones, popup e imagens institucionais).
- `PASS`: nada foi apagado do legado.
- `PASS`: crawler read-only percorreu as 143 URLs do sitemap, extraiu o corpo editorial e encontrou 429 referências de imagens; os arquivos foram copiados para `new-site/public/assets/ajn-live/content` sem remover nada do legado.
- `WARN`: duplicidade, alt text e uso visual por rota ainda requerem revisão antes de qualquer limpeza de assets.

## Riscos arquiteturais

| Severidade | Finding | Evidência | Resposta |
|---|---|---|---|
| HIGH | Referências locais e publicação divergentes | CSS local preto/amarelo versus publicação verde/Poppins | usar publicação para fidelidade; manter cópias para auditoria |
| HIGH | Segredos/cache no backup | `wp-config.php`, autologin, WAF, wflogs, WPForms cache | `.gitignore`, não abrir valores, não copiar para app |
| HIGH | Leads não comprovados | cache WPForms sem banco atual | revisar fonte operacional antes de migrar |
| MEDIUM | SEO com grande superfície | sitemap público com 143 URLs | preservar rotas e metadata extraídos |
| MEDIUM | Conteúdo em fonte não versionável | WP/Elementor e/ou CMS público | conteúdo tipado no novo app, sem executar Elementor |
| LOW | Bugs do legado | erro Slick `initADA` observado na home publicada | não reproduzir dependência; validar comportamento novo |

## Status

- `PASS`: isolamento, proteção Git, inspeção read-only, plugin/tema/assets locais, sitemap público, tokens visuais e shell inicial do novo app.
- `WARN`: formulário/leads, banco correspondente à cópia atual, SEO completo por página e comparação visual página a página.
- `PASS`: conteúdo público do sitemap foi incorporado ao novo app em arquivos locais sanitizados; scripts, estilos, formulários e atributos de evento não foram copiados.
- `FAIL`: nenhuma falha de build/lint/typecheck atual; a divergência entre backup local e publicação impede declarar migração fiel concluída.
- `BLOCKED`: produção, DNS, deploy, SMTP real e acesso administrativo.
