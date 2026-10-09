# Modelo de ameaças

**Data:** 2026-10-08 · **Escopo:** site estático Astro, repositório, pipeline, navegação e headers HTTP. STRIDE aplicado proporcionalmente; sem API ou sessão.

## Ativos e adversários

Ativos: integridade do conteúdo publicado, confiança dos visitantes, dados que o usuário decide enviar por canais externos, cadeia de build e disponibilidade das páginas. Adversários plausíveis: contribuidor malicioso ou conta comprometida, operador de rede hostil antes de o navegador aprender HSTS, link externo malicioso e abuso de canal externo. Não há evidência de um atacante ativo.

## Matriz

| ID | Ativo | Ameaça | Evidência / pré-condição | Impacto | Probabilidade | Severidade | Classificação da evidência | Estado | Tratamento |
|---|---|---|---|---|---|---|---|---|---|
| AJN-SEC-001 | Transporte do domínio | STRIDE: spoofing/tampering via downgrade antes de HTTPS | Produção HTTPS sem `Strict-Transport-Security`; atacante precisa controlar/interferir na primeira navegação HTTP | Confidencialidade/integridade do primeiro acesso | Baixa a média em rede hostil | Média | CONFIRMADO | ABERTO — separado em PR de infraestrutura draft | PR #50 preserva `.htaccess`; qualquer HSTS requer revisão, implantação e GET posterior |
| AJN-SEC-002 | Navegação/formulários | STRIDE: exfiltração via submissão ou conteúdo injetado | CSP aplicada no host aceita `form-action https:` e `img-src https:`; formulário não está renderizado e scripts não usam inline | Dados de formulário futuros ou requisições externas | Baixa, exige injeção ou mudança de configuração | Média | CONFIRMADO | ABERTO — separado em PR de infraestrutura draft | Política atual permanece; candidata Report-Only não ativa, sem telemetria central |
| AJN-SEC-003 | Links editoriais | XSS por `javascript:`/esquema ativo em âncora | Schema Zod aceitava qualquer string em `href`; atacante precisaria inserir conteúdo malicioso no repositório/build | Integridade e execução no navegador após clique | Baixa, depende de alteração de conteúdo | Baixa | CONFIRMADO | CORRIGIDO; testes ampliados nesta rodada | `URL` + allowlist root-relative/HTTPS, rejeição de controles, percent-encoding inválido/sensível e credenciais |
| AJN-SEC-004 | Privacidade e confiança | Falta de transparência/rota legal indisponível | GET público anterior retornou 404; a AJN forneceu textos legados e as rotas agora existem no build local; sem formulário na produção observada | Conformidade, confiança e orientação do usuário | Média | Média | CONFIRMADO | IMPLEMENTADO LOCALMENTE; produção ainda não verificada | Textos adaptados a partir do material fornecido; remover referências de publicidade não observadas; revisão jurídica independente não realizada |
| AJN-SEC-005 | Publicação de segurança | Configuração do host divergente ou não aplicada | `.htaccess` publicado não prova deploy de alteração futura; workflow não publica; staging não respondeu | Headers novos podem não chegar à produção | Média | Média | BLOQUEADO | BLOQUEADO | Operador Hostinger confirmar mecanismo e validar headers após publicação autorizada |
| AJN-SEC-006 | CI/supply chain | Action tag atualizada/movida ou abuso de permissão | Workflows usam tags major (`@v7`, `@v4`, etc.); conteúdo submetido é executado em PR; token tem leitura no workflow de qualidade | Integridade do build e artefato | Baixa a média; requer comprometimento upstream/conta | Média | CONFIRMADO | ABERTO, mitigado parcialmente | Permissões mínimas observadas; avaliar pin por SHA e proteção de branch nas configurações GitHub |
| AJN-SEC-007 | Dados pessoais | Divulgação a terceiros por canais escolhidos pelo usuário | Google Fonts recebe requisições do navegador; links levam a WhatsApp/Instagram/LinkedIn; sem analytics/cookies identificados no código | Privacidade/IP e dados inseridos pelo usuário no terceiro | Baixa; dependente da escolha do visitante | Baixa | PROVÁVEL | NECESSITA VERIFICAÇÃO | Atualizar aviso de privacidade e confirmar práticas do provedor/canais |
| AJN-SEC-008 | Apresentação do site | `style-src-attr 'unsafe-inline'` permite atributos de estilo inline | Componentes geram estilos de apresentação controlados pelo código; não foi identificado dado externo fluindo para esses atributos | Integridade visual; impacto de XSS limitado pelo CSP de scripts | Baixa | Baixa | CONFIRMADO | ACEITO com justificativa | Preservar animações/estilos atuais; reavaliar ao alterar componentes e remover a exceção se possível |
| AJN-SEC-009 | Canonical do domínio | Conteúdo duplicado acessível no host `www` | GET de `https://www.ajnengenharia.com.br/` responde 200; HTML canonical aponta ao apex | Sinais de indexação e compartilhamento inconsistentes | Baixa | Baixa | CONFIRMADO | ABERTO — separado em PR de infraestrutura draft | PR #50 não muda roteamento; proposta `www`→apex deve ser validada em preview antes de decidir 301 |

## Superfície e controles existentes

- **NÃO APLICÁVEL:** SQL injection, SSRF de servidor, CSRF de API, CORS de API, IDOR, autenticação, upload persistente, multi-tenant e gestão de sessão; o checkout não implementa esses componentes.
- **CONFIRMADO no código:** sem `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `eval`, `new Function`, Web Storage ou scripts executáveis inline. JSON-LD usa serializador que escapa caracteres HTML.
- **CONFIRMADO:** links externos em nova janela usam `noopener`/`noreferrer` nos pontos auditados.
- **CONFIRMADO:** workflow de qualidade declara `contents: read`; CodeQL concede `security-events: write` no job; nenhum deploy é disparado pelo workflow.

## Limites

As probabilidades são avaliação qualitativa da arquitetura, não medição estatística. A segurança efetiva do browser após as mudanças depende da publicação e da confirmação dos headers no Hostinger/CDN. GitHub branch protection, secret scanning e configuração real do host permanecem sem acesso administrativo.
