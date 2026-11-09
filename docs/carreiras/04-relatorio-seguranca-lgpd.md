# Relatório de Segurança e Conformidade LGPD — AJN Carreiras

## 1. Sumário Executivo

O projeto **AJN Carreiras** foi concebido sob a metodologia *Security by Design* e *Privacy by Default*, alinhado às diretrizes da Lei Geral de Proteção de Dados Pessoais (LGPD - Lei 13.709/2018), aos padrões OWASP Top 10 e à rigorosa política de segurança pré-existente no repositório institucional da AJN.

Nenhuma decisão de segurança foi negligenciada:
- Armazenamento de arquivos estritamente privado.
- Zero avaliação ou triagem por inteligência artificial.
- Criptografia robusta de senhas (PBKDF2-SHA256) e tokens com MFA TOTP.
- Rastreamento público seguro sem exposição de e-mail ou CPF.
- Trilha de auditoria imutável para todas as ações administrativas.
- Total aderência às regras de Content Security Policy (CSP) sem injeção de HTML dinâmico ou persistência em Web Storage.

---

## 2. Modelo de Ameaças e Contramedidas

| Ameaça | Impacto | Contramedida Implementada |
|---|---|---|
| **Acesso público / vazamento de currículos** | Crítico | O bucket Cloudflare R2 é privado sem URL pública. O download exige sessão de recrutador ativa e permissão RBAC. Cada download é registrado em log imutável. |
| **Injeção de malware via upload (Ransomware/PDF malicioso)** | Alto | Validação de Magic Bytes (assinatura binária) para PDFs (`%PDF-`), DOCX (`PK`) e DOC (`OLE2`). Nomes de arquivo sanitizados com UUID randômico. Limite estrito de 5 MB. |
| **Força bruta em credenciais administrativas** | Alto | Bloqueio automático por 15 minutos após 5 tentativas falhas consecutivas (`lockout_until`). Rate limiter por IP (5 req/15min). Senhas com PBKDF2 (100.000 iterações com salt único de 16 bytes). |
| **Sequestro de sessão de recrutador** | Médio | Token de sessão criptografado (SHA-256 no banco). Sessões expiram em 8 horas e são invalidadas no logout. Associação de IP e User-Agent. |
| **Spam / DoS no cadastro de candidaturas** | Médio | Cloudflare Turnstile obrigatório no envio de formulários + Rate limiting adaptativo (10 requisições por IP a cada 15 minutos). |
| **Enumeração de candidatos por terceiros** | Médio | O acompanhamento público utiliza exclusivamente o `tracking_code` randômico base32 (`AJN-XXXXXX`). O endpoint de consulta retorna apenas dados agregados da vaga e etapa, sem CPF ou telefone. |
| **XSS (Cross-Site Scripting)** | Alto | Zero uso de `innerHTML`, `outerHTML`, `eval` ou `document.write`. Todo o frontend manipula o DOM via `document.createElement` e `textContent`. CSP do site bloqueia scripts inline não autorizados. |
| **Violação de regras de Web Storage (CSP Audit)** | Médio | Conforme auditoria estrita do site (`scripts/audit-security.mjs`), nenhum dado de sessão é armazenado em `localStorage` ou `sessionStorage`. O token administrativo permanece exclusivamente em memória na sessão ativa. |

---

## 3. Conformidade com a LGPD (Lei 13.709/2018)

### 3.1. Bases Legais Aplicadas
- **Art. 7º, I (Consentimento):** Aceite explícito com registro de IP, data/hora e versão do termo no momento do envio da candidatura (`data_consents`).
- **Art. 7º, V (Execução de Procedimentos Preliminares Relacionados a Contrato de Trabalho):** Tratamento dos dados exclusivamente para fins do processo seletivo da vaga pleiteada.
- **Art. 18 (Direitos do Titular):**
  - **Acesso e Confirmação:** O candidato consulta o status de seu processo através do seu código `AJN-XXXXXX`.
  - **Retificação:** O candidato pode solicitar atualização de suas informações profissionais.
  - **Eliminação e Revogação do Consentimento:** Funcionalidade nativa na página `/carreiras/acompanhamento/` para abertura de solicitação de exclusão.
  - **Execução pelo DPO/RH:** Endpoint administrativo `/api/admin/lgpd/execute-erasure` anonimiza os dados do candidato e exclui permanentemente o arquivo de currículo do bucket R2.

### 3.2. Retenção e Descarte
- Candidaturas associadas a vagas encerradas são mantidas pelo período legal de 2 anos para fins de defesa em processos trabalhistas.
- Candidatos que autorizaram o Banco de Talentos têm renovação anual de consentimento.

---

## 4. Política Anti-IA e Decisões Humanas

> [!IMPORTANT]
> Em estrita observância ao briefing do projeto e às recomendações da ANPD, **o AJN Carreiras não implementa nenhum mecanismo de triagem, rankeamento ou decisão automatizada baseado em Inteligência Artificial ou algoritmos preditivos.**

- As notas atribuídas aos candidatos (`rating` de 1 a 5) refletem unicamente o julgamento profissional de recrutadores humanos.
- A tela administrativa exibe o aviso claro: *"Avaliação humana. Decisões baseadas exclusivamente no julgamento do recrutador."*
- As movimentações de etapa no Kanban exigem ação explícita do recrutador, ficando registradas na tabela `audit_logs` com o identificador do operador.

---

## 5. Matriz de Permissões RBAC (Role-Based Access Control)

| Papel | Candidatos | Vagas | Download de Currículo | LGPD / Exclusão | Auditoria |
|---|---|---|---|---|---|
| **superadmin** | Leitura / Escrita | Leitura / Escrita | Sim | Sim | Leitura |
| **recruiter** | Leitura / Escrita | Leitura / Escrita | Sim | Não | Não |
| **interviewer** | Leitura da Vaga | Leitura | Não | Não | Não |
| **dpo** | Leitura | Leitura | Não | Sim | Leitura |
