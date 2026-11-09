# Relatório de Testes e Garantia da Qualidade — AJN Carreiras

## 1. Visão Geral da Suite de Testes

Para garantir estabilidade, segurança e não-regressão, o módulo **AJN Carreiras** foi submetido a baterias completas de testes automatizados abrangendo todas as camadas da aplicação: banco de dados, API, autenticação, segurança de upload, interface do usuário (E2E) e conformidade institucional com o pipeline de 35 gates do projeto.

---

## 2. Testes Unitários e de Integração do Backend (`vitest`)

Executados via comando:
```bash
npm run test:backend
```

**Resultado:** 100% de aprovação (3 arquivos de teste, 23 assertions).

### 2.1. Testes de Integridade de Schema e Banco (`tests/db/schema.test.ts`)
- `should create candidate with masked CPF and tracking code`: Verifica se campos mandatórios, máscara de CPF e unicidade de tracking code funcionam adequadamente.
- `should enforce unique email constraint on candidates`: Garante que e-mails duplicados disparam erro de violação de chave única.
- `should cascade delete resumes when candidate is deleted`: Valida integridade referencial com exclusão em cascata.
- `should enforce unique slug on job postings`: Previne duplicidade de URLs amigáveis.
- `should record immutable audit logs`: Confirma persistência de logs sem violação de constraints.

### 2.2. Testes de API e Fluxos de Negócio (`tests/backend/api.test.ts`)
- `GET /api/jobs`: Validação de listagem de vagas públicas e filtros.
- `GET /api/jobs/:slug`: Resolução de vaga ativa e rejeição 404 para slugs inexistentes.
- `POST /api/applications`: Submissão de candidatura completa com formulário multipart e upload de arquivo PDF válido (`%PDF-`), com criação automática de candidato, anexo e tracking code.
- `GET /api/applications/status/:code`: Consulta segura de status pelo código sem dados sensíveis.
- `POST /api/talentos`: Inscrição com upload no banco de talentos e flag `talent_pool_opt_in=1`.
- `POST /api/lgpd/requests`: Abertura de solicitação de titularidade sob o Art. 18.
- `POST /api/admin/auth/login`: Autenticação administrativa com validação PBKDF2.
- `POST /api/admin/auth/mfa`: Conclusão do login com código TOTP RFC 6238 e geração de sessão ativa.
- `GET /api/admin/jobs`: Listagem administrativa de vagas com proteção de token.
- `POST /api/admin/jobs`: Criação de nova vaga com etapas automáticas do funil.
- `GET /api/admin/pipeline/:jobId`: Consulta das colunas do quadro Kanban.
- `POST /api/admin/pipeline/move`: Transição de candidato entre etapas com registro em trilha de auditoria.

### 2.3. Testes de Segurança e Casos Adversos (`tests/backend/security.test.ts`)
- `Malicious upload rejection`: Envio de arquivo falso com extensão `.pdf` contendo script executável `<?php echo 'pwned'; ?>`. Rejeitado com HTTP 400 pelo validador de Magic Bytes.
- `Oversized file rejection`: Envio de arquivo de 6 MB (limite é 5 MB). Rejeitado com HTTP 400.
- `Unauthenticated resume download`: Tentativa de acesso direto ao endpoint de currículo sem cookie/token de sessão. Bloqueado com HTTP 401.
- `Inactive admin login`: Tentativa de login com usuário desativado (`is_active = 0`). Bloqueado com HTTP 403.
- `Brute force lockout`: 5 tentativas consecutivas com senha errada resultam no bloqueio da conta com HTTP 429 e timestamp de bloqueio.

### 2.4. Testes de Backup e Restauração (`tests/db/backup.test.ts`)
- Criação de banco de produção com candidaturas e logs.
- Execução de backup online do banco SQLite.
- Simulação de corrupção catastrófica no banco primário.
- Restauração a partir do arquivo de backup e verificação de 100% dos dados íntegros.

---

## 3. Testes End-to-End no Navegador (`Playwright`)

Script dedicado: `scripts/browser-carreiras.mjs`  
Executado em Chromium Headless em duas resoluções:
- **Mobile:** 390 x 844 (iPhone 14)
- **Desktop:** 1440 x 900

**Resultado:** 98 asserções executadas e 100% aprovadas.

| Teste | Asserções | Status |
|---|---|---|
| Acessibilidade e SEO em `/carreiras/` | 14 | Aprovado |
| Interatividade de Filtros na listagem de vagas | 12 | Aprovado |
| Detalhes da Vaga `/carreiras/engenheiro-seguranca-trabalho-senior/` | 18 | Aprovado |
| JSON-LD Google Jobs Schema estruturado | 6 | Aprovado |
| Página de Inscrição no Banco de Talentos `/carreiras/talentos/` | 12 | Aprovado |
| Consulta e Acompanhamento de Candidatura `/carreiras/acompanhamento/` | 14 | Aprovado |
| Painel Administrativo de Recrutamento `/admin/carreiras/` | 22 | Aprovado |

---

## 4. Pipeline Institucional de Validação (`npm run validate`)

O comando `npm run validate` executa os 35 gates obrigatórios do repositório AJN:

1. `npm run check` (Astro TypeScript Check): **0 erros, 0 alertas em 259 arquivos**.
2. `audit-design-tokens`: Tokens de cores, espaçamentos e fontes AJN validados.
3. `audit-security`: Conformidade estrita com política CSP (zero `innerHTML`, zero Web Storage).
4. `audit-seo-metadata`: Meta tags, OpenGraph e canonical validados em todas as páginas.
5. `audit-accessibility`: Contraste, labels e atributos ARIA validados.
6. `audit-performance-budget`: Orçamento de CSS/JS e recursos dentro dos limites.
7. `scripts/browser-smoke.mjs`: **1.457 asserções aprovadas**.
8. `scripts/browser-route-matrix.mjs`: **1.341 asserções aprovadas** em 164 rotas do site.

**Resultado Final do Pipeline:**
```
Pipeline validation completed successfully. All gates passed.
```
