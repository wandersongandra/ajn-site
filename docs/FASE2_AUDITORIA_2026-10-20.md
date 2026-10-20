# AJN — Auditoria e implementação Fase 2

Data: 20/10/2026  
Escopo: continuidade após a PR #70, com foco em conversão, contato, GA4,
SEO, browser, performance e segurança.

## Estado das entregas

| Frente | Evidência | Estado |
| --- | --- | --- |
| PR #70 | PR aberta, draft, mergeable; 5 workflows e testes locais do commit `4fafa04` passaram | **CONFIRMED** |
| Redirect www → apex | Produção respondeu `302`; a PR altera o código para `301`, mas ainda não está publicada | **CONFIRMED / NÃO VERIFICADO em deploy** |
| Jornada comercial | Home, Serviços, páginas prioritárias, Blog e Contato carregaram com H1, título esperado, links de contato e sem overflow no browser | **CONFIRMED** |
| Formulário | `/contato` público não renderiza formulário sem `PUBLIC_CONTACT_ENDPOINT`; WhatsApp e e-mail continuam disponíveis | **CONFIRMED** |
| Receptor de leads | Não há endpoint HTTPS real fornecido/configurado; nenhum envio real foi executado | **BLOCKED** |
| GA4 | Cliques de contato da PR #70 e submissão confirmada da Fase 2 são consent-gated e sem PII em testes | **CONFIRMED em código/teste** |
| Search Console | Connector retornou `payment_required`; não houve leitura live de consultas, CTR ou cobertura | **BLOCKED** |
| Core Web Vitals | Foi feita medição lab Playwright; não é CrUX, RUM nem substitui INP real | **CONFIRMED como lab / NÃO VERIFICADO como campo real** |

## Lab browser — produção pública

Uma execução por rota e viewport, aguardando o carregamento inicial. Valores em
milissegundos; servem como linha de base, não como garantia de campo.

| Rota | Viewport | HTTP | LCP lab | CLS lab | TTFB lab | Overflow |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| `/` | 390 | 200 | 1064 | 0,0197 | 352 | não |
| `/servicos/` | 390 | 200 | 204 | 0,0197 | 39 | não |
| `/contato/` | 390 | 200 | 96 | 0,0197 | 33 | não |
| `/` | 1440 | 200 | 496 | 0,0202 | 99 | não |
| `/servicos/` | 1440 | 200 | 164 | 0,0206 | 30 | não |
| `/contato/` | 1440 | 200 | 104 | 0,0211 | 27 | não |

INP não foi inferido a partir dessa navegação; precisa de interação/RUM ou
instrumentação apropriada. O GSC/CrUX continua indisponível nesta rodada.

## QA realizado

- smoke browser local: 1.457 asserções em 9 rotas, 10 larguras reduzidas,
  cenário padrão e `saveData`;
- E2E controlado do formulário: endpoint HTTPS simulado, POST multipart,
  resposta `202`, anexo permitido e estado acessível de sucesso;
- `npm run validate`: PASS, com um hint preexistente de import `stat` não usado
  em `scripts/audit-medicoes.mjs`;
- `npm audit --audit-level=high`: 0 vulnerabilidades;
- `test:contact-form`: 4/4; `test:privacy-notice`: 18/18;
- screenshots desktop/mobile do formulário revisadas em browser real.

## Pendências externas

1. publicar/revalidar a PR #70 no Hostinger e confirmar `301` em produção;
2. obter acesso funcional ao Search Console para consultas, dispositivos,
   cobertura e conversões reais;
3. escolher e homologar o receptor de leads, incluindo CORS, `connect-src`,
   validação server-side, antiabuso, anexo, retenção e destinatário;
4. após publicação, repetir smoke live, headers, canonical, sitemap, robots e
   teste controlado de submissão sem usar dados pessoais reais;
5. investigar a divergência entre CSP enforced/report-only que gera alerta de
   `style-src` em `/contato`; não foi ampliada a política para silenciar o
   relatório.
