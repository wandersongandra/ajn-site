# Auditoria crítica do site AJN — 9 de outubro de 2026

## Escopo e estado observado

- Repositório: `wandersongandra/ajn-site`, checkout `astro-site`.
- Base auditada: `origin/main` em `c96f446` (`feat(legal): dedicated cookies policy and editorial legal pages`).
- Branch de trabalho criada após o reconhecimento: `modernization/ajn-site-2026-10-09`, sem alterações locais prévias.
- Site público: `https://ajnengenharia.com.br/`.
- Método: leitura do código, scripts e documentação; build e auditorias existentes; requisições HTTP GET ao domínio e a rotas representativas; renderização visual em Microsoft Edge headless.
- Nenhum formulário foi enviado e nenhuma configuração externa, hospedagem, DNS, WordPress ou dado de usuário foi alterado.

## Resumo

O domínio oficial já entrega o site Astro. Em 9/10/2026, Home, Blog, Serviços, Contato, Política de Privacidade, Política de Cookies e Termos de Uso responderam HTTP 200. A Home publicou `index,follow`; o build explícito com `PUBLIC_ALLOW_INDEXING=true` produziu canonical e `robots.txt` indexáveis. Portanto, o estado atual difere do snapshot de 7/10/2026 registrado em `docs/AUDITORIA-PRODUCAO-2026-10-07.md`, que observava WordPress. Esse documento permanece como evidência histórica, não como descrição do estado atual.

O Quality Gate local concluiu sem falhas após as alterações: 155 páginas estáticas geradas; auditorias de SEO (156 HTML, incluindo 404), fragmentos, deploy/indexação, segurança, conteúdo, serviços, rodapé, blog e privacidade passaram. `astro check` reportou zero erros, zero warnings e zero hints depois de tipar o mock de localização. Isso prova os controles automatizados executados, não cobre toda a experiência do usuário nem métricas de campo.

Não foi confirmado overflow horizontal nas larguras auditadas. Capturas preliminares feitas com o tamanho externo da janela Edge cortaram o conteúdo e foram descartadas: a janela não correspondia ao viewport CSS pretendido. A medição subsequente por Chromium DevTools Protocol usou viewports CSS de 320, 375, 390, 430, 768, 1024, 1440 e 1920 px; `documentElement.scrollWidth` não excedeu `innerWidth`. As capturas válidas de Home e Blog em 390×844 estão em `output/playwright/live-cdp-home-390x844.png` e `live-cdp-blog-390x844.png`.

## Achados priorizados

### AJN-01 — Resultado visual — suspeita de overflow descartada

- **Componente/rotas:** Home e Blog.
- **Evidência inicial:** capturas `live-home-*.png` obtidas pelo argumento `--window-size` do Edge pareciam mostrar corte. A geometria de viewport do browser mostrou que essa captura não representava as dimensões CSS solicitadas; não é evidência válida do site.
- **Verificação corretiva:** Chromium DevTools Protocol mediu `innerWidth` e `documentElement.scrollWidth` em 8 larguras para Home e Blog. Não houve largura documental maior que a viewport. As capturas emuladas 390×844 mostram hero, título do Blog e botões de privacidade dentro da tela.
- **Impacto/status:** sem defeito confirmado; achado encerrado como falso positivo de método. Nenhuma correção CSS foi feita com base nessa suspeita.
- **Aceite da checagem:** `scrollWidth <= innerWidth` em 320, 375, 390, 430, 768, 1024, 1440 e 1920 px; capturas válidas mantidas em `output/playwright/live-cdp-home-390x844.png` e `live-cdp-blog-390x844.png`.

### AJN-02 — Alto — Biblioteca editorial ainda concentrada em poucos temas

- **Componente/rota:** catálogo do Blog (`src/content/blog/catalog.ts`, `src/content/blog/index.ts`, `src/content/blog/*.ts`).
- **Evidência inicial:** o build incluía 20 artigos; os assuntos visíveis incluíam LTCAT, PGR, PCMSO, PPP/eSocial e NRs. A classificação era derivada do título por regex, com fallback para “Institucional”.
- **Impacto:** baixa cobertura de gestão de terceiros, higiene ocupacional, APR/PT, NR-10, NR-12, ergonomia, investigação de acidentes, EPI e construção civil; classificação frágil pode perder precisão ao renomear títulos.
- **Plano:** manter os 20 slugs e datas existentes; migrar a classificação para metadados explícitos tipados; publicar primeiro artigos que preencham lacunas confirmadas, usando fontes primárias atuais; registrar decisão por URL sem consolidar ou remover páginas sem dados de tráfego e backlinks.
- **Execução:** categoria editorial explícita nos oito novos artigos e mapeamento por slug nos 20 artigos preexistentes; oito artigos novos adicionados, sem remover slugs existentes. Busca/filtros existentes preservados. `audit:blog` confere 28 páginas, descrições, imagens OG, JSON-LD e sumário.
- **Status:** implementado localmente; revisão de sobreposição por dados de tráfego e revisão técnica humana permanecem pendentes.

### AJN-03 — Médio — Uma rota de artigo mantém implementação paralela

- **Componente:** `/blog/a-importancia-do-ltcat-para-a-seguranca-do-trabalho-e-a-protecao-do-ambiente-profissional`.
- **Evidência inicial:** a rota especial usava um componente isolado, enquanto os demais artigos passavam pelo template comum.
- **Impacto:** metadados, sumário, esquema estruturado, estilos e validação editorial podem divergir entre artigos.
- **Plano:** verificar o contrato da URL e transferir a renderização para o template comum sem mudar o slug nem a data histórica; manter os mesmos metadados de publicação.
- **Execução:** template especial e componente removidos; o objeto foi integrado à coleção validada e renderiza por `/blog/[slug]`.
- **Status:** corrigido localmente; a rota anterior, canonical e metadados foram preservados no build.

### AJN-04 — Médio — Amplitude de serviços deve seguir o catálogo comprovado

- **Componente:** `src/content/services/catalog.ts` e páginas geradas de marketing/serviços.
- **Evidência:** o catálogo institucional auditado possui dez serviços. A matriz de escopo da missão propõe quinze áreas, várias sem oferta direta comprovada neste catálogo.
- **Impacto:** risco de deixar áreas atendidas difíceis de encontrar ou publicar oferta, habilitação profissional ou capacidade operacional não confirmada.
- **Plano/execução:** matriz de quinze áreas comparada ao catálogo de dez entradas atuais; lacunas estão marcadas para confirmação empresarial, sem publicação como oferta.
- **Aceite:** cada alegação pública aponta a uma oferta confirmada e nenhuma competência legal, responsável técnico, estrutura ou cliente é inventado.
- **Status:** catálogo atual CONFIRMED; lacunas comerciais específicas requerem confirmação da empresa.

### AJN-05 — Baixo — Tipagem de uma asserção no teste de privacidade

- **Componente:** `scripts/test-privacy-notice.mjs`.
- **Evidência inicial:** execução de `npm run validate` sinalizou um hint TypeScript na leitura de `window.location.reloaded` no mock de teste.
- **Impacto:** ruído na validação e divergência entre o mock tipado e o estado esperado pelo teste.
- **Execução:** estado `reloaded` incluído explicitamente no mock, sem relaxar a asserção.
- **Aceite:** `npm run check` termina com zero erros, warnings e hints.
- **Status:** corrigido; a última validação integral confirmou zero hints.

## O que já funciona no estado auditado

- `PUBLIC_ALLOW_INDEXING` exige valor explícito nos gates; o HTML de produção visto publicamente permite indexação e o build `true` passou; builds de preview `false` continuam cobertos pelo gate correspondente.
- Busca local, filtros por assunto, estado vazio e controle “Mostrar mais” estão implementados no Blog. O novo catálogo tem 28 artigos e `audit:blog` passou.
- O aviso de privacidade oferece personalização, rejeição, aceite e revogação; os dez testes unitários existentes passaram e verificam que o GA4 não é inicializado antes de consentimento válido.
- Imagens de cards usam o componente `Image` do Astro, `srcset`, `sizes` e dimensões declaradas; o conteúdo já usa validação Zod de links e campos.
- O catálogo de serviços já tem pesquisa e dez entradas; os testes de SEO e conteúdo verificaram as rotas e a presença dos elementos definidos pelas auditorias.
- Contato e políticas legais responderam HTTP 200. A auditoria de contato passou; não foi enviado formulário nem confirmada a entrega de lead a um destino externo.

## Complemento de escopo — relatório de serviços recebido em 2026-10-09

A AJN forneceu relatório institucional com 13 ofertas/frentes públicas, incluindo consultoria ocupacional, gestão ambiental e qualidade, eSocial, PCMSO/ASOs, perícias, PPCIP, projetos elétricos, regularização de imóveis, treinamentos, PGR, LTCAT e mobilização/acompanhamento técnico. Esse relatório resolve a pendência de confirmação da amplitude geral do catálogo observada em AJN-04.

A implementação agrupa os 13 serviços em SST/saúde ocupacional, treinamentos/operação e engenharia/ambiente/qualidade. Foram aproveitadas as páginas existentes para PGR, LTCAT e mobilização, preservando os URLs. A página de mobilização foi revisada para remover alegações de experiência, equipe qualificada, eficiência garantida e telefone que não tinham fonte confirmada no relatório.

Três pautas originais complementam as lacunas editoriais sobre resíduos, controle de qualidade em obras e PPCIP/regularização. As afirmações normativas remetem à Lei nº 12.305/2010 e a páginas oficiais do CBMMG; requisitos de imóvel permanecem condicionados à jurisdição e classificação. Os textos distinguem educação geral de contratação e escopo.

Continuam NÃO VERIFICADOS: credenciais e responsáveis individuais, disponibilidade/região por serviço, modalidade por curso, contratos e limites ambientais específicos, permissões para divulgar clientes/cases, e entregáveis de cada proposta. O relatório confirma o portfólio informado, sem provar capacidade ou habilitação individual.

## Plano de correção e critérios de aceite

1. Não alterar o layout com base nas capturas inválidas; manter a evidência válida e ampliar os fluxos de teclado/menu.
2. Categorias explícitas e oito novos artigos implementados; manter revisão humana e observar intenção de busca antes de consolidar conteúdo.
3. Rota especial normalizada no template comum, mantendo slug existente.
4. Entregar matriz de cobertura do catálogo com lacunas marcadas como não confirmadas.
5. Hint no mock do teste de consentimento corrigido.
6. Revisar diff; repetir `npm run validate`, `npm audit --omit=dev --audit-level=high` e smoke visual local viável.

## Limites de evidência

- A execução visual foi feita em Edge headless; não foi possível conectar Playwright CLI, e o navegador integrado não apresentou abas disponíveis. Há capturas para as larguras solicitadas, mas a interação completa por teclado, leitor de tela, zoom e reduced motion ainda precisa de validação automatizada/manual.
- Não foram medidos LCP, INP ou CLS, nem há dados CrUX/RUM consultados nesta rodada. Não atribuir pontuação Lighthouse.
- Os GETs confirmam respostas e metadados de páginas representativas, não a configuração do hPanel nem a origem de deploy.
- Não foram verificados Search Console, backlinks, analytics de tráfego, leads recebidos, permissões de uso de marcas de clientes ou habilitação profissional individual.
- Artigos legais e normativos exigem revisão técnica/editorial atualizada; os links e testes existentes não substituem aprovação profissional.
- Formulários, dados de pessoas, bancos, DNS, e-mail, WordPress e arquivos em quarentena/backups não foram modificados.
