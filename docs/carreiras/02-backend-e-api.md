# Especificação de Backend e API — AJN Carreiras

## 1. Visão Geral

O backend do **AJN Carreiras** é implementado em **Cloudflare Workers** utilizando o framework **Hono v4** em TypeScript. Ele executa em ambiente Serverless na Edge global da Cloudflare, com latência mínima e tolerância a falhas.

O serviço orquestra:
- Banco de dados relacional distribuído (**Cloudflare D1** via Drizzle ORM).
- Armazenamento privado de arquivos (**Cloudflare R2**).
- Validação estrita de contratos (**Zod**).
- Criptografia Web Crypto nativa (PBKDF2-SHA256, HMAC, SHA-256).
- Autenticação e MFA TOTP (RFC 6238).
- Proteção antispam (**Cloudflare Turnstile**).
- Rate Limiting adaptativo em memória/KV.

---

## 2. Mapa Completo de Endpoints

### 2.1. Rotas Públicas

| Método | Endpoint | Descrição | Autenticação / Rate Limit |
|---|---|---|---|
| `GET` | `/api/jobs` | Lista vagas publicadas com filtros de depto, regime e local | Público (60 req/min) |
| `GET` | `/api/jobs/:slug` | Retorna os detalhes de uma vaga publicada | Público (60 req/min) |
| `POST` | `/api/applications` | Submissão de candidatura com upload multipart de currículo | Turnstile + 10 req/15min |
| `GET` | `/api/applications/status/:code` | Consulta do status da candidatura pelo tracking code `AJN-XXXXXX` | 20 req/15min |
| `POST` | `/api/talentos` | Cadastro no Banco de Talentos com upload multipart de currículo | Turnstile + 10 req/15min |
| `POST` | `/api/lgpd/requests` | Abertura de solicitação do titular (acesso, exclusão, etc.) | Turnstile + 5 req/15min |

### 2.2. Rotas Administrativas

| Método | Endpoint | Descrição | Permissão RBAC |
|---|---|---|---|
| `POST` | `/api/admin/auth/login` | Login inicial com e-mail e senha PBKDF2 | Público (5 tentativas / 15min) |
| `POST` | `/api/admin/auth/mfa` | Validação de token TOTP de 6 dígitos e emissão de sessão | Público (MFA pendente) |
| `POST` | `/api/admin/auth/logout` | Revogação imediata da sessão ativa | Requer Autenticação |
| `GET` | `/api/admin/auth/me` | Dados do usuário logado e permissões ativas | Requer Autenticação |
| `GET` | `/api/admin/jobs` | Lista todas as vagas (incluindo rascunhos e pausadas) | `jobs:read` |
| `POST` | `/api/admin/jobs` | Criação de nova vaga e etapas do funil | `jobs:create` |
| `PATCH` | `/api/admin/jobs/:id` | Atualização de requisitos, status e dados da vaga | `jobs:update` |
| `DELETE` | `/api/admin/jobs/:id` | Exclusão lógica/física da vaga | `jobs:delete` |
| `GET` | `/api/admin/candidates` | Lista candidatos com filtros, busca e paginação | `candidates:read` |
| `GET` | `/api/admin/candidates/:id` | Ficha completa do candidato, histórico e etapas | `candidates:read` |
| `PATCH` | `/api/admin/candidates/:id` | Atualização de status e avaliação humana (rating) | `candidates:update` |
| `GET` | `/api/admin/candidates/:id/resume` | Download autenticado e privado do currículo no R2 | `resumes:read` |
| `GET` | `/api/admin/pipeline/:jobId` | Quadro Kanban com etapas e candidatos alocados | `candidates:read` |
| `POST` | `/api/admin/pipeline/move` | Movimentação de candidato entre etapas do funil | `candidates:update` |
| `GET` | `/api/admin/lgpd/requests` | Painel de solicitações de titulares (Art. 18) | `lgpd:read` |
| `POST` | `/api/admin/lgpd/execute-erasure` | Execução de exclusão/anonimização de candidato e expurgo do R2 | `lgpd:delete` |
| `GET` | `/api/admin/audit` | Trilha de auditoria cronológica das ações administrativas | `audit:read` |

---

## 3. Segurança e Validação de Uploads

O upload de currículos segue regras de segurança corporativa:
1. **Verificação de Magic Bytes:** Não confia no cabeçalho `Content-Type` do navegador nem na extensão do arquivo. Lê os primeiros bytes binários:
   - PDF: `%PDF-` (`0x25, 0x50, 0x44, 0x46`)
   - DOCX: Assinatura PK Zip (`0x50, 0x4B, 0x03, 0x04`)
   - DOC: Assinatura OLE2 Compound File (`0xD0, 0xCF, 0x11, 0xE0`)
2. **Limite de Tamanho:** Máximo de 5 MB. Arquivos maiores são rejeitados antes do processamento.
3. **Armazenamento Privado R2:**
   - O bucket não possui subdomínio público, nem domínio customizado ativado.
   - O acesso é restrito ao Worker através da chave `c.env.RESUMES_BUCKET.get(r2Key)`.
   - O download exige sessão de recrutador ativa e permissão `resumes:read`.
   - Cada download gera um registro em `audit_logs` contendo o ID do recrutador, IP e timestamp.

---

## 4. Política Anti-IA e Decisões Humanas

Em total cumprimento aos requisitos de governança e ética da AJN:
- Não há triagem automatizada ou algoritmos de classificação por inteligência artificial.
- O campo `rating` (1 a 5 estrelas) e `notes` só podem ser preenchidos manualmente pelo recrutador autenticado.
- Todas as decisões de movimentação no funil são auditadas com o identificador do operador humano responsável.
