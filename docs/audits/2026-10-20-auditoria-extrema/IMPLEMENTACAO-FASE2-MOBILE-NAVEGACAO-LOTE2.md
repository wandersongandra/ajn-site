# AJN — Fase 2, lote 2: navegação responsiva e blog em telas pequenas

Data: 20/10/2026
Base: `origin/main` — `524bd531d3c3f04f6efb7f23e6b24bd655ff81f5`
Branch: `fix/ajn-fase2-mobile-navigation-blog`

## Contexto

A PR #76 (Fase 2, lote 1: fast-scroll e carrossel) continua aberta. Este lote é independente, originado da `main`, e não integra nem publica as alterações daquela PR.

## Ajustes implementados

### Cabeçalho: foco visível em mudanças do breakpoint

Arquivo: `public/scripts/header.js`.

A transição entre desktop e menu mobile sempre fechava os submenus, mas não verificava se o foco estava em um controle que se tornaria invisível com a nova largura. Agora:

- Desktop → mobile: se um link da navegação estiver focado quando a navegação recolher, o foco é transferido ao botão visível de menu.
- Mobile → desktop: se o botão de menu estiver focado e desaparecer, o foco é transferido ao primeiro link visível da navegação.
- `setMenu(false)` e `closeSubmenus()` continuam preservados, inclusive o estado `aria-expanded`.
- Nenhum focus trap, rolagem forçada ou regra de rastreamento é adicionado.

### Blog: prevenção de zoom de formulário em iPhone

Arquivo: `src/styles/blog.css`.

A largura móvel já definia fonte de 16px no input de busca do índice, porém os campos equivalentes de artigos e páginas legadas ainda herdavam 14px. O CSS mobile padroniza **16px** para as três variantes, evitando o gatilho habitual de ampliação automática no Safari iOS.

Também aperfeiçoa a faixa horizontal de assuntos no mobile: links com **altura mínima 44px**, rolagem horizontal contida e margem interna para reduzir cortes nos controles.

### Regressões reais de navegador

Arquivo: `scripts/browser-mobile-navigation.mjs`, executado no workflow `.github/workflows/browser-smoke.yml`.

- Larguras: 320, 390, 620, 768, 1024 e 1440px.
- Páginas: Home, blog, serviços e contato.
- Artigo detalhado nas larguras 320/390/620px.
- Detecção de overflow global, manutenção do menu acessível, Escape e foco.
- Fonte computada >=16px nos campos de pesquisa do blog mobile.
- Alvos de toque do filtro de assuntos >=44px de altura.
- Focus-transfer automático desktop → mobile e mobile → desktop.

## Riscos e limites

- O teste automatizado usa Chromium com viewport emulando dimensões comuns; não prova o comportamento do teclado virtual de um iPhone físico.
- A atualização de layout é escopada ao blog e a de foco ao cabeçalho; não há alterações em conteúdo, contratos de formulário, GA4, SEO, Hostinger ou arquivos do lote 1.
- Verificações de produção só podem ser realizadas após merge e publicação, com autorização do proprietário.
- A `main` ainda pode precisar ser reconciliada após a integração da PR #76, devido à edição comum do workflow Browser Smoke. Não efetuar merge de nenhuma PR sem revisar a diferença atual.

## Critérios para revisão

Exigir `Quality Gate`, `Browser Smoke`, `CodeQL`, `Gitleaks` e `Dependency Security` PASS; verificar resultados do novo passo e ausência de conflitos com a `main` no instante da aprovação.

Nenhuma conclusão de testes deve ser declarada sem conferir o GitHub Actions.

**Nenhum merge nem deploy autorizado nesta implementação.**
