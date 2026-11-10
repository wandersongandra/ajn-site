# AJN Carreiras — evidências e pendências de homologação Hostinger

Atualização: 10/11/2026. O ambiente escolhido para o piloto atual é **Hostinger, PHP/PDO + MySQL/MariaDB + armazenamento privado local**, e não o protótipo Cloudflare Worker/D1/R2.

## Separação dos ambientes

| Ambiente | Endereço / referência | Estado |
|---|---|---|
| Produção institucional | `https://ajnengenharia.com.br` | Site em `main`; **não incluir carreiras sem gate e autorização de produção** |
| Homologação de carreiras | `https://lightskyblue-gnat-418094.hostingersite.com` | API PHP real, vaga fictícia e candidato sintético |
| Código em preparação | Branch `feat/ajn-carreiras` | Alterações posteriores ainda podem não estar publicadas na homologação |

Em 10/11/2026, o painel de implantações da Hostinger para a produção institucional indicava como implantação atual de `main` o commit `3b0c7743` (PR #109, SEO comercial). Não confundir essa implantação com a branch de carreiras.

## Evidências observadas no Chrome conectado — 10/11/2026

| Verificação | Resultado | Evidência / limite |
|---|---|---|
| API e banco do staging | **PASS parcial** | `GET /api/health` apresentou JSON `status: ok`, `service: ajn-carreiras-api`, `environment: staging` |
| Vaga fictícia publicada | **PASS** | `/carreiras/vaga/?slug=teste-tst-homologacao-20261110` carregou título e requisitos de teste; action do formulário apontou para o slug publicado |
| Antindexação do staging | **PASS na página amostrada** | A vaga fictícia apresentou `meta[name=robots]` com `noindex,nofollow,noarchive` |
| Sessão administrativa | **PASS de restauração** | Sessão já autenticada mostrou painel com perfil `recruiter` após carregamento; este teste **não** comprova MFA/login do zero |
| Persistência do candidato | **PASS de leitura** | Candidato fictício apareceu no Kanban (etapa de análise) e na lista de currículos, com ação de download |
| Download privado | **NÃO CONCLUSIVO** | Botão acionado; o navegador automatizado não confirmou evento de download; não classificar como PASS nem como FAIL até validar arquivo recebido e integridade |
| Turnstile | **PENDENTE** | Contêiner `.cf-turnstile` presente no formulário; desafio válido/inválido e bloqueio server-side não executados |
| LGPD administrativa | **PARCIAL** | Aba de solicitações acessível para o recrutador autenticado; solicitação/exclusão não foi executada |
| Atualização do frontend | **PENDENTE** | Staging ainda apresenta cópia antiga: checkbox opcional de retenção pré-marcado e texto legado sobre bucket R2, embora o backend atual seja PHP/arquivo privado |

Todos os dados do candidato observado eram **fictícios de teste**. Não usar currículos ou CPF reais em homologação.

## Bloqueios para produção

1. **Atualizar somente o staging** com a branch revisada e repetir inspeção de cache e versão dos assets. A produção institucional não deve ser alterada por essa etapa.
2. Confirmar que a opção de **retenção de currículo para futuras vagas começa desmarcada** no formulário de candidatura. No formulário específico do banco de talentos, o aceite de retenção deve continuar explícito e obrigatório.
3. Comprovar download privado do PDF/DOCX sintético em sessão permitida, nome, formato e hash; provar também `401/403` sem sessão ou com papel sem permissão, sem expor arquivo ao diretório público.
4. Executar E2E de **MFA real**, renovação/expiração de sessão, logout, acesso entre papéis `viewer`, `recruiter`, `dpo` e `super_admin`, proteção CSRF/origem e limite de tentativas.
5. Exercitar candidatura e banco de talentos com arquivos sintéticos válidos e inválidos, dupla submissão, recuperação de protocolo por e-mail, rastreamento e retomada após erro; usar caixa de e-mail controlada e confirmar SMTP.
6. Validar Turnstile válido/inválido e antispam efetivo no servidor. Conferir logs para garantir ausência de senha, CPF bruto, currículo e token.
7. Revisar retenção e exclusão LGPD em dados descartáveis, procedimento de cópia de segurança e restauração do MySQL e do armazenamento privado, e trilha de auditoria.
8. Executar novamente os testes de build, contratos PHP, browser, segurança, acessibilidade e regressão; registrar SHA exato publicado em staging e evidências do navegador para uma decisão de release.

## Gate de liberação

Somente recomendar implantação pública quando todos os itens críticos acima tiverem resultado comprovado. Um teste automatizado local ou a presença de uma interface não equivale a E2E remoto. O deploy de `main` pode afetar diretamente o site institucional pela integração GitHub/Hostinger; qualquer merge requer aprovação explícita de produção.

### Nota histórica sobre o protótipo Cloudflare

O comando `npm run test:homologation-remote` ainda foi escrito para Worker/D1/R2/Durable Object. Ele **não** representa o gate de infraestrutura atual da Hostinger. As decisões anteriores sobre Cloudflare estão registradas em `07-decisao-arquitetural-staging-2026-11.md` e `08-decisao-hostinger-2026-11.md`; não tratar seus requisitos antigos como bloqueio obrigatório para o backend PHP escolhido.
