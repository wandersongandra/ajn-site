# Modelo de ameaças

**Data:** 2026-10-08 · **Escopo:** site estático Astro, repositório, pipeline, navegação e headers HTTP. STRIDE aplicado proporcionalmente; sem API ou sessão.

## Ativos e adversários

Ativos: integridade do conteúdo publicado, confiança dos visitantes, dados que o usuário decide enviar por canais externos, cadeia de build e disponibilidade das páginas. Adversários plausíveis: contribuidor malicioso ou conta comprometida, operador de rede hostil antes de o navegador aprender HSTS, link externo malicioso e abuso de canal externo. Não há evidência de um atacante ativo.

## Matriz

| ID | Ativo | Ameaça | Evidência / pré-condição | Impacto | Probabilidade | Severidade | Classificação da evidência | Estado | Tratamento |
|---|---|---|---|---|---|---|---|---|---|
| AJN-SEC-001 | Transporte do domínio | STRIDE: spoofing/tampering via downgrade antes de HTTPS | Produção HTTPS sem `Strict-Transport-Security`; atacante precisa controlar/interferir na primeira navegação HTTP | Confidencialidade/integridade do primeiro acesso | Baixa a média em rede hostil | Média | CONFIRMADO | CORRIGIDO local; pendente publicação/verificação | Adicionado HSTS de 1 ano sem `includeSubDomains`; validar no host após deploy |
| AJN-SEC-002 | Navegação/formulários | STRIDE: exfiltração via submissão ou conteúdo injetado | CSP aceitava `form-action https:` para qualquer origem e `img-src https:`; formulário atualmente não renderizado | Dados de formulário futuros ou requisições externas | Baixa, exige injeção ou mudança de configuração | Média | CONFIRMADO | CORRIGIDO local; pendente publicação | CSP agora restringe formulário à origem e imagens à origem/data |
| AJN-SEC-003 | Links editoriais | XSS por `javascript:`/esquema ativo em âncora | Schema Zod aceitava qualquer string em `href`; atacante precisaria inserir conteúdo malicioso no repositório/build | Integridade e execução no navegador após clique | Baixa, depende de alteração de conteúdo | Baixa | CONFIRMADO | CORRIGIDO e validado localmente | Allowlist de caminhos locais e HTTPS sem credenciais; teste de regressão |
| AJN-SEC-004 | Privacidade e confiança | Falta de transparência/rota legal indisponível | GET público retorna 404 em `/politica-de-privacidade/` e `/termos-de-uso/`; sem formulário na produção observada | Conformidade, confiança e orientação do usuário | Média | Média | CONFIRMADO | ABERTO | Recuperar conteúdo aprovado da fonte legal e restaurar URLs; não inventar política |
| AJN-SEC-005 | Publicação de segurança | Configuração do host divergente ou não aplicada | `.htaccess` publicado não prova deploy de alteração futura; workflow não publica; staging não respondeu | Headers novos podem não chegar à produção | Média | Média | BLOQUEADO | BLOQUEADO | Operador Hostinger confirmar mecanismo e validar headers após publicação autorizada |
| AJN-SEC-006 | CI/supply chain | Action tag atualizada/movida ou abuso de permissão | Workflows usam tags major (`@v7`, `@v4`, etc.); conteúdo submetido é executado em PR; token tem leitura no workflow de qualidade | Integridade do build e artefato | Baixa a média; requer comprometimento upstream/conta | Média | CONFIRMADO | ABERTO, mitigado parcialmente | Permissões mínimas observadas; avaliar pin por SHA e proteção de branch nas configurações GitHub |
| AJN-SEC-007 | Dados pessoais | Divulgação a terceiros por canais escolhidos pelo usuário | Google Fonts recebe requisições do navegador; links levam a WhatsApp/Instagram/LinkedIn; sem analytics/cookies identificados no código | Privacidade/IP e dados inseridos pelo usuário no terceiro | Baixa; dependente da escolha do visitante | Baixa | PROVÁVEL | NECESSITA VERIFICAÇÃO | Atualizar aviso de privacidade e confirmar práticas do provedor/canais |
| AJN-SEC-008 | Apresentação do site | `style-src-attr 'unsafe-inline'` permite atributos de estilo inline | Componentes geram estilos de apresentação controlados pelo código; não foi identificado dado externo fluindo para esses atributos | Integridade visual; impacto de XSS limitado pelo CSP de scripts | Baixa | Baixa | CONFIRMADO | ACEITO com justificativa | Preservar animações/estilos atuais; reavaliar ao alterar componentes e remover a exceção se possível |

## Superfície e controles existentes

- **NÃO APLICÁVEL:** SQL injection, SSRF de servidor, CSRF de API, CORS de API, IDOR, autenticação, upload persistente, multi-tenant e gestão de sessão; o checkout não implementa esses componentes.
- **CONFIRMADO no código:** sem `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `eval`, `new Function`, Web Storage ou scripts executáveis inline. JSON-LD usa serializador que escapa caracteres HTML.
- **CONFIRMADO:** links externos em nova janela usam `noopener`/`noreferrer` nos pontos auditados.
- **CONFIRMADO:** workflow de qualidade declara `contents: read`; CodeQL concede `security-events: write` no job; nenhum deploy é disparado pelo workflow.

## Limites

As probabilidades são avaliação qualitativa da arquitetura, não medição estatística. A segurança efetiva do browser após as mudanças depende da publicação e da confirmação dos headers no Hostinger/CDN. GitHub branch protection, secret scanning e configuração real do host permanecem sem acesso administrativo.
