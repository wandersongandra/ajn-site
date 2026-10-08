# Limpeza técnica — Fase 2 (CSS legado comprovadamente obsoleto)

Data: 08/10/2026. Repositório: `wandersongandra/ajn-site`. Base: `main` após PR #47.

## Escopo executado

A revisão de `src/styles/global.css` confirmou quatro blocos de estilos de componentes antigos que não fazem parte das páginas institucionais atuais:

| Bloco removido | Uso anterior | Caracteres removidos |
| --- | --- | ---: |
| `/* Featured services */` | Cartões `.highlight-card` de antiga área de destaque | 657 |
| `/* Continuous featured-services marquee */` | Carrossel `.highlights__track`, já substituído | 2.696 |
| `/* Text-led home about section */` | Layout `.about__visual` de Home, removido antes da página Sobre Nós atual | 4.857 |
| `/* Portfolio */` | Grade `.portfolio__item` antiga | 565 |
| **Total** | | **8.775** |

O arquivo global passou de **101.352** para **92.577 caracteres**, sem alterações nos estilos ativos do catálogo de serviços, Home, Blog, contato ou carrossel de logos.

## Evidências e testes

- `src/pages/index.astro` atualmente usa Hero, SolutionsSection, HomeSectorsSection, ClientsSection e DifferentialsSection. Não importa antiga seção `about`, `highlights` ou `portfolio`.
- `src/components/InstitutionalPage.astro` utiliza classes `about-page__*` distintas, definidas em `about-editorial.css`.
- A Home usa `home-services-grid` e `home-clients-carousel`, não `highlights__track`.
- Novo `scripts/audit-dead-css.mjs` verifica **todas as páginas HTML geradas**, pesquisa classes exatas de componentes removidos e exige que Home e Sobre Nós atuais continuem presentes. Registrado em package scripts e workflow CI.

## Limites

- Não foi feita varredura visual automatizada completa por screenshots nesta rodada; o navegador TinyFish estava com saldo insuficiente. Build/CI não comprovam equivalência pixel a pixel.
- Outras áreas do CSS global ainda mantêm regras históricas. Eliminá-las exigirá inventário cuidadoso de seletores e/ou comparação visual.
- **Não apagar** imagens duplicadas em `public/images/content/marketing` apenas porque têm o mesmo SHA: URLs podem estar referenciadas por páginas e pelo Google. Não alterar links, robots ou sitemap sem inspeção.
- **Não alterar** DNS, nameservers, e-mails, backups WordPress ou hospedagem.

## Próxima fase

1. Auditar seletor por seletor as antigas classes `clients__track`, `solutions__track`, `portfolio`, `highlights` ainda presentes em seções mistas do CSS global. Essas áreas contêm regras compartilhadas com componentes ativos e devem ser divididas antes de remoção.
2. Mapear e reorganizar estilos específicos de Contato e rodapé em módulos, com teste de ordem da cascata.
3. Inventariar imagens duplicadas por referências reais em código/HTML e arquivos do output.
4. Obter teste de navegador com breakpoints mobile/desktop antes de publicar uma refatoração grande de estilos.

## Gate

Publicar após Astro check, build, auditorias existentes, `audit:dead-css`, Quality Gate, CodeQL, segredos e dependências PASS. Conferir URLs /, /sobre-nos/, /servicos/, /blog/ e /contato/ depois do deploy automático.
