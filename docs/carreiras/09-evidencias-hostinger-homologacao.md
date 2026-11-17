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
| Atualização do frontend | **PASS em 10/11/2026, após a inspeção inicial** | Pacote incremental aplicado somente na homologação; retenção opcional desmarcada e formulário de vaga habilitado após ajuste de versão do JavaScript. Ver evidências adicionais abaixo. |

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

## Atualização incremental de homologação — 10/11/2026

- **Destino isolado:** `lightskyblue-gnat-418094.hostingersite.com`; produção `ajnengenharia.com.br` não modificada. O envio inicial de 42 MB pelo navegador não concluiu e foi abandonado sem extração.
- **Transporte rastreável:** branch `deploy/ajn-carreiras-stage-bc3dad7-20261110`, commit `8bb6a7b05a92b437149ed53e71c8b1327f3944e4`, com pacote incremental codificado para transporte por Git; o servidor baixou e decodificou o artefato fora de `public_html`.
- **Integridade do pacote:** SHA-256 `1a3316a04b633e156394e5f3bf5bb214cb33441f37aa4ff957913776f396090c`; nove arquivos: cinco páginas HTML, dois scripts, um CSS versionado e `robots.txt`. Conteúdo e caminhos listados antes da extração; conferência pós-publicação de quatro arquivos por SHA-256 bateu com o build local.
- **Rollback:** arquivo `ajn-carreiras-stage-backup-pre-bc3dad7-20261110.tar.gz`, criado fora de `public_html`, contém os oito arquivos sobrescritos; os arquivos antigos do CSS e os backups anteriores permanecem preservados. A restauração **não** foi exercitada.
- **Cache e correção:** o HTML novo apontava para os parâmetros antigos `?v=20261110-feedback` e `?v=20261110-session`, o que deixou o formulário indisponível no navegador apesar de a vaga carregar. As cinco páginas estáticas tiveram a versão alterada para `20261110-consent-gate`. O código-fonte equivalente foi salvo na PR #107, commit `c27a38d38b38f0f616a5923038350c3f44e6d77d` (ainda sem novo resultado de CI no momento desta anotação).
- **Verificação visual real:** a vaga fictícia voltou a ter os campos habilitados; `consentRetention` começou `false`; a vaga e a listagem carregaram; as rotas `/carreiras/talentos/`, `/carreiras/acompanhamento/` e a página estática individual abriram. Nenhum currículo real foi submetido nesta rodada.
- **API e controle de acesso:** `/api/health` respondeu `status=ok` e `environment=staging`; `GET /api/admin/jobs` sem cookie retornou HTTP 401; o caminho público `/ajn-carreiras-private/` retornou HTTP 404. Em sessão existente, `/api/admin/auth/me` confirmou perfil `recruiter` com MFA configurado, sem testar login do zero.
- **Anti-indexação:** páginas da área apresentam `noindex,nofollow,noarchive` e `/carreiras/` também respondeu `X-Robots-Tag: noindex, nofollow, noarchive`. O arquivo `robots.txt` no disco tem `User-agent: * / Disallow: /`, mas a URL pública continuou mostrando a versão antiga (`Googlebot` bloqueado, demais robôs permitidos), inclusive após limpeza de cache da CDN; ainda precisa investigar o roteamento/cache da Hostinger. O modo de desenvolvimento CDN foi restaurado para desligado após o diagnóstico.
- **Testes locais após correção:** `npm run build` (120 páginas), `npm run check` (0 erros, 0 warnings, 29 hints), 66 testes de backend, 5 testes de interação, auditorias de 170 páginas SEO e de hospedagem, 5 testes de política de scripts e 5 de redirecionamento — todos PASS. A suíte Playwright local ficou **não executada** por bloqueio do ambiente à inicialização do Chromium; não contar como regressão aprovada.

**Veredito:** atualização visual e funcional de staging concluída nos caminhos testados; **produção ainda bloqueada** por SMTP, Turnstile real, MFA/login integral, download de arquivo sintético, LGPD/E2E e teste de restauração. Não fazer merge em `main` por esta evidência parcial.

### Nota histórica sobre o protótipo Cloudflare

O comando `npm run test:homologation-remote` ainda foi escrito para Worker/D1/R2/Durable Object. Ele **não** representa o gate de infraestrutura atual da Hostinger. As decisões anteriores sobre Cloudflare estão registradas em `07-decisao-arquitetural-staging-2026-11.md` e `08-decisao-hostinger-2026-11.md`; não tratar seus requisitos antigos como bloqueio obrigatório para o backend PHP escolhido.
