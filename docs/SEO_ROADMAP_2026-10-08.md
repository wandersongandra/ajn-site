# AJN — Plano de SEO técnico e evolução página a página

Data de abertura: 2026-10-08. Site oficial: https://ajnengenharia.com.br/
Projeto: Astro (`ajn-site`). Deploy automático: Hostinger, a confirmar no hPanel.

## Fase 0 — Medição e indexação (bloqueadores)

- [ ] Criar e verificar `sc-domain:ajnengenharia.com.br` em Google Search Console na conta conectada ao GSC Wizard. O GSC Wizard não cria esta propriedade de domínio e a tentativa de registro retornou `not_found`.
- [ ] Após verificar, registrar a propriedade no GSC Wizard, torná-la visível no dashboard e vincular `https://ajnengenharia.com.br/sitemap-index.xml` **somente após testar resposta HTTP 200 e XML válido**.
- [ ] Inspecionar a home e URLs representativas: Home, Serviços, PGR, PCMSO, LTCAT, eSocial, Contato e Blog.
- [ ] Conferir no hPanel que a build de PRODUÇÃO usa `PUBLIC_SITE_ORIGIN=https://ajnengenharia.com.br` e `PUBLIC_ALLOW_INDEXING=true`. Pré-visualizações/homologação devem continuar usando `PUBLIC_ALLOW_INDEXING=false`.
- [ ] Validar **HTML publicado**, não só código: `<meta name="robots">`, canonical, robots.txt, sitemap XML, SSL, 301 entre www e sem www, códigos HTTP, páginas 404.
- [ ] Preservar sem alterações os registros DNS MX/SPF/DKIM/DMARC e o serviço de e-mail Standard Business Email.

**Regra de segurança:** nunca adicionar o TXT de propriedade do Google substituindo registros TXT existentes. Só adicionar a entrada solicitada pelo Search Console. Nenhuma alteração em nameservers.

## Fase 1 — SEO técnico (esta primeira PR)

- [x] Alinhar os valores padrão do `site`, canonical, Open Graph, sitemap e robots ao endereço público `https://ajnengenharia.com.br` (sem www).
- [x] Atualizar modelo de ambiente sem alterar variáveis reais da Hostinger.
- [x] Adicionar à CI um segundo build de teste simulando o ambiente de produção com indexação habilitada, preservando o build de homologação com noindex.
- [ ] Conferir o resultado do Quality Gate da PR antes de aprovar merge.
- [ ] Conferir ambiente real no hPanel antes de publicar: a CI não lê a configuração da Hostinger.

## Fase 2 — Páginas institucionais (uma por uma)

1. **Home** (`/`): intenção de busca institucional, segmentação de serviços, mensagem principal, posicionamento de BH e atendimento, CTA e provas reais.
2. **Sobre nós** (`/sobre-nos`): credenciais verificáveis, responsável técnico, história real, evidências de experiência e fotos.
3. **Serviços** (`/servicos`): arquitetura de navegação, taxonomia, cards e links internos.
4. **Contato** (`/contato`): NAP (nome, endereço, telefone), contato por canais funcionais, teste de conversão e dados estruturados quando compatíveis.

## Fase 3 — Serviços prioritários e buscas comerciais

| Página representativa | Intenção principal | Tema-chave para validar em GSC |
| --- | --- | --- |
| `/consultoria-seguranca-do-trabalho` | empresa procurando consultoria em SST | consultoria em segurança do trabalho |
| `/elaboracao-pgr` | empresa precisa elaborar PGR | elaboração de PGR, programa de gerenciamento de riscos |
| `/servicos/pcmso-e-asos` | contratação de saúde ocupacional | PCMSO, ASO, saúde ocupacional |
| `/emissao-ltcat` | laudo previdenciário | LTCAT, emissão de LTCAT |
| `/servicos/gestao-do-e-social` | terceirização de SST/eSocial | eSocial SST, S-2210, S-2220, S-2240 |
| `/servicos/pericias-em-periculosidade-e-insalubridade` | laudos e perícias | insalubridade, periculosidade |

As palavras-chave acima são **hipóteses** até termos impressões, consultas, dispositivos e cidades reais do Google Search Console. Sem inventar resultados, preços, certificações ou clientes.

## Fase 4 — Auditoria de conteúdo e canibalização

- A migração documenta 107 páginas comerciais, 20 artigos e demais páginas institucionais. Há títulos muito parecidos em pares como `/empresa-que-faz-pgr`, `/empresa-que-elabora-pgr`, `/elaboracao-pgr`.
- Fazer matriz URL × intenção × qualidade × tráfego × links antes de consolidar. Não aplicar noindex, remover ou redirecionar em massa sem dados do Search Console e plano de 301.
- Revisar informações de SST conforme normas atuais e evitar parágrafos repetitivos, títulos forçados e preenchimento artificial de palavras-chave.
- Blog: revisar autoria, fontes oficiais, originalidade, datas reais de revisão, imagens responsivas e ligações a serviços.

## Fase 5 — Design, mobile e performance

- Revisar desktop/mobile: Hero, tipografia, contraste, responsividade, carrossel de clientes, cartões, menu e formulário.
- Medir LCP, INP, CLS, TTFB e desempenho real nas páginas prioritárias; melhorar imagens, fontes, JS e estabilidade visual.
- Auditar acessibilidade por teclado, foco, `prefers-reduced-motion`, alt de imagens, formulários e CTAs.
- Testar Webmail e DNS separadamente: ajustes de frontend NÃO devem tocar na infraestrutura de e-mail.

## Fase 6 — Publicação e acompanhamento

- Submeter sitemap válido ao Google Search Console e conectar GSC Wizard; inspecionar URLs importantes e acompanhar cobertura.
- Monitorar quinzenalmente impressões, cliques, CTR, posição média e leads; comparar períodos equivalentes e anotar data da migração.
- Revisar hipóteses de palavras-chave com dados reais; SEO não garante primeira posição.
- Publicar apenas após Quality Gate, revisão de diffs, verificação de produção e plano de reversão.

## Aprovação do gate

Checklist por PR: `npm run check`, `npm run build`, `npm run audit:seo`, `npm run audit:deploy` nos ambientes de prévia e produção simulada, HTTP 200, noindex/robots/canonical verificados em produção e nenhuma alteração em e-mails/DNS.
