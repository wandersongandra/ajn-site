# Lista Objetiva de Pendências e Recursos para Homologação — AJN Carreiras

Este documento sintetiza os passos necessários e os recursos externos que devem ser providenciados pelos gestores do projeto antes da entrada em produção.

---

## 1. Status do Desenvolvimento na Branch `feat/ajn-carreiras`

| Componente | Status | Observações |
|---|---|---|
| Modelagem e Migrations D1 | **Concluído** | 13 tabelas, índices e integridade validados. |
| Backend Serverless (Cloudflare Worker) | **Concluído** | 17 rotas públicas e administrativas implementadas e testadas. |
| Armazenamento Privado R2 | **Concluído** | Download mediado por permissões e logs imutáveis. |
| Frontend Público de Vagas e Talentos | **Concluído** | Páginas com tokens AJN, responsivas, acessíveis e com SEO Google Jobs. |
| Painel Administrativo de Recrutamento | **Concluído** | Kanban, triagem humana, consulta de dados e módulo LGPD. |
| Testes Automatizados (Unitários, Integração, E2E) | **Concluído** | 100% de aprovação (Vitest: 23/23, E2E: 98/98, Smoke: 1.457/1.457). |
| Gates de Validação do Repositório | **Concluído** | 35 verificações aprovadas em `npm run validate`. |

---

## 2. Pendências Externas e Recursos para Homologação

Para que o sistema passe do estágio local para o ambiente de homologação (Staging) e posteriormente Produção, as seguintes ações dependem de credenciais de infraestrutura dos responsáveis:

### 2.1. Conta Cloudflare e Provisionamento
1. **Criação dos Recursos:**
   - Executar os comandos de criação do banco D1 e do bucket R2 no dashboard da Cloudflare ou via Wrangler (conforme documentado no [Guia de Deploy](03-guia-deploy-configuracao.md)).
2. **Definição dos Segredos no Worker:**
   - Inserir `TURNSTILE_SECRET_KEY` (chave secreta obtida no Cloudflare Turnstile).
   - Inserir `SESSION_SECRET` (string aleatória de 64 caracteres criptográficos para assinatura de tokens).
3. **Chave Pública Turnstile:**
   - Inserir a chave pública do Turnstile na variável `data-sitekey` dos formulários em produção ou configurar a chave real no `worker/wrangler.toml`.

### 2.2. Configuração de DNS e Rotas
1. Definir o endpoint do backend:
   - Opção recomendada: Criar rota do Worker na Cloudflare para `https://ajnconsultoria.com.br/api/*`.
   - Opção alternativa: Criar subdomínio `https://api.carreiras.ajnconsultoria.com.br`.

### 2.3. Cadastramento de Usuários Iniciais do RH
1. Rodar o seed script (`worker/db/seed.ts`) com o e-mail oficial do responsável de RH da AJN para provisionar o primeiro usuário com perfil `recruiter` ou `superadmin`.
2. Registrar o aplicativo autenticador (ex: Google Authenticator, Microsoft Authenticator) com o segredo TOTP gerado.

---

## 3. Bloqueios Técnicos

> [!NOTE]
> **Nenhum bloqueio técnico impede o prosseguimento.** Todo o código está encapsulado na branch `feat/ajn-carreiras`, com zero impacto sobre o site institucional existente e zero alteração no ambiente de produção.
