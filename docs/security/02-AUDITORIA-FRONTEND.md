# Auditoria de segurança do frontend

**Data:** 2026-10-08 · **Escopo:** todos os arquivos Astro/TS/JS de `src/`, `public/scripts/` e scripts de auditoria.

## Resultado

**CONFIRMADO:** o site produz HTML estático. A busca do blog lê `q` e `tema` da URL e atualiza resultados por `textContent`; os filtros não interpretam HTML. O formulário só é emitido quando `PUBLIC_CONTACT_ENDPOINT` é HTTPS sem usuário/senha. Na produção observada, esse endpoint não está configurado e a página exibe alternativas WhatsApp/e-mail. Não há backend de formulário no repositório.

O JSON-LD inserido com `set:html` passa por `serializeJsonLd()` (`src/utils/site.ts`), que escapa `<`, `>`, `&`, U+2028 e U+2029. Os usos encontrados são schemas de organização, breadcrumbs e artigos.

## Achados

### AJN-SEC-003 — links editoriais sem restrição de esquema

- **Classificação:** CONFIRMADO · Baixa.
- **Evidência:** `contentLinkSegmentSchema` em `src/content.config.ts` antes da alteração aceitava `href: z.string().min(1)`; `ContentInline.astro` renderiza esse campo em `<a href>`.
- **Cenário:** alguém adiciona acidentalmente ou maliciosamente `javascript:`/`data:` em conteúdo versionado e um visitante ativa o link.
- **Correção:** schema aceita apenas caminho iniciado por `/` que não seja `//`, ou URL HTTPS sem credenciais; helper compartilhado em `src/utils/safe-content-href.mjs`.
- **Teste:** `npm run test:security-links` (6 casos) cobre caminhos locais codificados, HTTPS, esquemas executáveis e `data:`, caracteres percent-encoded, protocol-relative, barras invertidas, caminhos relativos suspeitos, protocolos não autorizados, credenciais e valor inválido. Também exercita a serialização real de JSON-LD com payload HTML e confirma parse válido.
- **Risco residual:** conteúdo é controlado por commit; a proteção não substitui revisão de alterações editoriais.

### AJN-SEC-008 — permissões de atributo de estilo inline

- **Classificação:** CONFIRMADO · Informativa/baixa.
- **Evidência:** `public/.htaccess` contém `style-src-attr 'unsafe-inline'`; componentes aplicam custom properties `--reveal-delay` e `--hero-image` via atributo `style` com dados versionados.
- **Impacto:** enfraquece a política para atributos de estilo, mas não libera scripts inline. Não foi observada entrada de usuário alimentando esses atributos.
- **Tratamento:** mantido para preservar imagem/efeitos atuais. Remover requer mover esses valores para classes/estilos estáticos; não é necessário para fechar risco de XSS confirmado.

## Superfícies examinadas

- Scripts de cabeçalho/menu, filtro do blog, filtro de serviços, reveals da Home e movimento da página Sobre.
- Formulário de busca GET do blog; não envia para serviço externo.
- Links de conteúdo, URL de imagens, JSON-LD, schemas e dados com origem em arquivos versionados.
- Uso de APIs DOM perigosas, handlers inline, iframe, `srcdoc`, storage, mensagens entre janelas e recursos remotos.

## Resultado dos controles

Na segunda revisão, `npm run audit:security` passou em 189 arquivos fonte e 145 HTML compilados; valida JSON-LD parseável e verifica scripts inline executáveis e protocolos proibidos em links compilados. `npm run test:security-links` passou (6/6), além de `npm run check` (218 arquivos, 0 erros/avisos/hints) e `npm run build` (144 páginas), repetidos em contexto de produção e preview. A validação de navegação permanece automatizada/estática; não foi realizado teste visual/browser nesta rodada.
