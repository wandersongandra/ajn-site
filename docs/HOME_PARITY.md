# Paridade da Home — WordPress x Astro

Data: 2026-10-06
Escopo: somente a homepage (`/`). As demais URLs não foram implementadas nesta fase.

Referências usadas: HTML público atual, conteúdo recuperado localmente, assets inventariados e comparação visual em preview estático.

| Elemento | WordPress atual | Astro | Status |
|---|---|---|---|
| Topbar | Endereço, telefone WhatsApp e e-mail da AJN | `Header.astro` com os mesmos dados e destinos | PASS |
| Header e menu | Logo, Home, Sobre Nós, Serviços, Blog, Contato, Informações e Treinamentos online | Componente Astro real, dropdown de Serviços e menu mobile | PASS |
| Hero | Banner de treinamento, texto institucional e dois CTAs | `Hero.astro`, imagem local e texto real do legado | PASS |
| Apresentação | Fachada, H1 AJN, cinco parágrafos reais, ícone e imagem secundária | `AboutSection.astro` com dados em `src/data/home.ts` | PASS |
| Clientes | Título e dez logos/imagens de clientes | `ClientsSection.astro` com dez assets locais | PASS |
| Missão, visão e valores | Três blocos na ordem original | `MissionSection.astro` com conteúdo real | PASS |
| Nossas Soluções | Nove cards com imagens, títulos e descrições | `SolutionsSection.astro` com nove componentes de card e assets locais | PASS |
| Nosso Portfólio | Grade de sete imagens com composição assimétrica | `PortfolioSection.astro` com os sete assets locais | PASS |
| Nossos Diferenciais | Fundo verde, três blocos, listas e grafismos laterais | `DifferentialsSection.astro` com conteúdo e ícones locais | PASS |
| Serviços em Destaque | Quatro cards com imagens, títulos e URLs atuais | `HighlightsSection.astro` com os quatro registros reais | PASS |
| Popup | Popup central automático com imagem de aviso, fechamento e link WhatsApp | `PromoDialog.astro` usando `<dialog>`, imagem local e destino WhatsApp | PASS |
| Footer | Logo, razão social, CNPJ, navegação, contato, endereço e redes sociais | `Footer.astro` com dados reais e componentes Astro | PASS |
| Tipografia e cores | Poppins, verde `#576B43`, secundário `#728A58`, cinza `#5C5C5C` | Tokens CSS equivalentes em `src/styles/global.css` | PASS |
| Responsividade 1440px | Header horizontal e hero largo | Validado no preview estático, `scrollWidth = 1440` | PASS |
| Responsividade 768px | Layout intermediário do site público | Menu compacto, grid adaptado, `scrollWidth = 768` | PASS |
| Responsividade 390px | Menu compacto e conteúdo sem rolagem lateral intencional | Menu abre por teclado/clique, `scrollWidth = 390` | PASS |
| Console no preview | Sem erros bloqueantes observados na página pública de referência | Console do preview Astro: 0 erros e 0 warnings | PASS |
| Rotas dos CTAs e cards | Destinos existem no site atual | As páginas ainda não fazem parte desta Fase 1 | WARN |
| Fidelidade pixel a pixel | Tema e composição atuais, com comportamentos legados específicos | Paridade estrutural e visual validada por amostragem; comparação pixel-perfect completa fica para a próxima rodada | WARN |

## Evidências executadas

- `npm run build`: PASS; Astro gerou saída `static` com `/index.html`.
- `npx astro check`: PASS; 0 erros, 0 warnings e 0 hints.
- `npm audit --omit=dev --audit-level=high`: PASS; 0 vulnerabilidades.
- Preview estático em `http://127.0.0.1:4322/`: PASS.
- Viewports validados: 1440×900, 768×900 e 390×844.
- Overflow horizontal: não observado nos três viewports.
- Popup: abertura automática e fechamento por botão validados.
- Menu mobile: abertura validada com `aria-expanded="true"`.

## Limites desta fase

- As outras 135 URLs públicas continuam sem implementação; somente as sete
  páginas representativas da Fase 2 foram adicionadas além da Home.
- Nenhum banco, API própria, SSR, ISR, Server Action, CMS ou runtime de servidor foi adicionado.
- Nenhum HTML recuperado foi importado como markup bruto.
- Os links para páginas ainda não implementadas permanecem como `WARN` até as próximas fases.
